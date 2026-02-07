import React, { useState, useEffect, useRef } from 'react';
import { ViewState, DailyLogEntry, TaperStep, UserSettings } from './types';
import { TAPER_SCHEDULE } from './constants';
import DailyTracker from './components/DailyTracker';
import TaperGuide from './components/TaperGuide';
import HistoryAnalytics from './components/HistoryAnalytics';
import LoginScreen from './components/LoginScreen';
import SettingsModal from './components/SettingsModal';
import { api } from './services/api';
import { LayoutDashboard, Activity, BookOpen, ChevronLeft, ChevronRight, Settings, Cloud, CloudOff, RefreshCw } from 'lucide-react';

const STORAGE_KEY = 'taper_track_data_v1';
const SCHEDULE_KEY = 'taper_schedule_custom_v1';
const START_DATE_KEY = 'taper_start_date_v1';
const SETTINGS_KEY = 'taper_settings_v1';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.TODAY);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  // Data State
  const [logs, setLogs] = useState<DailyLogEntry[]>([]);
  const [taperSchedule, setTaperSchedule] = useState<TaperStep[]>(TAPER_SCHEDULE);
  const [protocolStartDate, setProtocolStartDate] = useState<string>('');
  
  // Settings & Auth State
  const [userSettings, setUserSettings] = useState<UserSettings>({
    isPinEnabled: false,
    pinCode: null,
    notificationsEnabled: false,
    notificationTime: '09:00'
  });
  const [isAppLocked, setIsAppLocked] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Sync State
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error' | 'success'>('idle');
  const saveTimeoutRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Notification Timer Ref
  const notificationInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // INITIAL LOAD
  useEffect(() => {
    const initializeApp = async () => {
      // 1. Load Local
      const localLogs = localStorage.getItem(STORAGE_KEY);
      const localSchedule = localStorage.getItem(SCHEDULE_KEY);
      const localStart = localStorage.getItem(START_DATE_KEY);
      const localSettings = localStorage.getItem(SETTINGS_KEY);

      let parsedSettings = localSettings ? JSON.parse(localSettings) : userSettings;

      if (localLogs) setLogs(JSON.parse(localLogs));
      if (localSchedule) setTaperSchedule(JSON.parse(localSchedule));
      if (localStart) setProtocolStartDate(localStart);
      if (localSettings) setUserSettings(parsedSettings);

      // Lock Logic
      if (!parsedSettings.isPinEnabled || !parsedSettings.pinCode) {
        setIsAppLocked(false);
      }

      // 2. Try Cloud Load (Background)
      // We pass the PIN if it exists to authenticate the read
      const cloudData = await api.loadData(parsedSettings.pinCode);
      if (cloudData) {
        if (cloudData.logs) setLogs(cloudData.logs);
        if (cloudData.schedule) setTaperSchedule(cloudData.schedule);
        if (cloudData.startDate) setProtocolStartDate(cloudData.startDate);
        if (cloudData.settings) {
            setUserSettings(cloudData.settings);
            // Re-evaluate lock if cloud settings differ (optional, usually we stick to local first for speed)
        }
        setSyncStatus('success');
      }

      setIsLoaded(true);
    };

    initializeApp();
  }, []);

  // SAVE & SYNC LOGIC
  useEffect(() => {
    if (isLoaded) {
      // 1. Local Save Immediate
      localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
      localStorage.setItem(SCHEDULE_KEY, JSON.stringify(taperSchedule));
      localStorage.setItem(START_DATE_KEY, protocolStartDate);
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(userSettings));

      // 2. Cloud Save Debounced (2 seconds)
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      
      setSyncStatus('syncing');
      saveTimeoutRef.current = setTimeout(async () => {
        const success = await api.saveData({
          logs,
          schedule: taperSchedule,
          startDate: protocolStartDate,
          settings: userSettings
        }, userSettings.pinCode);
        
        setSyncStatus(success ? 'success' : 'error');
      }, 2000);
    }
  }, [logs, taperSchedule, protocolStartDate, userSettings, isLoaded]);

  // Notification Logic
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

  // Handlers
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

  if (!isLoaded) return <div className="min-h-screen bg-stone-50" />;

  if (isAppLocked && userSettings.isPinEnabled && userSettings.pinCode) {
    return (
      <LoginScreen 
        storedPin={userSettings.pinCode} 
        onSuccess={() => setIsAppLocked(false)} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#fcfcfc] text-stone-800 font-sans max-w-5xl mx-auto relative shadow-2xl shadow-stone-200 border-x border-stone-100">
      
      <SettingsModal 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)}
        settings={userSettings}
        onSave={setUserSettings}
      />

      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-stone-100 px-6 py-4 flex items-center justify-between transition-all">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 ring-1 ring-white/50">
             <Activity className="text-white w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-stone-900 leading-none tracking-tight">
              TaperTrack
            </h1>
            <p className="text-[10px] text-stone-500 font-semibold tracking-wider uppercase mt-1">Wellness Protocol</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
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
      <nav className="fixed bottom-0 left-0 right-0 max-w-5xl mx-auto bg-white/90 backdrop-blur-xl border-t border-stone-200/80 flex justify-between items-center z-40 pb-safe px-6 shadow-[0_-8px_30px_-5px_rgba(0,0,0,0.03)]">
        <NavButton view={ViewState.TODAY} icon={LayoutDashboard} label="Daily" />
        <NavButton view={ViewState.HISTORY} icon={Activity} label="Analytics" />
        <NavButton view={ViewState.TAPER} icon={BookOpen} label="Protocol" />
      </nav>
      
      <div className="h-6 w-full bg-white fixed bottom-0 left-0 right-0 -z-10" />
    </div>
  );
};

export default App;