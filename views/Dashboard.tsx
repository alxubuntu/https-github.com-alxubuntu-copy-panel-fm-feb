import React from 'react';
import { useStore } from '../store';
import { BarChart, Users, DollarSign, Activity } from 'lucide-react';
import { ResponsiveContainer, BarChart as ReBarChart, Bar, XAxis, Tooltip } from 'recharts';

export const Dashboard: React.FC = () => {
  const { deals, pipeline, prices } = useStore();

  const totalValue = deals.reduce((acc, deal) => acc + deal.value, 0);
  const activeDeals = deals.length;
  // Calcular valor potencial basado en precio promedio si el valor es 0
  const avgPrice = prices.reduce((acc, p) => acc + p.price, 0) / (prices.length || 1);
  const pipelineValue = activeDeals * avgPrice;

  // Transformar deals para gráfica
  const chartData = pipeline.map(stage => ({
    name: stage.name,
    count: deals.filter(d => d.stageId === stage.id).length
  }));

  return (
    <div className="p-8 h-full overflow-y-auto">
      <header className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Resumen del Pipeline</h2>
        <p className="text-slate-500 dark:text-slate-400">Vista en tiempo real de negocios gestionados por IA</p>
      </header>

      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
              <DollarSign size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Valor del Pipeline (Est.)</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">${pipelineValue.toLocaleString()}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg">
              <Users size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Oportunidades Activas</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{activeDeals}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg">
              <Activity size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Tasa de Conversión</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">12.5%</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Tablero Kanban */}
      <div className="flex gap-4 overflow-x-auto pb-4 h-[500px]">
        {pipeline.map((stage) => {
          const stageDeals = deals.filter(d => d.stageId === stage.id);
          
          return (
            <div key={stage.id} className="min-w-[300px] bg-slate-100 dark:bg-slate-800/50 rounded-xl p-4 flex flex-col h-full border border-slate-200 dark:border-slate-800">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-semibold text-slate-700 dark:text-slate-200">{stage.name}</h4>
                <span className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs px-2 py-1 rounded-full font-medium">
                  {stageDeals.length}
                </span>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-3">
                {stageDeals.map(deal => (
                  <div key={deal.id} className="bg-white dark:bg-slate-900 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 cursor-grab hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                      <h5 className="font-bold text-slate-800 dark:text-slate-100">{deal.customerName}</h5>
                      <span className="text-xs text-slate-400">{deal.lastInteraction}</span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">ID: {deal.id}</div>
                    {deal.value > 0 && (
                      <div className="text-sm font-medium text-green-600 dark:text-green-400">
                        ${deal.value.toLocaleString()}
                      </div>
                    )}
                    <div className="mt-3 flex justify-end">
                       <button className="text-xs bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-1 rounded border border-slate-200 dark:border-slate-700">
                          Ver Chat
                       </button>
                    </div>
                  </div>
                ))}
                {stageDeals.length === 0 && (
                  <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-sm border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg">
                    Sin oportunidades
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};