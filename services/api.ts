import { DailyLogEntry, TaperStep, UserSettings } from '../types';

// Use relative path. This ensures it looks for /api/index.php relative to the index.html
// e.g. https://domain.com/api/index.php or https://domain.com/subfolder/api/index.php
const API_BASE = 'api/index.php';

export const api = {
  async loadData(pin: string | null) {
    try {
      const headers: Record<string, string> = {};
      if (pin) headers['X-App-Pin'] = pin;

      const res = await fetch(`${API_BASE}?action=load`, { headers });
      const text = await res.text();

      if (!res.ok) {
        console.error("API Load Error:", res.status, text);
        // If 404, it means the file api/index.php is missing on the server
        return null;
      }

      try {
        const json = JSON.parse(text);
        
        // Handle explicit backend errors (e.g., Wrong Password)
        if (json.status === 'error') {
            console.error("Backend Error:", json.message, json.debug);
            alert(`Sync Error: ${json.message}\n\nDetails: ${json.debug || ''}`);
            return null;
        }

        return json.data || null;
      } catch (e) {
        console.error("JSON Parse Error. Response:", text);
        return null;
      }
    } catch (e) {
      console.warn("Offline/Network Error:", e);
      return null;
    }
  },

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
        
        if (json.status === 'error') {
             console.error("Save Error:", json.message, json.debug);
             alert(`Save Failed: ${json.message}`);
             return false;
        }

        return json.status === 'success';
      } catch (e) {
        console.error("JSON Parse Error (Save). Response:", text);
        return false;
      }
    } catch (e) {
      console.error("Network Error:", e);
      return false;
    }
  }
};