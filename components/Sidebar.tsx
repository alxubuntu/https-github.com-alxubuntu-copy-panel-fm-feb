import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  DollarSign, 
  GitMerge, 
  MessageSquare, 
  Settings,
  Book,
  CreditCard,
  Globe,
  Sun,
  Moon,
  ShieldCheck,
  Database,
  MessageSquareText,
  CreditCard as IdCard,
  KanbanSquare,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { useStore } from '../store';

interface SidebarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView }) => {
  const { theme, updateState } = useStore();
  
  // Estado para controlar qué grupos están expandidos (por defecto todos)
  const [openGroups, setOpenGroups] = useState<string[]>(['VENTAS', 'CATÁLOGO', 'AGENTE', 'SISTEMA']);

  const toggleGroup = (groupTitle: string) => {
    setOpenGroups(prev => 
      prev.includes(groupTitle) 
        ? prev.filter(t => t !== groupTitle) 
        : [...prev, groupTitle]
    );
  };

  const menuGroups = [
    {
      title: 'VENTAS',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'kanban', label: 'Negocios (M12)', icon: KanbanSquare },
        { id: 'leads', label: 'Chats (M10)', icon: MessageSquareText },
        { id: 'datacards', label: 'Leads (M11)', icon: IdCard },
      ]
    },
    {
      title: 'CATÁLOGO',
      items: [
        { id: 'courses', label: 'Cursos (M1)', icon: Package },
        { id: 'pricing', label: 'Precios (M2)', icon: DollarSign },
        { id: 'payment-links', label: 'Links (M3)', icon: CreditCard },
      ]
    },
    {
      title: 'AGENTE',
      items: [
        { id: 'settings', label: 'Config (M7)', icon: Settings },
        { id: 'pipeline', label: 'Flujo (M5)', icon: GitMerge },
        { id: 'faqs', label: 'FAQs (M6)', icon: Book },
        { id: 'sandbox', label: 'Simulador', icon: MessageSquare },
      ]
    },
    {
      title: 'SISTEMA',
      items: [
        { id: 'countries', label: 'Países (M8)', icon: Globe },
        { id: 'professions', label: 'Req_Profesiones (M4)', icon: ShieldCheck },
        { id: 'properties', label: 'Campos_Usr (M9)', icon: Database },
      ]
    }
  ];

  const toggleTheme = () => {
    updateState('theme', theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="w-64 bg-slate-900 text-slate-300 flex flex-col h-full border-r border-slate-800 shrink-0">
      <div className="p-6 border-b border-slate-800">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <span className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center text-white text-lg">IA</span>
          SalesFlow
        </h1>
        <p className="text-xs text-slate-500 mt-1">Panel Administrativo</p>
      </div>
      
      <nav className="flex-1 p-2 space-y-2 overflow-y-auto">
        {menuGroups.map((group) => {
          const isOpen = openGroups.includes(group.title);
          return (
            <div key={group.title} className="mb-2">
              <button 
                onClick={() => toggleGroup(group.title)}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold text-slate-500 hover:text-slate-300 uppercase tracking-wider transition-colors mb-1"
              >
                {group.title}
                {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
              
              {isOpen && (
                <div className="space-y-1">
                  {group.items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setCurrentView(item.id)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-sm ${
                        currentView === item.id 
                          ? 'bg-brand-600/10 text-brand-400 border border-brand-500/20' 
                          : 'hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <item.icon size={18} className={currentView === item.id ? 'text-brand-500' : 'text-slate-400'} />
                      <span className="font-medium">{item.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800 bg-slate-900">
        <div className="flex items-center justify-between mb-4">
           <span className="text-xs font-semibold text-slate-500 uppercase">Tema</span>
           <button 
              onClick={toggleTheme}
              className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 text-slate-200 transition-colors"
              title={`Cambiar a modo ${theme === 'dark' ? 'claro' : 'oscuro'}`}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
           </button>
        </div>
        
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
            <span className="text-xs font-bold text-white">AD</span>
          </div>
          <div>
            <p className="text-sm font-medium text-white">Usuario Admin</p>
            <p className="text-xs text-slate-500">Super Admin</p>
          </div>
        </div>
      </div>
    </div>
  );
};