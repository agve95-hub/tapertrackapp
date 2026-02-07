export interface TaperStep {
  weeks: string;
  dose: number | string; // string for "Below 2.0"
  notes: string;
  isCritical?: boolean;
}

export interface ScheduleItem {
  id: string;
  time: string;
  label: string;
  items: string[];
  notes: string[];
  requiresBP?: boolean;
  conditional?: boolean; // For "Only if needed" items
}

export interface DailyLogEntry {
  date: string; // ISO String YYYY-MM-DD
  // Medication Adherence (Boolean map of schedule items completed)
  completedItems: Record<string, boolean>; 
  
  // Vitals & Ratings (Doc 2)
  lDose: number;
  bDose: string;
  sleepHrs: number;
  napMinutes?: number; // New: Nap duration
  anxietyLevel: number; // 1-10
  moodLevel: number; // 1-10
  depressionLevel?: number; // New: 1-10
  brainZapLevel?: number; // New: 0=None, 1=Mild, 2=Mod, 3=Severe
  smokingLevel: number; // 1-10
  
  // Blood Pressure & Heart Rate
  bpMorningSys?: number;
  bpMorningDia?: number;
  bpMorningPulse?: number;
  bpMorningIrregular?: boolean;
  
  bpNightSys?: number;
  bpNightDia?: number;
  bpNightPulse?: number;
  bpNightIrregular?: boolean;

  // Journal
  dailyNote?: string;
}

export interface UserSettings {
  isPinEnabled: boolean;
  pinCode: string | null;
  notificationsEnabled: boolean;
  notificationTime: string; // "08:00"
}

export enum ViewState {
  TODAY = 'TODAY',
  TAPER = 'TAPER',
  HISTORY = 'HISTORY',
}