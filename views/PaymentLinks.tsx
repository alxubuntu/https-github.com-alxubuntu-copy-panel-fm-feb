import React, { useState } from 'react';
import { useStore } from '../store';
import { Plus, Trash2, Copy, ExternalLink, AlertOctagon, CheckCircle, AlertTriangle } from 'lucide-react';
import { Modal } from '../components/Modal';
import { PaymentLink } from '../types';

export const PaymentLinks: React.FC = () => {
  const { courses, paymentLinks, countries, updateState } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  // Estado del Formulario
  const [newLink, setNewLink] = useState<Partial<PaymentLink>>({
    sku: courses[0]?.sku || '',
    country: countries.length > 0 ? countries[0].code : 'US',
    url: '',
    paymentMethods: [],
    isActive: true,
    instructions: ''
  });
  
  const [methodInput, setMethodInput] = useState('');

  // Helper para validar sintaxis URL
  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Link copiado al portapapeles');
  };

  const confirmDelete = () => {
    if (deleteId) {
        updateState('paymentLinks', paymentLinks.filter(l => l.id !== deleteId));
        setDeleteId(null);
    }
  };

  const handleToggleActive = (id: string) => {
    updateState('paymentLinks', paymentLinks.map(l => 
      l.id === id ? { ...l, isActive: !l.isActive } : l
    ));
  };

  const handleSave = () => {
    if (!newLink.url || !newLink.sku) return;

    const methods = methodInput 
      ? methodInput.split(',').map(m => m.trim()) 
      : (newLink.paymentMethods || []);

    const linkToAdd: PaymentLink = {
      id: `pl_${Date.now()}`,
      sku: newLink.sku!,
      country: newLink.country || 'US',
      url: newLink.url,
      paymentMethods: methods,
      instructions: newLink.instructions || '',
      isActive: newLink.isActive ?? true
    };

    updateState('paymentLinks', [...paymentLinks, linkToAdd]);
    setIsModalOpen(false);
    // Reiniciar formulario
    setNewLink({
      sku: courses[0]?.sku || '',
      country: countries.length > 0 ? countries[0].code : 'US',
      url: '',
      paymentMethods: [],
      isActive: true,
      instructions: ''
    });
    setMethodInput('');
  };

  return (
    <div className="p-8 h-full overflow-y-auto">
      <header className="mb-8 flex justify-between items-end">
        <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Gestor Links de Pago</h2>
            <p className="text-slate-500 dark:text-slate-400">Módulo 3: Repositorio Global de Checkout</p>
        </div>
        <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-brand-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-brand-700 transition-colors shadow-sm"
        >
            <Plus size={18} /> Agregar Link de Pago
        </button>
      </header>

      <div className="space-y-8">
        {courses.map(course => {
          const links = paymentLinks.filter(l => l.sku === course.sku);
          
          return (
            <div key={course.sku} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm transition-colors">
              {/* Cabecera Curso */}
              <div className="bg-slate-50 dark:bg-slate-800 px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-2 py-1 rounded text-slate-600 dark:text-slate-300">
                    {course.sku}
                  </span>
                  <h3 className="font-bold text-slate-800 dark:text-slate-200">{course.name}</h3>
                </div>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {links.length} links configurados
                </span>
              </div>

              {/* Lista Links */}
              {links.length > 0 ? (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {links.map(link => {
                    const isUrlValid = isValidUrl(link.url);
                    const countryInfo = countries.find(c => c.code === link.country);
                    
                    return (
                      <div key={link.id} className="p-6 flex items-start justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                        {/* Info Izquierda */}
                        <div className="flex gap-6 items-start flex-1">
                          <div className="flex flex-col items-center gap-1 w-12 pt-1">
                             <div className="text-2xl">
                                {countryInfo ? countryInfo.flag : '🌍'}
                             </div>
                             <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{link.country}</span>
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-slate-800 dark:text-slate-200">Link de Checkout</span>
                              {!link.isActive && (
                                <span className="text-xs bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-300 px-2 py-0.5 rounded-full">Inactivo</span>
                              )}
                              {!isUrlValid && (
                                <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                                  <AlertOctagon size={12} /> Link Roto
                                </span>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-2 mb-2">
                                <a 
                                  href={isUrlValid ? link.url : '#'} 
                                  target="_blank" 
                                  rel="noreferrer"
                                  className={`text-sm truncate max-w-md ${isUrlValid ? 'text-brand-600 dark:text-brand-400 hover:underline' : 'text-red-400 line-through'}`}
                                >
                                  {link.url}
                                </a>
                                <button onClick={() => handleCopy(link.url)} className="text-slate-400 hover:text-brand-600 dark:hover:text-brand-400">
                                  <Copy size={14} />
                                </button>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              {link.paymentMethods.map(method => (
                                <span key={method} className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded border border-slate-200 dark:border-slate-700">
                                  {method}
                                </span>
                              ))}
                            </div>
                            {link.instructions && (
                              <p className="text-xs text-slate-400 mt-2 italic">
                                Nota: {link.instructions}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Acciones */}
                        <div className="flex items-center gap-2">
                            <a 
                              href={isUrlValid ? link.url : '#'} 
                              target="_blank"
                              rel="noreferrer"
                              className="p-2 text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-lg transition-colors"
                              title="Probar Link"
                            >
                              <ExternalLink size={18} />
                            </a>
                            <button 
                              onClick={() => handleToggleActive(link.id)}
                              className={`p-2 rounded-lg transition-colors ${link.isActive ? 'text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20' : 'text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                              title={link.isActive ? "Desactivar" : "Activar"}
                            >
                              <CheckCircle size={18} />
                            </button>
                            <button 
                              onClick={() => setDeleteId(link.id)}
                              className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              title="Eliminar"
                            >
                              <Trash2 size={18} />
                            </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/50 text-slate-400 text-sm">
                  No hay links de pago configurados para este curso aún.
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Configurar Link de Pago">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Curso</label>
            <select 
              className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              value={newLink.sku}
              onChange={(e) => setNewLink({...newLink, sku: e.target.value})}
            >
              {courses.map(c => <option key={c.sku} value={c.sku}>{c.name} ({c.sku})</option>)}
            </select>
          </div>

          <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Mercado Objetivo</label>
              <select 
                className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                value={newLink.country}
                onChange={(e) => setNewLink({...newLink, country: e.target.value})}
              >
                {countries.map(c => (
                    <option key={c.code} value={c.code}>
                        {c.flag} {c.name}
                    </option>
                ))}
              </select>
          </div>

          <div>
             <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">URL de Checkout</label>
             <div className="relative">
                <input 
                  type="url"
                  className={`w-full p-2 pl-3 border rounded-lg focus:ring-2 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white ${isValidUrl(newLink.url || '') ? 'border-slate-300 dark:border-slate-700 focus:ring-brand-500' : 'border-red-300 focus:ring-red-200'}`}
                  placeholder="https://checkout.proveedor.com/..."
                  value={newLink.url}
                  onChange={(e) => setNewLink({...newLink, url: e.target.value})}
                />
                {!isValidUrl(newLink.url || '') && newLink.url && (
                   <AlertTriangle className="absolute right-3 top-2.5 text-red-400" size={16} />
                )}
             </div>
             <p className="text-xs text-slate-400 mt-1">Debe ser una URL https válida.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Métodos de Pago (Separados por coma)</label>
            <input 
              type="text"
              className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              placeholder="Tarjeta Crédito, Efectivo, PSE..."
              value={methodInput}
              onChange={(e) => setMethodInput(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Instrucciones Internas</label>
            <textarea 
              className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              rows={2}
              placeholder="ej. Solo usar para ofertas de Black Friday"
              value={newLink.instructions}
              onChange={(e) => setNewLink({...newLink, instructions: e.target.value})}
            />
          </div>

          <div className="flex items-center gap-2 py-2">
            <input 
              type="checkbox" 
              id="isActive"
              checked={newLink.isActive}
              onChange={(e) => setNewLink({...newLink, isActive: e.target.checked})}
              className="w-4 h-4 text-brand-600 rounded focus:ring-brand-500"
            />
            <label htmlFor="isActive" className="text-sm text-slate-700 dark:text-slate-300">Link Activo</label>
          </div>

          <div className="pt-4 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
             <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">Cancelar</button>
             <button onClick={handleSave} className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700">Guardar Link</button>
          </div>
        </div>
      </Modal>

      {/* Modal Borrar */}
      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Eliminar Link de Pago">
          <div className="space-y-4">
               <p className="text-slate-600 dark:text-slate-300">¿Estás seguro de que deseas eliminar este link? Esta acción no se puede deshacer.</p>
               <div className="flex justify-end gap-2 pt-4">
                   <button onClick={() => setDeleteId(null)} className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">Cancelar</button>
                   <button onClick={confirmDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Eliminar Link</button>
               </div>
          </div>
      </Modal>
    </div>
  );
};