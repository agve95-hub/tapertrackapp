import React, { useMemo, useState } from 'react';
import { DailyLogEntry } from '../types';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { Calendar, FileText, ChevronDown, Zap } from 'lucide-react';

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
      // Ensure we have numbers for the charts
      anxietyLevel: l.anxietyLevel || 0,
      moodLevel: l.moodLevel || 0,
      depressionLevel: l.depressionLevel || 0,
      sleepHrs: l.sleepHrs || 0
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
       };
    });
  }, [logs, viewMode, sortedLogs]);

  const formatDateAxis = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    
    if (viewMode === 'monthly') {
      return date.toLocaleDateString(undefined, { month: 'short' });
    }
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const CustomDropdown = () => (
    <div className="relative group">
      <select 
        value={viewMode}
        onChange={(e) => setViewMode(e.target.value as ViewMode)}
        className="appearance-none bg-stone-100 hover:bg-stone-200 transition-colors pl-4 pr-9 py-2 rounded-lg text-xs font-bold text-stone-600 outline-none cursor-pointer border border-transparent focus:border-indigo-200"
      >
        <option value="daily">Daily View</option>
        <option value="weekly">Weekly Avg</option>
        <option value="monthly">Monthly Avg</option>
      </select>
      <ChevronDown className="w-3 h-3 text-stone-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
    </div>
  );

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-xl shadow-xl border border-stone-100 text-xs">
          <p className="font-bold text-stone-700 mb-2">{label ? formatDateAxis(label) : ''}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 mb-1">
              <div 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-stone-500 font-medium capitalize">
                {entry.name}:
              </span>
              <span className="font-bold text-stone-700">
                {entry.value}
              </span>
            </div>
          ))}
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
    <div className="space-y-8 pb-24">
      
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-stone-900">Analytics</h2>
        <p className="text-stone-500 text-sm mt-1">
          Tracking correlations and patterns over time
        </p>
      </div>

      {/* CHART 1: SYMPTOM TRENDS (Line Chart) */}
      <div className="bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-stone-100">
        <div className="flex items-center justify-between mb-8">
           <div>
             <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-1">LINE CHART</h3>
             <div className="flex items-center gap-4 text-sm font-medium">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-teal-400"></span>
                  <span className="text-stone-600">Anxiety</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                  <span className="text-stone-600">Mood</span>
                </div>
             </div>
           </div>
           <CustomDropdown />
        </div>
        
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatDateAxis}
                axisLine={false}
                tickLine={false}
                tick={{fill: '#9ca3af', fontSize: 10, fontWeight: 500}}
                dy={10}
                interval={viewMode === 'daily' ? 'preserveStartEnd' : 0}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: '#9ca3af', fontSize: 10, fontWeight: 500}} 
                domain={[0, 10]}
              />
              <Tooltip content={<CustomTooltip />} cursor={{stroke: '#e2e8f0', strokeWidth: 1}} />
              <Line 
                type="monotone" 
                dataKey="anxietyLevel" 
                name="Anxiety"
                stroke="#2dd4bf" 
                strokeWidth={3} 
                dot={{r: 4, strokeWidth: 2, fill: '#fff', stroke: '#2dd4bf'}} 
                activeDot={{r: 6, strokeWidth: 0, fill: '#2dd4bf'}}
              />
              <Line 
                type="monotone" 
                dataKey="moodLevel" 
                name="Mood"
                stroke="#6366f1" 
                strokeWidth={3} 
                dot={{r: 4, strokeWidth: 2, fill: '#fff', stroke: '#6366f1'}} 
                activeDot={{r: 6, strokeWidth: 0, fill: '#6366f1'}}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* CHART 2: SLEEP ANALYSIS (Stacked Bar Chart) */}
      <div className="bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-stone-100">
        <div className="flex items-center justify-between mb-8">
           <div>
             <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-1">STACKED BAR CHART</h3>
             <div className="flex items-center gap-4 text-sm font-medium">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-teal-400"></span>
                  <span className="text-stone-600">Night Sleep</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-sky-300"></span>
                  <span className="text-stone-600">Naps</span>
                </div>
             </div>
           </div>
           <CustomDropdown />
        </div>
        
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barGap={0}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatDateAxis}
                axisLine={false}
                tickLine={false}
                tick={{fill: '#9ca3af', fontSize: 10, fontWeight: 500}}
                dy={10}
                interval={viewMode === 'daily' ? 'preserveStartEnd' : 0}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: '#9ca3af', fontSize: 10, fontWeight: 500}} 
              />
              <Tooltip content={<CustomTooltip />} cursor={{fill: '#f8fafc'}} />
              
              <Bar 
                dataKey="sleepHrs" 
                name="Sleep"
                stackId="a" 
                fill="#2dd4bf" 
                barSize={viewMode === 'daily' ? 12 : 32}
              />
              <Bar 
                dataKey="napHrs" 
                name="Naps"
                stackId="a" 
                fill="#7dd3fc" 
                radius={[4, 4, 0, 0]}
                barSize={viewMode === 'daily' ? 12 : 32}
              />
            </BarChart>
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
                           <Zap className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
                           <span className="text-[10px] font-bold">{log.bpMorningPulse}</span>
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