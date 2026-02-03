import React, { useState } from 'react';
import { useStore } from '../store';
import { Database, MessageSquare, ArrowRight, User, AlertCircle, Edit2, Trash2, Save, X, DollarSign, GitCommit } from 'lucide-react';
import { Modal } from '../components/Modal';
import { Deal } from '../types';

interface DataCardsProps {
  onNavigateToChat: () => void;
}

export const DataCards: React.FC<DataCardsProps> = ({ onNavigateToChat }) => {
  const { deals, contactProperties, pipeline, updateState, deleteItem, countries } = useStore();
  
  // Estados para Modales
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleNavigate = (dealId: string) => {
    updateState('navigatedDealId', dealId);
    onNavigateToChat();
  };

  // --- LÓGICA DE EDICIÓN ---
  const handleEdit = (deal: Deal) => {
      // Clonar objeto para evitar mutación directa antes de guardar
      setEditingDeal(JSON.parse(JSON.stringify(deal)));
      setIsEditModalOpen(true);
  };

  const handleSaveEdit = () => {
      if (!editingDeal) return;

      const updatedDeals = deals.map(d => d.id === editingDeal.id ? editingDeal : d);
      updateState('deals', updatedDeals);
      setIsEditModalOpen(false);
      setEditingDeal(null);
  };

  const updateCapturedData = (key: string, value: any) => {
      if (!editingDeal) return;
      setEditingDeal({
          ...editingDeal,
          capturedData: {
              ...editingDeal.capturedData,
              [key]: value
          }
      });
  };

  // --- LÓGICA DE ELIMINACIÓN ---
  const confirmDelete = () => {
      if (deleteId) {
          // Usar la función explícita de borrado para sincronizar con la BD
          deleteItem('deals', deleteId);
          setDeleteId(null);
      }
  };

  // Solo mostrar deals que tengan al menos un dato capturado O que hayan sido creados manualmente
  // Para ver todos, quitamos el filtro estricto, pero mantenemos la lógica visual
  const displayedDeals = deals; 

  return (
    <div className="p-8 h-full overflow-y-auto">
      <header className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Database className="text-brand-500" />
            Visualizador de Datos (Leads)
        </h2>
        <p className="text-slate-500 dark:text-slate-400">Módulo 11: Gestión y edición de información recolectada.</p>
      </header>

      {displayedDeals.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-96 text-slate-400 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-800">
            <AlertCircle size={48} className="mb-4 opacity-50" />
            <p>No hay leads activos.</p>
            <p className="text-sm">Inicia conversaciones en el Sandbox para generar oportunidades.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {displayedDeals.map(deal => (
            <div key={deal.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-brand-300 dark:hover:border-brand-700 transition-all flex flex-col overflow-hidden group/card">
                {/* Header Card */}
                <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 dark:text-brand-400 font-bold">
                            {deal.customerName.charAt(0)}
                        </div>
                        <div className="overflow-hidden">
                            <h3 className="font-bold text-slate-800 dark:text-slate-200 truncate w-32 md:w-40" title={deal.customerName}>
                                {deal.customerName}
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">ID: {deal.id}</p>
                        </div>
                    </div>
                    
                    {/* Botones de Acción Rápida */}
                    <div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover/card:opacity-100 transition-opacity">
                        <button 
                            onClick={() => handleEdit(deal)}
                            className="p-2 text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors"
                            title="Editar Datos"
                        >
                            <Edit2 size={16} />
                        </button>
                        <button 
                            onClick={() => setDeleteId(deal.id)}
                            className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors"
                            title="Eliminar Lead"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>

                {/* Body Card - Grid de Datos */}
                <div className="p-5 flex-1 space-y-4">
                    {/* Datos Críticos Fijos */}
                    <div className="grid grid-cols-2 gap-4 mb-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                         <div>
                             <span className="text-[10px] uppercase font-bold text-slate-400">Valor</span>
                             <div className="font-mono text-sm text-green-600 dark:text-green-400 font-medium">
                                 ${deal.value.toLocaleString()} {deal.currency}
                             </div>
                         </div>
                         <div>
                             <span className="text-[10px] uppercase font-bold text-slate-400">Etapa</span>
                             <div className="text-sm text-slate-700 dark:text-slate-300 truncate">
                                 {pipeline.find(p => p.id === deal.stageId)?.name || 'Desconocido'}
                             </div>
                         </div>
                    </div>

                    {/* Datos Dinámicos Capturados */}
                    {Object.keys(deal.capturedData).length === 0 ? (
                        <div className="text-center text-xs text-slate-400 italic py-2">
                            Sin datos adicionales capturados.
                        </div>
                    ) : (
                        contactProperties.map(prop => {
                            const value = deal.capturedData[prop.key];
                            if (!value) return null; 

                            return (
                                <div key={prop.key} className="group">
                                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                                        {prop.label}
                                    </span>
                                    <div className="text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-2 rounded border border-slate-100 dark:border-slate-700 break-words whitespace-pre-wrap">
                                        {String(value)}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800">
                    <button 
                        onClick={() => handleNavigate(deal.id)}
                        className="w-full py-2.5 px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-brand-50 dark:hover:bg-brand-900/10 hover:border-brand-200 dark:hover:border-brand-800 transition-colors flex items-center justify-center gap-2 text-sm font-medium group"
                    >
                        <MessageSquare size={16} className="text-brand-500 group-hover:scale-110 transition-transform" />
                        Ver Chat
                        <ArrowRight size={14} className="ml-1 opacity-50 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>
          ))}
        </div>
      )}

      {/* --- MODAL EDITAR LEAD --- */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Editar Lead & Datos">
        {editingDeal && (
            <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
                
                {/* Sección 1: Datos Principales del Sistema */}
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
                    <h4 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                        <User size={14} /> Información Principal
                    </h4>
                    
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nombre del Cliente</label>
                        <input 
                            type="text" 
                            className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                            value={editingDeal.customerName}
                            onChange={(e) => setEditingDeal({...editingDeal, customerName: e.target.value})}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                                <DollarSign size={12} /> Valor y Moneda
                            </label>
                            <div className="flex gap-2">
                                <input 
                                    type="number" 
                                    className="w-2/3 p-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                    value={editingDeal.value}
                                    onChange={(e) => setEditingDeal({...editingDeal, value: Number(e.target.value)})}
                                />
                                <select
                                    className="w-1/3 p-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                                    value={editingDeal.currency || 'USD'}
                                    onChange={(e) => setEditingDeal({...editingDeal, currency: e.target.value})}
                                >
                                    <option value="USD">USD</option>
                                    {countries.map(c => (
                                        <option key={c.code} value={c.currency}>{c.currency}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                                <GitCommit size={12} /> Etapa Pipeline
                            </label>
                            <select 
                                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                value={editingDeal.stageId}
                                onChange={(e) => setEditingDeal({...editingDeal, stageId: e.target.value})}
                            >
                                {pipeline.map(stage => (
                                    <option key={stage.id} value={stage.id}>{stage.order}. {stage.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Sección 2: Datos Capturados Dinámicos (M9) */}
                <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                        <Database size={14} /> Datos Recolectados (M9)
                    </h4>
                    
                    {contactProperties.length === 0 && (
                        <p className="text-sm text-slate-400 italic">No hay propiedades configuradas en el Módulo 9.</p>
                    )}

                    <div className="grid grid-cols-1 gap-4">
                        {contactProperties.map(prop => (
                            <div key={prop.id}>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    {prop.label} 
                                    <span className="text-[10px] text-slate-400 font-normal ml-2">({prop.type})</span>
                                </label>
                                <input 
                                    type={prop.type === 'Number' ? 'number' : 'text'}
                                    className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                                    placeholder={`Ingresar ${prop.label}...`}
                                    value={editingDeal.capturedData[prop.key] || ''}
                                    onChange={(e) => updateCapturedData(prop.key, e.target.value)}
                                />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="pt-4 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                    <button onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg flex items-center gap-2">
                        <X size={16} /> Cancelar
                    </button>
                    <button onClick={handleSaveEdit} className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 flex items-center gap-2 shadow-sm">
                        <Save size={16} /> Guardar Cambios
                    </button>
                </div>
            </div>
        )}
      </Modal>

      {/* --- MODAL CONFIRMACIÓN BORRAR --- */}
      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Eliminar Lead">
          <div className="space-y-4">
               <div className="flex items-center gap-3 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                   <AlertCircle size={24} />
                   <p className="text-sm font-medium">Esta acción eliminará permanentemente la tarjeta, el historial de chat y todos los datos capturados.</p>
               </div>
               <p className="text-slate-600 dark:text-slate-300">
                   ¿Confirmar eliminación del lead <span className="font-bold">{deals.find(d => d.id === deleteId)?.customerName}</span>?
               </p>
               <div className="flex justify-end gap-2 pt-4">
                   <button onClick={() => setDeleteId(null)} className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">Cancelar</button>
                   <button onClick={confirmDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2">
                       <Trash2 size={16} /> Eliminar Definitivamente
                   </button>
               </div>
          </div>
      </Modal>
    </div>
  );
};