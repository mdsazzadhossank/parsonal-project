
import { GoogleGenAI } from "@google/genai";
import { Transaction, TransactionType } from "../types";

export const getFinancialAdvice = async (transactions: Transaction[], userMessage: string) => {
  const income = transactions
    .filter(t => t.type === TransactionType.INCOME)
    .reduce((sum, t) => sum + t.amount, 0);
  const expense = transactions
    .filter(t => t.type === TransactionType.EXPENSE)
    .reduce((sum, t) => sum + t.amount, 0);

  const context = `
    User's Current Financial Summary:
    Total Income: ${income}
    Total Expenses: ${expense}
    Net Balance: ${income - expense}
    Recent Transactions: ${JSON.stringify(transactions.slice(-5))}
  `;

  try {
    // Safety check for process.env
    const apiKey = typeof process !== 'undefined' && process.env ? process.env.API_KEY : null;
    
    if (!apiKey) {
      console.warn("Gemini API Key is missing. AI features will not work.");
      return "এআই অ্যাসিস্ট্যান্টের জন্য এপিআই কি (API Key) সেট করা নেই।";
    }

    const ai = new GoogleGenAI({ apiKey });
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `
        You are a personal financial expert assistant for a Bengali user. 
        Context: ${context}
        User Query: ${userMessage}
        Please respond in Bengali. Provide helpful, actionable financial advice, or answer the user's question about their spending based on the context provided.
      `,
    });
    
    return response.text || "আমি দুঃখিত, কোনো উত্তর তৈরি করা সম্ভব হয়নি।";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "দুঃখিত, এই মুহূর্তে এআই অ্যাসিস্ট্যান্ট কাজ করছে না। দয়া করে পরে চেষ্টা করুন।";
  }
};
