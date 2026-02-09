import React, { useState, useEffect } from 'react';
import { InventoryData } from '../types';
import { X, Package, Plus, Calculator, Calendar } from 'lucide-react';

interface InventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventory: InventoryData;
  onSave: (data: InventoryData) => void;
  currentDose: number;
}

const InventoryModal: React.FC<InventoryModalProps> = ({ isOpen, onClose, inventory, onSave, currentDose }) => {
  const [formData, setFormData] = useState<InventoryData>(inventory);
  const [addAmount, setAddAmount] = useState<string>('');

  useEffect(() => {
    setFormData(inventory);
  }, [inventory, isOpen]);

  if (!isOpen) return null;

  const handleAddStock = () => {
    const amount = parseFloat(addAmount);
    if (!isNaN(amount) && amount > 0) {
       setFormData(prev => ({
           ...prev,
           totalMg: prev.totalMg + amount,
           lastRefillDate: new Date().toISOString().split('T')[0]
       }));
       setAddAmount('');
    }
  };

  const daysRemaining = currentDose > 0 ? Math.floor(formData.totalMg / currentDose) : 0;
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + daysRemaining);

  const handleSave = () => {
      onSave(formData);
      onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        <div className="flex items-center justify-between p-6 border-b border-stone-100 bg-gradient-to-r from-stone-50 to-white">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
                <Package className="w-5 h-5" />
             </div>
             <div>
                <h2 className="text-lg font-bold text-stone-900">Medication Stock</h2>
                <p className="text-xs text-stone-500 font-medium">Track your supply to avoid gaps</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 bg-stone-50 rounded-full hover:bg-stone-100 transition-colors text-stone-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
            
            {/* Status Card */}
            <div className={`p-5 rounded-2xl border ${daysRemaining < 7 ? 'bg-amber-50 border-amber-100' : 'bg-emerald-50 border-emerald-100'}`}>
                <div className="flex justify-between items-start mb-4">
                    <span className="text-xs font-bold uppercase tracking-wider opacity-60">Estimated Supply</span>
                    <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${daysRemaining < 7 ? 'bg-white text-amber-700' : 'bg-white text-emerald-700'}`}>
                        {daysRemaining < 7 ? 'Refill Soon' : 'Stock OK'}
                    </span>
                </div>
                <div className="flex items-baseline gap-2 mb-1">
                    <span className={`text-4xl font-black ${daysRemaining < 7 ? 'text-amber-900' : 'text-emerald-900'}`}>
                        {daysRemaining}
                    </span>
                    <span className={`text-sm font-bold ${daysRemaining < 7 ? 'text-amber-700' : 'text-emerald-700'}`}>Days</span>
                </div>
                <div className="flex items-center gap-2 opacity-70 text-xs font-medium">
                   <Calendar className="w-3 h-3" />
                   Lasts until {targetDate.toLocaleDateString(undefined, {month: 'long', day: 'numeric'})}
                </div>
            </div>

            {/* Current Stock Input */}
            <div>
               <label className="text-xs font-bold text-stone-400 uppercase tracking-wide mb-2 block">Current Total Stock (mg)</label>
               <div className="flex gap-3">
                   <div className="relative flex-1">
                        <input 
                            type="number" 
                            value={Math.floor(formData.totalMg)}
                            onChange={(e) => setFormData(p => ({...p, totalMg: parseFloat(e.target.value) || 0}))}
                            className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-lg font-bold text-stone-800 focus:ring-2 focus:ring-indigo-100 outline-none"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400">mg</span>
                   </div>
               </div>
            </div>

            <div className="h-px bg-stone-100" />

            {/* Quick Add */}
            <div>
               <label className="text-xs font-bold text-stone-400 uppercase tracking-wide mb-2 block">Add Refill</label>
               <div className="flex gap-2">
                   <input 
                        type="number" 
                        placeholder="Amount in mg"
                        value={addAmount}
                        onChange={(e) => setAddAmount(e.target.value)}
                        className="flex-1 bg-white border border-stone-200 rounded-xl px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-indigo-100 outline-none"
                   />
                   <button 
                     onClick={handleAddStock}
                     disabled={!addAmount}
                     className="bg-stone-900 text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-black disabled:opacity-50 transition-all"
                   >
                       <Plus className="w-4 h-4" /> Add
                   </button>
               </div>
               <p className="text-[10px] text-stone-400 mt-2">
                   Enter total milligrams (e.g. 30 pills x 10mg = 300)
               </p>
            </div>

        </div>

        <div className="p-6 bg-stone-50 border-t border-stone-100">
           <button 
             onClick={handleSave}
             className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95"
           >
             Save Inventory
           </button>
        </div>

      </div>
    </div>
  );
};

export default InventoryModal;