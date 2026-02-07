import React, { useState } from 'react';
import { UserSettings } from '../types';
import { X, Bell, Lock, ShieldCheck, Clock } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onSave: (newSettings: UserSettings) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onSave }) => {
  const [formData, setFormData] = useState<UserSettings>(settings);
  const [newPin, setNewPin] = useState('');
  
  if (!isOpen) return null;

  const handleTogglePin = (enabled: boolean) => {
    if (enabled && !formData.pinCode && !newPin) {
      // Must set a pin first, keep disabled until typed
      return; 
    }
    if (!enabled) {
       setFormData(prev => ({ ...prev, isPinEnabled: false, pinCode: null }));
       setNewPin('');
    } else {
       setFormData(prev => ({ ...prev, isPinEnabled: true }));
    }
  };

  const handleSavePin = () => {
    if (newPin.length === 4) {
      setFormData(prev => ({ ...prev, isPinEnabled: true, pinCode: newPin }));
      setNewPin(''); // Clear input
    }
  };

  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
      alert("This browser does not support desktop notifications");
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      setFormData(prev => ({ ...prev, notificationsEnabled: true }));
    } else {
      setFormData(prev => ({ ...prev, notificationsEnabled: false }));
      alert("Permission denied. Please enable notifications in your browser settings.");
    }
  };

  const handleSaveAll = () => {
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-stone-900/20 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-stone-100">
          <h2 className="text-xl font-bold text-stone-900">App Settings</h2>
          <button 
            onClick={onClose} 
            className="p-2 bg-stone-50 rounded-full hover:bg-stone-100 transition-colors text-stone-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-8">
          
          {/* Section: Reminders */}
          <div className="space-y-4">
             <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider flex items-center gap-2">
               <Bell className="w-4 h-4" /> Reminders
             </h3>
             
             <div className="bg-stone-50 rounded-2xl p-4 border border-stone-100">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-semibold text-stone-700">Daily Reminder</span>
                  <button 
                    onClick={() => formData.notificationsEnabled ? setFormData(p => ({...p, notificationsEnabled: false})) : requestNotificationPermission()}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.notificationsEnabled ? 'bg-indigo-600' : 'bg-stone-300'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ml-1 ${formData.notificationsEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>
                
                {formData.notificationsEnabled && (
                  <div className="flex items-center gap-3 animate-in fade-in slide-in-from-top-1">
                    <Clock className="w-5 h-5 text-indigo-500" />
                    <input 
                      type="time" 
                      value={formData.notificationTime}
                      onChange={(e) => setFormData(p => ({...p, notificationTime: e.target.value}))}
                      className="bg-white border border-stone-200 text-stone-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5 font-bold"
                    />
                  </div>
                )}
                <p className="text-xs text-stone-400 mt-3 leading-relaxed">
                   We'll send you a browser notification to log your symptoms at this time.
                </p>
             </div>
          </div>

          {/* Section: Security */}
          <div className="space-y-4">
             <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider flex items-center gap-2">
               <ShieldCheck className="w-4 h-4" /> Privacy & Security
             </h3>
             
             <div className="bg-stone-50 rounded-2xl p-4 border border-stone-100">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-semibold text-stone-700">App Lock (PIN)</span>
                  <button 
                     onClick={() => {
                        if (formData.isPinEnabled) {
                            handleTogglePin(false);
                        } else {
                            // Don't enable directly, user needs to type PIN below
                        }
                     }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.isPinEnabled ? 'bg-indigo-600' : 'bg-stone-300'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ml-1 ${formData.isPinEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>

                {!formData.isPinEnabled ? (
                  <div className="flex gap-2">
                    <input 
                      type="password" 
                      maxLength={4}
                      placeholder="Set 4-digit PIN"
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value.replace(/[^0-9]/g, ''))}
                      className="flex-1 bg-white border border-stone-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-100"
                    />
                    <button 
                       disabled={newPin.length !== 4}
                       onClick={handleSavePin}
                       className="bg-stone-900 text-white px-4 py-2 rounded-lg text-sm font-bold disabled:opacity-50 hover:bg-black transition-colors"
                    >
                      Set PIN
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-indigo-600 text-sm font-bold bg-indigo-50 px-3 py-2 rounded-lg">
                    <Lock className="w-4 h-4" />
                    <span>Active. App is protected.</span>
                  </div>
                )}
             </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-6 bg-stone-50 border-t border-stone-100 flex justify-end">
           <button 
             onClick={handleSaveAll}
             className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-95"
           >
             Save Changes
           </button>
        </div>

      </div>
    </div>
  );
};

export default SettingsModal;