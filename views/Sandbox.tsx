import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../store';
import { constructSystemPrompt, sendMessageToGemini, extractData } from '../services/geminiService';
import { Send, RefreshCw, Terminal, User, Bot, AlertTriangle, ArrowRight } from 'lucide-react';
import { marked } from 'marked';
import { ChatMessage, Deal } from '../types';

export const Sandbox: React.FC = () => {
  const state = useStore();
  const { deals, activeSandboxDealId, pipeline, updateState, saveDeal, contactProperties, courses, isLoading } = state;
  
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [debugLog, setDebugLog] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- 1. INITIALIZATION LOGIC ---
  const createNewSandboxSession = () => {
    const newDealId = `sandbox_${Date.now()}`;
    const initialStageId = pipeline[0]?.id || '1';
    
    const newDeal: Deal = {
      id: newDealId,
      customerName: 'Cliente Sandbox (Tú)',
      stageId: initialStageId,
      value: 0,
      currency: 'USD',
      lastInteraction: 'Ahora',
      chatHistory: [],
      capturedData: {}
    };

    // Update state and PERSIST activeSandboxDealId
    // We update local deals state optimistically via saveDeal inside Store, but here we need to ensure the new deal is in the array
    // so we call saveDeal immediately.
    saveDeal(newDeal).then(() => {
        updateState('activeSandboxDealId', newDealId);
        setDebugLog(['Sistema inicializado.', 'Nueva sesión de Sandbox sincronizada.', 'Esperando input...']);
    });
  };

  useEffect(() => {
    // Wait for Supabase to finish loading before checking validity
    if (isLoading) return;

    // Check if the currently stored ID corresponds to an actual deal in memory
    const isValidSession = activeSandboxDealId && deals.some(d => d.id === activeSandboxDealId);
    
    if (!isValidSession) {
      console.log("Sandbox: Sesión inválida o expirada. Creando nueva...");
      createNewSandboxSession();
    }
  }, [activeSandboxDealId, deals, isLoading]);

  const activeDeal = deals.find(d => d.id === activeSandboxDealId);
  const messages = activeDeal?.chatHistory || [];

  const addLog = (msg: string) => {
    setDebugLog(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);
  };

  const normalizeText = (text: string) => {
    return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  };

  const processPipelineLogic = async (userMessage: string, deal: Deal): Promise<Partial<Deal>> => {
      const currentStage = pipeline.find(p => p.id === deal.stageId);
      const nextStage = pipeline.find(p => p.order === (currentStage?.order || 0) + 1);
      
      let updates: Partial<Deal> = { capturedData: { ...deal.capturedData } };

      // --- DETECCIÓN AUTOMÁTICA DE CURSO ---
      const normalizedMsg = normalizeText(userMessage);
      
      const detectedCourse = courses.find(c => {
          const normalizedName = normalizeText(c.name);
          const normalizedSku = normalizeText(c.sku);
          return normalizedMsg.includes(normalizedName) || normalizedMsg.includes(normalizedSku);
      });

      if (detectedCourse) {
          updates.capturedData = { 
              ...updates.capturedData, 
              selected_course: detectedCourse.name 
          };
          addLog(`🎯 Intención Detectada: Interés en "${detectedCourse.name}"`);
      }

      if (currentStage && currentStage.requiredInput) {
          addLog(`Etapa actual (${currentStage.name}) requiere: ${currentStage.requiredInput}`);
          const propertyDef = contactProperties.find(cp => cp.key === currentStage.requiredInput);

          if (propertyDef) {
             addLog(`🤖 Extrayendo dato granular: ${propertyDef.label}...`);
             const extractedValue = await extractData(userMessage, propertyDef);
             
             if (extractedValue) {
                 const capturedKey = currentStage.requiredInput;
                 const newCapturedData = { ...updates.capturedData, [capturedKey]: extractedValue };
                 updates.capturedData = newCapturedData;

                 addLog(`✅ Dato capturado: ${capturedKey} = "${extractedValue}"`);

                 if (nextStage) {
                     updates.stageId = nextStage.id;
                     addLog(`➡️ Avanzando Pipeline: ${currentStage.name} -> ${nextStage.name}`);
                 } else {
                     addLog(`🏁 Pipeline completado.`);
                 }
             } else {
                 addLog(`⚠️ IA no encontró "${propertyDef.label}" en el mensaje.`);
             }
          }
      }
      return updates;
  };

  // --- 3. HANDLING MESSAGES ---
  const handleSend = async () => {
    if (!input.trim() || loading || !activeDeal) return;

    const userMsgText = input;
    setInput('');
    setLoading(true);

    const userMsg: ChatMessage = {
        id: `msg_u_${Date.now()}`,
        role: 'user',
        text: userMsgText,
        timestamp: new Date().toLocaleTimeString()
    };

    // 1. Optimistic Update (User Message)
    const updatedHistoryWithUser = [...activeDeal.chatHistory, userMsg];
    let currentDealState: Deal = {
        ...activeDeal,
        chatHistory: updatedHistoryWithUser,
        lastInteraction: 'Ahora mismo'
    };
    
    // Save User Msg
    await saveDeal(currentDealState);
    addLog(`Input Usuario: "${userMsgText}"`);

    // 2. Process Logic (Pipeline & Extraction)
    const pipelineUpdates = await processPipelineLogic(userMsgText, currentDealState);
    
    currentDealState = {
        ...currentDealState,
        ...pipelineUpdates
    };
    
    // Save Logic Updates (before AI reply)
    await saveDeal(currentDealState);

    if (pipelineUpdates.stageId && pipelineUpdates.stageId !== activeDeal.stageId) {
        addLog(`Deal actualizado en Tablero.`);
    }

    try {
       // Context for Gemini includes the latest updates
       const tempState = {
           ...state,
           deals: state.deals.map(d => d.id === activeDeal.id ? currentDealState : d)
       };

       const geminiHistory = updatedHistoryWithUser.map(m => ({
           role: m.role,
           parts: [{ text: m.text }]
       }));

       const responseText = await sendMessageToGemini(userMsgText, geminiHistory, tempState);
       
       if (responseText) {
           // --- DETECCIÓN DE PRECIO ---
           let detectedValue = currentDealState.value;
           let detectedCurrency = currentDealState.currency;
           
           const matchSymbol = responseText.match(/\$\s?([\d,.]+)/);
           const matchCurrencyCode = responseText.match(/([\d,.]+)\s?(COP|MXN|USD|EUR|PEN|ARS|CLP|BRL)/i);
           let rawPriceString = '';

           if (matchCurrencyCode) {
               rawPriceString = matchCurrencyCode[1];
               detectedCurrency = matchCurrencyCode[2].toUpperCase();
           } else if (matchSymbol) {
               rawPriceString = matchSymbol[1];
           }

           if (rawPriceString) {
               const val = parseFloat(rawPriceString.replace(/,/g, ''));
               if (!isNaN(val) && val > 0) {
                   detectedValue = val;
                   addLog(`💰 Precio cotizado detectado: ${val.toLocaleString()} ${detectedCurrency}`);
               }
           }

           const modelMsg: ChatMessage = {
               id: `msg_m_${Date.now()}`,
               role: 'model',
               text: responseText,
               timestamp: new Date().toLocaleTimeString()
           };

           // 3. Final Update (Model Message)
           const finalDealState: Deal = {
               ...currentDealState,
               chatHistory: [...updatedHistoryWithUser, modelMsg],
               lastInteraction: 'Ahora mismo',
               value: detectedValue,
               currency: detectedCurrency
           };

           await saveDeal(finalDealState);
       }
    } catch (e) {
        addLog(`ERROR: Falló la llamada a la API Gemini.`);
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  const handleReset = () => {
    createNewSandboxSession();
    addLog('Nueva sesión iniciada.');
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const renderMarkdown = (text: string) => {
    return { __html: marked.parse(text) };
  };

  if (isLoading) return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 bg-slate-100 dark:bg-slate-950">
          <RefreshCw className="animate-spin mb-4 text-brand-500" size={32} />
          <p>Conectando con base de datos...</p>
      </div>
  );

  if (!activeDeal) return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 bg-slate-100 dark:bg-slate-950">
          <RefreshCw className="animate-spin mb-4 text-brand-500" size={32} />
          <p>Creando sesión de sandbox...</p>
      </div>
  );

  return (
    <div className="flex h-full bg-slate-100 dark:bg-slate-950">
      {/* Área Chat */}
      <div className="flex-1 flex flex-col h-full relative">
        <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 flex justify-between items-center z-10 shadow-sm transition-colors">
            <div>
                <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    {state.config.name} (Sandbox Persistente)
                </h3>
                <div className="flex gap-4 text-xs text-slate-500 dark:text-slate-400 mt-1">
                    <span>Deal ID: {activeDeal.id}</span>
                    <span className="flex items-center gap-1 text-brand-600 dark:text-brand-400 font-medium">
                        <ArrowRight size={12} />
                        Etapa Actual: {pipeline.find(p => p.id === activeDeal.stageId)?.name || 'Desconocida'}
                    </span>
                    <span className={`font-mono px-1 rounded transition-colors ${activeDeal.value > 0 ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20' : 'text-slate-400'}`}>
                        ${activeDeal.value.toLocaleString()} {activeDeal.currency}
                    </span>
                </div>
            </div>
            <button onClick={handleReset} className="text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" title="Nueva Conversación (Guarda la anterior)">
                <RefreshCw size={20} />
            </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-100 dark:bg-slate-950">
            {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-600 opacity-50">
                    <Bot size={64} className="mb-4" />
                    <p>Inicia conversación. Todo se guardará en Módulo 10 (Leads).</p>
                </div>
            )}
            {messages.map((msg, i) => (
                <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.role === 'model' && (
                        <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900/50 flex items-center justify-center text-brand-600 dark:text-brand-400 flex-shrink-0 border border-brand-200 dark:border-brand-800">
                            <Bot size={16} />
                        </div>
                    )}
                    <div className={`max-w-[80%] rounded-2xl px-5 py-3 shadow-sm text-sm ${
                        msg.role === 'user' 
                        ? 'bg-brand-600 text-white rounded-br-none' 
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-slate-700 rounded-bl-none'
                    }`}>
                         <div 
                           className="prose prose-sm prose-invert"
                           dangerouslySetInnerHTML={renderMarkdown(msg.text)}
                         />
                    </div>
                    {msg.role === 'user' && (
                        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 flex-shrink-0">
                            <User size={16} />
                        </div>
                    )}
                </div>
            ))}
            {loading && (
                 <div className="flex gap-4 justify-start">
                    <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900/50 flex items-center justify-center text-brand-600 dark:text-brand-400 flex-shrink-0 border border-brand-200 dark:border-brand-800">
                        <Bot size={16} />
                    </div>
                    <div className="bg-white dark:bg-slate-800 text-slate-500 border border-slate-100 dark:border-slate-700 px-4 py-3 rounded-2xl rounded-bl-none shadow-sm text-xs flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-75"></span>
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-150"></span>
                        <span className="ml-2 italic opacity-75">Analizando...</span>
                    </div>
                 </div>
            )}
            <div ref={messagesEndRef} />
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 transition-colors">
             <div className="flex gap-2 relative">
                 <input 
                    type="text" 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Escribe un mensaje como cliente potencial..."
                    className="flex-1 bg-slate-100 dark:bg-slate-800 border-none rounded-full px-6 py-3 text-sm focus:ring-2 focus:ring-brand-500 outline-none text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                    disabled={loading}
                 />
                 <button 
                    onClick={handleSend}
                    disabled={loading || !input.trim()}
                    className="bg-brand-600 hover:bg-brand-700 text-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg disabled:opacity-50 transition-all"
                 >
                    <Send size={20} />
                 </button>
             </div>
             {!process.env.API_KEY && (
                 <div className="mt-2 text-xs text-red-500 flex items-center gap-1 justify-center">
                     <AlertTriangle size={12} />
                     <span>No se encontró API Key en process.env. El chat podría no funcionar.</span>
                 </div>
             )}
        </div>
      </div>

      {/* Panel Debug (El Cerebro) */}
      <div className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col h-full text-slate-300 font-mono text-xs hidden md:flex">
          <div className="p-3 border-b border-slate-800 bg-slate-950 flex items-center gap-2">
              <Terminal size={14} className="text-green-500" />
              <span className="font-bold text-slate-200">Logs del Sistema (Cerebro)</span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {debugLog.length === 0 ? (
                  <span className="text-slate-600 italic">Esperando eventos...</span>
              ) : (
                  debugLog.map((log, i) => (
                      <div key={i} className="border-l-2 border-slate-700 pl-2 py-1 text-slate-400">
                          {log}
                      </div>
                  ))
              )}
          </div>

          {activeDeal && (
          <div className="p-3 bg-slate-950 border-t border-slate-800">
             <div className="mb-2 text-slate-500 uppercase text-[10px] font-bold">Datos en Tiempo Real</div>
             <div className="bg-slate-900 p-2 rounded border border-slate-800 mb-2">
                 <span className="block text-slate-400 mb-2 font-semibold">Datos Capturados:</span>
                 <div className="space-y-2">
                     {Object.entries(activeDeal.capturedData).length > 0 ? (
                        Object.entries(activeDeal.capturedData).map(([key, val]) => {
                             // Buscar la etiqueta legible en contactProperties
                             const propLabel = contactProperties.find(cp => cp.key === key)?.label || key;
                             
                             return (
                                 <div key={key} className="flex flex-col border-b border-slate-800 pb-1 last:border-0">
                                     <span className="text-purple-400 text-[10px] uppercase font-bold">{propLabel}</span>
                                     <span className="text-white text-[11px] break-words leading-tight">{String(val)}</span>
                                 </div>
                             );
                        })
                     ) : (
                         <span className="text-slate-600 italic text-[10px]">Ninguno</span>
                     )}
                 </div>
             </div>
             <div className="grid grid-cols-2 gap-2">
                 <div className="bg-slate-900 p-2 rounded border border-slate-800">
                     <span className="block text-slate-400">Etapa</span>
                     <span className="text-white text-lg font-bold">{activeDeal.stageId}</span>
                 </div>
                 <div className="bg-slate-900 p-2 rounded border border-slate-800">
                     <span className="block text-slate-400">Valor</span>
                     <span className="text-green-400 text-lg font-bold">${activeDeal.value.toLocaleString()}</span>
                 </div>
             </div>
          </div>
          )}
      </div>
    </div>
  );
};