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
  ResponsiveContainer,
  Legend
} from 'recharts';
import { Calendar, FileText, ChevronDown, TrendingUp } from 'lucide-react';

interface HistoryAnalyticsProps {
  logs: DailyLogEntry[];
}

type ViewMode = 'daily' | 'weekly' | 'monthly';

const HistoryAnalytics: React.FC<HistoryAnalyticsProps> = ({ logs }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('daily');
  
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
      brainZapLevel: l.brainZapLevel || 0,
      anxietyLevel: l.anxietyLevel || 0,
      moodLevel: l.moodLevel || 0,
      depressionLevel: l.depressionLevel || 0,
      sleepHrs: l.sleepHrs || 0
    });

    if (viewMode === 'daily') {
       return sortedLogs.map(formatEntry);
    }

    // Aggregation Logic
    const groups: Record<string, DailyLogEntry[]> = {};
    
    sortedLogs.forEach(log => {
      const [y, m, d] = log.date.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);
      
      let key = '';
      if (viewMode === 'weekly') {
         const day = dateObj.getDay(); 
         const diff = dateObj.getDate() - day + (day === 0 ? -6 : 1); 
         const monday = new Date(dateObj);
         monday.setDate(diff);
         key = monday.toISOString().split('T')[0];
      } else {
         key = `${y}-${String(m).padStart(2, '0')}-01`;
      }
      
      if (!groups[key]) groups[key] = [];
      groups[key].push(log);
    });

    return Object.keys(groups).sort().map(dateKey => {
       const group = groups[dateKey];
       const avg = (field: keyof DailyLogEntry) => {
         const valid = group.filter(g => g[field] !== undefined);
         if (valid.length === 0) return 0;
         const sum = valid.reduce((acc, curr) => acc + (Number(curr[field]) || 0), 0);
         return Number((sum / valid.length).toFixed(1));
       };
       const avgNapMins = avg('napMinutes');

       return {
         ...group[0],
         date: dateKey,
         anxietyLevel: avg('anxietyLevel'),
         moodLevel: avg('moodLevel'),
         depressionLevel: avg('depressionLevel'),
         brainZapLevel: avg('brainZapLevel'),
         sleepHrs: avg('sleepHrs'),
         napHrs: parseFloat((avgNapMins / 60).toFixed(1)),
       };
    });
  }, [logs, viewMode, sortedLogs]);

  const formatDateAxis = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    
    if (viewMode === 'monthly') return date.toLocaleDateString(undefined, { month: 'short' });
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-xl shadow-xl border border-stone-100 text-xs">
          <p className="font-bold text-stone-700 mb-2">{label ? formatDateAxis(label) : ''}</p>
          <div className="space-y-1">
             {payload.map((entry: any, index: number) => (
                <div key={index} className="flex items-center gap-2 justify-between min-w-[120px]">
                  <div className="flex items-center gap-2">
                     <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                     <span className="text-stone-500 font-medium capitalize">{entry.name}</span>
                  </div>
                  <span className="font-bold text-stone-700">{entry.value}</span>
                </div>
             ))}
          </div>
        </div>
      );
    }
    return null;
  };

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
    <div className="space-y-6 pb-24">
      
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-bold text-stone-900">Analytics</h2>
          <p className="text-stone-500 text-sm mt-1">
            Tracking correlations over time
          </p>
        </div>
      </div>

      {/* COMBINED CHART CARD */}
      <div className="bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-stone-100 relative">
        
        {/* Card Header & Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
           <div className="flex items-center gap-2">
              <div className="bg-indigo-50 p-2 rounded-lg text-indigo-600">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-stone-800 uppercase tracking-wide">Wellness Trends</h3>
                <p className="text-[10px] text-stone-400 font-medium">Sleep vs. Symptoms</p>
              </div>
           </div>
           
           <div className="relative group">
              <select 
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value as ViewMode)}
                className="appearance-none bg-stone-100 hover:bg-stone-200 transition-colors pl-4 pr-10 py-2 rounded-xl text-xs font-bold text-stone-600 outline-none cursor-pointer focus:ring-2 focus:ring-indigo-100 border-none"
              >
                <option value="daily">Daily View</option>
                <option value="weekly">Weekly Avg</option>
                <option value="monthly">Monthly Avg</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-stone-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
           </div>
        </div>
        
        {/* Chart */}
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatDateAxis}
                axisLine={false}
                tickLine={false}
                tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 500}}
                dy={10}
                interval={viewMode === 'daily' ? 'preserveStartEnd' : 0}
              />
              
              {/* Left Axis: Scores 0-10 */}
              <YAxis 
                yAxisId="left"
                orientation="left"
                axisLine={false} 
                tickLine={false} 
                tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 500}} 
                domain={[0, 10]}
                ticks={[0, 2, 4, 6, 8, 10]}
              />
              
              {/* Right Axis: Hours 0-12 (Sleep) */}
              <YAxis 
                yAxisId="right"
                orientation="right"
                axisLine={false} 
                tickLine={false} 
                tick={{fill: '#cbd5e1', fontSize: 10, fontWeight: 500}} 
                domain={[0, 12]}
                hide={false}
              />

              <Tooltip content={<CustomTooltip />} cursor={{fill: '#f8fafc', opacity: 0.5}} />
              
              <Legend 
                wrapperStyle={{ paddingTop: '20px', fontSize: '11px', fontWeight: 600, color: '#64748b' }} 
                iconType="circle"
              />
              
              {/* BARS: Sleep */}
              <Bar 
                yAxisId="right"
                dataKey="sleepHrs" 
                name="Sleep (hrs)"
                stackId="a" 
                fill="#cbd5e1" 
                barSize={viewMode === 'daily' ? 12 : 24}
                opacity={0.6}
              />
              <Bar 
                yAxisId="right"
                dataKey="napHrs" 
                name="Naps"
                stackId="a" 
                fill="#94a3b8" 
                radius={[4, 4, 0, 0]}
                barSize={viewMode === 'daily' ? 12 : 24}
                opacity={0.6}
              />

              {/* LINES: Symptoms */}
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="anxietyLevel" 
                name="Anxiety"
                stroke="#f43f5e" 
                strokeWidth={2.5} 
                dot={false}
                activeDot={{r: 6}}
              />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="moodLevel" 
                name="Mood"
                stroke="#10b981" 
                strokeWidth={2.5} 
                dot={false}
                activeDot={{r: 6}}
              />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="brainZapLevel" 
                name="Zaps"
                stroke="#6366f1" 
                strokeWidth={2} 
                strokeDasharray="4 4"
                dot={false}
                activeDot={{r: 6}}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* RAW DATA TABLE */}
      <div className="bg-white rounded-3xl shadow-sm border border-stone-100 overflow-hidden">
        <div className="p-5 border-b border-stone-100 flex items-center justify-between bg-stone-50/30">
           <h3 className="font-bold text-stone-800 flex items-center gap-2 text-sm">
             <Calendar className="w-4 h-4 text-stone-400" />
             Data Log
           </h3>
        </div>
        
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left">
            <thead className="bg-white text-stone-400 text-[10px] font-bold uppercase tracking-wider border-b border-stone-100">
              <tr>
                <th className="py-3 px-4 whitespace-nowrap">Date</th>
                <th className="py-3 px-4">Dose</th>
                <th className="py-3 px-4">Sleep</th>
                <th className="py-3 px-4 text-center">Anx</th>
                <th className="py-3 px-4 text-center">Mood</th>
                <th className="py-3 px-4 text-center">Dep</th>
                <th className="py-3 px-4 text-center">Zap</th>
                <th className="py-3 px-4 whitespace-nowrap">BP (AM)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {sortedLogs.slice().reverse().map((log, i) => (
                <tr key={i} className="hover:bg-stone-50/80 transition-colors group">
                  <td className="py-3 px-4 whitespace-nowrap text-xs font-bold text-stone-700">
                    {new Date(log.date).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                    <span className="text-stone-300 font-normal ml-1">
                      {new Date(log.date).toLocaleDateString(undefined, {weekday: 'short'})}
                    </span>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap text-xs font-medium text-stone-600">
                    {log.lDose}mg
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap text-xs font-medium text-stone-600">
                    {log.sleepHrs}h 
                    {log.napMinutes ? <span className="text-stone-400 ml-1">+{log.napMinutes}m</span> : ''}
                  </td>
                  
                  {/* Rating Cells: Compact Badges */}
                  <td className="py-3 px-4 text-center">
                    <div className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold mx-auto ${
                      log.anxietyLevel > 6 ? 'bg-rose-100 text-rose-600' : 
                      log.anxietyLevel > 3 ? 'bg-orange-50 text-orange-500' : 'bg-green-50 text-green-600'
                    }`}>
                      {log.anxietyLevel}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold mx-auto ${
                      log.moodLevel > 6 ? 'bg-emerald-100 text-emerald-600' : 
                      log.moodLevel > 3 ? 'bg-stone-100 text-stone-500' : 'bg-red-50 text-red-500'
                    }`}>
                      {log.moodLevel}
                    </div>
                  </td>
                   <td className="py-3 px-4 text-center">
                    <span className="text-xs font-medium text-stone-400">{log.depressionLevel || '-'}</span>
                  </td>
                  <td className="py-3 px-4 text-center">
                     {(log.brainZapLevel || 0) > 0 ? (
                       <span className="text-[10px] font-bold text-indigo-500">
                         {['','Mild','Mod','Sev'][log.brainZapLevel || 0]}
                       </span>
                     ) : <span className="text-stone-300">-</span>}
                  </td>

                  <td className="py-3 px-4 whitespace-nowrap text-xs font-mono text-stone-500">
                    {log.bpMorningSys ? (
                        <span>{log.bpMorningSys}/{log.bpMorningDia} <span className="text-stone-300 ml-1">{log.bpMorningPulse}</span></span>
                    ) : '-'}
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