import React, { useState } from 'react';
import { useStore } from '../store';
import { Plus, Trash2, Database, AlertTriangle, Key, Type, FileText, Bot, Edit2 } from 'lucide-react';
import { Modal } from '../components/Modal';
import { ContactProperty, PropertyType } from '../types';

export const ContactProperties: React.FC = () => {
  const { contactProperties, pipeline, updateState } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<Partial<ContactProperty>>({
    label: '',
    key: '',
    type: 'Text',
    description: ''
  });

  const openAddModal = () => {
    setEditingId(null);
    setFormData({ label: '', key: '', type: 'Text', description: '' });
    setIsModalOpen(true);
  };

  const handleEdit = (prop: ContactProperty) => {
    setEditingId(prop.id);
    setFormData({
        label: prop.label,
        key: prop.key,
        type: prop.type,
        description: prop.description
    });
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.label || !formData.key || !formData.type) return;

    // Validación duplicados
    if (contactProperties.some(cp => cp.key === formData.key && cp.id !== editingId)) {
        alert("¡La clave debe ser única!");
        return;
    }

    if (editingId) {
        // --- ACTUALIZAR EXISTENTE ---
        const oldProp = contactProperties.find(cp => cp.id === editingId);
        
        // 1. Actualizar Lista
        const updatedProperties = contactProperties.map(cp => 
            cp.id === editingId 
            ? { 
                ...cp, 
                label: formData.label!, 
                key: formData.key!, 
                type: formData.type as PropertyType, 
                description: formData.description || '' 
              }
            : cp
        );
        updateState('contactProperties', updatedProperties);

        // 2. Actualizar Pipeline en Cascada
        if (oldProp && oldProp.key !== formData.key) {
             const updatedPipeline = pipeline.map(stage => 
                stage.requiredInput === oldProp.key 
                ? { ...stage, requiredInput: formData.key! } 
                : stage
             );
             if (JSON.stringify(updatedPipeline) !== JSON.stringify(pipeline)) {
                 updateState('pipeline', updatedPipeline);
             }
        }

    } else {
        // --- CREAR NUEVO ---
        const newProperty: ContactProperty = {
          id: `cp_${Date.now()}`,
          label: formData.label!,
          key: formData.key!.toLowerCase().replace(/\s+/g, '_'),
          type: formData.type as PropertyType,
          description: formData.description || ''
        };
        updateState('contactProperties', [...contactProperties, newProperty]);
    }

    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ label: '', key: '', type: 'Text', description: '' });
  };

  const confirmDelete = () => {
    if (deleteId) {
        // Verificar uso en Pipeline
        const isUsed = pipeline.some(p => p.requiredInput === contactProperties.find(cp => cp.id === deleteId)?.key);
        if (isUsed) {
            alert("No se puede borrar: Esta propiedad se usa actualmente en el Pipeline (Módulo 5). Por favor remuévela de la etapa primero.");
            setDeleteId(null);
            return;
        }

        updateState('contactProperties', contactProperties.filter(cp => cp.id !== deleteId));
        setDeleteId(null);
    }
  };

  const getTypeColor = (type: PropertyType) => {
    switch(type) {
        case 'Email': return 'text-blue-600 bg-blue-50 dark:bg-blue-900/30';
        case 'Number': return 'text-green-600 bg-green-50 dark:bg-green-900/30';
        case 'Select': return 'text-purple-600 bg-purple-50 dark:bg-purple-900/30';
        case 'File': return 'text-orange-600 bg-orange-50 dark:bg-orange-900/30';
        default: return 'text-slate-600 bg-slate-50 dark:bg-slate-800';
    }
  };

  return (
    <div className="p-8 h-full overflow-y-auto">
      <header className="mb-8 flex justify-between items-end">
        <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Propiedades de Contacto (Usuario)</h2>
            <p className="text-slate-500 dark:text-slate-400">Módulo 9: Define la estructura de datos para los leads.</p>
        </div>
        <button 
            onClick={openAddModal}
            className="bg-brand-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-brand-700 transition-colors shadow-sm"
        >
            <Plus size={18} /> Agregar Propiedad
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {contactProperties.map(prop => (
              <div key={prop.id} className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-brand-300 dark:hover:border-brand-700 transition-all group relative">
                  <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${getTypeColor(prop.type)}`}>
                              <Database size={20} />
                          </div>
                          <div>
                              <h3 className="font-bold text-slate-800 dark:text-slate-200">{prop.label}</h3>
                              <div className="flex items-center gap-1 text-xs font-mono text-slate-400">
                                  <Key size={10} />
                                  {prop.key}
                              </div>
                          </div>
                      </div>
                      <div className="flex items-center gap-1">
                          <button 
                            onClick={() => handleEdit(prop)}
                            className="text-slate-300 hover:text-brand-500 dark:hover:text-brand-400 p-2 transition-colors"
                          >
                              <Edit2 size={18} />
                          </button>
                          <button 
                            onClick={() => setDeleteId(prop.id)}
                            className="text-slate-300 hover:text-red-500 dark:hover:text-red-400 p-2 transition-colors"
                          >
                              <Trash2 size={18} />
                          </button>
                      </div>
                  </div>

                  <div className="space-y-3">
                      <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-1 rounded font-medium border border-transparent ${getTypeColor(prop.type)}`}>
                              {prop.type}
                          </span>
                      </div>
                      
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                          <div className="flex items-center gap-2 mb-1 text-xs font-semibold text-slate-500 uppercase">
                              <Bot size={12} className="text-brand-500" /> Regla Validación IA
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-300 italic">
                              "{prop.description}"
                          </p>
                      </div>
                  </div>
              </div>
          ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "Editar Propiedad" : "Definir Nueva Propiedad"}>
          <div className="space-y-4">
              <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Etiqueta de Propiedad</label>
                  <input 
                    type="text" 
                    className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white" 
                    placeholder="ej., Turno Preferido"
                    value={formData.label}
                    onChange={(e) => {
                        const val = e.target.value;
                        if (!editingId) {
                            setFormData({
                                ...formData, 
                                label: val,
                                key: val.toLowerCase().replace(/[^a-z0-9]/g, '_')
                            })
                        } else {
                             setFormData({ ...formData, label: val })
                        }
                    }}
                  />
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Clave Interna (Key)</label>
                      <div className="relative">
                          <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                          <input 
                            type="text" 
                            className="w-full pl-9 p-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 font-mono text-sm" 
                            placeholder="turno_preferido"
                            value={formData.key}
                            onChange={(e) => setFormData({...formData, key: e.target.value})}
                          />
                      </div>
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tipo de Dato</label>
                      <div className="relative">
                          <Type className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                          <select 
                            className="w-full pl-9 p-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white appearance-none"
                            value={formData.type}
                            onChange={(e) => setFormData({...formData, type: e.target.value as PropertyType})}
                          >
                              <option value="Text">Texto</option>
                              <option value="Number">Número</option>
                              <option value="Select">Selección/Opción</option>
                              <option value="Email">Email</option>
                              <option value="File">Archivo Adjunto</option>
                          </select>
                      </div>
                  </div>
              </div>

              <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Descripción para Validación IA</label>
                  <div className="relative">
                      <FileText className="absolute left-3 top-3 text-slate-400" size={14} />
                      <textarea 
                        className="w-full pl-9 p-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white" 
                        rows={3}
                        placeholder="ej., Debe ser 'Mañana' o 'Tarde'. Rechaza otros valores."
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                      />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">El bot usará esta regla para aceptar o rechazar el input del usuario.</p>
              </div>

              {editingId && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg flex gap-2 items-start text-xs text-blue-700 dark:text-blue-300">
                      <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                      <p>Nota: Renombrar la <b>Clave Interna</b> actualizará automáticamente cualquier Etapa del Pipeline que la use.</p>
                  </div>
              )}

              <div className="pt-4 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                  <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">Cancelar</button>
                  <button onClick={handleSave} className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700">
                      {editingId ? "Actualizar Propiedad" : "Guardar Propiedad"}
                  </button>
              </div>
          </div>
      </Modal>

      {/* Modal Borrar */}
      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Eliminar Propiedad">
          <div className="space-y-4">
               <div className="flex items-center gap-3 text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg">
                   <AlertTriangle size={24} />
                   <p className="text-sm font-medium">Esto eliminará la definición de datos del sistema.</p>
               </div>
               <p className="text-slate-600 dark:text-slate-300">¿Estás seguro de que quieres eliminar <span className="font-bold">{contactProperties.find(p => p.id === deleteId)?.label}</span>?</p>
               <div className="flex justify-end gap-2 pt-4">
                   <button onClick={() => setDeleteId(null)} className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">Cancelar</button>
                   <button onClick={confirmDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Eliminar</button>
               </div>
          </div>
      </Modal>
    </div>
  );
};