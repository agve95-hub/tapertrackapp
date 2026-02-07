import { DailyLogEntry, TaperStep, UserSettings } from '../types';

// Relative path assumes the 'api' folder is uploaded to the same root directory on the server
// When running 'npm run build', Vite will copy public/api/index.php to dist/api/index.php
const API_BASE = './api/index.php';

export const api = {
  /**
   * Load all app data from the server
   */
  async loadData(pin: string | null) {
    try {
      const headers: Record<string, string> = {};
      if (pin) headers['X-App-Pin'] = pin;

      const res = await fetch(`${API_BASE}?action=load`, { headers });
      
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        // If we get HTML back (like a 404 page), it means the API file isn't found or PHP failed hard
        console.warn("API Error: Received HTML instead of JSON. Check if api/index.php exists.");
        return null;
      }

      if (!res.ok) throw new Error('Failed to fetch data');
      
      const json = await res.json();
      return json.data || null;
    } catch (e) {
      console.warn("Cloud sync failed (offline or not hosted):", e);
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

      if (!res.ok) throw new Error('Failed to save data');
      
      const json = await res.json();
      return json.status === 'success';
    } catch (e) {
      console.error("Cloud save failed:", e);
      return false;
    }
  }
};