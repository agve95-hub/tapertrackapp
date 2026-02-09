

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
import { Calendar, FileText, ChevronDown, Activity, TrendingDown, TrendingUp, Minus, Pill, Moon, Zap, Smile, HeartPulse, CloudRain, BatteryCharging, Flame, ChevronRight, ChevronUp, Download } from 'lucide-react';

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

       return {
         date: dateKey,
         dateFormatted: viewMode === 'monthly' 
            ? new Date(dateKey).toLocaleDateString(undefined, { month: 'short' })
            : new Date(dateKey).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
         anxietyLevel: avg('anxietyLevel'),
         moodLevel: avg('moodLevel'),
         depressionLevel: avg('depressionLevel'),
         sleepHrs: avg('sleepHrs'),
         lDose: avg('lDose'),
       };
    });
  }, [logs, viewMode, sortedLogs]);

  const downloadCSV = () => {
    if (logs.length === 0) return;

    // Headers
    const headers = ['Date', 'Dose (mg)', 'Sleep (hrs)', 'Anxiety (1-10)', 'Mood (1-10)', 'Depression (1-10)', 'Notes'];
    
    // Rows
    const rows = sortedLogs.map(log => [
        log.date,
        log.lDose,
        log.sleepHrs,
        log.anxietyLevel,
        log.moodLevel,
        log.depressionLevel || '',
        `"${(log.dailyNote || '').replace(/"/g, '""')}"` // Escape quotes in notes
    ]);

    const csvContent = [
        headers.join(','),
        ...rows.map(e => e.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `taper_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-xl shadow-xl border border-stone-100 text-xs z-50">
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

  const RatingBar = ({ label, value, colorClass, icon: Icon }: any) => (
      <div className="space-y-1">
          <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-stone-500 flex items-center gap-1.5"><Icon className="w-3 h-3" /> {label}</span>
              <span className={`font-bold ${colorClass.replace('bg-', 'text-')}`}>{value}/10</span>
          </div>
          <div className="h-1.5 w-full bg-stone-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${colorClass}`} style={{ width: `${(value / 10) * 100}%` }}></div>
          </div>
      </div>
  );

  const StatBadge = ({ icon: Icon, label, value, sub }: any) => (
     <div className="flex items-center gap-3 bg-white border border-stone-100 p-3 rounded-xl shadow-sm">
        <div className="w-8 h-8 rounded-full bg-stone-50 flex items-center justify-center text-stone-400">
           <Icon className="w-4 h-4" />
        </div>
        <div>
           <div className="text-sm font-bold text-stone-800">{value}</div>
           <div className="text-[10px] text-stone-400 font-bold uppercase">{label}</div>
           {sub && <div className="text-[10px] text-stone-300">{sub}</div>}
        </div>
     </div>
  );

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
                <Download className="w-4 h-4" /> Export Report
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* CARD 1: CURRENT STATUS */}
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
            </div>
        </div>

        {/* CARD 2: MAIN CHART */}
        <div className="bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-stone-100 md:col-span-2">
           <div className="flex items-center justify-between mb-4">
              <div>
                 <h3 className="text-lg font-bold text-stone-800">Symptom Trends</h3>
                 <p className="text-xs font-medium text-stone-400 mt-0.5">Correlation between Sleep, Anxiety, Mood & Depression</p>
              </div>
           </div>

           <div className="h-[250px] w-full">
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
                       domain={[0, 12]}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend 
                      iconType="circle" 
                      iconSize={8}
                      wrapperStyle={{paddingTop: '20px', fontSize: '11px', fontWeight: 'bold'}}
                    />
                    
                    <Line type="monotone" dataKey="sleepHrs" name="Sleep (hrs)" stroke="#3b82f6" strokeWidth={3} dot={false} strokeDasharray="4 4" />
                    <Line type="monotone" dataKey="anxietyLevel" name="Anxiety (1-10)" stroke="#14b8a6" strokeWidth={3} dot={false} />
                    <Line type="monotone" dataKey="moodLevel" name="Mood (1-10)" stroke="#f59e0b" strokeWidth={3} dot={false} />
                    <Line type="monotone" dataKey="depressionLevel" name="Depression (1-10)" stroke="#64748b" strokeWidth={3} dot={false} />
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
                <th className="py-4 px-2 text-[11px] font-bold text-stone-400 uppercase tracking-wider">Sleep</th>
                <th className="py-4 px-2 text-[11px] font-bold text-stone-400 uppercase tracking-wider hidden sm:table-cell">Wellness</th>
                <th className="py-4 px-6 text-[11px] font-bold text-stone-400 uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {sortedLogs.slice().reverse().map((log, i) => {
                 const isOpen = expandedRow === i;
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
                        <span className="text-sm font-bold text-stone-700">{log.sleepHrs}h</span>
                      </td>
                      <td className="py-4 px-2 hidden sm:table-cell">
                        <div className="flex gap-1">
                           <div className={`w-2 h-2 rounded-full ${log.anxietyLevel > 7 ? 'bg-red-400' : 'bg-teal-400'}`} title="Anxiety" />
                           <div className={`w-2 h-2 rounded-full ${log.moodLevel < 4 ? 'bg-orange-400' : 'bg-amber-400'}`} title="Mood" />
                           <div className={`w-2 h-2 rounded-full ${log.depressionLevel && log.depressionLevel > 5 ? 'bg-slate-400' : 'bg-slate-200'}`} title="Depression" />
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right">
                         <span className="text-xs font-bold text-indigo-600 hover:underline">
                            {isOpen ? 'Close' : 'View Details'}
                         </span>
                      </td>
                    </tr>
                    
                    {/* EXPANDED DETAILS */}
                    {isOpen && (
                       <tr>
                          <td colSpan={6} className="p-0 border-b border-stone-100">
                             <div className="bg-stone-50/50 p-6 md:p-8 animate-in fade-in slide-in-from-top-2">
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                   
                                   {/* Column 1: Vitals & Physical */}
                                   <div className="space-y-6">
                                      <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider flex items-center gap-2">
                                        <HeartPulse className="w-4 h-4" /> Vitals & Physical
                                      </h4>
                                      <div className="grid grid-cols-2 gap-4">
                                          <div className="bg-white p-4 rounded-xl border border-stone-100 shadow-sm">
                                             <div className="text-[10px] text-stone-400 font-bold uppercase mb-2">Morning BP</div>
                                             {log.bpMorningSys ? (
                                                <div className="text-xl font-mono font-bold text-stone-800">
                                                   {log.bpMorningSys}/{log.bpMorningDia} <span className="text-sm text-stone-400 font-sans ml-1">{log.bpMorningPulse}bpm</span>
                                                </div>
                                             ) : <span className="text-stone-300">-</span>}
                                          </div>
                                          <div className="bg-white p-4 rounded-xl border border-stone-100 shadow-sm">
                                             <div className="text-[10px] text-stone-400 font-bold uppercase mb-2">Night BP</div>
                                             {log.bpNightSys ? (
                                                <div className="text-xl font-mono font-bold text-stone-800">
                                                   {log.bpNightSys}/{log.bpNightDia} <span className="text-sm text-stone-400 font-sans ml-1">{log.bpNightPulse}bpm</span>
                                                </div>
                                             ) : <span className="text-stone-300">-</span>}
                                          </div>
                                      </div>
                                      
                                      <div className="bg-white p-4 rounded-xl border border-stone-100 shadow-sm space-y-3">
                                          <div className="flex justify-between items-center">
                                             <span className="text-xs font-bold text-stone-500">Total Sleep</span>
                                             <span className="text-sm font-bold text-indigo-900">{log.sleepHrs} hrs</span>
                                          </div>
                                          <div className="flex justify-between items-center border-t border-stone-50 pt-3">
                                             <span className="text-xs font-bold text-stone-500">Nap Duration</span>
                                             <span className="text-sm font-bold text-stone-700">{log.napMinutes || 0} mins</span>
                                          </div>
                                      </div>
                                   </div>

                                   {/* Column 2: Mental & Habits */}
                                   <div className="space-y-6">
                                      <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider flex items-center gap-2">
                                        <Activity className="w-4 h-4" /> Mental & Habits
                                      </h4>
                                      <div className="bg-white p-5 rounded-xl border border-stone-100 shadow-sm space-y-5">
                                          <RatingBar label="Anxiety" value={log.anxietyLevel} colorClass="bg-teal-400" icon={Zap} />
                                          <RatingBar label="Mood" value={log.moodLevel} colorClass="bg-amber-400" icon={Smile} />
                                          <RatingBar label="Depression" value={log.depressionLevel || 1} colorClass="bg-slate-400" icon={CloudRain} />
                                          <RatingBar label="Smoking / Cravings" value={log.smokingLevel || 1} colorClass="bg-orange-500" icon={Flame} />
                                      </div>
                                      <div className="flex gap-2">
                                         <div className={`flex-1 p-3 rounded-lg border text-center ${log.brainZapLevel && log.brainZapLevel > 0 ? 'bg-blue-50 border-blue-100' : 'bg-white border-stone-100'}`}>
                                            <div className="text-[10px] text-stone-400 font-bold uppercase">Brain Zaps</div>
                                            <div className="font-bold text-stone-800 mt-1">
                                               {['None', 'Mild', 'Mod', 'Severe'][log.brainZapLevel || 0]}
                                            </div>
                                         </div>
                                      </div>
                                   </div>

                                   {/* Column 3: Journal */}
                                   <div className="space-y-6">
                                      <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider flex items-center gap-2">
                                        <FileText className="w-4 h-4" /> Daily Notes
                                      </h4>
                                      <div className="bg-white p-5 rounded-xl border border-stone-100 shadow-sm h-full min-h-[200px]">
                                         {log.dailyNote ? (
                                            <p className="text-sm text-stone-600 leading-relaxed whitespace-pre-wrap font-medium">
                                               {log.dailyNote}
                                            </p>
                                         ) : (
                                            <p className="text-stone-300 text-sm italic">No notes recorded for this day.</p>
                                         )}
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