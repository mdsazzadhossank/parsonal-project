
import { AppState } from "../types";

// URL to your PHP file. If in the same root on cPanel, this works. 
// If developing locally with a separate PHP server, put the full URL here (e.g., 'http://localhost/api.php')
const API_URL = './api.php'; 

export const api = {
  // Fetch all data on load
  getAllData: async (): Promise<AppState | null> => {
    try {
      const response = await fetch(`${API_URL}?action=get_all`);
      const result = await response.json();
      if (result.status === 'success') {
        // Ensure numbers are numbers because PHP sends everything as strings often
        const data = result.data;
        
        // Helper to parsing numbers safely
        const parseNum = (arr: any[], fields: string[]) => {
            return arr.map(item => {
                fields.forEach(f => {
                    if (item[f] !== null && item[f] !== undefined) item[f] = Number(item[f]);
                });
                return item;
            });
        };

        return {
          transactions: parseNum(data.transactions || [], ['amount']),
          orders: parseNum(data.orders || [], ['amount']),
          accounts: data.accounts || [],
          vault: data.vault || [],
          dollarTransactions: parseNum(data.dollarTransactions || [], ['buyRate', 'sellRate', 'quantity']),
          personalDollarUsage: parseNum(data.personalDollarUsage || [], ['amount', 'rate'])
        };
      }
      return null;
    } catch (error) {
      console.error("Failed to fetch data", error);
      return null;
    }
  },

  // Generic poster
  post: async (type: string, payload: any) => {
    try {
      await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, payload })
      });
    } catch (e) {
      console.error("API Error", e);
      alert("ডাটা সেভ করতে সমস্যা হয়েছে। ইন্টারনেট কানেকশন চেক করুন।");
    }
  }
};
