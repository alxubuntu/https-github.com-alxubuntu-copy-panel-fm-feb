import React, { useState } from 'react';
import { useStore } from '../store';
import { Edit2, Plus, Trash2, Search, Filter, Calendar, DollarSign, CheckCircle, Ban, AlertCircle } from 'lucide-react';
import { CourseStatus, Course, Pricing, CourseModality } from '../types';
import { Modal } from '../components/Modal';

export const Inventory: React.FC = () => {
  const { courses, prices, countries, updateState } = useStore();
  const [activeTab, setActiveTab] = useState<'courses' | 'pricing'>('courses');
  
  // --- COURSE STATE ---
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [modalityFilter, setModalityFilter] = useState<string>('all');
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Partial<Course> | null>(null);
  const [benefitsInput, setBenefitsInput] = useState('');

  // --- PRICING STATE ---
  const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);
  const [editingPrice, setEditingPrice] = useState<Partial<Pricing>>({});

  // Filter Active Countries for the Matrix
  const activeCountries = countries.filter(c => c.isActive);

  // --- COURSE LOGIC ---
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

    // Validation
    const benefitsList = benefitsInput.split(',').map(b => b.trim()).filter(b => b);
    if (benefitsList.length < 3) {
      alert("Validation Error: Please add at least 3 benefits.");
      return;
    }
    if ((editingCourse.description?.length || 0) < 50) {
      alert("Validation Error: Description must be at least 50 characters.");
      return;
    }

    const courseToSave: Course = {
        ...editingCourse as Course,
        benefits: benefitsList
    };

    // Update or Create
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

  const handleDeleteCourse = (sku: string) => {
    if(window.confirm(`Delete course ${sku}? This will also delete related prices.`)) {
      updateState('courses', courses.filter(c => c.sku !== sku));
      updateState('prices', prices.filter(p => p.sku !== sku));
    }
  };

  const handleToggleStatus = (sku: string) => {
    const updated = courses.map(c => c.sku === sku ? {...c, status: c.status === CourseStatus.Active ? CourseStatus.Inactive : CourseStatus.Active} : c);
    updateState('courses', updated);
  };

  // --- PRICING LOGIC ---
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
    // Remove old entry if exists and add new one
    const filtered = prices.filter(p => !(p.sku === newPriceObj.sku && p.country === newPriceObj.country));
    updateState('prices', [...filtered, newPriceObj]);
    setIsPriceModalOpen(false);
  };

  // Render Helper for Matrix Cell
  const renderPriceCell = (sku: string, country: string) => {
    const price = prices.find(p => p.sku === sku && p.country === country);
    const countryConfig = countries.find(c => c.code === country);
    
    if (!price) {
      return (
        <div 
          onClick={() => handleEditPrice(sku, country)}
          className="h-full w-full min-h-[40px] flex items-center justify-center text-slate-300 hover:bg-slate-50 cursor-pointer text-xs italic"
        >
          + Add
        </div>
      );
    }

    const hasPromo = price.promoPrice && price.isActive;
    const isInactive = !price.isActive;

    return (
      <div 
        onClick={() => handleEditPrice(sku, country)}
        className={`h-full w-full min-h-[50px] p-2 cursor-pointer hover:bg-slate-50 flex flex-col items-center justify-center border-2 border-transparent hover:border-brand-200 transition-all rounded ${isInactive ? 'opacity-50 bg-slate-50' : ''}`}
      >
        <div className="flex items-center gap-1 font-medium text-slate-700">
           <span className="text-[10px] text-slate-400">{price.currency}</span>
           <span className={hasPromo ? 'line-through text-slate-400 text-xs' : ''}>{price.price}</span>
        </div>
        {hasPromo && (
           <span className="text-green-600 font-bold text-xs bg-green-50 px-1 rounded">
             {price.promoPrice}
           </span>
        )}
      </div>
    );
  };


  return (
    <div className="p-8 h-full overflow-y-auto">
      <header className="mb-6 flex justify-between items-center">
        <div>
            <h2 className="text-2xl font-bold text-slate-900">Inventory & Pricing</h2>
            <p className="text-slate-500">Modules 1 & 2</p>
        </div>
        <div className="flex bg-slate-200 rounded-lg p-1">
            <button 
                onClick={() => setActiveTab('courses')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'courses' ? 'bg-white text-slate-900 shadow' : 'text-slate-600 hover:text-slate-900'}`}
            >
                1. Course Manager
            </button>
            <button 
                onClick={() => setActiveTab('pricing')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'pricing' ? 'bg-white text-slate-900 shadow' : 'text-slate-600 hover:text-slate-900'}`}
            >
                2. Pricing Matrix
            </button>
        </div>
      </header>

      {activeTab === 'courses' ? (
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex gap-4 flex-1">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                            type="text"
                            placeholder="Search by SKU, Name or Instructor..."
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-brand-500"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
                        <Filter size={16} className="text-slate-400" />
                        <select 
                            className="bg-transparent text-sm font-medium text-slate-600 outline-none cursor-pointer"
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value)}
                        >
                            <option value="all">All Status</option>
                            <option value={CourseStatus.Active}>Active</option>
                            <option value={CourseStatus.Inactive}>Inactive</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
                        <select 
                            className="bg-transparent text-sm font-medium text-slate-600 outline-none cursor-pointer"
                            value={modalityFilter}
                            onChange={e => setModalityFilter(e.target.value)}
                        >
                            <option value="all">All Modalities</option>
                            <option value={CourseModality.Online}>Online</option>
                            <option value={CourseModality.Presencial}>Presencial</option>
                            <option value={CourseModality.Hybrid}>Hybrid</option>
                        </select>
                    </div>
                </div>
                <button 
                    onClick={() => handleEditCourse()}
                    className="bg-brand-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-brand-700 shadow-sm"
                >
                    <Plus size={18} /> New Course
                </button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4">SKU</th>
                            <th className="px-6 py-4">Name</th>
                            <th className="px-6 py-4">Instructor</th>
                            <th className="px-6 py-4">Modality</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredCourses.map(course => (
                            <tr key={course.sku} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 font-mono font-medium text-slate-700">{course.sku}</td>
                                <td className="px-6 py-4">
                                    <div className="font-semibold text-slate-900">{course.name}</div>
                                    <div className="text-xs text-slate-500 truncate max-w-[200px]">{course.description}</div>
                                </td>
                                <td className="px-6 py-4 text-slate-600">{course.instructor}</td>
                                <td className="px-6 py-4">
                                    <span className="inline-block px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs border border-blue-100">
                                        {course.modality}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <button onClick={() => handleToggleStatus(course.sku)}>
                                        {course.status === CourseStatus.Active ? (
                                            <span className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded-full text-xs font-medium border border-green-100">
                                                <CheckCircle size={12} /> Active
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1 text-slate-500 bg-slate-100 px-2 py-1 rounded-full text-xs font-medium border border-slate-200">
                                                <Ban size={12} /> Inactive
                                            </span>
                                        )}
                                    </button>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button onClick={() => handleEditCourse(course)} className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded transition-colors">
                                            <Edit2 size={16} />
                                        </button>
                                        <button onClick={() => handleDeleteCourse(course.sku)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredCourses.length === 0 && (
                    <div className="p-8 text-center text-slate-400">No courses match your filters.</div>
                )}
            </div>
          </div>
      ) : (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden overflow-x-auto">
              {/* Matrix Header */}
              <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center gap-2 text-sm text-slate-500">
                  <AlertCircle size={16} />
                  <span>Click on any cell to edit pricing. Only Active Markets (Module 8) are shown.</span>
              </div>
              
              <table className="w-full text-sm text-left border-collapse">
                  <thead>
                      <tr className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                          <th className="p-4 border-r border-slate-200 sticky left-0 bg-slate-50 z-10 w-[200px]">Course</th>
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
                  <tbody className="divide-y divide-slate-100">
                      {courses.map(course => (
                          <tr key={course.sku} className="hover:bg-slate-50">
                              <td className="p-4 border-r border-slate-200 font-medium text-slate-800 sticky left-0 bg-white z-10 group-hover:bg-slate-50">
                                  {course.name}
                                  <div className="text-xs text-slate-400 font-mono mt-0.5">{course.sku}</div>
                              </td>
                              {activeCountries.map(country => (
                                  <td key={country.code} className="border-r border-slate-100 last:border-r-0 p-0 text-center align-middle">
                                      {renderPriceCell(course.sku, country.code)}
                                  </td>
                              ))}
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      )}

      {/* --- MODALS --- */}

      {/* Course Modal */}
      <Modal isOpen={isCourseModalOpen} onClose={() => setIsCourseModalOpen(false)} title={editingCourse?.sku ? "Edit Course" : "New Course"}>
          <div className="space-y-4 max-h-[70vh] overflow-y-auto p-1">
              <div className="grid grid-cols-2 gap-4">
                  <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">SKU (Max 20)</label>
                      <input 
                        type="text" 
                        maxLength={20}
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-brand-500 outline-none uppercase"
                        value={editingCourse?.sku || ''}
                        onChange={(e) => setEditingCourse({...editingCourse, sku: e.target.value.toUpperCase()})}
                        disabled={!!(courses.find(c => c.sku === editingCourse?.sku) && editingCourse?.sku)}
                      />
                  </div>
                  <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Sort Order</label>
                      <input 
                        type="number" 
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-brand-500 outline-none"
                        value={editingCourse?.sortOrder || 0}
                        onChange={(e) => setEditingCourse({...editingCourse, sortOrder: parseInt(e.target.value)})}
                      />
                  </div>
              </div>
              
              <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Course Name (Max 200)</label>
                  <input 
                    type="text"
                    maxLength={200}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-brand-500 outline-none"
                    value={editingCourse?.name || ''}
                    onChange={(e) => setEditingCourse({...editingCourse, name: e.target.value})}
                  />
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Instructor</label>
                      <input 
                        type="text"
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-brand-500 outline-none"
                        value={editingCourse?.instructor || ''}
                        onChange={(e) => setEditingCourse({...editingCourse, instructor: e.target.value})}
                      />
                  </div>
                  <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Instructor Bio (Optional)</label>
                      <input 
                        type="text"
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-brand-500 outline-none"
                        value={editingCourse?.instructorBio || ''}
                        onChange={(e) => setEditingCourse({...editingCourse, instructorBio: e.target.value})}
                      />
                  </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Duration</label>
                      <input 
                        type="text"
                        placeholder="e.g. 40 Hours"
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-brand-500 outline-none"
                        value={editingCourse?.duration || ''}
                        onChange={(e) => setEditingCourse({...editingCourse, duration: e.target.value})}
                      />
                  </div>
                  <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Modality</label>
                      <select 
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-brand-500 outline-none bg-white"
                        value={editingCourse?.modality || CourseModality.Online}
                        onChange={(e) => setEditingCourse({...editingCourse, modality: e.target.value as CourseModality})}
                      >
                          <option value={CourseModality.Online}>Online</option>
                          <option value={CourseModality.Presencial}>Presencial</option>
                          <option value={CourseModality.Hybrid}>Hybrid</option>
                      </select>
                  </div>
              </div>

              <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Description (Min 50 chars)</label>
                  <textarea 
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-brand-500 outline-none"
                    rows={3}
                    value={editingCourse?.description || ''}
                    onChange={(e) => setEditingCourse({...editingCourse, description: e.target.value})}
                  />
                  <div className="text-right text-[10px] text-slate-400">
                      {(editingCourse?.description?.length || 0)} / 50 chars
                  </div>
              </div>

              <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Benefits (Comma separated, Min 3)</label>
                  <input 
                    type="text"
                    placeholder="Certificado, Mentoria, etc..."
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-brand-500 outline-none"
                    value={benefitsInput}
                    onChange={(e) => setBenefitsInput(e.target.value)}
                  />
              </div>

              <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Media URL (Image/Video)</label>
                  <input 
                    type="url"
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-brand-500 outline-none"
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
                 <label htmlFor="isActiveCourse" className="text-sm">Course Active for Sale</label>
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-slate-100 mt-4">
                  <button onClick={() => setIsCourseModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                  <button onClick={handleSaveCourse} className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700">Save Course</button>
              </div>
          </div>
      </Modal>

      {/* Pricing Modal */}
      <Modal isOpen={isPriceModalOpen} onClose={() => setIsPriceModalOpen(false)} title="Edit Price Rule">
          <div className="space-y-4">
               <div className="bg-slate-50 p-4 rounded-lg flex items-center justify-between">
                   <div>
                       <div className="font-bold text-slate-800">{editingPrice.sku}</div>
                       <div className="text-xs text-slate-500">Target Course</div>
                   </div>
                   <div className="text-right">
                       <div className="font-bold text-slate-800 flex items-center gap-1 justify-end">
                         {/* Dynamic Flag Display */}
                         {(() => {
                            const c = countries.find(x => x.code === editingPrice.country);
                            return c ? <span className="text-xl">{c.flag}</span> : null;
                         })()}
                          {editingPrice.country}
                       </div>
                       <div className="text-xs text-slate-500">Target Country</div>
                   </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                   <div>
                       <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Country</label>
                       <select 
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-brand-500 outline-none bg-white"
                        value={editingPrice.country}
                        onChange={(e) => handleCountryChangeInModal(e.target.value)}
                       >
                           {activeCountries.map(c => (
                               <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
                           ))}
                       </select>
                   </div>
                   <div>
                       <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Currency (Auto)</label>
                       <input 
                         type="text" 
                         className="w-full p-2 border rounded bg-slate-100 font-bold text-slate-600" 
                         value={editingPrice.currency || ''}
                         readOnly
                       />
                   </div>
               </div>

               <div>
                   <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Regular Price</label>
                   <input 
                     type="number" 
                     className="w-full p-2 border rounded focus:ring-2 focus:ring-brand-500 outline-none"
                     value={editingPrice.price || 0}
                     onChange={(e) => setEditingPrice({...editingPrice, price: parseFloat(e.target.value)})}
                   />
               </div>

               <div className="border-t border-slate-100 pt-4 mt-2">
                   <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                       <DollarSign size={16} className="text-green-600" /> Promotion (Optional)
                   </h4>
                   
                   <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                           <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Promo Price</label>
                           <input 
                             type="number" 
                             className="w-full p-2 border rounded focus:ring-2 focus:ring-brand-500 outline-none border-green-200 focus:border-green-500"
                             value={editingPrice.promoPrice || ''}
                             onChange={(e) => setEditingPrice({...editingPrice, promoPrice: parseFloat(e.target.value)})}
                           />
                        </div>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                       <div>
                           <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Start Date</label>
                           <input 
                             type="date" 
                             className="w-full p-2 border rounded focus:ring-2 focus:ring-brand-500 outline-none"
                             value={editingPrice.promoStartDate || ''}
                             onChange={(e) => setEditingPrice({...editingPrice, promoStartDate: e.target.value})}
                           />
                       </div>
                       <div>
                           <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">End Date</label>
                           <input 
                             type="date" 
                             className="w-full p-2 border rounded focus:ring-2 focus:ring-brand-500 outline-none"
                             value={editingPrice.promoEndDate || ''}
                             onChange={(e) => setEditingPrice({...editingPrice, promoEndDate: e.target.value})}
                           />
                       </div>
                   </div>
               </div>

               <div className="flex items-center gap-2 pt-4 border-t border-slate-100">
                   <input 
                      type="checkbox" 
                      id="isActivePrice"
                      checked={editingPrice.isActive}
                      onChange={(e) => setEditingPrice({...editingPrice, isActive: e.target.checked})}
                      className="w-4 h-4 text-brand-600"
                   />
                   <label htmlFor="isActivePrice" className="text-sm font-medium text-slate-700">Price Rule Active</label>
               </div>

               <div className="pt-4 flex justify-end gap-2">
                   <button onClick={() => setIsPriceModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                   <button onClick={handleSavePrice} className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700">Save Price</button>
               </div>
          </div>
      </Modal>
    </div>
  );
};