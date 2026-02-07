import { DailyLogEntry, TaperStep, UserSettings, AuthResponse } from '../types';

// Use ABSOLUTE path.
const API_BASE = '/api/index.php';

export const api = {
  // --- AUTH METHODS ---
  async register(username: string, pass: string): Promise<AuthResponse | null> {
      try {
          const res = await fetch(`${API_BASE}?action=register`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ username, password: pass })
          });
          
          // Catch HTML errors (Soft 404s)
          const text = await res.text();
          if (text.trim().startsWith("<")) {
             console.error("API Error (HTML returned):", text);
             alert("System Error: The server returned a webpage instead of JSON. Check if api/index.php exists.");
             return null;
          }

          const json = JSON.parse(text);
          if (json.status === 'success') return json.data;
          
          // SHOW TECHNICAL ERROR
          const errorMsg = json.debug 
            ? `${json.message}\n\nServer Response:\n${json.debug}` 
            : json.message;
            
          alert(errorMsg);
          return null;
      } catch (e) {
          console.error("Register Error", e);
          alert("Connection failed: Could not reach server.");
          return null;
      }
  },

  async login(username: string, pass: string): Promise<AuthResponse | null> {
    try {
        const res = await fetch(`${API_BASE}?action=login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password: pass })
        });
        const text = await res.text();
        
        try {
             const json = JSON.parse(text);
             if (json.status === 'success') return json.data;
             
             // SHOW TECHNICAL ERROR
             const errorMsg = json.debug 
                ? `${json.message}\n\nServer Response:\n${json.debug}` 
                : json.message;

             alert(errorMsg); 
             return null;
        } catch(e) {
             console.error("Login Parse Error", text);
             alert("Server Error: Invalid response from API.");
             return null;
        }
    } catch (e) {
        console.error("Login Error", e);
        alert("Connection failed: Could not reach server.");
        return null;
    }
  },

  // --- DATA METHODS ---
  async loadData(token: string) {
    try {
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      console.log("Loading data...");
      const res = await fetch(`${API_BASE}?action=load`, { headers });
      const text = await res.text();

      // Check for 404/HTML errors
      if (text.includes("404") || text.trim().startsWith("<!DOCTYPE")) {
         console.error("API Error", text);
         return null;
      }

      try {
        const json = JSON.parse(text);
        if (json.status === 'error') {
            if (json.message === 'Unauthorized') return 'UNAUTHORIZED';
            console.error("Backend Error:", json.message);
            return null;
        }
        return json.data || null;
      } catch (e) {
        console.error("JSON Parse Error", text);
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
    token: string
  ) {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE}?action=save`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });

      const text = await res.text();
      try {
        const json = JSON.parse(text);
        if (json.status === 'error') {
             console.error("Save Error:", json.message);
             return false;
        }
        return json.status === 'success';
      } catch (e) {
        return false;
      }
    } catch (e) {
      return false;
    }
  }
};