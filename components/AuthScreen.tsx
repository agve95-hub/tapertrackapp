import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { AuthResponse } from '../types';
import { Activity, Lock, User, AlertCircle, Loader2, ArrowRight, Quote } from 'lucide-react';

interface AuthScreenProps {
  onSuccess: (auth: AuthResponse) => void;
}

type AuthMode = 'login' | 'register';

const INSPIRATIONAL_QUOTES = [
  { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
  { text: "Difficulties strengthen the mind, as labor does the body.", author: "Seneca" },
  { text: "We acquire the strength we have overcome.", author: "Ralph Waldo Emerson" },
  { text: "The best way out is always through.", author: "Robert Frost" },
  { text: "He who has a why to live can bear almost any how.", author: "Friedrich Nietzsche" },
  { text: "Patience and time do more than strength or passion.", author: "Jean de La Fontaine" },
  { text: "The only journey is the one within.", author: "Rainer Maria Rilke" },
  { text: "Act as if what you do makes a difference. It does.", author: "William James" },
  { text: "Start where you are. Use what you have. Do what you can.", author: "Arthur Ashe" },
  { text: "Every wall is a door.", author: "Ralph Waldo Emerson" },
  { text: "Turn your face to the sunshine and you cannot see a shadow.", author: "Helen Keller" },
  { text: "Knowing your own darkness is the best method for dealing with the darknesses of other people.", author: "Carl Jung" }
];

const AuthScreen: React.FC<AuthScreenProps> = ({ onSuccess }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  
  // Form State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  
  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'checking' | 'online' | 'error'>('checking');
  
  // Quote State
  const [dailyQuote, setDailyQuote] = useState(INSPIRATIONAL_QUOTES[0]);

  // Check Database Connection on Mount & Set Quote
  useEffect(() => {
    const check = async () => {
      setStatus('checking');
      const result = await api.checkConnection();
      if (result.ok) {
        setStatus('online');
      } else {
        setStatus('error');
      }
    };
    check();
    
    // Set random quote
    const randomIndex = Math.floor(Math.random() * INSPIRATIONAL_QUOTES.length);
    setDailyQuote(INSPIRATIONAL_QUOTES[randomIndex]);
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
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-200 rounded-full blur-[120px] opacity-20 -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-200 rounded-full blur-[120px] opacity-20 translate-x-1/2 translate-y-1/2"></div>

      <div className="w-full max-w-sm relative z-10 flex flex-col">
        
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
          <div className="mb-6 bg-red-50 border border-red-100 p-4 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2 shadow-sm">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-red-700">Service Unavailable</h3>
              <p className="text-xs text-red-600 mt-1 leading-relaxed">
                Unable to connect to the secure database. Please try again later.
              </p>
            </div>
          </div>
        )}

        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-stone-100 overflow-hidden relative z-20">
           
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
                          placeholder="••••••••"
                          required
                          autoComplete="current-password"
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
                            placeholder="••••••••"
                            required={mode === 'register'}
                            autoComplete="new-password"
                        />
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button 
                    type="submit"
                    disabled={isLoading || status === 'error'}
                    className="w-full bg-stone-900 text-white py-4 rounded-xl font-bold text-sm shadow-lg shadow-stone-200 hover:bg-black hover:shadow-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {mode === 'login' ? 'Signing In...' : 'Creating Account...'}
                      </>
                    ) : (
                      <>
                        {mode === 'login' ? 'Sign In' : 'Create Account'}
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

              </form>
           </div>
           
           {/* Footer */}
           <div className="bg-stone-50 p-4 text-center border-t border-stone-100">
             <p className="text-xs text-stone-400 font-medium">
               {mode === 'login' ? "Don't have an account yet?" : "Already have an account?"}
               <button 
                 onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                 className="ml-1 text-indigo-600 font-bold hover:underline"
               >
                 {mode === 'login' ? "Register Now" : "Sign In"}
               </button>
             </p>
           </div>

        </div>
        
        <p className="text-center text-[10px] text-stone-400 mt-6 font-medium">
          Protected by End-to-End Logic & Secure Storage
        </p>

        {/* Inspirational Quote Section */}
        <div className="mt-12 text-center max-w-xs mx-auto animate-in fade-in slide-in-from-bottom-6 duration-1000">
           <Quote className="w-6 h-6 text-indigo-200 mx-auto mb-3 opacity-50" />
           <p className="text-stone-600 italic font-medium leading-relaxed font-serif">
             "{dailyQuote.text}"
           </p>
           <div className="flex items-center justify-center gap-2 mt-3">
             <div className="h-px w-6 bg-stone-200"></div>
             <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
               {dailyQuote.author}
             </span>
             <div className="h-px w-6 bg-stone-200"></div>
           </div>
        </div>

      </div>
    </div>
  );
};

export default AuthScreen;