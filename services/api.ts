
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
      
      // Merge with default state to ensure no undefined values
      const merged = { ...defaultState, ...data };
      
      // Update local storage cache
      localStorage.setItem('amar_hisab_data', JSON.stringify(merged));
      return merged;
    } catch (e) {
      console.warn("MySQL fetch failed, falling back to LocalStorage:", e);
      const saved = localStorage.getItem('amar_hisab_data');
      return saved ? JSON.parse(saved) : defaultState;
    }
  },

  // Save specific modules to MySQL
  async sync(module: keyof AppState, data: any) {
    // 1. Update local storage first for instant feedback/persistence
    const saved = localStorage.getItem('amar_hisab_data');
    const currentState = saved ? JSON.parse(saved) : {};
    currentState[module] = data;
    localStorage.setItem('amar_hisab_data', JSON.stringify(currentState));

    // 2. Try to sync with MySQL Backend
    try {
      const response = await fetch(`${API_BASE_URL}/sync.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ module, data })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Sync failed');
      }
      
      console.log(`Cloud Sync Success: ${module}`);
      return true;
    } catch (e) {
      console.error(`Cloud Sync Failed for ${module}:`, e);
      // Even if it fails, data is safe in localStorage until next refresh
      return false;
    }
  }
};
