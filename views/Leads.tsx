import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { Search, MessageSquare, User, Bot, Clock, Database, CircleDollarSign, ArrowRight } from 'lucide-react';
import { Deal } from '../types';

export const Leads: React.FC = () => {
  const { deals, pipeline, contactProperties, updateState, navigatedDealId } = useStore();
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Handle incoming navigation from Module 11 (DataCards)
  useEffect(() => {
    if (navigatedDealId) {
      setSelectedDealId(navigatedDealId);
      // Clear the navigation request so it doesn't persist
      updateState('navigatedDealId', null);
    }
  }, [navigatedDealId, updateState]);

  const selectedDeal = deals.find(d => d.id === selectedDealId);

  const filteredDeals = deals.filter(d => 
    d.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStageName = (stageId: string) => {
    return pipeline.find(p => p.id === stageId)?.name || 'Desconocido';
  };

  const handleStageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      if (!selectedDeal) return;
      const newStageId = e.target.value;
      const updatedDeals = deals.map(d => 
          d.id === selectedDeal.id ? { ...d, stageId: newStageId } : d
      );
      updateState('deals', updatedDeals);
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* --- PANEL IZQUIERDO: LISTA DE LEADS --- */}
      <div className="w-1/3 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Gestor de Leads</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Módulo 10: Explorador de Conversaciones</p>
          <div className="mt-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Buscar por nombre o ID..." 
              className="w-full pl-9 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none text-slate-900 dark:text-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredDeals.length === 0 && (
              <div className="p-8 text-center text-slate-400 text-sm">No se encontraron leads.</div>
          )}
          {filteredDeals.map(deal => (
            <div 
              key={deal.id}
              onClick={() => setSelectedDealId(deal.id)}
              id={`lead-item-${deal.id}`}
              className={`p-4 border-b border-slate-100 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${selectedDealId === deal.id ? 'bg-brand-50 dark:bg-brand-900/10 border-l-4 border-l-brand-500' : 'border-l-4 border-l-transparent'}`}
            >
              <div className="flex justify-between items-start mb-1">
                <h3 className="font-bold text-slate-800 dark:text-slate-200">{deal.customerName}</h3>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                   <Clock size={10} /> {deal.lastInteraction}
                </span>
              </div>
              <div className="flex items-center justify-between">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                    {getStageName(deal.stageId)}
                  </span>
                  {deal.value > 0 && (
                      <span className="text-xs font-bold text-green-600 dark:text-green-400">
                          ${deal.value.toLocaleString()} {deal.currency || 'USD'}
                      </span>
                  )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* --- PANEL DERECHO: DETALLE & CHAT --- */}
      <div className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-950">
        {selectedDeal ? (
          <>
            {/* HEADER DEL DEAL */}
            <div className="bg-white dark:bg-slate-900 p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center shadow-sm z-10">
               <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400">
                       <User size={20} />
                   </div>
                   <div>
                       <h2 className="text-lg font-bold text-slate-900 dark:text-white">{selectedDeal.customerName}</h2>
                       <div className="flex items-center gap-2 text-xs text-slate-500">
                           <span>ID: {selectedDeal.id}</span>
                           <span>•</span>
                           <span className="flex items-center gap-1">
                               <CircleDollarSign size={12} className="text-green-500" />
                               Valor Potencial: <span className="font-semibold text-slate-700 dark:text-slate-300">${selectedDeal.value.toLocaleString()} {selectedDeal.currency}</span>
                           </span>
                       </div>
                   </div>
               </div>

               <div className="flex items-center gap-3">
                   <div className="flex flex-col items-end">
                       <label className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">Etapa Actual (M5)</label>
                       <div className="relative">
                           <select 
                               value={selectedDeal.stageId}
                               onChange={handleStageChange}
                               className="appearance-none bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium py-1 px-3 pr-8 rounded focus:ring-2 focus:ring-brand-500 outline-none cursor-pointer"
                           >
                               {pipeline.map(stage => (
                                   <option key={stage.id} value={stage.id}>{stage.order}. {stage.name}</option>
                                ))}
                           </select>
                           <ArrowRight size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                       </div>
                   </div>
               </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* ÁREA DE CHAT */}
                <div className="flex-1 flex flex-col p-4 overflow-y-auto space-y-4">
                    <div className="text-center text-xs text-slate-400 my-4">
                        --- Inicio de la conversación ---
                    </div>
                    {selectedDeal.chatHistory.map((msg) => (
                        <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {msg.role === 'model' && (
                                <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900/50 flex items-center justify-center text-brand-600 dark:text-brand-400 flex-shrink-0 border border-brand-200 dark:border-brand-800 mt-1">
                                    <Bot size={16} />
                                </div>
                            )}
                            <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} max-w-[70%]`}>
                                <div className={`px-4 py-2 rounded-2xl text-sm ${
                                    msg.role === 'user' 
                                    ? 'bg-brand-600 text-white rounded-tr-none' 
                                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-tl-none shadow-sm'
                                }`}>
                                    {msg.text}
                                </div>
                                <span className="text-[10px] text-slate-400 mt-1 px-1">
                                    {msg.timestamp}
                                </span>
                            </div>
                            {msg.role === 'user' && (
                                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 flex-shrink-0 mt-1">
                                    <User size={16} />
                                </div>
                            )}
                        </div>
                    ))}
                    {selectedDeal.chatHistory.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400 opacity-50">
                            <MessageSquare size={48} className="mb-2" />
                            <p>Sin historial de mensajes</p>
                        </div>
                    )}
                </div>

                {/* SIDEBAR DERECHO: DATOS RECOLECTADOS */}
                <div className="w-72 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 p-4 overflow-y-auto hidden xl:block">
                    <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                        <Database size={16} className="text-brand-500" />
                        Datos Capturados
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                        Información extraída automáticamente por la IA según definiciones del Módulo 9.
                    </p>

                    <div className="space-y-4">
                        {contactProperties.map(prop => {
                            const value = selectedDeal.capturedData[prop.key];
                            return (
                                <div key={prop.id} className="group">
                                    <label className="text-xs font-semibold text-slate-500 uppercase flex justify-between">
                                        {prop.label}
                                        {value && <CheckCircleIcon />}
                                    </label>
                                    <div className={`mt-1 p-2 rounded text-sm border break-words whitespace-pre-wrap ${
                                        value 
                                        ? 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200' 
                                        : 'bg-slate-50/50 dark:bg-slate-900 border-dashed border-slate-200 dark:border-slate-800 text-slate-400 italic'
                                    }`}>
                                        {value || 'Pendiente...'}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-600">
              <div className="w-20 h-20 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center mb-4">
                  <User size={40} />
              </div>
              <h3 className="text-xl font-medium mb-2">Selecciona un Lead</h3>
              <p className="max-w-xs text-center text-sm">Elige un contacto de la lista para ver su historial completo de conversaciones y datos capturados.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const CheckCircleIcon = () => (
    <svg className="w-3 h-3 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
    </svg>
);