
export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE'
}

export enum OrderStatus {
  PENDING = 'Pending payment',
  PROCESSING = 'Processing',
  ON_HOLD = 'On hold',
  COMPLETED = 'Completed',
  CANCELLED = 'Cancelled',
  REFUNDED = 'Refunded',
  FAILED = 'Failed'
}

export type AccountType = 'Mobile Wallet' | 'Bank' | 'Cash' | 'Other';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  accountNumber?: string;
  providerName?: string;
  note?: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  date: string;
  note: string;
  accountName?: string;
}

export interface VaultItem {
  id: string;
  siteName: string;
  username: string;
  password: string;
  note: string;
}

export interface DollarTransaction {
  id: string;
  buyRate: number;
  sellRate?: number;
  quantity: number;
  note: string;
  date: string;
  sellDate?: string;
  accountName?: string; // Track which account paid for this dollar purchase
}

export interface PersonalDollarUsage {
  id: string;
  amount: number;
  rate: number;
  purpose: string;
  date: string;
  note: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  amount: number;
  status: OrderStatus;
  date: string;
  note: string;
}

export interface AppState {
  transactions: Transaction[];
  vault: VaultItem[];
  dollarTransactions: DollarTransaction[];
  accounts?: Account[];
  personalDollarUsage?: PersonalDollarUsage[];
  orders?: Order[];
}
