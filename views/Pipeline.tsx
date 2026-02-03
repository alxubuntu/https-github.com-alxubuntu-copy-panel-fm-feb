import React, { useState } from 'react';
import { useStore } from '../store';
import { ArrowDown, Trash2, AlertTriangle, Edit2, Database, MessageCircle, CheckCircle, GripVertical } from 'lucide-react';
import { Modal } from '../components/Modal';
import { PipelineStage } from '../types';

export const Pipeline: React.FC = () => {
  const { pipeline, contactProperties, updateState } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteStageId, setDeleteStageId] = useState<string | null>(null);
  const [editingStageId, setEditingStageId] = useState<string | null>(null);
  const [stageForm, setStageForm] = useState({ name: '', scriptTemplate: '', requiredInput: '' });
  
  // Drag and Drop State
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Ensure pipeline is displayed in order
  const sortedPipeline = [...pipeline].sort((a, b) => a.order - b.order);

  const confirmDelete = () => {
    if (deleteStageId) {
        const updatedPipeline = sortedPipeline
            .filter(p => p.id !== deleteStageId)
            .map((p, index) => ({ ...p, order: index + 1 })); // Re-indexar orden
        updateState('pipeline', updatedPipeline);
        setDeleteStageId(null);
    }
  };

  const openAddModal = () => {
      setEditingStageId(null);
      setStageForm({ name: '', scriptTemplate: '', requiredInput: '' });
      setIsModalOpen(true);
  };

  const openEditModal = (stage: PipelineStage) => {
      setEditingStageId(stage.id);
      setStageForm({ 
          name: stage.name, 
          scriptTemplate: stage.scriptTemplate, 
          requiredInput: stage.requiredInput || '' 
      });
      setIsModalOpen(true);
  };

  const handleSaveStage = () => {
      if (!stageForm.name || !stageForm.scriptTemplate) return;
      
      if (editingStageId) {
          // Modo Edición
          const updatedPipeline = pipeline.map(p => 
              p.id === editingStageId 
                  ? { 
                      ...p, 
                      name: stageForm.name, 
                      scriptTemplate: stageForm.scriptTemplate,
                      requiredInput: stageForm.requiredInput || null
                    }
                  : p
          );
          updateState('pipeline', updatedPipeline);
      } else {
          // Modo Agregar
          const stageToAdd = {
              id: `new_${Date.now()}`,
              order: pipeline.length + 1,
              name: stageForm.name,
              scriptTemplate: stageForm.scriptTemplate,
              requiredInput: stageForm.requiredInput || null
          };
          updateState('pipeline', [...pipeline, stageToAdd]);
      }
      
      setIsModalOpen(false);
      setStageForm({ name: '', scriptTemplate: '', requiredInput: '' });
      setEditingStageId(null);
  };

  // --- Drag and Drop Handlers ---
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
      setDraggedIndex(index);
      e.dataTransfer.effectAllowed = "move";
      // Opcional: Personalizar imagen de arrastre si fuera necesario
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault(); // Necesario para permitir onDrop (y visualmente el cursor de drop)
  };

  const handleDragEnter = (index: number) => {
      if (draggedIndex === null || draggedIndex === index) return;

      const newPipeline = [...sortedPipeline];
      const draggedItem = newPipeline[draggedIndex];

      // Remove item from old position
      newPipeline.splice(draggedIndex, 1);
      // Insert item at new position
      newPipeline.splice(index, 0, draggedItem);

      // Update Order property
      const reordered = newPipeline.map((item, idx) => ({
          ...item,
          order: idx + 1
      }));

      updateState('pipeline', reordered);
      setDraggedIndex(index);
  };

  const handleDragEnd = () => {
      setDraggedIndex(null);
  };

  // Helper para obtener detalles de prop seleccionada
  const selectedProp = contactProperties.find(cp => cp.key === stageForm.requiredInput);

  return (
    <div className="p-8 h-full overflow-y-auto">
      <header className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Lógica del Pipeline (El Guión)</h2>
        <p className="text-slate-500 dark:text-slate-400">Módulo 5: Define el camino lineal que la IA debe seguir. Arrastra para reordenar.</p>
      </header>

      <div className="max-w-4xl mx-auto">
        <div className="relative">
            {/* Línea Conectora */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-800 -z-10"></div>

            {sortedPipeline.map((stage, index) => {
                const requiredProp = contactProperties.find(cp => cp.key === stage.requiredInput);

                return (
                    <div 
                        key={stage.id} 
                        draggable
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragEnter={() => handleDragEnter(index)}
                        onDragEnd={handleDragEnd}
                        onDragOver={handleDragOver}
                        className={`mb-8 flex gap-6 group transition-all duration-200 ${draggedIndex === index ? 'opacity-50 scale-[0.98]' : 'opacity-100'}`}
                    >
                        {/* Drag Handle & Order Circle */}
                        <div className="flex-shrink-0 w-16 h-16 bg-white dark:bg-slate-900 border-2 border-brand-500 rounded-full flex flex-col items-center justify-center shadow-sm z-10 relative cursor-move hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                            <span className="font-bold text-xl text-brand-600 dark:text-brand-400 leading-none">{stage.order}</span>
                            <GripVertical size={14} className="text-slate-300 dark:text-slate-600 mt-1" />
                        </div>
                        
                        <div className="flex-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm hover:border-brand-300 dark:hover:border-brand-700 transition-colors relative">
                            {index < pipeline.length - 1 && (
                                <div className="absolute -bottom-10 left-0 w-full flex justify-center text-slate-300 dark:text-slate-600">
                                    <ArrowDown size={24} />
                                </div>
                            )}
                            
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 cursor-move">{stage.name}</h3>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-1 rounded">ID: {stage.id}</span>
                                    <button onClick={() => openEditModal(stage)} className="text-slate-300 hover:text-brand-500 dark:hover:text-brand-400 p-1">
                                        <Edit2 size={16} />
                                    </button>
                                    <button onClick={() => setDeleteStageId(stage.id)} className="text-slate-300 hover:text-red-500 dark:hover:text-red-400 p-1">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Plantilla de Guión</label>
                                    <textarea 
                                        className="w-full text-sm p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 font-mono focus:ring-2 focus:ring-brand-500 outline-none"
                                        rows={2}
                                        value={stage.scriptTemplate}
                                        readOnly 
                                    />
                                </div>
                                
                                {stage.requiredInput && (
                                    <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                                        <Database size={16} className="text-purple-500" />
                                        <div className="text-sm text-slate-600 dark:text-slate-400">
                                            Recolecta Datos: <span className="font-bold text-slate-800 dark:text-slate-200">{requiredProp ? requiredProp.label : stage.requiredInput}</span> <span className="text-xs font-mono text-slate-400">({stage.requiredInput})</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}

            <div className="flex justify-center pt-4 pb-12">
                <button 
                    onClick={openAddModal}
                    className="bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 px-6 py-3 rounded-full hover:border-brand-500 hover:text-brand-500 transition-colors font-medium flex items-center gap-2"
                >
                    <span className="text-xl">+</span> Agregar Etapa
                </button>
            </div>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingStageId ? "Editar Etapa" : "Agregar Etapa"}>
          <div className="space-y-4">
              <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nombre de la Etapa</label>
                  <input 
                    type="text" 
                    className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white" 
                    placeholder="ej., Pedir Email"
                    value={stageForm.name}
                    onChange={(e) => setStageForm({...stageForm, name: e.target.value})}
                  />
              </div>
              <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Plantilla de Guión (Qué dice el bot)</label>
                  <textarea 
                    className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white" 
                    rows={3}
                    placeholder="ej., ¿Me podrías dar tu email para enviarte el folleto?"
                    value={stageForm.scriptTemplate}
                    onChange={(e) => setStageForm({...stageForm, scriptTemplate: e.target.value})}
                  />
                  <p className="text-xs text-slate-400 mt-1">Usa {'{variable}'} para datos dinámicos.</p>
              </div>
              
              <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Dato Requerido (Módulo 9)</label>
                  <select
                    className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    value={stageForm.requiredInput}
                    onChange={(e) => setStageForm({...stageForm, requiredInput: e.target.value})}
                  >
                      <option value="">-- Sin Recolección de Datos (Conversacional) --</option>
                      {contactProperties.map(cp => (
                          <option key={cp.key} value={cp.key}>
                              {cp.label} (Clave: {cp.key}) - {cp.type}
                          </option>
                      ))}
                  </select>
                  
                  {/* Texto de Ayuda Dinámico basado en selección */}
                  <div className={`mt-3 text-xs p-3 rounded-lg border flex items-start gap-2 ${
                      stageForm.requiredInput 
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-900/30 text-green-800 dark:text-green-300'
                      : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-900/30 text-blue-800 dark:text-blue-300'
                  }`}>
                      {stageForm.requiredInput ? (
                          <>
                              <CheckCircle size={14} className="mt-0.5 shrink-0" />
                              <div>
                                  <span className="font-bold block mb-0.5">Validación Activa</span>
                                  El bot requerirá estrictamente que el usuario proporcione un <span className="font-mono bg-white dark:bg-black/20 px-1 rounded">{selectedProp?.type}</span> válido para "{selectedProp?.label}" antes de avanzar a la siguiente etapa.
                              </div>
                          </>
                      ) : (
                          <>
                              <MessageCircle size={14} className="mt-0.5 shrink-0" />
                              <div>
                                  <span className="font-bold block mb-0.5">Modo Conversación</span>
                                  El bot enviará el mensaje y aceptará <b>cualquier</b> respuesta (o ninguna si es el último paso). Usa esto para saludos, compartir información o preguntas abiertas.
                              </div>
                          </>
                      )}
                  </div>
              </div>

              <div className="pt-4 flex justify-end gap-2">
                  <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">Cancelar</button>
                  <button onClick={handleSaveStage} className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700">
                      {editingStageId ? "Guardar Cambios" : "Agregar Etapa"}
                  </button>
              </div>
          </div>
      </Modal>

      {/* Modal Borrar */}
      <Modal isOpen={!!deleteStageId} onClose={() => setDeleteStageId(null)} title="Eliminar Etapa">
          <div className="space-y-4">
              <div className="flex items-center gap-3 text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg">
                   <AlertTriangle size={24} />
                   <p className="text-sm font-medium">Esto alterará la lógica del flujo de conversación.</p>
               </div>
               <p className="text-slate-600 dark:text-slate-300">¿Estás seguro de que quieres eliminar esta etapa?</p>
               <div className="flex justify-end gap-2 pt-4">
                   <button onClick={() => setDeleteStageId(null)} className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">Cancelar</button>
                   <button onClick={confirmDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Eliminar Etapa</button>
               </div>
          </div>
      </Modal>
    </div>
  );
};