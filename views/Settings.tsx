import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { Save, Bot, Volume2, Cpu, Key } from 'lucide-react';

export const Settings: React.FC = () => {
  const { config, updateState } = useStore();
  const [localConfig, setLocalConfig] = useState(config);
  const [apiKey, setApiKey] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const storedKey = localStorage.getItem('GEMINI_API_KEY');
    if (storedKey) setApiKey(storedKey);
  }, []);

  const handleSave = () => {
      updateState('config', localConfig);
      localStorage.setItem('GEMINI_API_KEY', apiKey);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="p-8 h-full overflow-y-auto">
      <header className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Configuración del Agente</h2>
        <p className="text-slate-500 dark:text-slate-400">Módulo 7: Personalidad y Ajustes del Modelo.</p>
      </header>

      <div className="max-w-2xl bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
          <div className="p-6 space-y-8">
              
              {/* Sección API Key */}
              <div>
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                      <Key size={20} className="text-yellow-500" /> Credenciales
                  </h3>
                  <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Google Gemini API Key</label>
                      <input 
                        type="password" 
                        value={apiKey}
                        placeholder="AIzaSy..."
                        onChange={(e) => setApiKey(e.target.value)}
                        className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                      <p className="text-xs text-slate-400 mt-1">Se guarda localmente en tu navegador para habilitar el chat.</p>
                  </div>
              </div>

              <hr className="border-slate-100 dark:border-slate-800" />

              {/* Sección Identidad */}
              <div>
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                      <Bot size={20} className="text-brand-500" /> Identidad
                  </h3>
                  <div className="grid gap-4">
                      <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nombre del Bot</label>
                          <input 
                            type="text" 
                            value={localConfig.name}
                            onChange={(e) => setLocalConfig({...localConfig, name: e.target.value})}
                            className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                          />
                          <p className="text-xs text-slate-400 mt-1">El nombre que usa el bot para presentarse.</p>
                      </div>
                  </div>
              </div>

              <hr className="border-slate-100 dark:border-slate-800" />

              {/* Sección Personalidad */}
              <div>
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                      <Volume2 size={20} className="text-purple-500" /> Tono de Voz
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                      {['Friendly', 'Professional', 'Urgent'].map((t) => (
                          <button
                            key={t}
                            onClick={() => setLocalConfig({...localConfig, tone: t as any})}
                            className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                                localConfig.tone === t 
                                ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-500 text-purple-700 dark:text-purple-400' 
                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                            }`}
                          >
                              {t === 'Friendly' ? 'Amigable' : t === 'Professional' ? 'Profesional' : 'Urgente'}
                          </button>
                      ))}
                  </div>
              </div>

              <hr className="border-slate-100 dark:border-slate-800" />

              {/* Sección Modelo */}
              <div>
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                      <Cpu size={20} className="text-blue-500" /> Modelo IA
                  </h3>
                  <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Versión Modelo Gemini</label>
                      <select 
                        value={localConfig.model}
                        onChange={(e) => setLocalConfig({...localConfig, model: e.target.value})}
                        className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      >
                          <option value="gemini-3-flash-preview">Gemini 3 Flash (Más Rápido)</option>
                          <option value="gemini-3-pro-preview">Gemini 3 Pro (Razonamiento)</option>
                      </select>
                  </div>
              </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <span className={`text-sm font-medium text-green-600 dark:text-green-400 transition-opacity ${saved ? 'opacity-100' : 'opacity-0'}`}>
                  ¡Ajustes Guardados con Éxito!
              </span>
              <button 
                onClick={handleSave}
                className="bg-brand-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-brand-700 flex items-center gap-2 transition-colors"
              >
                  <Save size={18} /> Guardar Cambios
              </button>
          </div>
      </div>
    </div>
  );
};