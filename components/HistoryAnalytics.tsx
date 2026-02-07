import React, { useMemo, useState } from 'react';
import { DailyLogEntry } from '../types';
import { 
  AreaChart, 
  Area, 
  LineChart,
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { Calendar, FileText, ChevronDown, Activity, TrendingDown, TrendingUp, Minus, Pill, Moon, Zap, Smile } from 'lucide-react';

interface HistoryAnalyticsProps {
  logs: DailyLogEntry[];
}

type ViewMode = 'daily' | 'weekly' | 'monthly';

const HistoryAnalytics: React.FC<HistoryAnalyticsProps> = ({ logs }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('daily');
  
  const sortedLogs = useMemo(() => {
    return [...logs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [logs]);

  // --- STATS CALCULATION ---
  const stats = useMemo(() => {
    if (logs.length === 0) return null;
    
    const last7 = sortedLogs.slice(-7);
    const avg = (items: DailyLogEntry[], key: keyof DailyLogEntry) => {
      const valid = items.filter(i => typeof i[key] === 'number');
      if (valid.length === 0) return 0;
      return valid.reduce((sum, item) => sum + (item[key] as number), 0) / valid.length;
    };

    const current = sortedLogs[sortedLogs.length - 1];
    
    return {
      currentDose: current.lDose,
      avgSleep: avg(last7, 'sleepHrs'),
      avgAnxiety: avg(last7, 'anxietyLevel'),
      avgMood: avg(last7, 'moodLevel'),
      avgEnergy: 10 - avg(last7, 'brainZapLevel'), // Invert zap for "Health"
      adherence: 95, // Mock or calc based on completedItems
    };
  }, [logs, sortedLogs]);

  // --- CHART DATA PREP ---
  const chartData = useMemo(() => {
    if (logs.length === 0) return [];
    
    const formatEntry = (l: DailyLogEntry) => ({
      ...l,
      dateFormatted: new Date(l.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      // Normalize values for chart visualization if needed, or keep raw
      sleepHrs: l.sleepHrs || 0,
      anxietyLevel: l.anxietyLevel || 0,
      moodLevel: l.moodLevel || 0,
      brainZapLevel: l.brainZapLevel || 0,
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

       return {
         date: dateKey,
         dateFormatted: viewMode === 'monthly' 
            ? new Date(dateKey).toLocaleDateString(undefined, { month: 'short' })
            : new Date(dateKey).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
         anxietyLevel: avg('anxietyLevel'),
         moodLevel: avg('moodLevel'),
         brainZapLevel: avg('brainZapLevel'),
         sleepHrs: avg('sleepHrs'),
         lDose: avg('lDose'),
       };
    });
  }, [logs, viewMode, sortedLogs]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-xl shadow-xl border border-stone-100 text-xs">
          <p className="font-bold text-stone-900 mb-3 text-sm">{label}</p>
          <div className="space-y-2">
             {payload.map((entry: any, index: number) => (
                <div key={index} className="flex items-center gap-3 justify-between min-w-[140px]">
                  <div className="flex items-center gap-2">
                     <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                     <span className="text-stone-500 font-medium">{entry.name}</span>
                  </div>
                  <span className="font-bold text-stone-800 text-sm">{Number(entry.value).toFixed(1)}</span>
                </div>
             ))}
          </div>
        </div>
      );
    }
    return null;
  };

  // --- RENDERING ---

  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center px-4">
        <div className="w-20 h-20 bg-stone-100 rounded-full flex items-center justify-center mb-6">
           <FileText className="w-8 h-8 text-stone-300" />
        </div>
        <h3 className="text-xl font-bold text-stone-700 mb-2">No Data Available</h3>
        <p className="text-stone-500 max-w-sm mx-auto">
          Start logging your daily progress to generate analytics and insights.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-24 font-sans">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-stone-900 tracking-tight">Analytics</h2>
          <p className="text-stone-500 text-sm font-medium">Overview of your wellness journey</p>
        </div>
        
        {/* View Switcher */}
        <div className="relative group">
            <select 
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value as ViewMode)}
              className="appearance-none bg-white hover:bg-stone-50 transition-colors pl-4 pr-10 py-2.5 rounded-xl border border-stone-200 text-sm font-bold text-stone-700 outline-none cursor-pointer focus:ring-2 focus:ring-teal-100 shadow-sm"
            >
              <option value="daily">Daily View</option>
              <option value="weekly">Weekly Avg</option>
              <option value="monthly">Monthly Avg</option>
            </select>
            <ChevronDown className="w-4 h-4 text-stone-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
         </div>
      </div>

      {/* DASHBOARD GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* CARD 1: CURRENT STATUS (Matches "Supply" Card) */}
        <div className="bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-stone-100 md:col-span-1 flex flex-col justify-between">
            <div>
               <div className="flex justify-between items-start mb-2">
                 <h3 className="text-stone-500 font-bold text-sm">Current Dose</h3>
                 <div className="p-1.5 bg-teal-50 rounded-lg text-teal-600">
                   <Pill className="w-4 h-4" />
                 </div>
               </div>
               <div className="flex items-baseline gap-2">
                 <span className="text-4xl font-bold text-stone-900 tracking-tight">{stats?.currentDose}</span>
                 <span className="text-stone-400 font-semibold">mg</span>
               </div>
            </div>
            
            <div className="mt-8">
               {/* Mini Sparkline Area */}
               <div className="h-16 w-full -mx-2">
                 <ResponsiveContainer width="100%" height="100%">
                   <AreaChart data={chartData.slice(-10)}>
                     <defs>
                       <linearGradient id="doseGradient" x1="0" y1="0" x2="0" y2="1">
                         <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3}/>
                         <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
                       </linearGradient>
                     </defs>
                     <Area type="monotone" dataKey="lDose" stroke="#14b8a6" strokeWidth={2} fill="url(#doseGradient)" />
                   </AreaChart>
                 </ResponsiveContainer>
               </div>
               <div className="flex justify-between items-center text-xs font-bold text-stone-400 mt-2 border-t border-stone-100 pt-3">
                  <span>Adherence</span>
                  <span className="text-teal-600">98% This Week</span>
               </div>
            </div>
        </div>

        {/* CARD 2: SYMPTOM HEALTH (Matches "Inventory Health" Card) */}
        <div className="bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-stone-100 md:col-span-2">
            <div className="flex justify-between items-center mb-6">
               <div>
                  <h3 className="text-3xl font-bold text-stone-900 tracking-tight">Wellness Score</h3>
                  <p className="text-stone-400 text-xs font-bold uppercase tracking-wider mt-1">Last 7 Days Average</p>
               </div>
               <div className="text-right">
                  <div className="text-sm font-bold text-stone-500">Overall</div>
                  <div className="text-xl font-bold text-teal-500">Good</div>
               </div>
            </div>

            <div className="space-y-6">
               {/* Sleep Bar */}
               <div>
                  <div className="flex justify-between items-end mb-2">
                     <span className="text-sm font-bold text-stone-700 flex items-center gap-2">
                        <Moon className="w-4 h-4 text-indigo-900" /> Sleep Quality
                     </span>
                     <span className="text-sm font-bold text-indigo-900">{stats?.avgSleep.toFixed(1)} hrs</span>
                  </div>
                  <div className="w-full bg-stone-100 rounded-full h-2.5 overflow-hidden">
                     <div 
                        className="h-full rounded-full bg-gradient-to-r from-indigo-900 to-indigo-800" 
                        style={{ width: `${Math.min(((stats?.avgSleep || 0) / 9) * 100, 100)}%` }}
                     />
                  </div>
               </div>

               {/* Anxiety Bar */}
               <div>
                  <div className="flex justify-between items-end mb-2">
                     <span className="text-sm font-bold text-stone-700 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-teal-500" /> Anxiety Level
                     </span>
                     <span className="text-sm font-bold text-teal-600">{stats?.avgAnxiety.toFixed(1)} / 10</span>
                  </div>
                  <div className="w-full bg-stone-100 rounded-full h-2.5 overflow-hidden">
                     {/* Invert color logic: Low anxiety is good (full bar visual for 'Health' might be tricky, let's just show raw level) */}
                     <div 
                        className="h-full rounded-full bg-gradient-to-r from-teal-400 to-teal-500" 
                        style={{ width: `${((stats?.avgAnxiety || 0) / 10) * 100}%` }}
                     />
                  </div>
               </div>

               {/* Mood Bar */}
               <div>
                  <div className="flex justify-between items-end mb-2">
                     <span className="text-sm font-bold text-stone-700 flex items-center gap-2">
                        <Smile className="w-4 h-4 text-amber-400" /> Mood Stability
                     </span>
                     <span className="text-sm font-bold text-amber-500">{stats?.avgMood.toFixed(1)} / 10</span>
                  </div>
                  <div className="w-full bg-stone-100 rounded-full h-2.5 overflow-hidden">
                     <div 
                        className="h-full rounded-full bg-gradient-to-r from-amber-300 to-amber-400" 
                        style={{ width: `${((stats?.avgMood || 0) / 10) * 100}%` }}
                     />
                  </div>
               </div>
            </div>
        </div>

        {/* CARD 3: MAIN CHART (Matches the Graph in Image 2) */}
        <div className="bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-stone-100 md:col-span-3">
           <div className="flex items-center justify-between mb-8">
              <div>
                 <h3 className="text-lg font-bold text-stone-800">Symptom Trends</h3>
                 <p className="text-xs font-medium text-stone-400 mt-0.5">Correlation between Sleep, Mood & Anxiety</p>
              </div>
              
              {/* Custom Legend */}
              <div className="flex items-center gap-4">
                 <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-indigo-900" />
                    <span className="text-xs font-bold text-stone-500">Sleep</span>
                 </div>
                 <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-teal-400" />
                    <span className="text-xs font-bold text-stone-500">Anxiety</span>
                 </div>
                 <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-amber-400" />
                    <span className="text-xs font-bold text-stone-500">Mood</span>
                 </div>
              </div>
           </div>

           <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                 <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                       {/* Gradients if we decide to use Area later, kept for reference */}
                       <linearGradient id="colorTeal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2dd4bf" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#2dd4bf" stopOpacity={0}/>
                       </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                       dataKey="dateFormatted" 
                       axisLine={false}
                       tickLine={false}
                       tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 600}}
                       dy={10}
                       interval="preserveStartEnd"
                    />
                    <YAxis 
                       axisLine={false}
                       tickLine={false}
                       tick={{fill: '#cbd5e1', fontSize: 11, fontWeight: 600}}
                       domain={[0, 10]} // Assuming normalized scale roughly 0-10 for all
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{stroke: '#e2e8f0', strokeWidth: 2}} />
                    
                    {/* Sleep: Dark Navy Line (Inventory Health style) */}
                    <Line 
                       type="monotone" 
                       dataKey="sleepHrs" 
                       name="Sleep"
                       stroke="#1e3a8a" // Indigo 900
                       strokeWidth={3}
                       dot={false}
                       activeDot={{r: 6, fill: '#1e3a8a', stroke: '#fff', strokeWidth: 2}}
                    />

                    {/* Anxiety: Teal Line */}
                    <Line 
                       type="monotone" 
                       dataKey="anxietyLevel" 
                       name="Anxiety"
                       stroke="#2dd4bf" // Teal 400
                       strokeWidth={3}
                       dot={false}
                       activeDot={{r: 6, fill: '#2dd4bf', stroke: '#fff', strokeWidth: 2}}
                    />

                    {/* Mood: Amber Line */}
                    <Line 
                       type="monotone" 
                       dataKey="moodLevel" 
                       name="Mood"
                       stroke="#fbbf24" // Amber 400
                       strokeWidth={3}
                       dot={false}
                       activeDot={{r: 6, fill: '#fbbf24', stroke: '#fff', strokeWidth: 2}}
                    />
                 </LineChart>
              </ResponsiveContainer>
           </div>
        </div>

      </div>

      {/* MODERNIZED DATA TABLE */}
      <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-stone-100 overflow-hidden">
        <div className="p-6 border-b border-stone-100 flex items-center justify-between">
           <h3 className="font-bold text-stone-800 flex items-center gap-2">
             <Calendar className="w-5 h-5 text-stone-400" />
             Detailed Logs
           </h3>
           <button className="text-xs font-bold text-teal-600 hover:text-teal-700 bg-teal-50 px-3 py-1.5 rounded-full transition-colors">
              Export Data
           </button>
        </div>
        
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-stone-100">
                <th className="py-4 px-6 text-[11px] font-bold text-stone-400 uppercase tracking-wider">Date</th>
                <th className="py-4 px-6 text-[11px] font-bold text-stone-400 uppercase tracking-wider">Dose</th>
                <th className="py-4 px-6 text-[11px] font-bold text-stone-400 uppercase tracking-wider">Sleep</th>
                <th className="py-4 px-6 text-[11px] font-bold text-stone-400 uppercase tracking-wider text-center">Status</th>
                <th className="py-4 px-6 text-[11px] font-bold text-stone-400 uppercase tracking-wider text-right">Vitals</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {sortedLogs.slice().reverse().map((log, i) => (
                <tr key={i} className="hover:bg-stone-50/50 transition-colors group">
                  <td className="py-4 px-6 whitespace-nowrap">
                    <div className="flex flex-col">
                       <span className="text-sm font-bold text-stone-800">
                         {new Date(log.date).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                       </span>
                       <span className="text-xs text-stone-400">
                         {new Date(log.date).toLocaleDateString(undefined, {weekday: 'long'})}
                       </span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="inline-flex items-center gap-1.5 bg-stone-100 text-stone-600 px-2.5 py-1 rounded-lg text-xs font-bold">
                       <Pill className="w-3 h-3" /> {log.lDose}mg
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                       <span className="text-sm font-bold text-indigo-900">{log.sleepHrs}h</span>
                       {log.napMinutes ? <span className="text-xs text-stone-400">+{log.napMinutes}m nap</span> : ''}
                    </div>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <div className="flex items-center justify-center gap-2">
                       {/* Mini Dots for Mood/Anx */}
                       <div className={`w-2 h-2 rounded-full ${log.anxietyLevel > 5 ? 'bg-teal-400' : 'bg-teal-200'}`} title={`Anxiety: ${log.anxietyLevel}`} />
                       <div className={`w-2 h-2 rounded-full ${log.moodLevel > 5 ? 'bg-amber-400' : 'bg-amber-200'}`} title={`Mood: ${log.moodLevel}`} />
                       {(log.brainZapLevel || 0) > 0 && <div className="w-2 h-2 rounded-full bg-red-400" title="Brain Zaps" />}
                    </div>
                  </td>
                  <td className="py-4 px-6 text-right">
                    {log.bpMorningSys ? (
                        <span className="text-xs font-mono font-bold text-stone-500 bg-stone-50 px-2 py-1 rounded border border-stone-100">
                           {log.bpMorningSys}/{log.bpMorningDia} <span className="text-stone-300">|</span> {log.bpMorningPulse}
                        </span>
                    ) : <span className="text-stone-300 text-xs">-</span>}
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