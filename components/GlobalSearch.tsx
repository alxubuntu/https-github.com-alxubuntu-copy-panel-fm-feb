import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store';
import { Search, User, Package, ArrowRight, X } from 'lucide-react';

interface GlobalSearchProps {
  onNavigate: (view: string, id?: string) => void;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({ onNavigate }) => {
  const { deals, courses, updateState } = useStore();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Cerrar al hacer click fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  // Atajo de teclado (CTRL+K / CMD+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
          setIsOpen(false);
          inputRef.current?.blur();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleFocus = () => setIsOpen(true);
  
  const handleSelectLead = (dealId: string) => {
      updateState('navigatedDealId', dealId); // Trigger para Leads.tsx
      onNavigate('leads');
      setIsOpen(false);
      setQuery('');
  };

  const handleSelectCourse = (sku: string) => {
      // Futuro: Podríamos añadir un filtro global para cursos, por ahora vamos al inventario
      onNavigate('courses');
      setIsOpen(false);
      setQuery('');
  };

  // Lógica de Filtrado
  const filteredDeals = query.trim() === '' ? [] : deals.filter(d => 
    d.customerName.toLowerCase().includes(query.toLowerCase()) || 
    d.id.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 5); // Top 5

  const filteredCourses = query.trim() === '' ? [] : courses.filter(c => 
    c.name.toLowerCase().includes(query.toLowerCase()) || 
    c.sku.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 5); // Top 5

  const hasResults = filteredDeals.length > 0 || filteredCourses.length > 0;

  return (
    <div className="relative w-full max-w-2xl z-50" ref={wrapperRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          ref={inputRef}
          type="text"
          placeholder="Buscar Leads (Nombre/ID) o Cursos (SKU)... (Ctrl+K)"
          className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-slate-800 border-none rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500 outline-none transition-all placeholder-slate-400 dark:placeholder-slate-500"
          value={query}
          onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
          }}
          onFocus={handleFocus}
        />
        {query && (
            <button 
                onClick={() => { setQuery(''); setIsOpen(false); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
                <X size={14} />
            </button>
        )}
      </div>

      {/* RESULTADOS MODAL / DROPDOWN */}
      {isOpen && query.trim() !== '' && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            
            {!hasResults && (
                <div className="p-8 text-center text-slate-400 dark:text-slate-500">
                    <Search size={32} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No se encontraron resultados para "{query}"</p>
                </div>
            )}

            {/* Sección LEADS */}
            {filteredDeals.length > 0 && (
                <div className="py-2">
                    <div className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                        <User size={12} /> Leads / Oportunidades
                    </div>
                    {filteredDeals.map(deal => (
                        <button
                            key={deal.id}
                            onClick={() => handleSelectLead(deal.id)}
                            className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between group transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-bold">
                                    {deal.customerName.charAt(0)}
                                </div>
                                <div>
                                    <div className="font-semibold text-slate-800 dark:text-slate-200 text-sm group-hover:text-brand-600 dark:group-hover:text-brand-400">
                                        {deal.customerName}
                                    </div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                        <span>ID: {deal.id}</span>
                                        {deal.value > 0 && <span className="text-green-600 dark:text-green-500 font-mono">${deal.value.toLocaleString()}</span>}
                                    </div>
                                </div>
                            </div>
                            <ArrowRight size={16} className="text-slate-300 group-hover:text-brand-500 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                        </button>
                    ))}
                </div>
            )}

            {filteredDeals.length > 0 && filteredCourses.length > 0 && (
                <div className="h-px bg-slate-100 dark:bg-slate-800 mx-4"></div>
            )}

            {/* Sección CURSOS */}
            {filteredCourses.length > 0 && (
                <div className="py-2">
                    <div className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                        <Package size={12} /> Cursos / Inventario
                    </div>
                    {filteredCourses.map(course => (
                        <button
                            key={course.sku}
                            onClick={() => handleSelectCourse(course.sku)}
                            className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between group transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                                    <Package size={16} />
                                </div>
                                <div>
                                    <div className="font-semibold text-slate-800 dark:text-slate-200 text-sm group-hover:text-brand-600 dark:group-hover:text-brand-400">
                                        {course.name}
                                    </div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400">
                                        SKU: <span className="font-mono">{course.sku}</span>
                                    </div>
                                </div>
                            </div>
                            <ArrowRight size={16} className="text-slate-300 group-hover:text-brand-500 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                        </button>
                    ))}
                </div>
            )}
        </div>
      )}
    </div>
  );
};