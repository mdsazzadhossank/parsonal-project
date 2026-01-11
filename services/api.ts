
import { AppState, Transaction, Order, Account, VaultItem, DollarTransaction, PersonalDollarUsage } from "../types";

// Base API URL - Change this to your backend endpoint (e.g., PHP or Node.js bridge)
const API_BASE_URL = "/api"; 

/**
 * Note: Since this is a frontend, you will need a small PHP or Node.js script 
 * on your free panel to receive these requests and talk to MySQL.
 */

export const dbService = {
  // Fetch everything
  async getState(): Promise<AppState> {
    try {
      const response = await fetch(`${API_BASE_URL}/get_state.php`);
      if (!response.ok) throw new Error("Database offline");
      return await response.json();
    } catch (e) {
      console.warn("API failed, falling back to local simulation", e);
      const saved = localStorage.getItem('amar_hisab_data');
      return saved ? JSON.parse(saved) : { transactions: [], vault: [], dollarTransactions: [], orders: [], accounts: [], personalDollarUsage: [] };
    }
  },

  // Save specific modules
  async sync(module: keyof AppState, data: any) {
    try {
      await fetch(`${API_BASE_URL}/sync.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ module, data })
      });
      console.log(`Synced ${module} to MySQL`);
    } catch (e) {
      console.error(`Sync failed for ${module}`, e);
      // Fail-safe: update localStorage
    }
  }
};
