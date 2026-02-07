import React, { useMemo, useState } from 'react';
import { DailyLogEntry } from '../types';
import { 
  ComposedChart, 
  Line, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { Calendar, FileText, Layers, Filter, Zap } from 'lucide-react';

interface HistoryAnalyticsProps {
  logs: DailyLogEntry[];
}

type ViewMode = 'daily' | 'weekly' | 'monthly';

const HistoryAnalytics: React.FC<HistoryAnalyticsProps> = ({ logs }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('daily');
  
  // Filter State - Control visibility of metrics
  const [filters, setFilters] = useState({
    anxiety: true,
    depression: false,
    mood: false,
    zaps: true,
    sleep: true,
    bp: true
  });

  const toggleFilter = (key: keyof typeof filters) => {
    setFilters(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const sortedLogs = useMemo(() => {
    return [...logs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [logs]);

  const chartData = useMemo(() => {
    if (logs.length === 0) return [];
    
    // Helper to format data
    const formatEntry = (l: DailyLogEntry) => ({
      ...l,
      napHrs: l.napMinutes ? parseFloat((l.napMinutes / 60).toFixed(1)) : 0,
      bpSys: l.bpMorningSys || null,
      bpDia: l.bpMorningDia || null,
      brainZapLevel: l.brainZapLevel || 0
    });

    // If daily, return raw sorted logs formatted
    if (viewMode === 'daily') {
       return sortedLogs.map(formatEntry);
    }

    // Aggregation Logic
    const groups: Record<string, DailyLogEntry[]> = {};
    
    sortedLogs.forEach(log => {
      // Parse YYYY-MM-DD safely
      const [y, m, d] = log.date.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);
      
      let key = '';
      
      if (viewMode === 'weekly') {
         // Group by Week (Monday start)
         const day = dateObj.getDay(); // 0 is Sunday
         const diff = dateObj.getDate() - day + (day === 0 ? -6 : 1); 
         const monday = new Date(dateObj);
         monday.setDate(diff);
         key = monday.toISOString().split('T')[0];
      } else {
         // Group by Month
         key = `${y}-${String(m).padStart(2, '0')}-01`;
      }
      
      if (!groups[key]) groups[key] = [];
      groups[key].push(log);
    });

    // Create averaged entries
    return Object.keys(groups).sort().map(dateKey => {
       const group = groups[dateKey];
       
       const avg = (field: keyof DailyLogEntry) => {
         const valid = group.filter(g => g[field] !== undefined);
         if (valid.length === 0) return 0;
         const sum = valid.reduce((acc, curr) => acc + (Number(curr[field]) || 0), 0);
         return Number((sum / valid.length).toFixed(1));
       };
       
       const avgBP = (sysField: 'bpMorningSys', diaField: 'bpMorningDia') => {
          const valid = group.filter(g => g[sysField] && g[diaField]);
          if (valid.length === 0) return { sys: null, dia: null };
          const sysSum = valid.reduce((acc, curr) => acc + (Number(curr[sysField]) || 0), 0);
          const diaSum = valid.reduce((acc, curr) => acc + (Number(curr[diaField]) || 0), 0);
          return {
              sys: Math.round(sysSum / valid.length),
              dia: Math.round(diaSum / valid.length)
          };
       };

       const bp = avgBP('bpMorningSys', 'bpMorningDia');
       const avgNapMins = avg('napMinutes');

       return {
         ...group[0], // keep base structure
         date: dateKey,
         anxietyLevel: avg('anxietyLevel'),
         moodLevel: avg('moodLevel'),
         depressionLevel: avg('depressionLevel'),
         brainZapLevel: avg('brainZapLevel'),
         sleepHrs: avg('sleepHrs'),
         napHrs: parseFloat((avgNapMins / 60).toFixed(1)),
         bpSys: bp.sys,
         bpDia: bp.dia,
       };
    });
  }, [logs, viewMode, sortedLogs]);

  const formatDateAxis = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    
    if (viewMode === 'monthly') {
      return date.toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
    }
    return date.toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' });
  };

  // Explicit config for Tailwind scanner
  const FILTER_CONFIG = [
    { key: 'anxiety' as const, label: 'Anxiety', activeClass: 'bg-orange-50 text-orange-700 border-orange-200', dotClass: 'bg-orange-500' },
    { key: 'depression' as const, label: 'Depression', activeClass: 'bg-purple-50 text-purple-700 border-purple-200', dotClass: 'bg-purple-500' },
    { key: 'mood' as const, label: 'Mood', activeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200', dotClass: 'bg-emerald-500' },
    { key: 'zaps' as const, label: 'Brain Zaps', activeClass: 'bg-blue-50 text-blue-700 border-blue-200', dotClass: 'bg-blue-500' },
    { key: 'sleep' as const, label: 'Sleep', activeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200', dotClass: 'bg-indigo-500' },
    { key: 'bp' as const, label: 'BP', activeClass: 'bg-rose-50 text-rose-700 border-rose-200', dotClass: 'bg-rose-500' },
  ];

  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center px-4">
        <div className="w-20 h-20 bg-stone-100 rounded-full flex items-center justify-center mb-6">
           <FileText className="w-8 h-8 text-stone-300" />
        </div>
        <h3 className="text-xl font-bold text-stone-700 mb-2">No History Yet</h3>
        <p className="text-stone-500 max-w-sm mx-auto">
          Start logging your daily progress to visualize your taper journey and symptom trends here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-24">
      
      {/* Analytics Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
         <div>
            <h2 className="text-2xl font-bold text-stone-900">Analytics</h2>
            <p className="text-stone-500 text-sm mt-1">
              {viewMode === 'daily' && "Tracking daily correlations"}
              {viewMode === 'weekly' && "Weekly averages"}
              {viewMode === 'monthly' && "Long-term trends"}
            </p>
         </div>
         
         <div className="flex bg-stone-100 p-1 rounded-xl self-start sm:self-auto">
            {(['daily', 'weekly', 'monthly'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition-all duration-200 ${
                  viewMode === mode 
                    ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5' 
                    : 'text-stone-400 hover:text-stone-600'
                }`}
              >
                {mode}
              </button>
            ))}
         </div>
      </div>

      {/* Master Chart Card */}
      <div className="bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-stone-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-6">
           {/* Title & Sub */}
           <div className="flex items-center gap-3">
             <div className="p-2 bg-indigo-50 rounded-lg shrink-0">
               <Layers className="w-5 h-5 text-indigo-500" />
             </div>
             <div>
               <h3 className="font-bold text-stone-800">Master Timeline</h3>
               <p className="text-xs text-stone-400">Toggle filters to customize view</p>
             </div>
           </div>
           
           {/* Interactive Filters */}
           <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-stone-300 uppercase tracking-wide mr-2">
                <Filter className="w-3 h-3" />
                Filters
              </div>
              {FILTER_CONFIG.map((config) => (
                <button 
                  key={config.key}
                  onClick={() => toggleFilter(config.key)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 border flex items-center gap-2 ${
                    filters[config.key] 
                      ? `${config.activeClass} shadow-sm` 
                      : 'bg-white text-stone-400 border-stone-100 hover:border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full ${filters[config.key] ? config.dotClass : 'bg-stone-300'}`} />
                  {config.label}
                </button>
              ))}
           </div>
        </div>
        
        <div className="h-96 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f4" />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatDateAxis}
                stroke="#d6d3d1"
                fontSize={10}
                tickMargin={10}
                tickLine={false}
                axisLine={false}
                interval={viewMode === 'daily' ? 'preserveStartEnd' : 0}
              />
              
              {/* Left Axis: Sleep (0-12), Symptoms (0-10), Zaps (0-3) */}
              <YAxis yAxisId="left" stroke="#94a3b8" fontSize={10} domain={[0, 12]} tickLine={false} axisLine={false} />
              
              {/* Right Axis: BP (60-180) - Only show if BP is enabled */}
              {filters.bp && (
                 <YAxis yAxisId="right" orientation="right" stroke="#fda4af" fontSize={10} domain={[60, 'auto']} tickLine={false} axisLine={false} />
              )}

              <Tooltip 
                cursor={{fill: '#f5f5f4'}}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                labelFormatter={(date) => {
                    const [y, m, d] = date.split('-').map(Number);
                    const dObj = new Date(y, m - 1, d);
                    if (viewMode === 'monthly') return dObj.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
                    return dObj.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
                }}
                formatter={(value: any, name: string) => {
                  if (name === 'Night Sleep' || name === 'Naps') return [`${value}h`, name];
                  if (name === 'Systolic' || name === 'Diastolic') return [`${value} mmHg`, name];
                  if (name === 'Brain Zaps') return [value, name];
                  return [value, name]; // Ratings
                }}
              />

              {/* Background: Sleep & Naps - Rendered first to be on left or background */}
              {filters.sleep && (
                <>
                  <Bar yAxisId="left" dataKey="sleepHrs" name="Night Sleep" stackId="sleep" fill="#c7d2fe" radius={[0,0,4,4]} barSize={viewMode === 'daily' ? 24 : 12} />
                  <Bar yAxisId="left" dataKey="napHrs" name="Naps" stackId="sleep" fill="#818cf8" radius={[4,4,0,0]} barSize={viewMode === 'daily' ? 24 : 12} />
                </>
              )}

              {/* Symptoms Bars - Grouped by default by Recharts (no stackId) */}
              {filters.anxiety && (
                <Bar yAxisId="left" dataKey="anxietyLevel" name="Anxiety" fill="#f97316" radius={[4, 4, 0, 0]} barSize={viewMode === 'daily' ? 14 : 8} />
              )}
              {filters.depression && (
                <Bar yAxisId="left" dataKey="depressionLevel" name="Depression" fill="#a855f7" radius={[4, 4, 0, 0]} barSize={viewMode === 'daily' ? 14 : 8} />
              )}
              {filters.mood && (
                <Bar yAxisId="left" dataKey="moodLevel" name="Mood" fill="#10b981" radius={[4, 4, 0, 0]} barSize={viewMode === 'daily' ? 14 : 8} />
              )}
              {filters.zaps && (
                <Bar yAxisId="left" dataKey="brainZapLevel" name="Brain Zaps" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={viewMode === 'daily' ? 14 : 8} />
              )}

              {/* Blood Pressure (Right Axis) */}
              {filters.bp && (
                <>
                  <Line yAxisId="right" type="monotone" dataKey="bpSys" name="Systolic" stroke="#f43f5e" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
                  <Line yAxisId="right" type="monotone" dataKey="bpDia" name="Diastolic" stroke="#fb7185" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
                </>
              )}

            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* History Log Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-stone-100 overflow-hidden">
        <div className="p-6 border-b border-stone-100 bg-stone-50/50">
           <h3 className="font-bold text-stone-800 flex items-center gap-2">
             <Calendar className="w-4 h-4 text-stone-400" />
             Raw Data Log
           </h3>
        </div>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-sm">
            <thead className="bg-white text-stone-400 text-xs font-bold uppercase tracking-wider border-b border-stone-100">
              <tr>
                <th className="p-4 whitespace-nowrap pl-6">Date</th>
                <th className="p-4">Meds</th>
                <th className="p-4">Sleep</th>
                <th className="p-4">Anxiety</th>
                <th className="p-4">Depress</th>
                <th className="p-4">Mood</th>
                <th className="p-4">Zaps</th>
                <th className="p-4 whitespace-nowrap pr-6">BP (AM)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {sortedLogs.slice().reverse().map((log, i) => (
                <tr key={i} className="hover:bg-stone-50/80 transition-colors group">
                  <td className="p-4 pl-6 whitespace-nowrap font-semibold text-stone-700">
                    {new Date(log.date).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                    <span className="text-stone-300 font-normal ml-2 text-xs hidden sm:inline">{new Date(log.date).toLocaleDateString(undefined, {weekday: 'short'})}</span>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1">
                      <span className="bg-stone-100 text-stone-600 px-2 py-0.5 rounded text-xs font-bold w-fit">
                        {log.lDose}mg
                      </span>
                      {log.bDose && (
                        <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded text-[10px] font-bold w-fit">
                          {log.bDose}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4 font-medium text-stone-600">
                    {log.sleepHrs}h
                    {log.napMinutes ? <span className="text-[10px] text-blue-400 ml-1">+{log.napMinutes}m</span> : ''}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${log.anxietyLevel > 6 ? 'bg-red-500' : 'bg-orange-400'}`} />
                      <span className="text-stone-700 font-medium">{log.anxietyLevel}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${(log.depressionLevel || 1) > 6 ? 'bg-slate-700' : 'bg-purple-400'}`} />
                      <span className="text-stone-700 font-medium">{log.depressionLevel || '-'}</span>
                    </div>
                  </td>
                  <td className="p-4">
                     <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${log.moodLevel > 6 ? 'bg-green-500' : 'bg-teal-400'}`} />
                      <span className="text-stone-700 font-medium">{log.moodLevel}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    {(log.brainZapLevel || 0) > 0 ? (
                       <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                         (log.brainZapLevel || 0) === 3 ? 'bg-blue-100 text-blue-700' : 
                         (log.brainZapLevel || 0) === 2 ? 'bg-blue-50 text-blue-600' : 'bg-stone-100 text-stone-500'
                       }`}>
                         {['None','Mild','Mod','Sev'][log.brainZapLevel || 0]}
                       </span>
                    ) : (
                      <span className="text-stone-300">-</span>
                    )}
                  </td>
                  <td className="p-4 pr-6 whitespace-nowrap text-xs text-stone-500 font-mono">
                    <div className="flex flex-col">
                       <span>{log.bpMorningSys ? `${log.bpMorningSys}/${log.bpMorningDia}` : '-'}</span>
                       {log.bpMorningPulse && (
                         <div className="flex items-center gap-1 mt-0.5 text-stone-400">
                           <span className="text-[10px] font-bold">{log.bpMorningPulse} bpm</span>
                           {log.bpMorningIrregular && <Zap className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />}
                         </div>
                       )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default HistoryAnalytics;