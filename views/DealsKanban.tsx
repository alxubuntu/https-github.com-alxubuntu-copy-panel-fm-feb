import React, { useState } from 'react';
import { useStore } from '../store';
import { Deal, ChatMessage } from '../types';
import { Filter, Search, Clock, Bot, User, AlertTriangle, Zap, VolumeX, DollarSign, GripHorizontal } from 'lucide-react';
import { Modal } from '../components/Modal';

export const DealsKanban: React.FC = () => {
  const { pipeline, deals, updateState, config } = useStore();
  
  // States para Drag & Drop y Modales
  const [draggedDealId, setDraggedDealId] = useState<string | null>(null);
  const [pendingMove, setPendingMove] = useState<{ dealId: string, targetStageId: string } | null>(null);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStagnant, setFilterStagnant] = useState(false);

  // Ordenar pipeline para columnas
  const sortedPipeline = [...pipeline].sort((a, b) => a.order - b.order);

  // Helpers de filtrado
  const isStagnant = (lastInteraction: string) => {
    // Lógica simple basada en el string para demo. En prod usaríamos timestamps reales.
    const lower = lastInteraction.toLowerCase();
    return lower.includes('día') || lower.includes('ayer') || lower.includes('semana');
  };

  const getFilteredDeals = (stageId: string) => {
    return deals.filter(d => {
        const matchesStage = d.stageId === stageId;
        const matchesSearch = d.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              (d.capturedData['selected_course'] || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStagnant = filterStagnant ? isStagnant(d.lastInteraction) : true;
        
        return matchesStage && matchesSearch && matchesStagnant;
    });
  };

  // --- Drag & Drop Handlers ---

  const handleDragStart = (e: React.DragEvent, dealId: string) => {
      setDraggedDealId(dealId);
      e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault(); // Necesario para permitir Drop
  };

  const handleDrop = (e: React.DragEvent, targetStageId: string) => {
      e.preventDefault();
      if (!draggedDealId) return;
      
      const deal = deals.find(d => d.id === draggedDealId);
      if (deal && deal.stageId !== targetStageId) {
          // Abrir modal de confirmación en lugar de mover inmediatamente
          setPendingMove({ dealId: draggedDealId, targetStageId });
      }
      setDraggedDealId(null);
  };

  // --- Lógica de Movimiento ---

  const executeMove = (triggerBot: boolean) => {
      if (!pendingMove) return;

      const { dealId, targetStageId } = pendingMove;
      const targetStage = pipeline.find(p => p.id === targetStageId);
      const deal = deals.find(d => d.id === dealId);

      if (!deal || !targetStage) return;

      let updatedChatHistory = [...deal.chatHistory];

      // Si se activa el bot, inyectamos el mensaje
      if (triggerBot) {
          // Reemplazo simple de variables
          const script = targetStage.scriptTemplate
              .replace('{bot_name}', config.name)
              .replace('{customer_name}', deal.customerName);

          const botMsg: ChatMessage = {
              id: `auto_${Date.now()}`,
              role: 'model',
              text: script,
              timestamp: new Date().toLocaleTimeString()
          };
          updatedChatHistory.push(botMsg);
      }

      const updatedDeals = deals.map(d => 
          d.id === dealId 
          ? { 
              ...d, 
              stageId: targetStageId, 
              chatHistory: updatedChatHistory,
              lastInteraction: 'Ahora (Manual)' 
            } 
          : d
      );

      updateState('deals', updatedDeals);
      setPendingMove(null);
  };

  return (
    <div className="flex flex-col h-full bg-slate-100 dark:bg-slate-950 overflow-hidden">
      {/* Header Operativo */}
      <div className="p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  Módulo 12: Gestión de Negocios
                  <span className="text-xs font-normal bg-brand-100 dark:bg-brand-900 text-brand-700 dark:text-brand-300 px-2 py-0.5 rounded-full">Kanban Operativo</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Supervisión manual y disparo de acciones.</p>
          </div>
          
          <div className="flex items-center gap-3">
              <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input 
                      type="text" 
                      placeholder="Filtrar por nombre, curso..." 
                      className="pl-9 pr-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none text-slate-900 dark:text-white"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                  />
              </div>
              <button 
                  onClick={() => setFilterStagnant(!filterStagnant)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm border transition-colors ${filterStagnant ? 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'}`}
              >
                  <Clock size={14} />
                  {filterStagnant ? 'Filtro: Estancados' : 'Ver Estancados'}
              </button>
          </div>
      </div>

      {/* Tablero Kanban */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-4">
          <div className="flex h-full gap-4 min-w-max">
              {sortedPipeline.map(stage => {
                  const stageDeals = getFilteredDeals(stage.id);
                  
                  // Agrupar totales por moneda
                  const totals = stageDeals.reduce((acc, d) => {
                      const currency = d.currency || 'USD';
                      acc[currency] = (acc[currency] || 0) + (Number(d.value) || 0);
                      return acc;
                  }, {} as Record<string, number>);

                  return (
                      <div 
                        key={stage.id} 
                        className="w-80 flex flex-col h-full rounded-xl bg-slate-200/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800"
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, stage.id)}
                      >
                          {/* Columna Header */}
                          <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 rounded-t-xl sticky top-0 z-10">
                              <div className="flex justify-between items-center mb-1">
                                  <h3 className="font-bold text-slate-700 dark:text-slate-200 truncate pr-2">{stage.name}</h3>
                                  <span className="bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold px-2 py-0.5 rounded-full">
                                      {stageDeals.length}
                                  </span>
                              </div>
                              
                              {/* Totales por moneda */}
                              <div className="flex flex-col gap-0.5 mt-1 min-h-[1.5rem] justify-end">
                                  {Object.entries(totals).length > 0 ? (
                                      Object.entries(totals).map(([curr, val]) => (
                                           <div key={curr} className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                                               <DollarSign size={10} />
                                               <span className="font-mono">{val.toLocaleString()}</span> {curr}
                                           </div>
                                      ))
                                  ) : (
                                      <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                                           <DollarSign size={10} />
                                           <span className="font-mono">0</span> USD
                                      </div>
                                  )}
                              </div>

                              <div className="h-1 w-full bg-slate-300 dark:bg-slate-700 rounded-full mt-2 overflow-hidden">
                                  <div className="h-full bg-brand-500 rounded-full" style={{ width: '40%' }}></div>
                              </div>
                          </div>

                          {/* Lista de Tarjetas */}
                          <div className="flex-1 overflow-y-auto p-2 space-y-3">
                              {stageDeals.map(deal => (
                                  <div 
                                      key={deal.id}
                                      draggable
                                      onDragStart={(e) => handleDragStart(e, deal.id)}
                                      className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 cursor-grab hover:shadow-md hover:border-brand-300 dark:hover:border-brand-600 transition-all group relative"
                                  >
                                      {/* Drag Handle Visual */}
                                      <div className="absolute top-2 right-2 text-slate-300 opacity-0 group-hover:opacity-100 cursor-grab">
                                          <GripHorizontal size={16} />
                                      </div>

                                      <div className="flex items-center gap-2 mb-2">
                                          <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-500 text-xs font-bold">
                                              {deal.customerName.charAt(0)}
                                          </div>
                                          <div className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate max-w-[150px]">
                                              {deal.customerName}
                                          </div>
                                      </div>

                                      <div className="mb-2">
                                          <div className="text-xs text-brand-600 dark:text-brand-400 font-medium mb-0.5">
                                              {deal.capturedData['selected_course'] || 'Interés General'}
                                          </div>
                                          {deal.value > 0 && (
                                              <div className="text-xs font-mono text-slate-500 dark:text-slate-400">
                                                  ${deal.value.toLocaleString()} {deal.currency || 'USD'}
                                              </div>
                                          )}
                                      </div>

                                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700/50">
                                          <div className={`flex items-center gap-1 text-[10px] ${isStagnant(deal.lastInteraction) ? 'text-amber-600 font-bold' : 'text-slate-400'}`}>
                                              <Clock size={10} />
                                              {deal.lastInteraction}
                                          </div>
                                          
                                          {/* Mini indicator if bot handled last */}
                                          {deal.chatHistory.length > 0 && deal.chatHistory[deal.chatHistory.length - 1].role === 'model' && (
                                              <span title="Última respuesta: Bot">
                                                  <Bot size={12} className="text-brand-400" />
                                              </span>
                                          )}
                                      </div>
                                  </div>
                              ))}
                              {stageDeals.length === 0 && (
                                  <div className="h-20 flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-700/50 rounded-lg text-slate-300 text-xs uppercase font-medium">
                                      Vacío
                                  </div>
                              )}
                          </div>
                      </div>
                  );
              })}
          </div>
      </div>

      {/* Modal Confirmación Movimiento */}
      <Modal 
        isOpen={!!pendingMove} 
        onClose={() => setPendingMove(null)} 
        title="Mover Oportunidad"
      >
          <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg flex items-start gap-3">
                  <Zap className="text-brand-600 dark:text-brand-400 mt-1" size={24} />
                  <div>
                      <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">¿Disparar Automatización?</h4>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                          Estás moviendo este deal a la etapa <b>{pipeline.find(p => p.id === pendingMove?.targetStageId)?.name}</b>.
                      </p>
                  </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                  <button 
                      onClick={() => executeMove(false)}
                      className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex flex-col items-center gap-2 text-center group"
                  >
                      <VolumeX size={24} className="text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200" />
                      <div>
                          <span className="block font-bold text-slate-700 dark:text-slate-200 text-sm">Modo Silencioso</span>
                          <span className="block text-[10px] text-slate-400">Solo actualizar estado. No enviar mensajes.</span>
                      </div>
                  </button>

                  <button 
                      onClick={() => executeMove(true)}
                      className="p-4 rounded-xl border border-brand-200 dark:border-brand-800 bg-brand-50 dark:bg-brand-900/10 hover:bg-brand-100 dark:hover:bg-brand-900/20 transition-all flex flex-col items-center gap-2 text-center group"
                  >
                      <Bot size={24} className="text-brand-600 dark:text-brand-400 group-hover:scale-110 transition-transform" />
                      <div>
                          <span className="block font-bold text-brand-700 dark:text-brand-300 text-sm">Disparar Bot</span>
                          <span className="block text-[10px] text-brand-600/70 dark:text-brand-400/70">Enviar script de etapa automáticamente.</span>
                      </div>
                  </button>
              </div>
          </div>
      </Modal>
    </div>
  );
};