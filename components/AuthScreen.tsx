import React, { useState } from 'react';
import { api } from '../services/api';
import { AuthResponse } from '../types';
import { Activity, ArrowRight, Lock, User, Sparkles } from 'lucide-react';

interface AuthScreenProps {
  onSuccess: (auth: AuthResponse) => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onSuccess }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;

    setIsLoading(true);
    let result;
    
    if (isRegistering) {
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
      <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-200 rounded-full blur-[100px] opacity-30 -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-blue-200 rounded-full blur-[100px] opacity-30 translate-x-1/2 translate-y-1/2"></div>

      <div className="w-full max-w-sm relative z-10">
        
        {/* Logo Area */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-blue-600 rounded-2xl shadow-xl shadow-indigo-200 flex items-center justify-center mb-4 transform rotate-3">
             <Activity className="text-white w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight">TaperTrack</h1>
          <p className="text-stone-500 font-medium text-sm mt-1">
             {isRegistering ? 'Start your wellness journey' : 'Welcome back'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-stone-100">
           <form onSubmit={handleSubmit} className="space-y-4">
              
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-400 uppercase tracking-wide ml-1">Username</label>
                <div className="relative">
                   <User className="absolute left-3 top-3 w-5 h-5 text-stone-300" />
                   <input 
                      type="text" 
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl py-3 pl-10 pr-4 text-stone-800 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all"
                      placeholder="Enter username"
                      required
                   />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-400 uppercase tracking-wide ml-1">Password</label>
                <div className="relative">
                   <Lock className="absolute left-3 top-3 w-5 h-5 text-stone-300" />
                   <input 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl py-3 pl-10 pr-4 text-stone-800 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all"
                      placeholder="••••••••"
                      required
                   />
                </div>
              </div>

              <button 
                type="submit"
                disabled={isLoading}
                className="w-full bg-stone-900 text-white py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-black transition-all shadow-lg active:scale-95 disabled:opacity-70 mt-4"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    {isRegistering ? 'Create Account' : 'Sign In'} <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

           </form>
        </div>

        {/* Toggle */}
        <div className="mt-8 text-center">
           <button 
             onClick={() => {
               setIsRegistering(!isRegistering);
               setUsername('');
               setPassword('');
             }}
             className="text-sm font-semibold text-stone-500 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2 mx-auto"
           >
             {isRegistering ? (
               <>Already have an account? Login</>
             ) : (
               <>
                 <Sparkles className="w-4 h-4 text-indigo-400" /> New here? Create Account
               </>
             )}
           </button>
        </div>

      </div>
      
      <div className="absolute bottom-6 text-[10px] text-stone-300 font-bold uppercase tracking-widest">
         Secure • Private • Encrypted
      </div>
    </div>
  );
};

export default AuthScreen;