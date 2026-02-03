import React, { useState } from 'react';
import { useStore } from '../store';
import { Plus, Trash2, Search, MessageCircleQuestion, Edit2 } from 'lucide-react';
import { Modal } from '../components/Modal';
import { FAQ } from '../types';

export const FAQs: React.FC = () => {
  const { faqs, updateState } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Estado del formulario (sirve tanto para crear como para editar)
  const [formData, setFormData] = useState({ question: '', answer: '' });

  const filteredFAQs = faqs.filter(f => 
    f.question.toLowerCase().includes(searchTerm.toLowerCase()) || 
    f.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openAddModal = () => {
      setEditingId(null);
      setFormData({ question: '', answer: '' });
      setIsModalOpen(true);
  };

  const openEditModal = (faq: FAQ) => {
      setEditingId(faq.id);
      setFormData({ question: faq.question, answer: faq.answer });
      setIsModalOpen(true);
  };

  const handleSaveFAQ = () => {
      if (!formData.question || !formData.answer) return;

      if (editingId) {
          // Lógica de Actualización
          const updatedFaqs = faqs.map(f => 
              f.id === editingId 
              ? { ...f, question: formData.question, answer: formData.answer }
              : f
          );
          updateState('faqs', updatedFaqs);
      } else {
          // Lógica de Creación
          const faqToAdd = {
              id: `f${Date.now()}`,
              question: formData.question,
              answer: formData.answer
          };
          updateState('faqs', [...faqs, faqToAdd]);
      }

      setIsModalOpen(false);
      setFormData({ question: '', answer: '' });
      setEditingId(null);
  };

  const confirmDelete = () => {
    if (deleteId) {
        updateState('faqs', faqs.filter(f => f.id !== deleteId));
        setDeleteId(null);
    }
  };

  return (
    <div className="p-8 h-full overflow-y-auto">
      <header className="mb-8 flex justify-between items-end">
        <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Base de Conocimiento (FAQs)</h2>
            <p className="text-slate-500 dark:text-slate-400">Módulo 6: Respuestas para preguntas fuera del flujo.</p>
        </div>
        <button 
            onClick={openAddModal}
            className="bg-brand-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-brand-700 transition-colors shadow-sm"
        >
            <Plus size={18} /> Agregar FAQ
        </button>
      </header>

      <div className="mb-6 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Buscar preguntas o respuestas..." 
            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none shadow-sm text-slate-900 dark:text-white placeholder-slate-400 transition-colors"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
      </div>

      <div className="grid gap-4">
          {filteredFAQs.map(faq => (
              <div key={faq.id} className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-brand-300 dark:hover:border-brand-700 transition-all group">
                  <div className="flex justify-between items-start">
                      <div className="flex items-start gap-3 flex-1 pr-4">
                          <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-brand-600 dark:text-brand-400 rounded-lg mt-1 shrink-0">
                              <MessageCircleQuestion size={20} />
                          </div>
                          <div>
                              <h3 className="font-bold text-slate-800 dark:text-slate-200 text-lg mb-2">{faq.question}</h3>
                              <p className="text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">{faq.answer}</p>
                          </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                          <button 
                            onClick={() => openEditModal(faq)}
                            className="text-slate-300 hover:text-brand-500 dark:hover:text-brand-400 p-2 transition-colors rounded hover:bg-slate-50 dark:hover:bg-slate-800"
                            title="Editar FAQ"
                          >
                              <Edit2 size={18} />
                          </button>
                          <button 
                            onClick={() => setDeleteId(faq.id)}
                            className="text-slate-300 hover:text-red-500 dark:hover:text-red-400 p-2 transition-colors rounded hover:bg-slate-50 dark:hover:bg-slate-800"
                            title="Eliminar FAQ"
                          >
                              <Trash2 size={18} />
                          </button>
                      </div>
                  </div>
              </div>
          ))}
          {filteredFAQs.length === 0 && (
              <div className="text-center py-12 text-slate-400">
                  No se encontraron FAQs. Agrega una para enseñar al bot.
              </div>
          )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "Editar FAQ" : "Agregar Nueva FAQ"}>
          <div className="space-y-4">
              <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Pregunta / Intención Usuario</label>
                  <input 
                    type="text" 
                    className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white" 
                    placeholder="ej., ¿Ofrecen reembolsos?"
                    value={formData.question}
                    onChange={(e) => setFormData({...formData, question: e.target.value})}
                  />
              </div>
              <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Respuesta</label>
                  <textarea 
                    className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white" 
                    rows={4}
                    placeholder="ej., Sí, ofrecemos garantía de 30 días..."
                    value={formData.answer}
                    onChange={(e) => setFormData({...formData, answer: e.target.value})}
                  />
              </div>
              <div className="pt-4 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                  <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">Cancelar</button>
                  <button onClick={handleSaveFAQ} className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700">
                      {editingId ? "Guardar Cambios" : "Guardar FAQ"}
                  </button>
              </div>
          </div>
      </Modal>

      {/* Modal Borrar */}
      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Eliminar FAQ">
          <div className="space-y-4">
               <p className="text-slate-600 dark:text-slate-300">¿Seguro que deseas eliminar esta entrada de FAQ?</p>
               <div className="flex justify-end gap-2 pt-4">
                   <button onClick={() => setDeleteId(null)} className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">Cancelar</button>
                   <button onClick={confirmDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Eliminar FAQ</button>
               </div>
          </div>
      </Modal>
    </div>
  );
};