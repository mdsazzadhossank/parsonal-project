
import { GoogleGenAI } from "@google/genai";
import { Transaction, TransactionType } from "../types";

// Always use process.env.API_KEY directly for initialization
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `
        You are a personal financial expert assistant for a Bengali user. 
        Context: ${context}
        User Query: ${userMessage}
        Please respond in Bengali. Provide helpful, actionable financial advice, or answer the user's question about their spending based on the context provided.
      `,
    });
    // Accessing .text property directly as per guidelines
    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "দুঃখিত, এই মুহূর্তে এআই অ্যাসিস্ট্যান্ট কাজ করছে না। দয়া করে পরে চেষ্টা করুন।";
  }
};
