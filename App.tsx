import React, { useState, useEffect, useRef } from 'react';
import { ViewState, DailyLogEntry, TaperStep, UserSettings, AuthResponse } from './types';
import { TAPER_SCHEDULE } from './constants';
import DailyTracker from './components/DailyTracker';
import TaperGuide from './components/TaperGuide';
import HistoryAnalytics from './components/HistoryAnalytics';
import LoginScreen from './components/LoginScreen'; // Local PIN
import AuthScreen from './components/AuthScreen'; // Server Login
import SettingsModal from './components/SettingsModal';
import { api } from './services/api';
import { LayoutDashboard, Activity, BookOpen, ChevronLeft, ChevronRight, Settings, Cloud, CloudOff, RefreshCw, LogOut } from 'lucide-react';

const STORAGE_KEY = 'taper_track_data_v1';
const SCHEDULE_KEY = 'taper_schedule_custom_v1';
const START_DATE_KEY = 'taper_start_date_v1';
const SETTINGS_KEY = 'taper_settings_v1';
const TOKEN_KEY = 'taper_auth_token_v1';
const USER_KEY = 'taper_auth_user_v1';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.TODAY);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  // Auth State
  const [authToken, setAuthToken] = useState<string | null>(localStorage.getItem(TOKEN_KEY));
  const [username, setUsername] = useState<string | null>(localStorage.getItem(USER_KEY));
  
  // Data State
  const [logs, setLogs] = useState<DailyLogEntry[]>([]);
  const [taperSchedule, setTaperSchedule] = useState<TaperStep[]>(TAPER_SCHEDULE);
  const [protocolStartDate, setProtocolStartDate] = useState<string>('');
  
  // Settings & App Lock
  const [userSettings, setUserSettings] = useState<UserSettings>({
    isPinEnabled: false,
    pinCode: null,
    notificationsEnabled: false,
    notificationTime: '09:00'
  });
  const [isAppLocked, setIsAppLocked] = useState(false); // Default false, only locks if PIN set
  const [showSettings, setShowSettings] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Sync State
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error' | 'success'>('idle');
  const saveTimeoutRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const notificationInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // --- INITIAL LOAD ---
  useEffect(() => {
    const loadAppData = async () => {
      // 1. Load Local PIN Settings first (always available locally)
      const localSettings = localStorage.getItem(SETTINGS_KEY);
      if (localSettings) {
        const parsed = JSON.parse(localSettings);
        setUserSettings(parsed);
        if (parsed.isPinEnabled && parsed.pinCode) {
           setIsAppLocked(true);
        }
      }

      // 2. If we have a token, load cloud data
      if (authToken) {
        const cloudData = await api.loadData(authToken);
        
        if (cloudData === 'UNAUTHORIZED') {
           handleLogout();
           return;
        }

        if (cloudData) {
           // We prioritize cloud data
           if (cloudData.logs) setLogs(cloudData.logs);
           if (cloudData.schedule) setTaperSchedule(cloudData.schedule);
           if (cloudData.startDate) setProtocolStartDate(cloudData.startDate);
           if (cloudData.settings) {
               // Merge settings (prefer cloud, but keep local pin enabled state if cloud is empty?)
               // Actually, for simplicity, cloud overwrites local settings if they exist
               setUserSettings(cloudData.settings);
           }
           setSyncStatus('success');
        } 
      }
      
      setIsLoaded(true);
    };

    loadAppData();
  }, [authToken]);

  // --- SAVE & SYNC ---
  useEffect(() => {
    if (isLoaded && authToken) {
      // 1. Save critical keys locally for offline capability
      // (Note: With multi-user, local storage might be an issue if sharing device, but acceptable for this scope)
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(userSettings));

      // 2. Cloud Save
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      
      setSyncStatus('syncing');
      saveTimeoutRef.current = setTimeout(async () => {
        const success = await api.saveData({
          logs,
          schedule: taperSchedule,
          startDate: protocolStartDate,
          settings: userSettings
        }, authToken);
        
        setSyncStatus(success ? 'success' : 'error');
      }, 2000);
    }
  }, [logs, taperSchedule, protocolStartDate, userSettings, isLoaded, authToken]);

  // --- AUTH HANDLERS ---
  const handleAuthSuccess = (auth: AuthResponse) => {
    localStorage.setItem(TOKEN_KEY, auth.token);
    localStorage.setItem(USER_KEY, auth.username);
    setAuthToken(auth.token);
    setUsername(auth.username);
    // Force reload of data happens via useEffect on authToken change
  };

  const handleLogout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setAuthToken(null);
    setUsername(null);
    setLogs([]); // Clear sensitive data from memory
    setSyncStatus('idle');
  };

  // --- NOTIFICATION LOGIC ---
  useEffect(() => {
    if (userSettings.notificationsEnabled && userSettings.notificationTime) {
      if (notificationInterval.current) clearInterval(notificationInterval.current);
      notificationInterval.current = setInterval(() => {
        const now = new Date();
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        if (currentTime === userSettings.notificationTime && now.getSeconds() < 10) {
           if (Notification.permission === 'granted') {
             new Notification('TaperTrack Reminder', {
               body: 'Time to log your daily wellness and medication.',
               icon: '/favicon.ico'
             });
           }
        }
      }, 10000);
    }
    return () => {
      if (notificationInterval.current) clearInterval(notificationInterval.current);
    };
  }, [userSettings]);

  // --- HELPERS ---
  const handleUpdateLog = (updatedEntry: DailyLogEntry) => {
    setLogs(prev => {
      const existingIndex = prev.findIndex(l => l.date === updatedEntry.date);
      if (existingIndex >= 0) {
        const newLogs = [...prev];
        newLogs[existingIndex] = updatedEntry;
        return newLogs;
      } else {
        return [...prev, updatedEntry];
      }
    });
  };

  const getLogContext = (date: string): DailyLogEntry | undefined => {
    const exactMatch = logs.find(l => l.date === date);
    if (exactMatch) return exactMatch;

    const previousLogs = logs
      .filter(l => l.date < date)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (previousLogs.length > 0) {
      const lastLog = previousLogs[0];
      return {
        date: date,
        completedItems: {},
        lDose: lastLog.lDose,
        bDose: lastLog.bDose,
        sleepHrs: 7,
        napMinutes: 0,
        anxietyLevel: 5,
        moodLevel: 5,
        depressionLevel: 1,
        brainZapLevel: 0,
        smokingLevel: 5,
        dailyNote: ''
      };
    }
    return undefined;
  };

  const changeDate = (days: number) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + days);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const NavButton = ({ view, icon: Icon, label }: { view: ViewState; icon: any; label: string }) => (
    <button
      onClick={() => setCurrentView(view)}
      className={`flex flex-col items-center justify-center w-full py-3 transition-all duration-200 group ${
        currentView === view 
          ? 'text-indigo-600' 
          : 'text-stone-400 hover:text-stone-600'
      }`}
    >
      <div className={`mb-1 transition-transform duration-200 ${currentView === view ? 'scale-110' : 'group-hover:scale-110'}`}>
        <Icon className={`w-6 h-6 ${currentView === view ? 'fill-indigo-100 stroke-[2.5px]' : 'stroke-[1.5px]'}`} />
      </div>
      <span className={`text-[10px] font-medium tracking-wide ${currentView === view ? 'font-bold' : ''}`}>{label}</span>
      {currentView === view && (
        <div className="absolute top-0 w-8 h-0.5 bg-indigo-600 rounded-b-full shadow-[0_2px_8px_rgba(79,70,229,0.4)]" />
      )}
    </button>
  );

  // --- RENDER GATES ---

  // 1. If not authenticated, show Auth Screen
  if (!authToken) {
     return <AuthScreen onSuccess={handleAuthSuccess} />;
  }

  // 2. If authenticated but loading initial data
  if (!isLoaded) return <div className="min-h-screen bg-white" />;

  // 3. If Local PIN Lock is active
  if (isAppLocked && userSettings.isPinEnabled && userSettings.pinCode) {
    return (
      <LoginScreen 
        storedPin={userSettings.pinCode} 
        onSuccess={() => setIsAppLocked(false)} 
      />
    );
  }

  // 4. Main App
  return (
    <div className="min-h-screen bg-white text-stone-800 font-sans w-full relative">
      
      <SettingsModal 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)}
        settings={userSettings}
        onSave={setUserSettings}
      />

      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-stone-100 transition-all">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 ring-1 ring-white/50">
                <Activity className="text-white w-5 h-5" />
            </div>
            <div>
                <h1 className="text-lg font-bold text-stone-900 leading-none tracking-tight">
                TaperTrack
                </h1>
                <p className="text-[10px] text-stone-500 font-semibold tracking-wider uppercase mt-1">
                {username ? `Hello, ${username}` : 'Wellness Protocol'}
                </p>
            </div>
            </div>
            
            <div className="flex items-center gap-3">
            {currentView === ViewState.TODAY && (
                <div className="flex items-center bg-stone-100/50 rounded-full p-1 border border-stone-200/60 shadow-inner hidden sm:flex">
                    <button onClick={() => changeDate(-1)} className="p-2 hover:bg-white rounded-full transition-all shadow-sm hover:shadow text-stone-500 hover:text-indigo-600 active:scale-95">
                    <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-bold px-3 text-stone-700 min-w-[90px] text-center tabular-nums">
                    {new Date(selectedDate).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                    </span>
                    <button 
                    onClick={() => changeDate(1)} 
                    disabled={selectedDate === new Date().toISOString().split('T')[0]}
                    className="p-2 hover:bg-white rounded-full transition-all shadow-sm hover:shadow text-stone-500 hover:text-indigo-600 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-stone-500 active:scale-95"
                    >
                    <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
                )}
                
                <button 
                onClick={() => setShowSettings(true)}
                className="p-2.5 rounded-full bg-white border border-stone-200 text-stone-500 hover:text-indigo-600 hover:border-indigo-200 hover:shadow-md transition-all active:scale-95"
                >
                <Settings className="w-5 h-5" />
                </button>
                
                <button 
                onClick={handleLogout}
                className="p-2.5 rounded-full bg-stone-100 border border-stone-200 text-stone-500 hover:text-red-600 hover:bg-red-50 hover:border-red-100 transition-all active:scale-95"
                title="Logout"
                >
                <LogOut className="w-5 h-5" />
                </button>
            </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 md:p-8 min-h-[calc(100vh-140px)] w-full max-w-4xl mx-auto">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
          {currentView === ViewState.TODAY && (
            <DailyTracker 
              currentDate={selectedDate} 
              logData={getLogContext(selectedDate)}
              onUpdateLog={handleUpdateLog}
            />
          )}
          {currentView === ViewState.TAPER && (
            <TaperGuide 
              schedule={taperSchedule}
              onUpdateSchedule={setTaperSchedule}
              startDate={protocolStartDate}
              onUpdateStartDate={setProtocolStartDate}
            />
          )}
          {currentView === ViewState.HISTORY && (
            <HistoryAnalytics logs={logs} />
          )}
        </div>
      </main>

      {/* Sync Status Footer Indicator */}
      <div className="fixed bottom-24 right-6 z-20 pointer-events-none">
         {syncStatus === 'syncing' && (
           <div className="bg-stone-900/80 backdrop-blur text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 shadow-lg animate-in fade-in slide-in-from-bottom-2">
             <RefreshCw className="w-3 h-3 animate-spin" /> Syncing...
           </div>
         )}
         {syncStatus === 'success' && (
           <div className="bg-green-500/90 backdrop-blur text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-1000">
             <Cloud className="w-3 h-3" /> Saved
           </div>
         )}
         {syncStatus === 'error' && (
            <div className="bg-red-500/90 backdrop-blur text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 shadow-lg animate-in fade-in slide-in-from-bottom-2">
             <CloudOff className="w-3 h-3" /> Sync Failed
           </div>
         )}
      </div>

      {/* Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 w-full bg-white/90 backdrop-blur-xl border-t border-stone-100 z-40 pb-safe shadow-[0_-8px_30px_-5px_rgba(0,0,0,0.03)]">
        <div className="max-w-4xl mx-auto px-6 flex justify-between items-center">
            <NavButton view={ViewState.TODAY} icon={LayoutDashboard} label="Daily" />
            <NavButton view={ViewState.HISTORY} icon={Activity} label="Analytics" />
            <NavButton view={ViewState.TAPER} icon={BookOpen} label="Protocol" />
        </div>
      </nav>
      
      <div className="h-6 w-full bg-white fixed bottom-0 left-0 right-0 -z-10" />
    </div>
  );
};

export default App;