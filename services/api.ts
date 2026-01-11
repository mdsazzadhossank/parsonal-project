
import { AppState } from "../types";

const API_BASE_URL = "/api"; 

export const dbService = {
  // Fetch everything from MySQL
  async getState(): Promise<AppState> {
    const defaultState: AppState = { 
      transactions: [], 
      vault: [], 
      dollarTransactions: [], 
      orders: [], 
      accounts: [], 
      personalDollarUsage: [] 
    };

    try {
      const response = await fetch(`${API_BASE_URL}/get_state.php`);
      if (!response.ok) throw new Error("Backend connection failed");
      
      const data = await response.json();
      
      // Ensure data is an object before spreading
      const safeData = (data && typeof data === 'object') ? data : {};
      const merged = { ...defaultState, ...safeData };
      
      localStorage.setItem('amar_hisab_data', JSON.stringify(merged));
      return merged;
    } catch (e) {
      console.warn("MySQL fetch failed, falling back to LocalStorage:", e);
      try {
        const saved = localStorage.getItem('amar_hisab_data');
        if (saved) {
          const parsed = JSON.parse(saved);
          return { ...defaultState, ...(parsed || {}) };
        }
      } catch (jsonError) {
        console.error("LocalStorage JSON parse failed", jsonError);
      }
      return defaultState;
    }
  },

  // Save specific modules to MySQL
  async sync(module: keyof AppState, data: any) {
    try {
      // 1. Update local storage first
      const saved = localStorage.getItem('amar_hisab_data');
      const currentState = saved ? JSON.parse(saved) : {};
      currentState[module] = data;
      localStorage.setItem('amar_hisab_data', JSON.stringify(currentState));

      // 2. Try to sync with MySQL Backend
      const response = await fetch(`${API_BASE_URL}/sync.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ module, data })
      });
      
      if (!response.ok) throw new Error('Sync failed');
      return true;
    } catch (e) {
      console.error(`Cloud Sync Failed for ${module}:`, e);
      return false;
    }
  }
};
