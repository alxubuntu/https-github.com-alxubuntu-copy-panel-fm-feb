import React, { useState } from 'react';
import { useStore } from '../store';
import { Plus, Trash2, Globe, Flag, Edit2, CheckCircle, Ban, AlertTriangle } from 'lucide-react';
import { Modal } from '../components/Modal';
import { CountryConfig } from '../types';

export const Countries: React.FC = () => {
  const { countries, updateState } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingCountry, setEditingCountry] = useState<Partial<CountryConfig>>({
    code: '', name: '', currency: '', phonePrefix: '', flag: '', isActive: true
  });

  const handleEdit = (country?: CountryConfig) => {
    if (country) {
      setEditingCountry({ ...country });
    } else {
      setEditingCountry({
        code: '', name: '', currency: '', phonePrefix: '', flag: '', isActive: true
      });
    }
    setIsModalOpen(true);
  };

  const confirmDelete = () => {
    if (deleteId) {
        updateState('countries', countries.filter(c => c.code !== deleteId));
        setDeleteId(null);
    }
  };

  const handleToggleActive = (code: string) => {
    updateState('countries', countries.map(c => 
      c.code === code ? { ...c, isActive: !c.isActive } : c
    ));
  };

  const handleSave = () => {
    if (!editingCountry.code || !editingCountry.name) return;
    
    const countryToSave = editingCountry as CountryConfig;
    
    const exists = countries.find(c => c.code === countryToSave.code);
    
    let newCountries;
    if (exists) {
        newCountries = countries.map(c => c.code === countryToSave.code ? countryToSave : c);
    } else {
        newCountries = [...countries, countryToSave];
    }

    updateState('countries', newCountries);
    setIsModalOpen(false);
  };

  return (
    <div className="p-8 h-full overflow-y-auto">
      <header className="mb-8 flex justify-between items-end">
        <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Configuración Regional</h2>
            <p className="text-slate-500 dark:text-slate-400">Módulo 8: Catálogo Maestro de Mercados</p>
        </div>
        <button 
            onClick={() => handleEdit()}
            className="bg-brand-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-brand-700 transition-colors shadow-sm"
        >
            <Plus size={18} /> Agregar Mercado
        </button>
      </header>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm transition-colors">
          <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-200 dark:border-slate-800">
                  <tr>
                      <th className="px-6 py-4">Bandera</th>
                      <th className="px-6 py-4">Nombre País</th>
                      <th className="px-6 py-4">Código ISO</th>
                      <th className="px-6 py-4">Moneda</th>
                      <th className="px-6 py-4">Prefijo</th>
                      <th className="px-6 py-4">Estado</th>
                      <th className="px-6 py-4 text-right">Acciones</th>
                  </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {countries.map(country => (
                      <tr key={country.code} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="px-6 py-4 text-2xl">{country.flag}</td>
                          <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-200">{country.name}</td>
                          <td className="px-6 py-4 font-mono text-slate-500 dark:text-slate-400">{country.code}</td>
                          <td className="px-6 py-4"><span className="font-mono bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded px-2 py-1 w-fit">{country.currency}</span></td>
                          <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{country.phonePrefix}</td>
                          <td className="px-6 py-4">
                              <button onClick={() => handleToggleActive(country.code)}>
                                  {country.isActive ? (
                                      <span className="flex items-center gap-1 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full text-xs font-medium border border-green-100 dark:border-green-900/30">
                                          <CheckCircle size={12} /> Activo
                                      </span>
                                  ) : (
                                      <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full text-xs font-medium border border-slate-200 dark:border-slate-700">
                                          <Ban size={12} /> Inactivo
                                      </span>
                                  )}
                              </button>
                          </td>
                          <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                  <button onClick={() => handleEdit(country)} className="p-2 text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded transition-colors">
                                      <Edit2 size={16} />
                                  </button>
                                  <button onClick={() => setDeleteId(country.code)} className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors">
                                      <Trash2 size={16} />
                                  </button>
                              </div>
                          </td>
                      </tr>
                  ))}
              </tbody>
          </table>
          {countries.length === 0 && (
              <div className="p-12 text-center text-slate-400 flex flex-col items-center">
                  <Globe size={48} className="mb-4 text-slate-200 dark:text-slate-700" />
                  <p>No hay mercados configurados. Agrega un país para comenzar a vender.</p>
              </div>
          )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingCountry.code ? "Editar Mercado" : "Nuevo Mercado"}>
          <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                  <div>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Nombre País</label>
                      <input 
                        type="text" 
                        className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded focus:ring-2 focus:ring-brand-500 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        placeholder="ej. Brasil"
                        value={editingCountry.name}
                        onChange={(e) => setEditingCountry({...editingCountry, name: e.target.value})}
                      />
                  </div>
                  <div>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Código ISO (ID)</label>
                      <input 
                        type="text" 
                        maxLength={2}
                        className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded focus:ring-2 focus:ring-brand-500 outline-none uppercase bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        placeholder="BR"
                        value={editingCountry.code}
                        onChange={(e) => setEditingCountry({...editingCountry, code: e.target.value.toUpperCase()})}
                        disabled={!!(countries.find(c => c.code === editingCountry.code) && editingCountry.code)}
                      />
                  </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                   <div>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Moneda</label>
                      <input 
                        type="text" 
                        maxLength={3}
                        className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded focus:ring-2 focus:ring-brand-500 outline-none uppercase bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        placeholder="BRL"
                        value={editingCountry.currency}
                        onChange={(e) => setEditingCountry({...editingCountry, currency: e.target.value.toUpperCase()})}
                      />
                   </div>
                   <div>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Prefijo</label>
                      <input 
                        type="text" 
                        className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded focus:ring-2 focus:ring-brand-500 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        placeholder="+55"
                        value={editingCountry.phonePrefix}
                        onChange={(e) => setEditingCountry({...editingCountry, phonePrefix: e.target.value})}
                      />
                   </div>
                   <div>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Emoji Bandera</label>
                      <input 
                        type="text" 
                        className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded focus:ring-2 focus:ring-brand-500 outline-none text-center bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        placeholder="🇧🇷"
                        value={editingCountry.flag}
                        onChange={(e) => setEditingCountry({...editingCountry, flag: e.target.value})}
                      />
                   </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                 <input 
                    type="checkbox" 
                    id="isActive"
                    checked={editingCountry.isActive}
                    onChange={(e) => setEditingCountry({...editingCountry, isActive: e.target.checked})}
                    className="w-4 h-4 text-brand-600 rounded"
                 />
                 <label htmlFor="isActive" className="text-sm text-slate-700 dark:text-slate-300">Mercado Activo para Ventas</label>
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800 mt-4">
                  <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">Cancelar</button>
                  <button onClick={handleSave} className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700">Guardar Mercado</button>
              </div>
          </div>
      </Modal>

      {/* Modal Confirmación Borrar */}
      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Confirmar Eliminación">
        <div className="space-y-4">
            <div className="flex items-center gap-3 text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg">
                <AlertTriangle size={24} />
                <p className="text-sm font-medium">Advertencia: Esta acción no se puede deshacer.</p>
            </div>
            <p className="text-slate-600 dark:text-slate-300">
                ¿Seguro que deseas eliminar <span className="font-bold">{deleteId}</span>? Esto puede romper reglas de Precios y Links de Pago asociados.
            </p>
            <div className="flex justify-end gap-2 pt-4">
                <button onClick={() => setDeleteId(null)} className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">Cancelar</button>
                <button onClick={confirmDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Eliminar País</button>
            </div>
        </div>
      </Modal>
    </div>
  );
};