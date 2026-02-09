

import React, { useMemo, useState } from 'react';
import { DailyLogEntry } from '../types';
import { TRACKING_FACTORS } from '../constants';
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
  Legend,
  BarChart,
  Bar,
  ReferenceLine
} from 'recharts';
import { Calendar, FileText, ChevronDown, Activity, TrendingDown, TrendingUp, Minus, Pill, Moon, Zap, Smile, HeartPulse, CloudRain, BatteryCharging, Flame, ChevronRight, ChevronUp, Download, Sparkles, AlertCircle, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface HistoryAnalyticsProps {
  logs: DailyLogEntry[];
}

type ViewMode = 'daily' | 'weekly' | 'monthly';

const HistoryAnalytics: React.FC<HistoryAnalyticsProps> = ({ logs }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('daily');
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  
  const sortedLogs = useMemo(() => {
    return [...logs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [logs]);

  // --- METRIC CALCULATION ---
  // Calculates a 0-100 score based on Mood (High is good), Energy (High is good), Anxiety (Low is good), Depression (Low is good)
  const calculateWellnessScore = (log: DailyLogEntry) => {
    const mood = log.moodLevel || 5;
    const energy = log.energyLevel || 5;
    const anxiety = log.anxietyLevel || 5;
    const depression = log.depressionLevel || 1;
    
    // Inverse negative stats to make them positive contributors (10 - val)
    // Formula: (Mood + Energy + (10 - Anxiety) + (10 - Depression)) / 4 * 10
    const rawScore = (mood + energy + (10 - anxiety) + (10 - depression)) / 4;
    return Math.round(rawScore * 10);
  };

  const stats = useMemo(() => {
    if (logs.length === 0) return null;
    
    const last7 = sortedLogs.slice(-7);
    const avg = (items: DailyLogEntry[], key: keyof DailyLogEntry) => {
      const valid = items.filter(i => typeof i[key] === 'number');
      if (valid.length === 0) return 0;
      return valid.reduce((sum, item) => sum + (item[key] as number), 0) / valid.length;
    };

    const current = sortedLogs[sortedLogs.length - 1];
    
    // Calculate insights (correlations)
    const correlations = TRACKING_FACTORS.map(factor => {
        const withFactor = logs.filter(l => (l.factors || []).includes(factor.id));
        const withoutFactor = logs.filter(l => !(l.factors || []).includes(factor.id));
        
        if (withFactor.length < 3 || withoutFactor.length < 3) return null; // Need data

        const scoreWith = withFactor.reduce((acc, l) => acc + calculateWellnessScore(l), 0) / withFactor.length;
        const scoreWithout = withoutFactor.reduce((acc, l) => acc + calculateWellnessScore(l), 0) / withoutFactor.length;
        
        const diff = scoreWith - scoreWithout;
        
        return {
            factor,
            diff,
            isSignificant: Math.abs(diff) > 5
        };
    }).filter(c => c && c.isSignificant).sort((a, b) => Math.abs(b!.diff) - Math.abs(a!.diff));

    return {
      currentDose: current.lDose,
      avgSleep: avg(last7, 'sleepHrs'),
      wellnessScore: calculateWellnessScore(current),
      wellnessTrend: sortedLogs.map(l => ({ date: l.date, score: calculateWellnessScore(l) })),
      correlations: correlations.slice(0, 3) // Top 3 insights
    };
  }, [logs, sortedLogs]);

  const chartData = useMemo(() => {
    if (logs.length === 0) return [];
    
    const formatEntry = (l: DailyLogEntry) => ({
      ...l,
      dateFormatted: new Date(l.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      sleepHrs: l.sleepHrs || 0,
      anxietyLevel: l.anxietyLevel || 0,
      moodLevel: l.moodLevel || 0,
      depressionLevel: l.depressionLevel || 0,
      energyLevel: l.energyLevel || 5,
      wellnessScore: calculateWellnessScore(l)
    });

    if (viewMode === 'daily') {
       return sortedLogs.map(formatEntry);
    }

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

       const avgScore = group.reduce((acc, l) => acc + calculateWellnessScore(l), 0) / group.length;

       return {
         date: dateKey,
         dateFormatted: viewMode === 'monthly' 
            ? new Date(dateKey).toLocaleDateString(undefined, { month: 'short' })
            : new Date(dateKey).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
         anxietyLevel: avg('anxietyLevel'),
         moodLevel: avg('moodLevel'),
         depressionLevel: avg('depressionLevel'),
         energyLevel: avg('energyLevel'),
         sleepHrs: avg('sleepHrs'),
         lDose: avg('lDose'),
         wellnessScore: Math.round(avgScore)
       };
    });
  }, [logs, viewMode, sortedLogs]);

  // Heatmap Data Builder (Last 30 days grid)
  const heatmapData = useMemo(() => {
     const today = new Date();
     const days = [];
     for(let i=29; i>=0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const log = logs.find(l => l.date === dateStr);
        days.push({
            date: dateStr,
            dayName: d.toLocaleDateString(undefined, {weekday: 'narrow'}),
            score: log ? calculateWellnessScore(log) : null
        });
     }
     return days;
  }, [logs]);

  const downloadCSV = () => {
    if (logs.length === 0) return;
    const headers = ['Date', 'Dose', 'Wellness Score', 'Energy', 'Sleep', 'Anxiety', 'Mood', 'Factors', 'Notes'];
    const rows = sortedLogs.map(log => [
        log.date,
        log.lDose,
        calculateWellnessScore(log),
        log.energyLevel || 5,
        log.sleepHrs,
        log.anxietyLevel,
        log.moodLevel,
        `"${(log.factors || []).join(', ')}"`,
        `"${(log.dailyNote || '').replace(/"/g, '""')}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `wellness_report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 backdrop-blur-sm p-4 rounded-xl shadow-xl border border-stone-100 text-xs z-50">
          <p className="font-bold text-stone-900 mb-3 text-sm">{label}</p>
          <div className="space-y-2">
             {payload.map((entry: any, index: number) => (
                <div key={index} className="flex items-center gap-3 justify-between min-w-[140px]">
                  <div className="flex items-center gap-2">
                     <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                     <span className="text-stone-500 font-medium capitalize">{entry.name}</span>
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-stone-900 tracking-tight">Analytics</h2>
          <p className="text-stone-500 text-sm font-medium">Overview of your wellness journey</p>
        </div>
        
        <div className="flex items-center gap-2">
            <button 
                onClick={downloadCSV}
                className="flex items-center gap-2 bg-white text-indigo-600 border border-indigo-100 px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-indigo-50 transition-colors shadow-sm"
            >
                <Download className="w-4 h-4" /> Export
            </button>
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
      </div>

      {/* DASHBOARD GRID */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* HERO CARD: WELLNESS SCORE */}
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 p-6 rounded-3xl shadow-lg shadow-indigo-200 md:col-span-2 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white blur-3xl opacity-10 -mr-16 -mt-16 pointer-events-none" />
            
            <div className="flex justify-between items-start relative z-10">
                <div>
                    <h3 className="text-indigo-100 font-bold text-sm flex items-center gap-2">
                        <Sparkles className="w-4 h-4" /> Wellness Score
                    </h3>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-5xl font-black tracking-tighter">{stats?.wellnessScore}</span>
                        <span className="text-indigo-200 font-bold">/100</span>
                    </div>
                </div>
                <div className="text-right">
                    <div className="bg-white/20 backdrop-blur-md rounded-lg px-3 py-1 text-xs font-bold inline-flex items-center gap-1">
                        <Pill className="w-3 h-3" /> {stats?.currentDose}mg
                    </div>
                </div>
            </div>

            <div className="mt-8 h-24 w-full -mx-2 -mb-2">
                 <ResponsiveContainer width="100%" height="100%">
                   <AreaChart data={stats?.wellnessTrend.slice(-14)}>
                     <defs>
                       <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                         <stop offset="5%" stopColor="#fff" stopOpacity={0.4}/>
                         <stop offset="95%" stopColor="#fff" stopOpacity={0}/>
                       </linearGradient>
                     </defs>
                     <Area type="monotone" dataKey="score" stroke="#fff" strokeWidth={3} fill="url(#scoreGradient)" />
                   </AreaChart>
                 </ResponsiveContainer>
            </div>
        </div>

        {/* CARD: CALENDAR HEATMAP */}
        <div className="bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-stone-100 md:col-span-1 flex flex-col">
            <h3 className="text-stone-800 font-bold text-sm mb-4">Consistency</h3>
            <div className="flex-1 grid grid-cols-7 gap-1.5 content-start">
                {heatmapData.map((d, i) => (
                    <div 
                        key={i} 
                        className={`aspect-square rounded-md transition-all hover:scale-110 ${
                            d.score === null ? 'bg-stone-100' :
                            d.score > 80 ? 'bg-emerald-400' :
                            d.score > 60 ? 'bg-emerald-300' :
                            d.score > 40 ? 'bg-yellow-300' :
                            'bg-red-300'
                        }`}
                        title={`${d.date}: ${d.score ?? 'No Log'}`}
                    />
                ))}
            </div>
            <div className="mt-3 flex justify-between text-[10px] text-stone-400 font-bold uppercase">
                <span>30 Days Ago</span>
                <span>Today</span>
            </div>
        </div>

        {/* CARD: INSIGHTS */}
        <div className="bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-stone-100 md:col-span-1 overflow-hidden">
            <h3 className="text-stone-800 font-bold text-sm mb-4 flex items-center gap-2">
                <Activity className="w-4 h-4 text-orange-500" /> Insights
            </h3>
            <div className="space-y-3">
                {stats?.correlations && stats.correlations.length > 0 ? (
                    stats.correlations.map((c, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 bg-stone-50 rounded-xl border border-stone-100">
                             <div className={`p-1.5 rounded-lg shrink-0 ${c!.diff > 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                                 {c!.diff > 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                             </div>
                             <div>
                                 <div className="text-xs text-stone-500 leading-tight">
                                    <span className="font-bold text-stone-800">{c!.factor.label}</span> makes you feel <span className={`font-bold ${c!.diff > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{Math.abs(Math.round(c!.diff))}% {c!.diff > 0 ? 'better' : 'worse'}</span>.
                                 </div>
                             </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-4 text-xs text-stone-400">
                        Log more factors to see what affects your mood.
                    </div>
                )}
            </div>
        </div>

        {/* CARD: MAIN CHART */}
        <div className="bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-stone-100 md:col-span-4">
           <div className="flex items-center justify-between mb-4">
              <div>
                 <h3 className="text-lg font-bold text-stone-800">Symptom Trends</h3>
                 <p className="text-xs font-medium text-stone-400 mt-0.5">Correlation between Sleep, Anxiety, Mood & Energy</p>
              </div>
           </div>

           <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                 <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                       dataKey="dateFormatted" 
                       axisLine={false}
                       tickLine={false}
                       tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 600}}
                       dy={10}
                    />
                    <YAxis 
                       axisLine={false}
                       tickLine={false}
                       tick={{fill: '#cbd5e1', fontSize: 11, fontWeight: 600}}
                       domain={[0, 10]}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend 
                      iconType="circle" 
                      iconSize={8}
                      wrapperStyle={{paddingTop: '20px', fontSize: '11px', fontWeight: 'bold'}}
                    />
                    
                    <Line type="monotone" dataKey="sleepHrs" name="Sleep (hrs)" stroke="#3b82f6" strokeWidth={2} dot={false} strokeDasharray="4 4" />
                    <Line type="monotone" dataKey="anxietyLevel" name="Anxiety" stroke="#14b8a6" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="moodLevel" name="Mood" stroke="#f59e0b" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="energyLevel" name="Energy" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                 </LineChart>
              </ResponsiveContainer>
           </div>
        </div>

      </div>

      {/* DETAILED LOGS TABLE */}
      <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-stone-100 overflow-hidden">
        <div className="p-6 border-b border-stone-100 flex items-center justify-between">
           <h3 className="font-bold text-stone-800 flex items-center gap-2 text-lg">
             <FileText className="w-5 h-5 text-stone-400" />
             Detailed Logs
           </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-100">
                <th className="py-4 px-6 text-[11px] font-bold text-stone-400 uppercase tracking-wider w-[40px]"></th>
                <th className="py-4 px-2 text-[11px] font-bold text-stone-400 uppercase tracking-wider">Date</th>
                <th className="py-4 px-2 text-[11px] font-bold text-stone-400 uppercase tracking-wider">Dose</th>
                <th className="py-4 px-2 text-[11px] font-bold text-stone-400 uppercase tracking-wider">Score</th>
                <th className="py-4 px-2 text-[11px] font-bold text-stone-400 uppercase tracking-wider hidden sm:table-cell">Factors</th>
                <th className="py-4 px-6 text-[11px] font-bold text-stone-400 uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {sortedLogs.slice().reverse().map((log, i) => {
                 const isOpen = expandedRow === i;
                 const score = calculateWellnessScore(log);
                 return (
                  <React.Fragment key={i}>
                    <tr 
                      className={`hover:bg-stone-50/50 transition-colors cursor-pointer ${isOpen ? 'bg-stone-50/80' : ''}`}
                      onClick={() => setExpandedRow(isOpen ? null : i)}
                    >
                      <td className="py-4 px-6 text-stone-300">
                         {isOpen ? <ChevronUp className="w-4 h-4 text-indigo-500" /> : <ChevronRight className="w-4 h-4" />}
                      </td>
                      <td className="py-4 px-2">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-stone-800">
                            {new Date(log.date).toLocaleDateString(undefined, {day: 'numeric', month: 'short'})}
                          </span>
                          <span className="text-[10px] text-stone-400 font-bold uppercase">
                            {new Date(log.date).toLocaleDateString(undefined, {weekday: 'short'})}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-2">
                        <span className="inline-flex items-center gap-1.5 bg-stone-100 text-stone-600 px-2.5 py-1 rounded-full text-xs font-bold">
                          {log.lDose}mg
                        </span>
                      </td>
                      <td className="py-4 px-2">
                        <span className={`text-sm font-bold ${score > 70 ? 'text-emerald-600' : score < 40 ? 'text-red-500' : 'text-stone-700'}`}>
                            {score}
                        </span>
                      </td>
                      <td className="py-4 px-2 hidden sm:table-cell">
                        <div className="flex gap-1 flex-wrap">
                           {log.factors && log.factors.slice(0, 3).map(f => (
                               <span key={f} className="text-[10px] bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded capitalize">
                                   {TRACKING_FACTORS.find(tf => tf.id === f)?.label || f}
                               </span>
                           ))}
                           {log.factors && log.factors.length > 3 && (
                               <span className="text-[10px] text-stone-400">+{log.factors.length - 3}</span>
                           )}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right">
                         <span className="text-xs font-bold text-indigo-600 hover:underline">
                            {isOpen ? 'Close' : 'View'}
                         </span>
                      </td>
                    </tr>
                    
                    {/* EXPANDED DETAILS */}
                    {isOpen && (
                       <tr>
                          <td colSpan={6} className="p-0 border-b border-stone-100">
                             <div className="bg-stone-50/50 p-6 md:p-8 animate-in fade-in slide-in-from-top-2">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                   
                                   {/* Column 1: Metrics */}
                                   <div className="space-y-4">
                                      <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider">Metrics</h4>
                                      <div className="grid grid-cols-2 gap-3">
                                          <div className="bg-white p-3 rounded-xl border border-stone-100">
                                              <span className="text-[10px] text-stone-400 font-bold uppercase block">Sleep</span>
                                              <span className="text-lg font-bold text-stone-800">{log.sleepHrs}h</span>
                                          </div>
                                          <div className="bg-white p-3 rounded-xl border border-stone-100">
                                              <span className="text-[10px] text-stone-400 font-bold uppercase block">Energy</span>
                                              <span className="text-lg font-bold text-stone-800">{log.energyLevel || 5}/10</span>
                                          </div>
                                          <div className="bg-white p-3 rounded-xl border border-stone-100">
                                              <span className="text-[10px] text-stone-400 font-bold uppercase block">Anxiety</span>
                                              <span className="text-lg font-bold text-stone-800">{log.anxietyLevel}/10</span>
                                          </div>
                                          <div className="bg-white p-3 rounded-xl border border-stone-100">
                                              <span className="text-[10px] text-stone-400 font-bold uppercase block">Mood</span>
                                              <span className="text-lg font-bold text-stone-800">{log.moodLevel}/10</span>
                                          </div>
                                      </div>
                                   </div>

                                   {/* Column 2: Journal & Factors */}
                                   <div className="space-y-4">
                                      <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider">Notes & Factors</h4>
                                      <div className="bg-white p-4 rounded-xl border border-stone-100 shadow-sm h-full">
                                         {log.factors && log.factors.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mb-4">
                                                {log.factors.map(f => (
                                                    <span key={f} className="text-xs font-bold bg-indigo-50 text-indigo-700 px-2 py-1 rounded-lg">
                                                        {TRACKING_FACTORS.find(tf => tf.id === f)?.label || f}
                                                    </span>
                                                ))}
                                            </div>
                                         )}
                                         <p className="text-sm text-stone-600 leading-relaxed whitespace-pre-wrap font-medium">
                                            {log.dailyNote || "No written notes."}
                                         </p>
                                      </div>
                                   </div>

                                </div>
                             </div>
                          </td>
                       </tr>
                    )}
                  </React.Fragment>
                 );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default HistoryAnalytics;