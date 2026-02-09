

import React, { useState, useEffect } from 'react';
import { DAILY_SCHEDULE, TAPER_SCHEDULE, TRACKING_FACTORS } from '../constants';
import { DailyLogEntry, InventoryData } from '../types';
import { Check, Clock, Sun, Moon, Sunrise, Sunset, Activity, AlertCircle, Zap, CloudRain, BatteryCharging, PenLine, Smile, HeartPulse, CheckCircle2, RotateCcw, Flame, Package, Coffee, Wine, Dumbbell, Users, AlertTriangle, Monitor, Flower2, Utensils } from 'lucide-react';

interface DailyTrackerProps {
  currentDate: string;
  logData: DailyLogEntry | undefined;
  onUpdateLog: (data: DailyLogEntry) => void;
  onOpenInventory?: () => void;
  inventory?: InventoryData;
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

const DailyTracker: React.FC<DailyTrackerProps> = ({ currentDate, logData, onUpdateLog, onOpenInventory, inventory }) => {
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
    if (logData) return logData;
    return {
      date: currentDate,
      completedItems: {},
      lDose: 5.0,
      bDose: '',
      sleepHrs: 7,
      napMinutes: 0,
      energyLevel: 5,
      anxietyLevel: 5,
      moodLevel: 5,
      depressionLevel: 1,
      brainZapLevel: 0,
      smokingLevel: 5,
      factors: [],
      dailyNote: '',
      isComplete: false
    };
  });

  const [expandedNotes, setExpandedNotes] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  
  useEffect(() => {
    if (logData) {
      setFormData(prev => ({
        ...prev,
        ...logData,
        napMinutes: logData.napMinutes ?? 0,
        energyLevel: logData.energyLevel ?? 5,
        depressionLevel: logData.depressionLevel ?? 1,
        brainZapLevel: logData.brainZapLevel ?? 0,
        smokingLevel: logData.smokingLevel ?? 5,
        factors: logData.factors ?? [],
        dailyNote: logData.dailyNote ?? '',
        isComplete: logData.isComplete ?? false
      }));
    } else {
       setFormData({
        date: currentDate,
        completedItems: {},
        lDose: 5.0,
        bDose: '',
        sleepHrs: 7,
        napMinutes: 0,
        energyLevel: 5,
        anxietyLevel: 5,
        moodLevel: 5,
        depressionLevel: 1,
        brainZapLevel: 0,
        smokingLevel: 5,
        factors: [],
        dailyNote: '',
        isComplete: false
      });
    }
  }, [logData, currentDate]);

  const handleToggleItem = (itemId: string, subItem: string) => {
    if (formData.isComplete) return; 
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
    if (formData.isComplete) return; 
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    onUpdateLog(updated);
  };

  const toggleFactor = (factorId: string) => {
    if (formData.isComplete) return;
    const currentFactors = formData.factors || [];
    const newFactors = currentFactors.includes(factorId)
      ? currentFactors.filter(f => f !== factorId)
      : [...currentFactors, factorId];
    handleChange('factors', newFactors);
  };

  const handleBPChange = (period: 'Morning' | 'Night', type: 'Sys' | 'Dia' | 'Pulse', value: string) => {
    if (formData.isComplete) return;
    const numValue = parseInt(value) || 0;
    const fieldName = `bp${period}${type}` as keyof DailyLogEntry;
    handleChange(fieldName, numValue);
  };

  const toggleCompleteDay = () => {
    const newStatus = !formData.isComplete;
    const updated = { ...formData, isComplete: newStatus };
    setFormData(updated);
    onUpdateLog(updated);
    
    if (newStatus) {
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 3000);
    }
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

  const getFactorIcon = (id: string) => {
      switch(id) {
          case 'caffeine': return <Coffee className="w-4 h-4" />;
          case 'alcohol': return <Wine className="w-4 h-4" />;
          case 'exercise': return <Dumbbell className="w-4 h-4" />;
          case 'social': return <Users className="w-4 h-4" />;
          case 'outdoors': return <Sun className="w-4 h-4" />;
          case 'meditation': return <Flower2 className="w-4 h-4" />;
          case 'screens': return <Monitor className="w-4 h-4" />;
          case 'stress': return <AlertTriangle className="w-4 h-4" />;
          case 'sugar': return <Utensils className="w-4 h-4" />;
          default: return <Activity className="w-4 h-4" />;
      }
  };

  const adherence = getProgress();
  const daysRemaining = (inventory && formData.lDose > 0) ? Math.floor(inventory.totalMg / formData.lDose) : 0;

  return (
    <div className="space-y-8 pb-24 relative">
      
      {showCelebration && (
         <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
            <div className="bg-white/90 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-teal-100 flex flex-col items-center animate-in zoom-in-95 duration-300">
               <div className="w-16 h-16 bg-teal-50 text-teal-500 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-10 h-10" />
               </div>
               <h2 className="text-xl font-bold text-stone-800">Day Completed!</h2>
               <p className="text-stone-500 text-sm mt-1">Great job tracking your progress today.</p>
               <div className="mt-4 px-4 py-2 bg-stone-50 rounded-lg text-xs font-bold text-stone-500">
                  Inventory updated
               </div>
            </div>
         </div>
      )}

      {/* Hero */}
      <div className={`rounded-3xl p-6 relative overflow-hidden transition-all duration-500 ${
         formData.isComplete 
           ? 'bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-lg shadow-teal-200' 
           : 'bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-stone-100'
      }`}>
        <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl -mr-16 -mt-16 opacity-30 pointer-events-none ${
           formData.isComplete ? 'bg-white' : 'bg-indigo-50'
        }`}></div>
        
        <div className="flex justify-between items-start mb-6 relative z-10">
          <div>
            <h2 className={`text-xl font-bold tracking-tight ${formData.isComplete ? 'text-white' : 'text-stone-900'}`}>
              {formData.isComplete ? "Daily Log Complete" : "Daily Progress"}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs font-semibold uppercase tracking-wide ${formData.isComplete ? 'text-teal-100' : 'text-stone-500'}`}>
                 Current Dose:
              </span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                 formData.isComplete 
                   ? 'bg-white/20 border-white/20 text-white' 
                   : 'text-indigo-600 bg-indigo-50 border-indigo-100'
              }`}>
                {formData.lDose} mg
              </span>
            </div>
          </div>
          <div className="text-right">
             <div className={`text-3xl font-black tabular-nums leading-none ${formData.isComplete ? 'text-white' : 'text-stone-800'}`}>
                {adherence}%
             </div>
          </div>
        </div>
        <div className="w-full bg-black/10 rounded-full h-3 overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-700 ease-out ${
               formData.isComplete ? 'bg-white' : 'bg-gradient-to-r from-indigo-500 to-indigo-600'
            }`}
            style={{ width: `${adherence}%` }}
          />
        </div>
      </div>
      
      {/* Inventory Banner for Mobile */}
      <div className="md:hidden">
          <button 
            onClick={onOpenInventory}
            className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all active:scale-95 ${
               daysRemaining < 7 ? 'bg-amber-50 border-amber-200' : 'bg-white border-stone-200'
            }`}
          >
             <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${daysRemaining < 7 ? 'bg-amber-100 text-amber-600' : 'bg-stone-100 text-stone-500'}`}>
                   <Package className="w-4 h-4" />
                </div>
                <div className="text-left">
                   <div className={`text-xs font-bold uppercase ${daysRemaining < 7 ? 'text-amber-800' : 'text-stone-500'}`}>
                      Estimated Supply
                   </div>
                   <div className={`text-sm font-bold ${daysRemaining < 7 ? 'text-amber-900' : 'text-stone-800'}`}>
                      {daysRemaining} Days Remaining
                   </div>
                </div>
             </div>
             <div className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg">
                Manage
             </div>
          </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Schedule */}
        <div className={`lg:col-span-7 space-y-6 ${formData.isComplete ? 'opacity-80 grayscale-[0.3] pointer-events-none' : ''}`}>
           <h3 className="text-lg font-bold text-stone-800 flex items-center gap-2">
             <Clock className="w-5 h-5 text-indigo-500" />
             Medication & Routine
           </h3>
           
           <div className="space-y-8">
              {DAILY_SCHEDULE.map((slot, index) => {
                const isCurrent = slot.id === getCurrentPeriodId() && new Date(currentDate).toDateString() === new Date().toDateString();
                const allDone = slot.items.every(item => formData.completedItems[`${slot.id}-${item}`]);
                
                // Timeline Connector
                const isLast = index === DAILY_SCHEDULE.length - 1;

                return (
                  <div key={slot.id} className="relative pl-12">
                    {/* Timeline Line */}
                    {!isLast && <div className="absolute left-[15px] top-10 bottom-[-32px] w-0.5 bg-stone-100"></div>}
                    
                    {/* Timeline Dot */}
                    <div className={`absolute left-0 top-6 w-8 h-8 rounded-full border-2 flex items-center justify-center z-10 bg-white transition-colors ${
                        allDone 
                        ? 'border-green-500 text-green-500' 
                        : isCurrent 
                            ? 'border-indigo-500 text-indigo-500' 
                            : 'border-stone-200 text-stone-300'
                    }`}>
                         {allDone ? <Check className="w-4 h-4" strokeWidth={3} /> : getTimeIcon(slot.label)}
                    </div>

                    <div className={`group relative transition-all duration-300 rounded-2xl border overflow-hidden ${
                        allDone ? 'bg-stone-50/50 border-stone-100 opacity-90' : 
                        isCurrent && !formData.isComplete ? 'bg-white border-indigo-200 ring-4 ring-indigo-50 shadow-lg shadow-indigo-100/50' : 
                        'bg-white border-stone-100 shadow-sm'
                    }`}>
                        
                        <div className="flex items-center justify-between p-4 border-b border-stone-50/50">
                        <div className="flex items-center gap-3">
                            <div>
                            <div className="flex items-center gap-2">
                                <div className={`font-bold ${isCurrent && !formData.isComplete ? 'text-indigo-900' : 'text-stone-800'}`}>{slot.label}</div>
                                {isCurrent && !formData.isComplete && <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />}
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
                        </div>
                        </div>

                        <div className="p-4 pt-3">
                        <div className="space-y-2">
                            {slot.items.map((item, idx) => {
                                const isChecked = formData.completedItems[`${slot.id}-${item}`] || false;
                                return (
                                <button
                                    key={idx}
                                    onClick={() => handleToggleItem(slot.id, item)}
                                    disabled={formData.isComplete}
                                    className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all duration-200 ${
                                    isChecked 
                                        ? 'bg-stone-50 border-transparent text-stone-400' 
                                        : 'bg-white border-stone-200 hover:border-indigo-300 hover:shadow-sm'
                                    } ${formData.isComplete ? 'cursor-default' : 'cursor-pointer'}`}
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

                        {slot.notes.length > 0 && !formData.isComplete && (
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
                                        disabled={formData.isComplete}
                                        className="w-full pl-3 pr-2 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm font-bold text-stone-700 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-300 text-center disabled:opacity-70"
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
                                        disabled={formData.isComplete}
                                        className="w-full pl-3 pr-2 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm font-bold text-stone-700 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-300 text-center disabled:opacity-70"
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
                                        disabled={formData.isComplete}
                                        className="w-full pl-3 pr-2 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm font-bold text-stone-700 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-300 text-center disabled:opacity-70"
                                    />
                                    <div className="text-[9px] text-stone-400 text-center mt-1 font-semibold">BPM</div>
                                    </div>
                                </div>
                            </div>
                        )}
                        </div>
                    </div>
                  </div>
                );
              })}
           </div>
        </div>

        {/* Check-in Column */}
        <div className="lg:col-span-5">
          <div className="sticky top-24 space-y-6">
            <h3 className="text-lg font-bold text-stone-800 flex items-center gap-2">
               <Activity className="w-5 h-5 text-teal-500" />
               End of Day Check-in
            </h3>
            
            {formData.isComplete ? (
               <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-stone-100 p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4">
                  <div className="text-center py-4 border-b border-stone-100">
                     <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 className="w-8 h-8 text-green-500" />
                     </div>
                     <h3 className="text-xl font-bold text-stone-800">Check-in Complete</h3>
                     <p className="text-sm text-stone-400">All data saved for {new Date(currentDate).toLocaleDateString(undefined, {weekday: 'long'})}</p>
                  </div>

                  <div className="space-y-4">
                     <div className="flex justify-between items-center bg-stone-50 p-3 rounded-xl border border-stone-100">
                        <span className="text-sm font-bold text-stone-600 flex items-center gap-2">
                           <Moon className="w-4 h-4 text-indigo-500" /> Sleep
                        </span>
                        <span className="text-sm font-bold text-stone-900">{formData.sleepHrs}h</span>
                     </div>
                     <div className="flex flex-wrap gap-2">
                        {formData.factors && formData.factors.map(f => {
                           const def = TRACKING_FACTORS.find(tf => tf.id === f);
                           return def ? (
                               <div key={f} className="text-xs bg-stone-100 text-stone-600 px-2 py-1 rounded-lg font-bold flex items-center gap-1">
                                   {getFactorIcon(f)} {def.label}
                               </div>
                           ) : null
                        })}
                     </div>
                  </div>

                  <button 
                    onClick={toggleCompleteDay}
                    className="w-full py-3 mt-4 text-sm font-bold text-stone-400 bg-white border-2 border-dashed border-stone-200 rounded-xl hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 transition-all flex items-center justify-center gap-2"
                  >
                     <RotateCcw className="w-4 h-4" /> Edit Entry
                  </button>
               </div>
            ) : (
               <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-stone-100 p-6 space-y-8 relative overflow-hidden">
                 
                 {/* Dosage Config */}
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

                 {/* Factors (New Section) */}
                 <div>
                    <label className="text-sm font-bold text-stone-700 mb-3 block flex items-center gap-2">
                        <Activity className="w-4 h-4 text-stone-400" /> Daily Factors
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {TRACKING_FACTORS.map(factor => {
                            const isSelected = (formData.factors || []).includes(factor.id);
                            return (
                                <button
                                    key={factor.id}
                                    onClick={() => toggleFactor(factor.id)}
                                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 ${
                                        isSelected 
                                            ? factor.type === 'positive' 
                                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                                                : 'bg-rose-50 border-rose-200 text-rose-700'
                                            : 'bg-white border-stone-200 text-stone-500 hover:border-stone-300'
                                    }`}
                                >
                                    {getFactorIcon(factor.id)}
                                    {factor.label}
                                </button>
                            );
                        })}
                    </div>
                 </div>

                 <div className="h-px bg-stone-100" />

                 {/* Sliders Section */}
                 <div className="space-y-6">
                   
                   {/* Sleep */}
                   <div className="relative">
                      <TouchSlider 
                          label="Sleep Duration" 
                          value={formData.sleepHrs} 
                          onChange={(v: number) => handleChange('sleepHrs', v)} 
                          min={0} max={12} step={0.5} 
                          icon={Moon} 
                          colorClass="text-indigo-500"
                          valueSuffix="h"
                      />
                      <div className="flex justify-end px-2 -mt-2 mb-2">
                          <div className="flex items-center gap-2 bg-stone-50 rounded-lg px-2 py-1 border border-stone-100 mt-2">
                             <span className="text-[10px] font-bold text-stone-400 uppercase">Nap</span>
                             <input 
                                type="number" 
                                value={formData.napMinutes || 0}
                                onChange={(e) => handleChange('napMinutes', parseInt(e.target.value) || 0)}
                                className="w-12 bg-transparent text-xs font-bold text-stone-700 text-right focus:outline-none"
                                placeholder="0"
                             />
                             <span className="text-[10px] font-bold text-stone-400">min</span>
                          </div>
                      </div>
                   </div>
                   
                   {/* Energy (New) */}
                   <TouchSlider 
                      label="Energy Level" 
                      value={formData.energyLevel || 5} 
                      onChange={(v: number) => handleChange('energyLevel', v)} 
                      min={1} max={10} 
                      icon={BatteryCharging} 
                      colorClass="text-yellow-500"
                   />

                   <div className="h-px bg-stone-100" />

                   {/* Anxiety */}
                   <TouchSlider 
                      label="Anxiety" 
                      value={formData.anxietyLevel} 
                      onChange={(v: number) => handleChange('anxietyLevel', v)} 
                      min={1} max={10} 
                      icon={Zap} 
                      colorClass="text-teal-500"
                   />

                   {/* Mood */}
                   <TouchSlider 
                      label="Overall Mood" 
                      value={formData.moodLevel} 
                      onChange={(v: number) => handleChange('moodLevel', v)} 
                      min={1} max={10} 
                      icon={Smile} 
                      colorClass="text-amber-500"
                   />

                   {/* Depression */}
                   <TouchSlider 
                      label="Depression" 
                      value={formData.depressionLevel || 1} 
                      onChange={(v: number) => handleChange('depressionLevel', v)} 
                      min={1} max={10} 
                      icon={CloudRain} 
                      colorClass="text-slate-500"
                   />
                   
                   <div className="h-px bg-stone-100" />

                   {/* Smoking */}
                   <TouchSlider 
                      label="Smoking / Cravings" 
                      value={formData.smokingLevel} 
                      onChange={(v: number) => handleChange('smokingLevel', v)} 
                      min={1} max={10} 
                      icon={Flame} 
                      colorClass="text-orange-600"
                   />

                   <div className="h-px bg-stone-100" />

                   {/* Brain Zaps */}
                   <div className="space-y-3">
                     <label className="flex items-center gap-2 text-sm font-bold text-stone-700">
                       <Activity className="w-4 h-4 text-blue-500" /> Brain Zaps
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

                   {/* Complete Button */}
                   <button 
                      onClick={toggleCompleteDay}
                      className="w-full py-4 mt-4 bg-stone-900 text-white rounded-xl font-bold text-sm shadow-xl shadow-stone-200 hover:bg-black hover:shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-2 group"
                   >
                      Complete Check-in <CheckCircle2 className="w-4 h-4 group-hover:text-green-400 transition-colors" />
                   </button>
                 </div>
               </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default DailyTracker;