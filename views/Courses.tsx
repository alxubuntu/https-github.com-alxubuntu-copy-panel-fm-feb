import React, { useState } from 'react';
import { useStore } from '../store';
import { Edit2, Plus, Trash2, Search, Filter, CheckCircle, Ban, AlertTriangle } from 'lucide-react';
import { CourseStatus, Course, CourseModality } from '../types';
import { Modal } from '../components/Modal';

export const Courses: React.FC = () => {
  const { courses, prices, updateState } = useStore();
  
  // --- ESTADO DEL CURSO ---
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [modalityFilter, setModalityFilter] = useState<string>('all');
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [deleteSku, setDeleteSku] = useState<string | null>(null);
  const [editingCourse, setEditingCourse] = useState<Partial<Course> | null>(null);
  const [benefitsInput, setBenefitsInput] = useState('');

  // --- LÓGICA DEL CURSO ---
  const filteredCourses = courses.filter(c => {
    const matchesSearch = 
      c.sku.toLowerCase().includes(searchTerm.toLowerCase()) || 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.instructor.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    const matchesModality = modalityFilter === 'all' || c.modality === modalityFilter;

    return matchesSearch && matchesStatus && matchesModality;
  });

  const handleEditCourse = (course?: Course) => {
    if (course) {
      setEditingCourse({ ...course });
      setBenefitsInput(course.benefits.join(', '));
    } else {
      setEditingCourse({
        sku: '', name: '', description: '', benefits: [], 
        instructor: '', duration: '', modality: CourseModality.Online, 
        status: CourseStatus.Active, sortOrder: courses.length + 1
      });
      setBenefitsInput('');
    }
    setIsCourseModalOpen(true);
  };

  const handleSaveCourse = () => {
    if (!editingCourse?.sku || !editingCourse?.name) return;

    // Validación
    const benefitsList = benefitsInput.split(',').map(b => b.trim()).filter(b => b);
    if (benefitsList.length < 3) {
      alert("Error de Validación: Por favor agrega al menos 3 beneficios.");
      return;
    }
    if ((editingCourse.description?.length || 0) < 50) {
      alert("Error de Validación: La descripción debe tener al menos 50 caracteres.");
      return;
    }

    const courseToSave: Course = {
        ...editingCourse as Course,
        benefits: benefitsList
    };

    // Actualizar o Crear
    const exists = courses.find(c => c.sku === courseToSave.sku);
    let newCourses;
    if (exists) {
       newCourses = courses.map(c => c.sku === courseToSave.sku ? courseToSave : c);
    } else {
       newCourses = [...courses, courseToSave];
    }
    
    updateState('courses', newCourses);
    setIsCourseModalOpen(false);
  };

  const confirmDelete = () => {
    if (deleteSku) {
        updateState('courses', courses.filter(c => c.sku !== deleteSku));
        updateState('prices', prices.filter(p => p.sku !== deleteSku));
        setDeleteSku(null);
    }
  };

  const handleToggleStatus = (sku: string) => {
    const updated = courses.map(c => c.sku === sku ? {...c, status: c.status === CourseStatus.Active ? CourseStatus.Inactive : CourseStatus.Active} : c);
    updateState('courses', updated);
  };

  return (
    <div className="p-8 h-full overflow-y-auto">
      <header className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Gestor de Cursos</h2>
        <p className="text-slate-500 dark:text-slate-400">Módulo 1: Inventario y Detalles del Producto</p>
      </header>

      <div className="space-y-4">
        {/* Filtros */}
        <div className="flex flex-col md:flex-row gap-4 justify-between bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
            <div className="flex gap-4 flex-1">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                        type="text"
                        placeholder="Buscar por SKU, Nombre o Instructor..."
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-white placeholder-slate-400"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 border-l border-slate-200 dark:border-slate-700 pl-4">
                    <Filter size={16} className="text-slate-400" />
                    <select 
                        className="bg-transparent text-sm font-medium text-slate-600 dark:text-slate-300 outline-none cursor-pointer"
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                    >
                        <option value="all">Todo Estado</option>
                        <option value={CourseStatus.Active}>Activo</option>
                        <option value={CourseStatus.Inactive}>Inactivo</option>
                    </select>
                </div>
                <div className="flex items-center gap-2 border-l border-slate-200 dark:border-slate-700 pl-4">
                    <select 
                        className="bg-transparent text-sm font-medium text-slate-600 dark:text-slate-300 outline-none cursor-pointer"
                        value={modalityFilter}
                        onChange={e => setModalityFilter(e.target.value)}
                    >
                        <option value="all">Toda Modalidad</option>
                        <option value={CourseModality.Online}>Online</option>
                        <option value={CourseModality.Presencial}>Presencial</option>
                        <option value={CourseModality.Hybrid}>Híbrido</option>
                    </select>
                </div>
            </div>
            <button 
                onClick={() => handleEditCourse()}
                className="bg-brand-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-brand-700 shadow-sm"
            >
                <Plus size={18} /> Nuevo Curso
            </button>
        </div>

        {/* Tabla */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm transition-colors">
            <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-200 dark:border-slate-800">
                    <tr>
                        <th className="px-6 py-4">SKU</th>
                        <th className="px-6 py-4">Nombre</th>
                        <th className="px-6 py-4">Instructor</th>
                        <th className="px-6 py-4">Modalidad</th>
                        <th className="px-6 py-4">Estado</th>
                        <th className="px-6 py-4 text-right">Acciones</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredCourses.map(course => (
                        <tr key={course.sku} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                            <td className="px-6 py-4 font-mono font-medium text-slate-700 dark:text-slate-300">{course.sku}</td>
                            <td className="px-6 py-4">
                                <div className="font-semibold text-slate-900 dark:text-white">{course.name}</div>
                                <div className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[200px]">{course.description}</div>
                            </td>
                            <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{course.instructor}</td>
                            <td className="px-6 py-4">
                                <span className="inline-block px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded text-xs border border-blue-100 dark:border-blue-800/30">
                                    {course.modality}
                                </span>
                            </td>
                            <td className="px-6 py-4">
                                <button onClick={() => handleToggleStatus(course.sku)}>
                                    {course.status === CourseStatus.Active ? (
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
                                    <button onClick={() => handleEditCourse(course)} className="p-2 text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded transition-colors">
                                        <Edit2 size={16} />
                                    </button>
                                    <button onClick={() => setDeleteSku(course.sku)} className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {filteredCourses.length === 0 && (
                <div className="p-8 text-center text-slate-400">No se encontraron cursos con tus filtros.</div>
            )}
        </div>
      </div>

      {/* --- MODALES --- */}

      {/* Modal Curso */}
      <Modal isOpen={isCourseModalOpen} onClose={() => setIsCourseModalOpen(false)} title={editingCourse?.sku ? "Editar Curso" : "Nuevo Curso"}>
          <div className="space-y-4 max-h-[70vh] overflow-y-auto p-1">
              <div className="grid grid-cols-2 gap-4">
                  <div>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">SKU (Máx 20)</label>
                      <input 
                        type="text" 
                        maxLength={20}
                        className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded focus:ring-2 focus:ring-brand-500 outline-none uppercase bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        value={editingCourse?.sku || ''}
                        onChange={(e) => setEditingCourse({...editingCourse, sku: e.target.value.toUpperCase()})}
                        disabled={!!(courses.find(c => c.sku === editingCourse?.sku) && editingCourse?.sku)}
                      />
                  </div>
                  <div>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Orden de Clasificación</label>
                      <input 
                        type="number" 
                        className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded focus:ring-2 focus:ring-brand-500 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        value={editingCourse?.sortOrder || 0}
                        onChange={(e) => setEditingCourse({...editingCourse, sortOrder: parseInt(e.target.value)})}
                      />
                  </div>
              </div>
              
              <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Nombre del Curso (Máx 200)</label>
                  <input 
                    type="text"
                    maxLength={200}
                    className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded focus:ring-2 focus:ring-brand-500 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    value={editingCourse?.name || ''}
                    onChange={(e) => setEditingCourse({...editingCourse, name: e.target.value})}
                  />
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <div>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Instructor</label>
                      <input 
                        type="text"
                        className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded focus:ring-2 focus:ring-brand-500 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        value={editingCourse?.instructor || ''}
                        onChange={(e) => setEditingCourse({...editingCourse, instructor: e.target.value})}
                      />
                  </div>
                  <div>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Bio Instructor (Opcional)</label>
                      <input 
                        type="text"
                        className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded focus:ring-2 focus:ring-brand-500 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        value={editingCourse?.instructorBio || ''}
                        onChange={(e) => setEditingCourse({...editingCourse, instructorBio: e.target.value})}
                      />
                  </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <div>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Duración</label>
                      <input 
                        type="text"
                        placeholder="ej. 40 Horas"
                        className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded focus:ring-2 focus:ring-brand-500 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        value={editingCourse?.duration || ''}
                        onChange={(e) => setEditingCourse({...editingCourse, duration: e.target.value})}
                      />
                  </div>
                  <div>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Modalidad</label>
                      <select 
                        className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded focus:ring-2 focus:ring-brand-500 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        value={editingCourse?.modality || CourseModality.Online}
                        onChange={(e) => setEditingCourse({...editingCourse, modality: e.target.value as CourseModality})}
                      >
                          <option value={CourseModality.Online}>Online</option>
                          <option value={CourseModality.Presencial}>Presencial</option>
                          <option value={CourseModality.Hybrid}>Híbrido</option>
                      </select>
                  </div>
              </div>

              <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Descripción (Mín 50 caracteres)</label>
                  <textarea 
                    className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded focus:ring-2 focus:ring-brand-500 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    rows={3}
                    value={editingCourse?.description || ''}
                    onChange={(e) => setEditingCourse({...editingCourse, description: e.target.value})}
                  />
                  <div className="text-right text-[10px] text-slate-400">
                      {(editingCourse?.description?.length || 0)} / 50 caracteres
                  </div>
              </div>

              <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Beneficios (Separados por coma, Mín 3)</label>
                  <input 
                    type="text"
                    placeholder="Certificado, Mentoria, etc..."
                    className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded focus:ring-2 focus:ring-brand-500 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    value={benefitsInput}
                    onChange={(e) => setBenefitsInput(e.target.value)}
                  />
              </div>

              <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">URL Multimedia (Imagen/Video)</label>
                  <input 
                    type="url"
                    className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded focus:ring-2 focus:ring-brand-500 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    value={editingCourse?.mediaUrl || ''}
                    onChange={(e) => setEditingCourse({...editingCourse, mediaUrl: e.target.value})}
                  />
              </div>

              <div className="flex items-center gap-2 pt-2">
                 <input 
                    type="checkbox" 
                    id="isActiveCourse"
                    checked={editingCourse?.status === CourseStatus.Active}
                    onChange={(e) => setEditingCourse({...editingCourse, status: e.target.checked ? CourseStatus.Active : CourseStatus.Inactive})}
                 />
                 <label htmlFor="isActiveCourse" className="text-sm text-slate-900 dark:text-slate-200">Curso Activo para la Venta</label>
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800 mt-4">
                  <button onClick={() => setIsCourseModalOpen(false)} className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">Cancelar</button>
                  <button onClick={handleSaveCourse} className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700">Guardar Curso</button>
              </div>
          </div>
      </Modal>

      {/* Modal Confirmación Borrar */}
      <Modal isOpen={!!deleteSku} onClose={() => setDeleteSku(null)} title="Eliminar Curso">
          <div className="space-y-4">
               <div className="flex items-center gap-3 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                   <AlertTriangle size={24} />
                   <p className="text-sm font-medium">Acción Crítica: Eliminar este curso también eliminará todas las Reglas de Precios asociadas.</p>
               </div>
               <p className="text-slate-600 dark:text-slate-300">
                   ¿Confirmar eliminación de <span className="font-bold">{deleteSku}</span>?
               </p>
               <div className="flex justify-end gap-2 pt-4">
                   <button onClick={() => setDeleteSku(null)} className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">Cancelar</button>
                   <button onClick={confirmDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Confirmar</button>
               </div>
          </div>
      </Modal>
    </div>
  );
};