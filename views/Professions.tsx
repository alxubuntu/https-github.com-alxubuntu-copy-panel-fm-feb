import React, { useState } from 'react';
import { useStore } from '../store';
import { Plus, Trash2, Check, X as XIcon, Settings2, ShieldAlert, FileText, AlertTriangle } from 'lucide-react';
import { Modal } from '../components/Modal';
import { CourseProfessionRule } from '../types';

export const Professions: React.FC = () => {
  const { courses, professionsCatalog, professionRules, updateState } = useStore();
  
  // Estado para Modal de Catálogo
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [newProfessionName, setNewProfessionName] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  // Estado para Modal de Reglas
  const [editingRule, setEditingRule] = useState<Partial<CourseProfessionRule> | null>(null);
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  
  // --- LÓGICA DE CATÁLOGO ---
  const handleAddProfession = () => {
      if (!newProfessionName.trim()) return;
      const newProf = {
          id: `p${Date.now()}`,
          name: newProfessionName
      };
      updateState('professionsCatalog', [...professionsCatalog, newProf]);
      setNewProfessionName('');
      setIsCatalogModalOpen(false);
  };

  const confirmDelete = () => {
      if (deleteId) {
          updateState('professionsCatalog', professionsCatalog.filter(p => p.id !== deleteId));
          // Limpiar reglas
          updateState('professionRules', professionRules.filter(r => r.professionId !== deleteId));
          setDeleteId(null);
      }
  };

  // --- LÓGICA DE REGLAS ---
  const getRule = (sku: string, professionId: string) => {
      return professionRules.find(r => r.sku === sku && r.professionId === professionId);
  };

  const handleCellClick = (sku: string, professionId: string) => {
      const existingRule = getRule(sku, professionId);
      if (existingRule) {
          setEditingRule({ ...existingRule });
      } else {
          // Estado por defecto para nueva regla
          setEditingRule({
              sku,
              professionId,
              isAllowed: false,
              requiresCertification: false,
              notes: ''
          });
      }
      setIsRuleModalOpen(true);
  };

  const handleSaveRule = () => {
      if (!editingRule || !editingRule.sku || !editingRule.professionId) return;
      
      const newRule = editingRule as CourseProfessionRule;
      
      // Remover regla existente si existe
      const otherRules = professionRules.filter(r => !(r.sku === newRule.sku && r.professionId === newRule.professionId));
      
      updateState('professionRules', [...otherRules, newRule]);
      
      setIsRuleModalOpen(false);
  };

  return (
    <div className="p-8 h-full overflow-y-auto">
      <header className="mb-8 flex justify-between items-end">
        <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Profesiones Permitidas</h2>
            <p className="text-slate-500 dark:text-slate-400">Módulo 4: Filtro de Calidad y Reglas de Admisión</p>
        </div>
        <button 
            onClick={() => setIsCatalogModalOpen(true)}
            className="bg-brand-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-brand-700 transition-colors shadow-sm"
        >
            <Plus size={18} /> Agregar Profesión
        </button>
      </header>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden overflow-x-auto transition-colors">
          <table className="w-full text-sm text-left border-collapse">
              <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-200 dark:border-slate-800">
                      <th className="p-4 border-r border-slate-200 dark:border-slate-800 sticky left-0 bg-slate-50 dark:bg-slate-900 z-10 w-[250px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                          Profesión / Catálogo
                      </th>
                      {courses.map(course => (
                          <th key={course.sku} className="p-4 text-center min-w-[140px]">
                              <div className="flex flex-col items-center">
                                  <span className="font-bold text-slate-800 dark:text-slate-200">{course.sku}</span>
                                  <span className="text-[10px] text-slate-400 font-normal truncate max-w-[120px]">{course.name}</span>
                              </div>
                          </th>
                      ))}
                      <th className="p-4 w-[50px]"></th>
                  </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {professionsCatalog.map(prof => (
                      <tr key={prof.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                          <td className="p-4 border-r border-slate-200 dark:border-slate-800 font-medium text-slate-700 dark:text-slate-300 sticky left-0 bg-white dark:bg-slate-900 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                              {prof.name}
                          </td>
                          {courses.map(course => {
                              const rule = getRule(course.sku, prof.id);
                              const isAllowed = rule?.isAllowed;
                              const hasConfig = rule?.requiresCertification || rule?.notes;

                              return (
                                  <td key={course.sku} className="border-r border-slate-100 dark:border-slate-800 last:border-r-0 p-0 text-center align-middle">
                                      <button 
                                          onClick={() => handleCellClick(course.sku, prof.id)}
                                          className={`w-full h-full min-h-[50px] flex items-center justify-center transition-all gap-1 group
                                            ${isAllowed 
                                                ? 'bg-green-50/50 dark:bg-green-900/10 hover:bg-green-100 dark:hover:bg-green-900/30' 
                                                : 'hover:bg-slate-100 dark:hover:bg-slate-800/50'
                                            }
                                          `}
                                      >
                                          {isAllowed ? (
                                              <>
                                                  <Check size={18} className="text-green-600 dark:text-green-400" />
                                                  {hasConfig && <Settings2 size={12} className="text-green-400 opacity-70" />}
                                              </>
                                          ) : (
                                              <div className="w-4 h-4 rounded border border-slate-300 dark:border-slate-600 group-hover:border-slate-400"></div>
                                          )}
                                      </button>
                                  </td>
                              );
                          })}
                          <td className="p-2 text-center">
                              <button 
                                onClick={() => setDeleteId(prof.id)}
                                className="text-slate-300 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                              >
                                  <Trash2 size={16} />
                              </button>
                          </td>
                      </tr>
                  ))}
              </tbody>
          </table>
          {professionsCatalog.length === 0 && (
              <div className="p-8 text-center text-slate-400">No hay profesiones en el catálogo. Agrega una para definir reglas.</div>
          )}
      </div>

      {/* --- MODAL AGREGAR PROFESIÓN --- */}
      <Modal isOpen={isCatalogModalOpen} onClose={() => setIsCatalogModalOpen(false)} title="Agregar Nueva Profesión">
          <div className="space-y-4">
              <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nombre de Profesión</label>
                  <input 
                    type="text" 
                    className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white" 
                    placeholder="ej., Diseñador Gráfico"
                    value={newProfessionName}
                    onChange={(e) => setNewProfessionName(e.target.value)}
                    autoFocus
                  />
              </div>
              <div className="pt-4 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                  <button onClick={() => setIsCatalogModalOpen(false)} className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">Cancelar</button>
                  <button onClick={handleAddProfession} className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700">Agregar al Catálogo</button>
              </div>
          </div>
      </Modal>

      {/* --- MODAL CONFIGURAR REGLA --- */}
      <Modal isOpen={isRuleModalOpen} onClose={() => setIsRuleModalOpen(false)} title="Configurar Regla de Admisión">
          {editingRule && (
              <div className="space-y-6">
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg flex justify-between items-center border border-slate-200 dark:border-slate-700">
                      <div>
                          <div className="text-xs text-slate-500 uppercase font-bold">Profesión</div>
                          <div className="text-lg font-bold text-slate-800 dark:text-slate-200">
                              {professionsCatalog.find(p => p.id === editingRule.professionId)?.name}
                          </div>
                      </div>
                      <div className="text-right">
                          <div className="text-xs text-slate-500 uppercase font-bold">SKU Curso</div>
                          <div className="font-mono text-slate-800 dark:text-slate-200">{editingRule.sku}</div>
                      </div>
                  </div>

                  {/* Toggle Principal */}
                  <div className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900">
                      <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${editingRule.isAllowed ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                              {editingRule.isAllowed ? <Check size={24} /> : <XIcon size={24} />}
                          </div>
                          <div>
                              <h4 className="font-bold text-slate-900 dark:text-white">
                                  {editingRule.isAllowed ? 'Admisión Permitida' : 'Admisión Denegada'}
                              </h4>
                              <p className="text-xs text-slate-500">¿Puede esta profesión inscribirse en este curso?</p>
                          </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                            type="checkbox" 
                            className="sr-only peer"
                            checked={editingRule.isAllowed}
                            onChange={(e) => setEditingRule({...editingRule, isAllowed: e.target.checked})}
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-300 dark:peer-focus:ring-brand-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-brand-600"></div>
                      </label>
                  </div>

                  {editingRule.isAllowed && (
                      <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                          {/* Requisito Certificación */}
                          <div className="flex items-start gap-3 p-3 rounded-lg border border-orange-100 dark:border-orange-900/30 bg-orange-50 dark:bg-orange-900/10">
                              <ShieldAlert className="text-orange-500 mt-0.5" size={20} />
                              <div className="flex-1">
                                  <div className="flex items-center justify-between mb-1">
                                      <label htmlFor="reqCert" className="font-semibold text-slate-800 dark:text-slate-200 text-sm cursor-pointer">¿Requiere Certificación Profesional?</label>
                                      <input 
                                        type="checkbox" 
                                        id="reqCert"
                                        checked={editingRule.requiresCertification}
                                        onChange={(e) => setEditingRule({...editingRule, requiresCertification: e.target.checked})}
                                        className="w-4 h-4 text-orange-500 rounded focus:ring-orange-500"
                                      />
                                  </div>
                                  <p className="text-xs text-slate-500 dark:text-slate-400">Si marcado, la IA pedirá al usuario confirmar que posee un certificado/licencia válido.</p>
                              </div>
                          </div>

                          {/* Notas */}
                          <div>
                              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                  <FileText size={16} /> Notas Internas / Excepciones
                              </label>
                              <textarea 
                                className="w-full p-3 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                rows={2}
                                placeholder="ej., Solo permitido si tienen 2 años de experiencia..."
                                value={editingRule.notes || ''}
                                onChange={(e) => setEditingRule({...editingRule, notes: e.target.value})}
                              />
                          </div>
                      </div>
                  )}

                  <div className="pt-4 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                      <button onClick={() => setIsRuleModalOpen(false)} className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">Cancelar</button>
                      <button onClick={handleSaveRule} className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700">Guardar Configuración</button>
                  </div>
              </div>
          )}
      </Modal>

      {/* --- MODAL CONFIRMACIÓN BORRAR --- */}
      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Eliminar Profesión">
          <div className="space-y-4">
              <div className="flex items-center gap-3 text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg">
                   <AlertTriangle size={24} />
                   <p className="text-sm font-medium">Advertencia: Esto eliminará todas las reglas asociadas con esta profesión.</p>
               </div>
               <p className="text-slate-600 dark:text-slate-300">¿Estás seguro que deseas eliminar <span className="font-bold">{professionsCatalog.find(p => p.id === deleteId)?.name}</span>?</p>
               <div className="flex justify-end gap-2 pt-4">
                   <button onClick={() => setDeleteId(null)} className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">Cancelar</button>
                   <button onClick={confirmDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Eliminar</button>
               </div>
          </div>
      </Modal>
    </div>
  );
};