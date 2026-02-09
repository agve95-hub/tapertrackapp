
import React, { useState } from 'react';
import { TaperStep } from '../types';
import { TAPER_SCHEDULE as DEFAULT_SCHEDULE } from '../constants';
import { TrendingDown, ShieldAlert, PenLine, Save, RotateCcw, Plus, Trash2, Calendar, Check } from 'lucide-react';

interface TaperGuideProps {
  schedule: TaperStep[];
  onUpdateSchedule: (newSchedule: TaperStep[]) => void;
  startDate: string;
  onUpdateStartDate: (date: string) => void;
}

const TaperGuide: React.FC<TaperGuideProps> = ({ 
  schedule, 
  onUpdateSchedule, 
  startDate, 
  onUpdateStartDate 
}) => {
  const [isEditing, setIsEditing] = useState(false);

  const handleReset = () => {
    if (confirm('Are you sure you want to reset the protocol to defaults? This cannot be undone.')) {
      onUpdateSchedule(DEFAULT_SCHEDULE);
      onUpdateStartDate('');
      setIsEditing(false);
    }
  };

  const handleStepChange = (index: number, field: keyof TaperStep, value: any) => {
    const newSchedule = [...schedule];
    newSchedule[index] = { ...newSchedule[index], [field]: value };
    onUpdateSchedule(newSchedule);
  };

  const handleAddStep = () => {
    const newStep: TaperStep = {
      weeks: 'New Phase',
      dose: 0,
      notes: 'Add notes here...',
    };
    onUpdateSchedule([...schedule, newStep]);
  };

  const handleDeleteStep = (index: number) => {
    const newSchedule = schedule.filter((_, i) => i !== index);
    onUpdateSchedule(newSchedule);
  };

  return (
    <div className="space-y-8 pb-24 max-w-3xl mx-auto">
      
      {/* Header Card */}
      <div className="bg-gradient-to-br from-white to-stone-50 p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-stone-100 text-center relative overflow-hidden">
         {/* Edit Button */}
         <div className="absolute top-4 right-4 z-10">
            <button 
              onClick={() => setIsEditing(!isEditing)}
              className={`p-2 rounded-full transition-all duration-200 border ${
                isEditing 
                  ? 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200' 
                  : 'bg-white text-stone-400 border-stone-200 hover:text-indigo-600 hover:border-indigo-200 hover:shadow-sm'
              }`}
            >
               {isEditing ? <Save className="w-5 h-5" /> : <PenLine className="w-5 h-5" />}
            </button>
         </div>

         <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
            <TrendingDown className="w-8 h-8" />
         </div>
         <h2 className="text-2xl font-bold text-stone-900 mb-2">
           {isEditing ? 'Edit Protocol' : 'Taper Protocol'}
         </h2>
         <p className="text-stone-500 max-w-md mx-auto mb-6">
            {isEditing 
              ? 'Customize your reduction schedule below. Set a start date to track your timeline.' 
              : 'This schedule is designed for stability. Do not rush. Listen to your body and hold the dose if symptoms arise.'}
         </p>
         
         {!isEditing && (
            <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-100 px-4 py-2 rounded-full">
               <ShieldAlert className="w-4 h-4 text-amber-600" />
               <span className="text-xs font-bold text-amber-800 uppercase tracking-wide">Consult your doctor before changes</span>
            </div>
         )}

         {isEditing && (
           <div className="mt-4 flex flex-col items-center animate-in fade-in slide-in-from-top-2">
              <label className="text-xs font-bold text-stone-500 uppercase tracking-wide mb-2 flex items-center gap-2">
                 <Calendar className="w-4 h-4" /> Protocol Start Date
              </label>
              <input 
                type="date"
                value={startDate}
                onChange={(e) => onUpdateStartDate(e.target.value)}
                className="bg-white border border-stone-300 text-stone-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full max-w-xs p-2.5 font-bold shadow-sm"
              />
              
              <div className="mt-6">
                <button 
                  onClick={handleReset}
                  className="flex items-center gap-2 text-xs font-bold text-stone-400 hover:text-red-500 transition-colors bg-white px-3 py-1.5 rounded-full border border-stone-200 hover:border-red-200"
                >
                  <RotateCcw className="w-3 h-3" /> Reset to Clinical Defaults
                </button>
              </div>
           </div>
         )}
      </div>

      {/* Start Date Indicator (View Mode) */}
      {!isEditing && startDate && (
        <div className="flex items-center justify-center gap-2 text-stone-500 text-sm font-medium bg-white py-2 px-4 rounded-full border border-stone-100 w-fit mx-auto shadow-sm">
           <Calendar className="w-4 h-4 text-indigo-500" />
           Started on <span className="text-stone-900 font-bold">{new Date(startDate).toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
        </div>
      )}

      {/* Timeline */}
      <div className="relative space-y-4">
        {!isEditing && <div className="absolute left-[28px] top-4 bottom-4 w-0.5 bg-stone-200 z-0 hidden md:block" />}

        {schedule.map((step, idx) => (
          <div key={idx} className={`relative group md:pl-20 transition-all duration-300 ${step.isCritical ? 'scale-[1.02]' : ''}`}>
            
            {/* Step Number (View Mode Only) */}
            {!isEditing && (
              <div className={`hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 w-14 h-14 border-2 rounded-full items-center justify-center z-10 shadow-sm transition-all duration-300 ${
                  step.isComplete 
                    ? 'bg-green-500 border-green-500 text-white' 
                    : 'bg-white border-stone-100 text-stone-400 group-hover:border-indigo-100'
              }`}>
                {step.isComplete ? (
                    <Check className="w-6 h-6" />
                ) : (
                    <span className={`font-bold ${step.isCritical ? 'text-red-500' : ''}`}>
                      {idx + 1}
                    </span>
                )}
              </div>
            )}

            {/* Content Card */}
            <div className={`bg-white rounded-2xl p-5 border shadow-sm transition-all duration-300 ${
              step.isCritical && !isEditing
                ? 'border-red-200 ring-4 ring-red-50 shadow-red-100/50' 
                : 'border-stone-100 hover:shadow-md'
            } ${step.isComplete && !isEditing ? 'opacity-60 grayscale-[0.5] hover:opacity-100 hover:grayscale-0' : ''}`}>
              
              {isEditing ? (
                 // EDIT MODE CARD
                 <div className="space-y-4">
                    <div className="flex justify-between items-center border-b border-stone-100 pb-2 mb-2">
                       <span className="text-xs font-bold text-stone-400 uppercase">Step {idx + 1}</span>
                       <button onClick={() => handleDeleteStep(idx)} className="text-stone-300 hover:text-red-500 transition-colors p-1">
                          <Trash2 className="w-4 h-4" />
                       </button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                       <div>
                          <label className="text-[10px] font-bold text-stone-500 uppercase mb-1 block">Dose (mg)</label>
                          <input 
                            type="text" 
                            value={step.dose}
                            onChange={(e) => handleStepChange(idx, 'dose', e.target.value)}
                            className="w-full font-bold text-stone-900 bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 outline-none"
                          />
                       </div>
                       <div>
                          <label className="text-[10px] font-bold text-stone-500 uppercase mb-1 block">Timeline Label</label>
                          <input 
                            type="text" 
                            value={step.weeks}
                            onChange={(e) => handleStepChange(idx, 'weeks', e.target.value)}
                            className="w-full font-medium text-stone-700 bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 outline-none"
                            placeholder="e.g. Weeks 1-2"
                          />
                       </div>
                    </div>
                    
                    <div>
                       <label className="text-[10px] font-bold text-stone-500 uppercase mb-1 block">Notes / Instructions</label>
                       <textarea 
                          value={step.notes}
                          onChange={(e) => handleStepChange(idx, 'notes', e.target.value)}
                          className="w-full text-sm text-stone-600 bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 outline-none resize-none min-h-[60px]"
                       />
                    </div>
                    
                    <div className="flex items-center gap-2">
                       <input 
                         type="checkbox" 
                         id={`critical-${idx}`}
                         checked={step.isCritical || false}
                         onChange={(e) => handleStepChange(idx, 'isCritical', e.target.checked)}
                         className="w-4 h-4 text-red-600 rounded border-stone-300 focus:ring-red-500"
                       />
                       <label htmlFor={`critical-${idx}`} className="text-xs font-bold text-red-600 select-none cursor-pointer">
                          Mark as Critical/Difficult Phase
                       </label>
                    </div>
                 </div>
              ) : (
                 // VIEW MODE CARD
                 <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                    {/* Dose & Weeks */}
                    <div className="flex items-center gap-4 min-w-[150px]">
                       <div className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center shrink-0 leading-none transition-colors ${
                         step.isCritical 
                           ? 'bg-red-50 text-red-700 border border-red-100' 
                           : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                       }`}>
                          {typeof step.dose === 'number' ? (
                             <>
                               <span className="font-bold text-lg">{step.dose}</span>
                               <span className="text-[10px] opacity-70 font-semibold mt-0.5">mg</span>
                             </>
                          ) : (
                             // Stacked layout for "Below 2.0"
                             <>
                               <span className="text-[9px] font-bold uppercase leading-tight">{step.dose.toString().split(' ')[0]}</span>
                               <span className="text-sm font-bold leading-none mt-0.5">{step.dose.toString().split(' ')[1]}</span>
                             </>
                          )}
                       </div>
                       <div>
                         <div className="text-xs text-stone-400 font-bold uppercase tracking-wider mb-0.5">
                            {step.weeks.toLowerCase().startsWith('week') ? step.weeks : `Weeks ${step.weeks}`}
                         </div>
                         <div className="font-semibold text-stone-800 leading-tight">
                           {step.isCritical ? 'Critical Reduction Phase' : 'Standard Reduction'}
                         </div>
                       </div>
                    </div>

                    {/* Notes */}
                    <div className="flex-1">
                       {step.isCritical && (
                          <span className="inline-block bg-red-100 text-red-700 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide mb-2">
                            Heavy Zone
                          </span>
                       )}
                       <p className={`text-sm leading-relaxed bg-stone-50 sm:bg-transparent p-3 sm:p-0 rounded-lg ${
                           step.isComplete ? 'text-stone-400 line-through decoration-stone-300' : 'text-stone-600'
                       }`}>
                         {step.notes}
                       </p>
                    </div>

                    {/* Completion Checkmark Toggle */}
                    <button 
                       onClick={() => handleStepChange(idx, 'isComplete', !step.isComplete)}
                       className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border-2 transition-all duration-300 active:scale-95 ${
                          step.isComplete 
                            ? 'bg-green-500 border-green-500 shadow-md shadow-green-200' 
                            : 'bg-transparent border-stone-200 hover:border-indigo-300 hover:bg-stone-50 group-hover:border-indigo-200'
                       }`}
                       title={step.isComplete ? "Mark as Incomplete" : "Mark as Complete"}
                    >
                       <Check className={`w-6 h-6 transition-transform duration-300 ${
                           step.isComplete ? 'text-white scale-100' : 'text-stone-300 scale-75'
                       }`} strokeWidth={3} />
                    </button>
                 </div>
              )}

            </div>
          </div>
        ))}
        
        {isEditing && (
           <button 
             onClick={handleAddStep}
             className="w-full py-4 rounded-2xl border-2 border-dashed border-stone-200 text-stone-400 font-bold flex items-center justify-center gap-2 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
           >
              <Plus className="w-5 h-5" /> Add Taper Step
           </button>
        )}

      </div>
    </div>
  );
};

export default TaperGuide;
