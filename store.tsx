import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { AppState, Course, Pricing, PipelineStage, Deal, FAQ, AgentConfig, PaymentLink, CountryConfig, Profession, CourseProfessionRule, ContactProperty } from './types';
import { supabase, TABLE_MAPPING } from './services/supabaseClient';

const defaultConfig: AgentConfig = {
  name: 'VentasBot 3000',
  tone: 'Friendly',
  model: 'gemini-3-flash-preview',
};

// --- DATA MAPPERS ---
// Helper to ensure compatibility between App (CamelCase) and DB (SnakeCase)
const mapDealFromDB = (d: any): Deal => ({
  id: d.id,
  customerName: d.customer_name ?? d.customerName,
  stageId: d.stage_id ?? d.stageId,
  value: d.value,
  currency: d.currency,
  lastInteraction: d.last_interaction ?? d.lastInteraction,
  chatHistory: d.chat_history ?? d.chatHistory ?? [],
  capturedData: d.captured_data ?? d.capturedData ?? {}
});

const mapDealToDB = (d: Deal) => ({
  id: d.id,
  customer_name: d.customerName,
  stage_id: d.stageId,
  value: d.value,
  currency: d.currency,
  last_interaction: d.lastInteraction,
  chat_history: d.chatHistory, // Supabase handles JSONB conversion automatically
  captured_data: d.capturedData
});

const StoreContext = createContext<AppState | undefined>(undefined);

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [state, setState] = useState({
    theme: 'dark' as 'light' | 'dark',
    countries: [] as CountryConfig[],
    courses: [] as Course[],
    prices: [] as Pricing[],
    paymentLinks: [] as PaymentLink[],
    professionsCatalog: [] as Profession[],
    professionRules: [] as CourseProfessionRule[],
    contactProperties: [] as ContactProperty[],
    pipeline: [] as PipelineStage[],
    deals: [] as Deal[],
    activeSandboxDealId: null as string | null,
    navigatedDealId: null as string | null,
    faqs: [] as FAQ[],
    config: defaultConfig,
  });

  // --- 1. INITIAL FETCH FROM SUPABASE ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        console.log("🔌 Connecting to Supabase...");

        // Execute all requests in parallel
        const [
          { data: countries, error: errCountries },
          { data: courses, error: errCourses },
          { data: prices, error: errPrices },
          { data: paymentLinks, error: errLinks },
          { data: professions, error: errProfs },
          { data: rules, error: errRules },
          { data: properties, error: errProps },
          { data: pipeline, error: errPipe },
          { data: deals, error: errDeals },
          { data: faqs, error: errFaqs },
          { data: configData, error: errConfig }
        ] = await Promise.all([
          supabase.from('countries').select('*'),
          supabase.from('courses').select('*'),
          supabase.from('prices').select('*'),
          supabase.from('payment_links').select('*'),
          supabase.from('professions').select('*'),
          supabase.from('profession_rules').select('*'),
          supabase.from('contact_properties').select('*'),
          supabase.from('pipeline_stages').select('*').order('order', { ascending: true }),
          supabase.from('deals').select('*'),
          supabase.from('faqs').select('*'),
          supabase.from('agent_config').select('*').limit(1)
        ]);

        if (errCountries || errCourses || errDeals) {
           throw new Error("Failed to load critical data from Supabase. Check your API Keys and Tables.");
        }

        // Hydrate State
        setState(prev => ({
          ...prev,
          countries: countries || [],
          courses: courses || [],
          prices: prices || [],
          paymentLinks: paymentLinks || [],
          professionsCatalog: professions || [],
          professionRules: rules || [],
          contactProperties: properties || [],
          pipeline: pipeline || [],
          deals: (deals || []).map(mapDealFromDB),
          faqs: faqs || [],
          config: configData?.[0] ? configData[0] : defaultConfig,
          activeSandboxDealId: localStorage.getItem('activeSandboxDealId') // Keep session locally
        }));
        
        console.log("✅ Data successfully loaded from backend.");

      } catch (err: any) {
        console.error("Database Error:", err);
        setError(err.message || "Unknown database error");
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // --- REALTIME SUBSCRIPTION FOR DEALS (MODULE 11 SYNC) ---
    const dealsSubscription = supabase
      .channel('public:deals')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'deals' }, (payload) => {
        
        setState(prev => {
          let updatedDeals = [...prev.deals];
          
          if (payload.eventType === 'INSERT') {
             const newDeal = mapDealFromDB(payload.new);
             // Avoid duplicate insert if we already added it locally optimistically
             const exists = updatedDeals.some(d => d.id === newDeal.id);
             if (!exists) updatedDeals.push(newDeal);
          } else if (payload.eventType === 'UPDATE') {
             const updatedDeal = mapDealFromDB(payload.new);
             // Check if local state is newer (to avoid jitter while typing), usually lastInteraction helps
             updatedDeals = updatedDeals.map(d => d.id === updatedDeal.id ? updatedDeal : d);
          } else if (payload.eventType === 'DELETE') {
             updatedDeals = updatedDeals.filter(d => d.id !== payload.old.id);
          }
          
          return { ...prev, deals: updatedDeals };
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(dealsSubscription);
    };

  }, []);

  // --- 2. PERSISTENCE LAYER ---
  const persistData = async (key: keyof AppState, value: any) => {
    const tableName = TABLE_MAPPING[key];
    
    // Skip keys that don't map to tables (like UI state)
    if (!tableName) {
        if (key === 'activeSandboxDealId' && value) {
            localStorage.setItem('activeSandboxDealId', value);
        }
        return;
    }

    try {
        if (key === 'config') {
            // Config is a singleton row (ID 1)
            await supabase.from(tableName).upsert({ ...value, id: 1 });
        } else if (key === 'deals' && Array.isArray(value)) {
            // Specialized handling for Deals to map to snake_case
            const dbDeals = value.map(mapDealToDB);
            const { error } = await supabase.from(tableName).upsert(dbDeals);
            if (error) {
                console.error(`Error persisting ${key}:`, JSON.stringify(error));
                if (error.message?.includes('column')) {
                    alert("⚠️ Error de Base de Datos: Faltan columnas en Supabase. Ejecuta el archivo SUPABASE_SETUP.sql");
                }
            }
        } else if (Array.isArray(value)) {
            const { error } = await supabase.from(tableName).upsert(value);
            if (error) console.error(`Error persisting ${key}:`, JSON.stringify(error));
        }
    } catch (err) {
        console.error(`Error writing to ${key}:`, err);
    }
  };

  const updateState = (key: keyof AppState, value: any) => {
    // 1. Optimistic Update (Immediate UI feedback)
    setState(prev => ({ ...prev, [key]: value }));

    // 2. Async Persist to Backend
    persistData(key, value);
  };

  const deleteItem = async (key: keyof AppState, id: string) => {
    const tableName = TABLE_MAPPING[key];
    if (!tableName) return;

    // 1. Optimistic Update: Remove from local state array
    setState(prev => {
        const currentList = prev[key];
        if (Array.isArray(currentList)) {
            return {
                ...prev,
                [key]: currentList.filter((item: any) => item.id !== id)
            };
        }
        return prev;
    });

    // 2. Database Delete
    try {
        const { error } = await supabase.from(tableName).delete().eq('id', id);
        if (error) {
            console.error(`Error deleting from ${tableName}:`, JSON.stringify(error));
        } else {
            console.log(`🗑️ Deleted ${id} from ${tableName}`);
        }
    } catch (err) {
        console.error(`Exception deleting from ${key}:`, err);
    }
  };

  // --- SPECIALIZED SAVE FOR DEALS (Atomic Updates) ---
  const saveDeal = async (deal: Deal) => {
      // 1. Optimistic Update Local State
      setState(prev => ({
          ...prev,
          deals: prev.deals.map(d => d.id === deal.id ? deal : d)
      }));

      // 2. Single Row Upsert to DB
      try {
          const dbDeal = mapDealToDB(deal);
          const { error } = await supabase.from('deals').upsert(dbDeal);
          
          if (error) {
              console.error("Error saving deal:", JSON.stringify(error));
              // Detect Schema Mismatch specifically
              if (error.code === 'PGRST204' || error.message?.includes('captured_data') || error.message?.includes('column')) {
                   console.warn("🚨 DATABASE SCHEMA MISMATCH 🚨");
                   console.warn("Please run the script in 'SUPABASE_SETUP.sql' in your Supabase SQL Editor.");
              }
          } else {
              // console.log("💾 Deal saved atomic:", deal.id);
          }
      } catch (err) {
          console.error("Exception saving deal:", err);
      }
  };

  if (loading) {
      return (
          <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-900 text-slate-200">
              <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <h2 className="text-xl font-bold animate-pulse">Cargando SalesFlow IA...</h2>
              <p className="text-sm text-slate-500 mt-2">Conectando con Supabase</p>
          </div>
      );
  }

  if (error) {
      return (
          <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-900 text-red-400 p-8 text-center">
              <h2 className="text-2xl font-bold mb-2">Error de Conexión</h2>
              <p className="max-w-md">{error}</p>
              <p className="mt-4 text-sm text-slate-500">Por favor verifica tus credenciales en services/supabaseClient.ts y ejecuta el script SQL de configuración.</p>
          </div>
      );
  }

  return (
    <StoreContext.Provider value={{ ...state, isLoading: loading, updateState, deleteItem, saveDeal }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore debe ser usado dentro de un StoreProvider');
  }
  return context;
};