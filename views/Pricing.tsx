import React, { useState } from 'react';
import { useStore } from '../store';
import { DollarSign, AlertCircle, Trash2 } from 'lucide-react';
import { Pricing } from '../types';
import { Modal } from '../components/Modal';

export const PricingView: React.FC = () => {
  const { courses, prices, countries, updateState } = useStore();
  
  // --- ESTADO DE PRECIOS ---
  const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);
  const [editingPrice, setEditingPrice] = useState<Partial<Pricing>>({});

  // Filtrar Países Activos para la Matriz
  const activeCountries = countries.filter(c => c.isActive);

  // --- LÓGICA DE PRECIOS ---
  const handleEditPrice = (sku: string, country: string) => {
    const existing = prices.find(p => p.sku === sku && p.country === country);
    const countryConfig = countries.find(c => c.code === country);
    
    if (existing) {
      setEditingPrice({ ...existing });
    } else {
      setEditingPrice({
        sku,
        country,
        currency: countryConfig?.currency || 'USD',
        price: 0,
        isActive: true
      });
    }
    setIsPriceModalOpen(true);
  };

  const handleCountryChangeInModal = (countryCode: string) => {
      const countryConfig = countries.find(c => c.code === countryCode);
      setEditingPrice({
          ...editingPrice,
          country: countryCode,
          currency: countryConfig?.currency || 'USD'
      });
  };

  const handleSavePrice = () => {
    if (!editingPrice.sku || !editingPrice.country) return;
    
    const newPriceObj = editingPrice as Pricing;
    // Eliminar entrada antigua si existe y añadir nueva
    const filtered = prices.filter(p => !(p.sku === newPriceObj.sku && p.country === newPriceObj.country));
    updateState('prices', [...filtered, newPriceObj]);
    setIsPriceModalOpen(false);
  };

  const handleDeletePrice = () => {
    if (!editingPrice.sku || !editingPrice.country) return;
    
    // Filtrar la regla de precio específica
    const filtered = prices.filter(p => !(p.sku === editingPrice.sku && p.country === editingPrice.country));
    updateState('prices', filtered);
    setIsPriceModalOpen(false);
  };

  // Helper para renderizar Celda de Matriz
  const renderPriceCell = (sku: string, country: string) => {
    const price = prices.find(p => p.sku === sku && p.country === country);
    const countryConfig = countries.find(c => c.code === country);
    
    if (!price) {
      return (
        <div 
          onClick={() => handleEditPrice(sku, country)}
          className="h-full w-full min-h-[40px] flex items-center justify-center text-slate-300 dark:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer text-xs italic"
        >
          + Agregar
        </div>
      );
    }

    const hasPromo = price.promoPrice && price.isActive;
    const isInactive = !price.isActive;

    return (
      <div 
        onClick={() => handleEditPrice(sku, country)}
        className={`h-full w-full min-h-[50px] p-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 flex flex-col items-center justify-center border-2 border-transparent hover:border-brand-200 dark:hover:border-brand-800 transition-all rounded ${isInactive ? 'opacity-50 bg-slate-50 dark:bg-slate-800/50' : ''}`}
      >
        <div className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
           <span className="text-[10px] text-slate-400">{price.currency}</span>
           <span className={hasPromo ? 'line-through text-slate-400 text-xs' : ''}>{price.price}</span>
        </div>
        {hasPromo && (
           <span className="text-green-600 dark:text-green-400 font-bold text-xs bg-green-50 dark:bg-green-900/20 px-1 rounded">
             {price.promoPrice}
           </span>
        )}
      </div>
    );
  };


  return (
    <div className="p-8 h-full overflow-y-auto">
      <header className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Matriz de Precios</h2>
        <p className="text-slate-500 dark:text-slate-400">Módulo 2: Configuración de Precios Transfronterizos</p>
      </header>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden overflow-x-auto transition-colors">
          {/* Cabecera Matriz */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <AlertCircle size={16} />
              <span>Clic en cualquier celda para editar. Solo se muestran Mercados Activos (Módulo 8).</span>
          </div>
          
          <table className="w-full text-sm text-left border-collapse">
              <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-200 dark:border-slate-800">
                      <th className="p-4 border-r border-slate-200 dark:border-slate-800 sticky left-0 bg-slate-50 dark:bg-slate-900 z-10 w-[200px]">Curso</th>
                      {activeCountries.map(country => (
                          <th key={country.code} className="p-4 text-center min-w-[120px]">
                              <div className="flex flex-col items-center">
                                  <span className="text-xl mb-1" role="img" aria-label={country.name}>{country.flag}</span>
                                  {country.code}
                              </div>
                          </th>
                      ))}
                  </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {courses.map(course => (
                      <tr key={course.sku} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                          <td className="p-4 border-r border-slate-200 dark:border-slate-800 font-medium text-slate-800 dark:text-slate-200 sticky left-0 bg-white dark:bg-slate-900 z-10">
                              {course.name}
                              <div className="text-xs text-slate-400 font-mono mt-0.5">{course.sku}</div>
                          </td>
                          {activeCountries.map(country => (
                              <td key={country.code} className="border-r border-slate-100 dark:border-slate-800 last:border-r-0 p-0 text-center align-middle">
                                  {renderPriceCell(course.sku, country.code)}
                              </td>
                          ))}
                      </tr>
                  ))}
              </tbody>
          </table>
      </div>

      {/* Modal Precio */}
      <Modal isOpen={isPriceModalOpen} onClose={() => setIsPriceModalOpen(false)} title="Editar Regla de Precio">
          <div className="space-y-4">
               <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg flex items-center justify-between">
                   <div>
                       <div className="font-bold text-slate-800 dark:text-slate-200">{editingPrice.sku}</div>
                       <div className="text-xs text-slate-500 dark:text-slate-400">Curso Objetivo</div>
                   </div>
                   <div className="text-right">
                       <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1 justify-end">
                         {/* Dynamic Flag Display */}
                         {(() => {
                            const c = countries.find(x => x.code === editingPrice.country);
                            return c ? <span className="text-xl">{c.flag}</span> : null;
                         })()}
                          {editingPrice.country}
                       </div>
                       <div className="text-xs text-slate-500 dark:text-slate-400">País Objetivo</div>
                   </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                   <div>
                       <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">País</label>
                       <select 
                        className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded focus:ring-2 focus:ring-brand-500 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        value={editingPrice.country}
                        onChange={(e) => handleCountryChangeInModal(e.target.value)}
                       >
                           {activeCountries.map(c => (
                               <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
                           ))}
                       </select>
                   </div>
                   <div>
                       <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Moneda (Auto)</label>
                       <input 
                         type="text" 
                         className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded bg-slate-100 dark:bg-slate-800 font-bold text-slate-600 dark:text-slate-400" 
                         value={editingPrice.currency || ''}
                         readOnly
                       />
                   </div>
               </div>

               <div>
                   <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Precio Regular</label>
                   <input 
                     type="number" 
                     className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded focus:ring-2 focus:ring-brand-500 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                     value={editingPrice.price || 0}
                     onChange={(e) => setEditingPrice({...editingPrice, price: parseFloat(e.target.value)})}
                   />
               </div>

               <div className="border-t border-slate-100 dark:border-slate-800 pt-4 mt-2">
                   <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                       <DollarSign size={16} className="text-green-600 dark:text-green-400" /> Promoción (Opcional)
                   </h4>
                   
                   <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                           <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Precio Promo</label>
                           <input 
                             type="number" 
                             className="w-full p-2 border rounded focus:ring-2 focus:ring-brand-500 outline-none border-green-200 dark:border-green-800/50 focus:border-green-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                             value={editingPrice.promoPrice || ''}
                             onChange={(e) => setEditingPrice({...editingPrice, promoPrice: parseFloat(e.target.value)})}
                           />
                        </div>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                       <div>
                           <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Fecha Inicio</label>
                           <input 
                             type="date" 
                             className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded focus:ring-2 focus:ring-brand-500 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                             value={editingPrice.promoStartDate || ''}
                             onChange={(e) => setEditingPrice({...editingPrice, promoStartDate: e.target.value})}
                           />
                       </div>
                       <div>
                           <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Fecha Fin</label>
                           <input 
                             type="date" 
                             className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded focus:ring-2 focus:ring-brand-500 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                             value={editingPrice.promoEndDate || ''}
                             onChange={(e) => setEditingPrice({...editingPrice, promoEndDate: e.target.value})}
                           />
                       </div>
                   </div>
               </div>

               <div className="flex items-center gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                   <input 
                      type="checkbox" 
                      id="isActivePrice"
                      checked={editingPrice.isActive}
                      onChange={(e) => setEditingPrice({...editingPrice, isActive: e.target.checked})}
                      className="w-4 h-4 text-brand-600"
                   />
                   <label htmlFor="isActivePrice" className="text-sm font-medium text-slate-700 dark:text-slate-300">Regla de Precio Activa</label>
               </div>

               <div className="pt-4 flex justify-between gap-2">
                   {/* ADDED DELETE BUTTON */}
                   {prices.find(p => p.sku === editingPrice.sku && p.country === editingPrice.country) && (
                       <button onClick={handleDeletePrice} className="px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg flex items-center gap-2 text-sm font-medium">
                           <Trash2 size={16} /> Borrar Regla
                       </button>
                   )}
                   <div className="flex gap-2">
                        <button onClick={() => setIsPriceModalOpen(false)} className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">Cancelar</button>
                        <button onClick={handleSavePrice} className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700">Guardar</button>
                   </div>
               </div>
          </div>
      </Modal>
    </div>
  );
};