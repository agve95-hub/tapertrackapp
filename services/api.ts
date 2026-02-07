import { DailyLogEntry, TaperStep, UserSettings } from '../types';

// Use absolute path to ensure we hit the domain root
const API_BASE = '/api/index.php';

export const api = {
  /**
   * Load all app data from the server
   */
  async loadData(pin: string | null) {
    try {
      const headers: Record<string, string> = {};
      if (pin) headers['X-App-Pin'] = pin;

      console.log("Attempting to load data from:", API_BASE);
      const res = await fetch(`${API_BASE}?action=load`, { headers });
      
      const text = await res.text(); // Get raw text first to debug

      if (!res.ok) {
        console.error("API Load Error:", res.status, text);
        return null;
      }

      try {
        const json = JSON.parse(text);
        return json.data || null;
      } catch (e) {
        console.error("JSON Parse Error (Load). Server response was:", text);
        return null;
      }
    } catch (e) {
      console.warn("Cloud sync failed (offline or network error):", e);
      return null;
    }
  },

  /**
   * Save all app data to the server
   */
  async saveData(
    data: {
      logs: DailyLogEntry[],
      schedule: TaperStep[],
      startDate: string,
      settings: UserSettings
    },
    pin: string | null
  ) {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (pin) headers['X-App-Pin'] = pin;

      const res = await fetch(`${API_BASE}?action=save`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });

      const text = await res.text();

      if (!res.ok) {
        console.error("API Save Error:", res.status, text);
        return false;
      }
      
      try {
        const json = JSON.parse(text);
        return json.status === 'success';
      } catch (e) {
        console.error("JSON Parse Error (Save). Server response was:", text);
        return false;
      }
    } catch (e) {
      console.error("Cloud save network error:", e);
      return false;
    }
  }
};