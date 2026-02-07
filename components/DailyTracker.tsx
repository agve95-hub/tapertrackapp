import React, { useState, useEffect } from 'react';
import { DAILY_SCHEDULE, TAPER_SCHEDULE } from '../constants';
import { DailyLogEntry } from '../types';
import { Check, Clock, Sun, Moon, Sunrise, Sunset, Activity, ChevronDown, ChevronUp, AlertCircle, Zap, CloudRain, BatteryCharging, PenLine, Smile, Frown, Meh, MoreHorizontal, HeartPulse } from 'lucide-react';

interface DailyTrackerProps {
  currentDate: string;
  logData: DailyLogEntry | undefined;
  onUpdateLog: (data: DailyLogEntry) => void;
}

// Helper: Custom Premium Slider
const TouchSlider = ({ 
  value, 
  onChange, 
  min, 
  max, 
  step = 1, 
  label, 
  icon: Icon, 
  colorClass, 
  valueSuffix = '' 
}: any) => {
  const percentage = ((value - min) / (max - min)) * 100;
  
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-end">
        <label className="flex items-center gap-2 text-sm font-bold text-stone-700">
          <Icon className={`w-4 h-4 ${colorClass}`} /> {label}
        </label>
        <span className="text-sm font-bold text-stone-800 tabular-nums bg-white px-2 py-0.5 rounded shadow-sm border border-stone-100">
          {value}{valueSuffix}
        </span>
      </div>
      <div className="relative w-full h-8 flex items-center group">
        <div className="absolute w-full h-2 bg-stone-100 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-150 ${colorClass.replace('text-', 'bg-')}`} 
            style={{ width: `${percentage}%` }}
          />
        </div>
        <input 
          type="range" 
          min={min} max={max} step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="absolute w-full h-full opacity-0 cursor-pointer z-10"
        />
        {/* Thumb visual */}
        <div 
          className="w-5 h-5 bg-white border border-stone-200 rounded-full shadow-md absolute pointer-events-none transition-all duration-150 flex items-center justify-center"
          style={{ left: `calc(${percentage}% - 10px)` }}
        >
          <div className={`w-1.5 h-1.5 rounded-full ${colorClass.replace('text-', 'bg-')}`} />
        </div>
      </div>
    </div>
  );
};

const DailyTracker: React.FC<DailyTrackerProps> = ({ currentDate, logData, onUpdateLog }) => {
  // Determine current time period for auto-focus
  const getCurrentPeriodId = () => {
    const hour = new Date().getHours();
    if (hour < 11) return 'morning_0800';
    if (hour < 14) return 'midday_1200';
    if (hour < 17) return 'afternoon_1500';
    if (hour < 21) return 'evening_2000';
    return 'night_bedtime';
  };

  const [formData, setFormData] = useState<DailyLogEntry>(() => {
    // If we have passed data (either existing or carried over from App.tsx), use it
    if (logData) return logData;
    
    // Fallback default
    return {
      date: currentDate,
      completedItems: {},
      lDose: 5.0,
      bDose: '',
      sleepHrs: 7,
      napMinutes: 0,
      anxietyLevel: 5,
      moodLevel: 5,
      depressionLevel: 1,
      brainZapLevel: 0,
      smokingLevel: 5,
      dailyNote: ''
    };
  });

  const [expandedNotes, setExpandedNotes] = useState<string | null>(null);
  
  // Update local state when prop changes (e.g. date switch)
  useEffect(() => {
    if (logData) {
      setFormData(prev => ({
        ...prev,
        ...logData,
        napMinutes: logData.napMinutes ?? 0,
        depressionLevel: logData.depressionLevel ?? 1,
        brainZapLevel: logData.brainZapLevel ?? 0,
        dailyNote: logData.dailyNote ?? '',
      }));
    } else {
       // Reset logic handled by App.tsx passed via logData mostly, but safety net:
       setFormData({
        date: currentDate,
        completedItems: {},
        lDose: 5.0,
        bDose: '',
        sleepHrs: 7,
        napMinutes: 0,
        anxietyLevel: 5,
        moodLevel: 5,
        depressionLevel: 1,
        brainZapLevel: 0,
        smokingLevel: 5,
        dailyNote: ''
      });
    }
  }, [logData, currentDate]);

  const handleToggleItem = (itemId: string, subItem: string) => {
    const key = `${itemId}-${subItem}`;
    const newCompleted = {
      ...formData.completedItems,
      [key]: !formData.completedItems[key]
    };
    const updated = { ...formData, completedItems: newCompleted };
    setFormData(updated);
    onUpdateLog(updated);
  };

  const handleChange = (field: keyof DailyLogEntry, value: any) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    onUpdateLog(updated);
  };

  const handleBPChange = (period: 'Morning' | 'Night', type: 'Sys' | 'Dia' | 'Pulse', value: string) => {
    const numValue = parseInt(value) || 0;
    const fieldName = `bp${period}${type}` as keyof DailyLogEntry;
    handleChange(fieldName, numValue);
  };

  const handleIrregularChange = (period: 'Morning' | 'Night') => {
    const fieldName = `bp${period}Irregular` as keyof DailyLogEntry;
    // @ts-ignore
    const currentValue = formData[fieldName] || false;
    handleChange(fieldName, !currentValue);
  };

  const getProgress = () => {
    let total = 0;
    let completed = 0;
    DAILY_SCHEDULE.forEach(schedule => {
      schedule.items.forEach(item => {
        total++;
        if (formData.completedItems[`${schedule.id}-${item}`]) {
          completed++;
        }
      });
    });
    return Math.round((completed / total) * 100);
  };

  const getTimeIcon = (label: string) => {
    switch (label.toLowerCase()) {
      case 'morning': return <Sunrise className="w-5 h-5 text-amber-500" />;
      case 'midday': return <Sun className="w-5 h-5 text-orange-500" />;
      case 'afternoon': return <Sun className="w-5 h-5 text-orange-400 opacity-80" />;
      case 'evening': return <Sunset className="w-5 h-5 text-indigo-500" />;
      case 'bedtime': return <Moon className="w-5 h-5 text-violet-500" />;
      default: return <Clock className="w-5 h-5 text-stone-400" />;
    }
  };

  const adherence = getProgress();

  return (
    <div className="space-y-8 pb-24">
      
      {/* 1. Hero / Progress Status */}
      <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-stone-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-50 pointer-events-none"></div>
        <div className="flex justify-between items-start mb-6 relative z-10">
          <div>
            <h2 className="text-xl font-bold text-stone-900 tracking-tight">Daily Progress</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Current Dose:</span>
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                {formData.lDose} mg
              </span>
            </div>
          </div>
          <div className="text-right">
             <div className="text-3xl font-black text-stone-800 tabular-nums leading-none">{adherence}%</div>
          </div>
        </div>
        <div className="w-full bg-stone-100 rounded-full h-3 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-700 ease-out shadow-[0_0_10px_rgba(99,102,241,0.4)]" 
            style={{ width: `${adherence}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* 2. Schedule Timeline (Left Column) */}
        <div className="lg:col-span-7 space-y-6">
           <h3 className="text-lg font-bold text-stone-800 flex items-center gap-2">
             <Clock className="w-5 h-5 text-indigo-500" />
             Schedule
           </h3>
           
           <div className="space-y-4">
              {DAILY_SCHEDULE.map((slot) => {
                const isCurrent = slot.id === getCurrentPeriodId() && new Date(currentDate).toDateString() === new Date().toDateString();
                const allDone = slot.items.every(item => formData.completedItems[`${slot.id}-${item}`]);

                return (
                  <div key={slot.id} className={`group relative transition-all duration-300 rounded-2xl border overflow-hidden ${
                    allDone ? 'bg-stone-50/50 border-stone-100 opacity-80' : 
                    isCurrent ? 'bg-white border-indigo-200 ring-4 ring-indigo-50 shadow-lg shadow-indigo-100/50' : 
                    'bg-white border-stone-100 shadow-sm'
                  }`}>
                    
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-stone-50/50">
                      <div className="flex items-center gap-3">
                         <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-colors ${
                            isCurrent ? 'bg-indigo-50 border-indigo-100' : 'bg-white border-stone-100'
                         }`}>
                           {getTimeIcon(slot.label)}
                         </div>
                         <div>
                           <div className="flex items-center gap-2">
                             <div className={`font-bold ${isCurrent ? 'text-indigo-900' : 'text-stone-800'}`}>{slot.label}</div>
                             {isCurrent && <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />}
                           </div>
                           <div className="text-xs text-stone-400 font-medium">{slot.time}</div>
                         </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {slot.conditional && (
                          <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-1 rounded-full font-bold uppercase border border-amber-100">
                            PRN
                          </span>
                        )}
                        {allDone && (
                          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center animate-in zoom-in duration-200">
                            <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="p-4 pt-3">
                       {/* Checklist */}
                       <div className="space-y-2">
                          {slot.items.map((item, idx) => {
                             const isChecked = formData.completedItems[`${slot.id}-${item}`] || false;
                             return (
                               <button
                                 key={idx}
                                 onClick={() => handleToggleItem(slot.id, item)}
                                 className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all duration-200 ${
                                   isChecked 
                                     ? 'bg-stone-50 border-transparent text-stone-400' 
                                     : 'bg-white border-stone-200 hover:border-indigo-300 hover:shadow-sm'
                                 }`}
                               >
                                 <span className={`text-sm font-medium text-left ${isChecked ? 'line-through decoration-stone-300' : 'text-stone-700'}`}>
                                   {item}
                                 </span>
                                 <div className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${
                                   isChecked ? 'bg-stone-300 border-stone-300' : 'bg-white border-stone-300'
                                 }`}>
                                   {isChecked && <Check className="w-3 h-3 text-white" />}
                                 </div>
                               </button>
                             )
                          })}
                       </div>

                       {/* Notes Toggle */}
                       {slot.notes.length > 0 && (
                         <div className="mt-3">
                           <button 
                             onClick={() => setExpandedNotes(expandedNotes === slot.id ? null : slot.id)}
                             className="text-[10px] font-bold text-stone-400 hover:text-indigo-600 flex items-center gap-1 transition-colors uppercase tracking-wider"
                           >
                             <AlertCircle className="w-3 h-3" />
                             {expandedNotes === slot.id ? 'Hide Tips' : 'Tips'}
                           </button>
                           
                           {expandedNotes === slot.id && (
                             <div className="mt-2 bg-indigo-50/50 p-3 rounded-lg border border-indigo-100 animate-in fade-in slide-in-from-top-1 duration-200">
                               <ul className="space-y-1">
                                 {slot.notes.map((note, i) => (
                                   <li key={i} className="text-xs text-indigo-900/70 flex items-start gap-2 leading-relaxed">
                                     <span className="mt-1.5 w-1 h-1 bg-indigo-400 rounded-full flex-shrink-0" />
                                     {note}
                                   </li>
                                 ))}
                               </ul>
                             </div>
                           )}
                         </div>
                       )}

                       {/* BP Entry */}
                       {slot.requiresBP && (
                          <div className="mt-4 pt-4 border-t border-stone-100">
                            <label className="text-xs font-bold text-rose-600 uppercase tracking-wide mb-2 flex items-center gap-2">
                              <HeartPulse className="w-3 h-3" /> BP & Pulse
                            </label>
                            
                            <div className="flex items-center gap-2">
                                <div className="flex-1 relative">
                                  <input 
                                    type="number" 
                                    placeholder="120"
                                    value={slot.id.includes('morning') ? formData.bpMorningSys || '' : formData.bpNightSys || ''}
                                    onChange={(e) => handleBPChange(slot.id.includes('morning') ? 'Morning' : 'Night', 'Sys', e.target.value)}
                                    className="w-full pl-3 pr-2 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm font-bold text-stone-700 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-300 text-center"
                                  />
                                  <div className="text-[9px] text-stone-400 text-center mt-1 font-semibold">SYS</div>
                                </div>
                                <span className="text-stone-300 text-xl font-light">/</span>
                                <div className="flex-1 relative">
                                  <input 
                                    type="number" 
                                    placeholder="80"
                                    value={slot.id.includes('morning') ? formData.bpMorningDia || '' : formData.bpNightDia || ''}
                                    onChange={(e) => handleBPChange(slot.id.includes('morning') ? 'Morning' : 'Night', 'Dia', e.target.value)}
                                    className="w-full pl-3 pr-2 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm font-bold text-stone-700 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-300 text-center"
                                  />
                                  <div className="text-[9px] text-stone-400 text-center mt-1 font-semibold">DIA</div>
                                </div>
                                <div className="w-px h-8 bg-stone-100 mx-1"></div>
                                <div className="flex-1 relative">
                                  <input 
                                    type="number" 
                                    placeholder="60"
                                    value={slot.id.includes('morning') ? formData.bpMorningPulse || '' : formData.bpNightPulse || ''}
                                    onChange={(e) => handleBPChange(slot.id.includes('morning') ? 'Morning' : 'Night', 'Pulse', e.target.value)}
                                    className="w-full pl-3 pr-2 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm font-bold text-stone-700 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-300 text-center"
                                  />
                                  <div className="text-[9px] text-stone-400 text-center mt-1 font-semibold">BPM</div>
                                </div>
                            </div>
                          </div>
                       )}
                    </div>
                  </div>
                );
              })}
           </div>
        </div>

        {/* 3. Daily Check-in Column (Right Column) */}
        <div className="lg:col-span-5">
          <div className="sticky top-24 space-y-6">
            <h3 className="text-lg font-bold text-stone-800 flex items-center gap-2">
               <Activity className="w-5 h-5 text-teal-500" />
               Wellness Check-in
            </h3>
            
            <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-stone-100 p-6 space-y-8">
              
              {/* Dosage Config (Compact) */}
              <div className="bg-stone-50 rounded-xl p-4 border border-stone-100">
                <div className="flex justify-between items-center mb-3">
                   <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">Active Dosage</label>
                   <PenLine className="w-3 h-3 text-stone-400" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-semibold text-stone-400 mb-1 block">Lexapro</label>
                      <select 
                        value={formData.lDose}
                        onChange={(e) => handleChange('lDose', parseFloat(e.target.value))}
                        className="w-full bg-white border border-stone-200 rounded-lg px-2 py-1.5 text-sm font-bold text-stone-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-100"
                      >
                        {TAPER_SCHEDULE.map(step => (
                          <option key={step.weeks} value={typeof step.dose === 'number' ? step.dose : 0}>
                            {step.dose} mg
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-stone-400 mb-1 block">Benzo</label>
                      <input 
                        type="text" 
                        value={formData.bDose}
                        onChange={(e) => handleChange('bDose', e.target.value)}
                        className="w-full bg-white border border-stone-200 rounded-lg px-2 py-1.5 text-sm font-bold text-stone-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 placeholder:font-normal placeholder:text-stone-300"
                        placeholder="0.5mg"
                      />
                    </div>
                </div>
              </div>

              {/* Sliders Section */}
              <div className="space-y-6">
                
                {/* Sleep */}
                <TouchSlider 
                   label="Sleep Duration" 
                   value={formData.sleepHrs} 
                   onChange={(v: number) => handleChange('sleepHrs', v)} 
                   min={0} max={12} step={0.5} 
                   icon={Moon} 
                   colorClass="text-indigo-500"
                   valueSuffix="h"
                />

                <div className="h-px bg-stone-100" />

                {/* Anxiety */}
                <TouchSlider 
                   label="Anxiety" 
                   value={formData.anxietyLevel} 
                   onChange={(v: number) => handleChange('anxietyLevel', v)} 
                   min={1} max={10} 
                   icon={Zap} 
                   colorClass="text-orange-500"
                />

                {/* Depression */}
                <TouchSlider 
                   label="Depression" 
                   value={formData.depressionLevel || 1} 
                   onChange={(v: number) => handleChange('depressionLevel', v)} 
                   min={1} max={10} 
                   icon={CloudRain} 
                   colorClass="text-purple-500"
                />

                {/* Mood */}
                <TouchSlider 
                   label="Overall Mood" 
                   value={formData.moodLevel} 
                   onChange={(v: number) => handleChange('moodLevel', v)} 
                   min={1} max={10} 
                   icon={Smile} 
                   colorClass="text-emerald-500"
                />

                <div className="h-px bg-stone-100" />

                {/* Brain Zaps */}
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-sm font-bold text-stone-700">
                    <BatteryCharging className="w-4 h-4 text-blue-500" /> Brain Zaps
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {['None', 'Mild', 'Mod', 'Severe'].map((label, idx) => {
                      const isSelected = (formData.brainZapLevel || 0) === idx;
                      return (
                        <button
                          key={idx}
                          onClick={() => handleChange('brainZapLevel', idx)}
                          className={`py-2 rounded-lg text-xs font-bold transition-all border ${
                            isSelected
                              ? 'bg-blue-500 text-white border-blue-600 shadow-md shadow-blue-200'
                              : 'bg-white text-stone-500 border-stone-200 hover:border-blue-200'
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="h-px bg-stone-100" />

                {/* Daily Journal */}
                <div className="space-y-2">
                   <label className="flex items-center gap-2 text-sm font-bold text-stone-700">
                      <PenLine className="w-4 h-4 text-stone-400" /> Daily Notes
                   </label>
                   <textarea
                      value={formData.dailyNote || ''}
                      onChange={(e) => handleChange('dailyNote', e.target.value)}
                      placeholder="Symptoms, stressors, food, etc..."
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 min-h-[80px] resize-none"
                   />
                </div>

              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default DailyTracker;