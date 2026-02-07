import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { AuthResponse } from '../types';
import { Activity, ArrowRight, Lock, User, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface AuthScreenProps {
  onSuccess: (auth: AuthResponse) => void;
}

type AuthMode = 'login' | 'register';

const AuthScreen: React.FC<AuthScreenProps> = ({ onSuccess }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  
  // Form State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  
  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'checking' | 'online' | 'error'>('checking');
  const [statusMsg, setStatusMsg] = useState('');

  // Check Database Connection on Mount
  useEffect(() => {
    const check = async () => {
      setStatus('checking');
      const result = await api.checkConnection();
      if (result.ok) {
        setStatus('online');
      } else {
        setStatus('error');
        setStatusMsg(result.message || 'Unknown Error');
      }
    };
    check();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;

    if (mode === 'register') {
      if (password !== confirmPass) {
        alert("Passwords do not match!");
        return;
      }
      if (password.length < 6) {
        alert("Password must be at least 6 characters.");
        return;
      }
    }

    setIsLoading(true);
    let result;
    
    if (mode === 'register') {
      result = await api.register(username, password);
    } else {
      result = await api.login(username, password);
    }

    if (result) {
      onSuccess(result);
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-200 rounded-full blur-[120px] opacity-20 -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-200 rounded-full blur-[120px] opacity-20 translate-x-1/2 translate-y-1/2"></div>

      <div className="w-full max-w-sm relative z-10">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-blue-600 rounded-2xl shadow-xl shadow-indigo-200 flex items-center justify-center mb-4 transform rotate-3">
             <Activity className="text-white w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight">TaperTrack</h1>
          <p className="text-stone-500 font-medium text-sm mt-1">
             Your secure wellness companion
          </p>
        </div>

        {/* Status Banner (If Error) */}
        {status === 'error' && (
          <div className="mb-6 bg-red-50 border border-red-100 p-4 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-red-700">Database Disconnected</h3>
              <p className="text-xs text-red-600 mt-1 leading-relaxed">
                The app cannot connect to the server. Please update the password in <code>api/index.php</code> to match your Hostinger database.
              </p>
            </div>
          </div>
        )}

        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-stone-100 overflow-hidden">
           
           {/* Tabs */}
           <div className="flex border-b border-stone-100">
             <button 
               onClick={() => setMode('login')}
               className={`flex-1 py-4 text-sm font-bold transition-all ${
                 mode === 'login' 
                   ? 'bg-white text-indigo-600 border-b-2 border-indigo-600' 
                   : 'bg-stone-50 text-stone-400 hover:text-stone-600'
               }`}
             >
               Sign In
             </button>
             <button 
               onClick={() => setMode('register')}
               className={`flex-1 py-4 text-sm font-bold transition-all ${
                 mode === 'register' 
                   ? 'bg-white text-indigo-600 border-b-2 border-indigo-600' 
                   : 'bg-stone-50 text-stone-400 hover:text-stone-600'
               }`}
             >
               Register
             </button>
           </div>

           <div className="p-8">
              <form onSubmit={handleSubmit} className="space-y-5">
                  
                  {/* Username Field */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-400 uppercase tracking-wide ml-1">Username</label>
                    <div className="relative group">
                       <User className="absolute left-3 top-3.5 w-5 h-5 text-stone-300 group-focus-within:text-indigo-400 transition-colors" />
                       <input 
                          type="text" 
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          className="w-full bg-stone-50 border border-stone-200 rounded-xl py-3 pl-10 pr-4 text-stone-800 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all placeholder:text-stone-300"
                          placeholder="Choose a username"
                          required
                          autoComplete="username"
                       />
                    </div>
                  </div>

                  {/* Password Field */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-400 uppercase tracking-wide ml-1">Password</label>
                    <div className="relative group">
                       <Lock className="absolute left-3 top-3.5 w-5 h-5 text-stone-300 group-focus-within:text-indigo-400 transition-colors" />
                       <input 
                          type="password" 
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full bg-stone-50 border border-stone-200 rounded-xl py-3 pl-10 pr-4 text-stone-800 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all placeholder:text-stone-300"
                          placeholder={mode === 'register' ? "Min 6 characters" : "Enter password"}
                          required
                          autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                       />
                    </div>
                  </div>

                  {/* Confirm Password (Register Only) */}
                  {mode === 'register' && (
                    <div className="space-y-1 animate-in fade-in slide-in-from-top-2">
                      <label className="text-xs font-bold text-stone-400 uppercase tracking-wide ml-1">Confirm Password</label>
                      <div className="relative group">
                         <Lock className="absolute left-3 top-3.5 w-5 h-5 text-stone-300 group-focus-within:text-indigo-400 transition-colors" />
                         <input 
                            type="password" 
                            value={confirmPass}
                            onChange={(e) => setConfirmPass(e.target.value)}
                            className="w-full bg-stone-50 border border-stone-200 rounded-xl py-3 pl-10 pr-4 text-stone-800 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all placeholder:text-stone-300"
                            placeholder="Re-type password"
                            required
                            autoComplete="new-password"
                         />
                      </div>
                    </div>
                  )}

                  {/* Action Button */}
                  <button 
                    type="submit"
                    disabled={isLoading || status === 'error'}
                    className="w-full bg-stone-900 text-white py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-black transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:active:scale-100 mt-2"
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        {mode === 'register' ? 'Create Account' : 'Sign In'} <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

              </form>
           </div>
        </div>
        
        {/* Footer Status */}
        <div className="mt-8 text-center flex items-center justify-center gap-2">
           {status === 'checking' && (
              <>
                 <Loader2 className="w-3 h-3 animate-spin text-stone-400" />
                 <span className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">Checking Server...</span>
              </>
           )}
           {status === 'online' && (
              <>
                 <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                 <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">System Online</span>
              </>
           )}
           {status === 'error' && (
              <>
                 <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                 <span className="text-[10px] text-red-500 font-bold uppercase tracking-widest">Connection Error</span>
              </>
           )}
        </div>

      </div>
    </div>
  );
};

export default AuthScreen;