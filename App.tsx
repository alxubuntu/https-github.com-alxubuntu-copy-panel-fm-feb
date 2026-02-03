import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { GlobalSearch } from './components/GlobalSearch';
import { Dashboard } from './views/Dashboard';
import { Courses } from './views/Courses';
import { PricingView } from './views/Pricing';
import { Pipeline } from './views/Pipeline';
import { Sandbox } from './views/Sandbox';
import { FAQs } from './views/FAQs';
import { Settings } from './views/Settings';
import { PaymentLinks } from './views/PaymentLinks';
import { Countries } from './views/Countries';
import { Professions } from './views/Professions';
import { ContactProperties } from './views/ContactProperties';
import { Leads } from './views/Leads';
import { DataCards } from './views/DataCards';
import { DealsKanban } from './views/DealsKanban';
import { StoreProvider, useStore } from './store';
import { Settings as SettingsIcon, Bell } from 'lucide-react';

const PlaceholderView: React.FC<{ title: string }> = ({ title }) => (
  <div className="p-8 flex flex-col items-center justify-center h-full text-slate-400">
    <div className="bg-slate-100 dark:bg-slate-800 p-6 rounded-full mb-4">
        <SettingsIcon size={48} />
    </div>
    <h2 className="text-2xl font-bold text-slate-600 dark:text-slate-300">{title}</h2>
    <p>Este módulo está actualmente en construcción.</p>
  </div>
);

const AppContent: React.FC = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const { theme } = useStore();

  const handleGlobalNavigate = (view: string, id?: string) => {
      setCurrentView(view);
      // El ID específico se maneja a través del store global (e.g. navigatedDealId)
      // que actualiza el componente GlobalSearch antes de llamar a esta función
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard': return <Dashboard />;
      case 'countries': return <Countries />;
      case 'courses': return <Courses />;
      case 'pricing': return <PricingView />; 
      case 'payment-links': return <PaymentLinks />;
      case 'professions': return <Professions />;
      case 'pipeline': return <Pipeline />;
      case 'properties': return <ContactProperties />;
      case 'leads': return <Leads />;
      case 'datacards': return <DataCards onNavigateToChat={() => setCurrentView('leads')} />;
      case 'kanban': return <DealsKanban />;
      case 'sandbox': return <Sandbox />;
      case 'faqs': return <FAQs />;
      case 'settings': return <Settings />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className={`${theme} flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200`}>
      <Sidebar currentView={currentView} setCurrentView={setCurrentView} />
      
      {/* Contenedor Principal (Flex Col para Header + Content) */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        {/* Header Global */}
        <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between px-6 shrink-0 z-20 shadow-sm">
             <div className="flex-1 max-w-2xl">
                 <GlobalSearch onNavigate={handleGlobalNavigate} />
             </div>
             
             <div className="flex items-center gap-4 ml-4">
                 <button className="relative p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                     <Bell size={20} />
                     <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
                 </button>
             </div>
        </header>

        {/* Vista del Módulo */}
        <div className="flex-1 overflow-hidden relative">
          {renderView()}
        </div>

      </main>
    </div>
  );
};

function App() {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
}

export default App;