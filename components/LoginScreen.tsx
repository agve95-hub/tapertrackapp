import React, { useState, useEffect } from 'react';
import { Lock, Delete, Activity, AlertCircle } from 'lucide-react';

interface LoginScreenProps {
  storedPin: string;
  onSuccess: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ storedPin, onSuccess }) => {
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    if (input.length === 4) {
      if (input === storedPin) {
        onSuccess();
      } else {
        setError(true);
        setTimeout(() => {
          setInput('');
          setError(false);
        }, 500);
      }
    }
  }, [input, storedPin, onSuccess]);

  const handleNum = (num: string) => {
    if (input.length < 4) {
      setInput(prev => prev + num);
      setError(false);
    }
  };

  const handleDelete = () => {
    setInput(prev => prev.slice(0, -1));
  };

  return (
    <div className="fixed inset-0 bg-stone-50 z-50 flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
      
      {/* Icon */}
      <div className="mb-8 p-4 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-stone-100">
        <Activity className="w-8 h-8 text-indigo-600" />
      </div>

      <h1 className="text-2xl font-bold text-stone-800 mb-2">Welcome Back</h1>
      <p className="text-stone-400 text-sm font-medium mb-10">Enter your passcode to unlock</p>

      {/* Dots */}
      <div className="flex gap-4 mb-12">
        {[0, 1, 2, 3].map((i) => (
          <div 
            key={i} 
            className={`w-4 h-4 rounded-full transition-all duration-200 ${
              error 
                ? 'bg-red-400 animate-shake' 
                : input.length > i 
                  ? 'bg-indigo-600 scale-110' 
                  : 'bg-stone-200'
            }`}
          />
        ))}
      </div>

      {/* Numpad */}
      <div className="grid grid-cols-3 gap-6 w-full max-w-[280px]">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button
            key={num}
            onClick={() => handleNum(num.toString())}
            className="w-16 h-16 rounded-full text-2xl font-bold text-stone-700 hover:bg-stone-200 active:bg-stone-300 transition-colors flex items-center justify-center select-none"
          >
            {num}
          </button>
        ))}
        <div /> {/* Empty slot */}
        <button
          onClick={() => handleNum('0')}
          className="w-16 h-16 rounded-full text-2xl font-bold text-stone-700 hover:bg-stone-200 active:bg-stone-300 transition-colors flex items-center justify-center select-none"
        >
          0
        </button>
        <button
          onClick={handleDelete}
          className="w-16 h-16 rounded-full text-stone-400 hover:text-stone-600 hover:bg-stone-200 active:bg-stone-300 transition-colors flex items-center justify-center"
        >
          <Delete className="w-6 h-6" />
        </button>
      </div>

      <div className="mt-12 flex items-center gap-2 text-stone-400 text-xs">
        <Lock className="w-3 h-3" />
        <span>End-to-End Encrypted Locally</span>
      </div>
    </div>
  );
};

export default LoginScreen;