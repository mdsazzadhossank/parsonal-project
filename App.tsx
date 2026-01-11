
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Wallet, 
  TrendingDown, 
  Lock, 
  Bot, 
  Trash2, 
  Eye, 
  EyeOff,
  Menu,
  X,
  RefreshCw,
  TrendingUp,
  DollarSign,
  Phone,
  Building2,
  Coins,
  CheckCircle2,
  Clock,
  ShoppingBag,
  Package,
  CheckCircle,
  CreditCard,
  Banknote,
  Loader2
} from 'lucide-react';
import { Transaction, TransactionType, VaultItem, DollarTransaction, Account, AccountType, PersonalDollarUsage, Order, OrderStatus } from './types';
import { getFinancialAdvice } from './services/gemini';
import { api } from './services/api';

// --- Sub-components ---

const SidebarItem: React.FC<{ 
  icon: React.ReactNode; 
  label: string; 
  active: boolean; 
  onClick: () => void 
}> = ({ icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
      active 
        ? 'bg-blue-600 text-white shadow-md' 
        : 'text-slate-600 hover:bg-blue-50 hover:text-blue-600'
    }`}
  >
    {icon}
    <span className="font-medium">{label}</span>
  </button>
);

const Card: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-slate-100 p-6 ${className}`}>
    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">{title}</h3>
    {children}
  </div>
);

const StatCard: React.FC<{ label: string; value: number; icon: React.ReactNode; color: string; prefix?: string }> = ({ label, value, icon, color, prefix = "৳" }) => (
  <div className={`bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex items-center space-x-4`}>
    <div className={`p-3 rounded-full ${color} bg-opacity-10 text-${color.split('-')[1]}-600`}>
      {icon}
    </div>
    <div>
      <p className="text-sm text-slate-500 font-medium">{label}</p>
      <p className="text-2xl font-bold text-slate-800">{prefix}{value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
    </div>
  </div>
);

const StatusBadge: React.FC<{ status: OrderStatus }> = ({ status }) => {
  const styles: Record<OrderStatus, string> = {
    [OrderStatus.PENDING]: 'bg-slate-100 text-slate-600 border-slate-200',
    [OrderStatus.PROCESSING]: 'bg-blue-100 text-blue-700 border-blue-200',
    [OrderStatus.ON_HOLD]: 'bg-orange-100 text-orange-700 border-orange-200',
    [OrderStatus.COMPLETED]: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    [OrderStatus.CANCELLED]: 'bg-rose-100 text-rose-700 border-rose-200',
    [OrderStatus.REFUNDED]: 'bg-slate-200 text-slate-700 border-slate-300',
    [OrderStatus.FAILED]: 'bg-slate-900 text-white border-slate-900',
  };

  return (
    <span className={`px-2 py-1 rounded-md text-[11px] font-bold uppercase border ${styles[status]}`}>
      {status}
    </span>
  );
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'income' | 'expense' | 'vault' | 'ai' | 'dollar' | 'accounts' | 'personal_dollar' | 'orders'>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Data States
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [vault, setVault] = useState<VaultItem[]>([]);
  const [dollarTransactions, setDollarTransactions] = useState<DollarTransaction[]>([]);
  const [personalDollarUsage, setPersonalDollarUsage] = useState<PersonalDollarUsage[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [showPasswordMap, setShowPasswordMap] = useState<Record<string, boolean>>({});

  // Calculator States
  const [calcTaka, setCalcTaka] = useState<string>('');
  const [calcRate, setCalcRate] = useState<string>('');
  const [rateCalcTaka, setRateCalcTaka] = useState<string>('');
  const [rateCalcDollar, setRateCalcDollar] = useState<string>('');

  // Editing Sell Price State
  const [editingSellId, setEditingSellId] = useState<string | null>(null);
  const [tempSellRate, setTempSellRate] = useState<string>('');

  // AI State
  const [aiQuery, setAiQuery] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // Load data from MySQL API
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      const data = await api.getAllData();
      if (data) {
        setTransactions(data.transactions);
        setVault(data.vault);
        setDollarTransactions(data.dollarTransactions);
        setPersonalDollarUsage(data.personalDollarUsage || []);
        setOrders(data.orders || []);
        if (data.accounts && data.accounts.length > 0) {
            setAccounts(data.accounts);
        } else {
            // Default accounts if DB is empty
            const defaults: Account[] = [
                { id: '1', name: 'বিকাশ পার্সোনাল', type: 'Mobile Wallet', accountNumber: '017XXXXXXXX', providerName: 'bKash' },
                { id: '2', name: 'নগদ পার্সোনাল', type: 'Mobile Wallet', accountNumber: '019XXXXXXXX', providerName: 'Nagad' },
                { id: '3', name: 'আমার ব্যাংক', type: 'Bank', accountNumber: '123456789', providerName: 'Brac Bank' },
                { id: '4', name: 'নগদ টাকা (ক্যাশ)', type: 'Cash', providerName: 'Cash' }
            ];
            setAccounts(defaults);
            // Sync defaults to DB (optional, but good for first run)
            defaults.forEach(acc => api.post('add_account', acc));
        }
      }
      setIsLoading(false);
    };
    loadData();
  }, []);

  const addTransaction = (type: TransactionType, amount: number, category: string, note: string, accountName: string) => {
    const newTx: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      amount,
      category,
      note,
      accountName,
      date: new Date().toISOString().split('T')[0]
    };
    setTransactions(prev => [newTx, ...prev]);
    api.post('add_transaction', newTx);
  };

  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
    api.post('delete_transaction', { id });
  };

  const addOrder = (orderNumber: string, customerName: string, amount: number, status: OrderStatus, note: string) => {
    const newOrder: Order = {
      id: Math.random().toString(36).substr(2, 9),
      orderNumber,
      customerName,
      amount,
      status,
      note,
      date: new Date().toISOString().split('T')[0]
    };
    setOrders(prev => [newOrder, ...prev]);
    api.post('add_order', newOrder);
  };

  const updateOrderStatus = (id: string, status: OrderStatus) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
    api.post('update_order_status', { id, status });
  };

  const deleteOrder = (id: string) => {
    setOrders(prev => prev.filter(o => o.id !== id));
    api.post('delete_order', { id });
  };

  const addVaultItem = (siteName: string, username: string, password: string, note: string) => {
    const newItem: VaultItem = {
      id: Math.random().toString(36).substr(2, 9),
      siteName,
      username,
      password,
      note
    };
    setVault(prev => [newItem, ...prev]);
    api.post('add_vault', newItem);
  };

  const deleteVaultItem = (id: string) => {
    setVault(prev => prev.filter(v => v.id !== id));
    api.post('delete_vault', { id });
  };

  const addDollarTx = (buyRate: number, sellRate: number | undefined, quantity: number, note: string, accountName?: string) => {
    const newTx: DollarTransaction = {
      id: Math.random().toString(36).substr(2, 9),
      buyRate,
      sellRate: sellRate || undefined,
      quantity,
      note,
      accountName,
      date: new Date().toISOString().split('T')[0]
    };

    // Automatically add an expense transaction if an account is selected
    if (accountName) {
      const totalCost = buyRate * quantity;
      addTransaction(TransactionType.EXPENSE, totalCost, "ডলার ক্রয়", `কেনা হয়েছে: ${quantity}$ (রেট: ${buyRate})`, accountName);
    }

    setDollarTransactions(prev => [newTx, ...prev]);
    api.post('add_dollar_tx', newTx);
  };

  const updateDollarSellRate = (id: string, sellRate: number) => {
    const sellDate = new Date().toISOString().split('T')[0];
    setDollarTransactions(prev => prev.map(t => 
      t.id === id ? { ...t, sellRate, sellDate } : t
    ));
    setEditingSellId(null);
    setTempSellRate('');
    api.post('update_dollar_sell', { id, sellRate, sellDate });
  };

  const deleteDollarTx = (id: string) => {
    setDollarTransactions(prev => prev.filter(t => t.id !== id));
    api.post('delete_dollar_tx', { id });
  };

  const addPersonalDollarUsage = (amount: number, rate: number, purpose: string, note: string) => {
    const newItem: PersonalDollarUsage = {
      id: Math.random().toString(36).substr(2, 9),
      amount,
      rate,
      purpose,
      note,
      date: new Date().toISOString().split('T')[0]
    };
    setPersonalDollarUsage(prev => [newItem, ...prev]);
    api.post('add_personal_dollar', newItem);
  };

  const deletePersonalDollarUsage = (id: string) => {
    setPersonalDollarUsage(prev => prev.filter(u => u.id !== id));
    api.post('delete_personal_dollar', { id });
  };

  const addAccount = (account: Omit<Account, 'id'>) => {
    const newAccount: Account = {
      ...account,
      id: Math.random().toString(36).substr(2, 9)
    };
    setAccounts(prev => [...prev, newAccount]);
    api.post('add_account', newAccount);
  };

  const deleteAccount = (id: string) => {
    setAccounts(prev => prev.filter(a => a.id !== id));
    api.post('delete_account', { id });
  };

  const togglePasswordVisibility = (id: string) => {
    setShowPasswordMap(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAiAsk = async () => {
    if (!aiQuery.trim()) return;
    setAiLoading(true);
    setAiResponse('');
    const advice = await getFinancialAdvice(transactions, aiQuery);
    setAiResponse(advice || "দুঃখিত, কোনো উত্তর পাওয়া যায়নি।");
    setAiLoading(false);
  };

  // Calculations
  const totalIncome = transactions.filter(t => t.type === TransactionType.INCOME).reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === TransactionType.EXPENSE).reduce((s, t) => s + t.amount, 0);
  const balance = totalIncome - totalExpense;

  // Dollar specific stats
  const soldTxs = dollarTransactions.filter(t => t.sellRate !== undefined);
  const holdingTxs = dollarTransactions.filter(t => t.sellRate === undefined);
  
  const totalDollarProfit = soldTxs.reduce((acc, curr) => acc + (curr.sellRate! - curr.buyRate) * curr.quantity, 0);
  const totalHoldingDollars = holdingTxs.reduce((acc, curr) => acc + curr.quantity, 0);
  const totalHoldingInvestment = holdingTxs.reduce((acc, curr) => acc + (curr.buyRate * curr.quantity), 0);

  // Personal Dollar Stats
  const totalPersonalDollarSpent = personalDollarUsage.reduce((s, u) => s + u.amount, 0);
  const totalPersonalTakaSpent = personalDollarUsage.reduce((s, u) => s + (u.amount * u.rate), 0);

  // Order Stats
  const totalOrdersCount = orders.length;
  const totalOrderSales = orders.filter(o => o.status === OrderStatus.COMPLETED).reduce((s, o) => s + o.amount, 0);

  const calculatedDollarResult = (Number(calcTaka) && Number(calcRate)) ? Number(calcTaka) / Number(calcRate) : 0;
  const calculatedRateResult = (Number(rateCalcTaka) && Number(rateCalcDollar)) ? Number(rateCalcTaka) / Number(rateCalcDollar) : 0;

  const getAccountBalance = (accountName: string) => {
    const inc = transactions.filter(t => t.type === TransactionType.INCOME && t.accountName === accountName).reduce((s, t) => s + t.amount, 0);
    const exp = transactions.filter(t => t.type === TransactionType.EXPENSE && t.accountName === accountName).reduce((s, t) => s + t.amount, 0);
    return inc - exp;
  };

  const getAccountIcon = (type: AccountType) => {
    switch (type) {
      case 'Mobile Wallet': return <Phone size={24} />;
      case 'Bank': return <Building2 size={24} />;
      case 'Cash': return <Coins size={24} />;
      default: return <CreditCard size={24} />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-500">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
        <p className="font-hind">ডাটাবেস থেকে তথ্য লোড হচ্ছে...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 bg-white rounded-lg shadow-md border border-slate-200">
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6">
          <h1 className="text-2xl font-bold text-blue-700 flex items-center gap-2"><Wallet className="w-8 h-8" />আমার হিসাব</h1>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">Database Edition</p>
        </div>
        <nav className="mt-4 px-4 space-y-2 overflow-y-auto max-h-[calc(100vh-250px)]">
          <SidebarItem icon={<LayoutDashboard size={20} />} label="ড্যাশবোর্ড" active={activeTab === 'dashboard'} onClick={() => { setActiveTab('dashboard'); setSidebarOpen(false); }} />
          <SidebarItem icon={<Package size={20} />} label="অর্ডার ম্যানেজমেন্ট" active={activeTab === 'orders'} onClick={() => { setActiveTab('orders'); setSidebarOpen(false); }} />
          <SidebarItem icon={<CreditCard size={20} />} label="অ্যাকাউন্টস" active={activeTab === 'accounts'} onClick={() => { setActiveTab('accounts'); setSidebarOpen(false); }} />
          <SidebarItem icon={<Wallet size={20} />} label="আয়ের তালিকা" active={activeTab === 'income'} onClick={() => { setActiveTab('income'); setSidebarOpen(false); }} />
          <SidebarItem icon={<TrendingDown size={20} />} label="ব্যয়ের তালিকা" active={activeTab === 'expense'} onClick={() => { setActiveTab('expense'); setSidebarOpen(false); }} />
          <SidebarItem icon={<RefreshCw size={20} />} label="ডলার বাই-সেল" active={activeTab === 'dollar'} onClick={() => { setActiveTab('dollar'); setSidebarOpen(false); }} />
          <SidebarItem icon={<ShoppingBag size={20} />} label="পার্সোনাল ডলার ইউজ" active={activeTab === 'personal_dollar'} onClick={() => { setActiveTab('personal_dollar'); setSidebarOpen(false); }} />
          <SidebarItem icon={<Lock size={20} />} label="পাসওয়ার্ড ভল্ট" active={activeTab === 'vault'} onClick={() => { setActiveTab('vault'); setSidebarOpen(false); }} />
          <div className="pt-4 mt-4 border-t border-slate-100">
            <SidebarItem icon={<Bot size={20} />} label="এআই অ্যাসিস্ট্যান্ট" active={activeTab === 'ai'} onClick={() => { setActiveTab('ai'); setSidebarOpen(false); }} />
          </div>
        </nav>
        <div className="absolute bottom-8 left-0 w-full px-6">
          <div className="bg-blue-50 p-4 rounded-xl">
            <p className="text-xs font-medium text-blue-600 mb-1">মোট ব্যালেন্স</p>
            <p className="text-xl font-bold text-blue-900">৳{balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          </div>
        </div>
      </aside>

      <main className="flex-1 lg:ml-64 p-4 lg:p-8 mt-12 lg:mt-0">
        {/* Dashboard */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-fadeIn">
            <header><h2 className="text-2xl font-bold text-slate-800">ওভারভিউ</h2><p className="text-slate-500">আপনার আর্থিক অবস্থার সংক্ষিপ্ত রূপ</p></header>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard label="মোট আয়" value={totalIncome} icon={<Wallet />} color="bg-emerald-500" />
              <StatCard label="মোট ব্যয়" value={totalExpense} icon={<TrendingDown />} color="bg-rose-500" />
              <StatCard label="অর্ডার সেলস" value={totalOrderSales} icon={<Package />} color="bg-orange-500" />
              <StatCard label="মোট ব্যালেন্স" value={balance} icon={<LayoutDashboard />} color="bg-blue-500" />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card title="সাম্প্রতিক অর্ডার">
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                  {orders.length === 0 ? <p className="text-slate-400 text-center py-10">কোনো অর্ডার পাওয়া যায়নি</p> : 
                    orders.slice(0, 5).map(o => (
                      <div key={o.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-white rounded-lg shadow-xs">
                             <Package size={18} className="text-slate-400" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-800">#{o.orderNumber} - {o.customerName}</p>
                            <p className="text-xs text-slate-500">{o.date}</p>
                          </div>
                        </div>
                        <StatusBadge status={o.status} />
                      </div>
                    ))
                  }
                </div>
              </Card>
              <Card title="অ্যাকাউন্ট ব্যালেন্স">
                <div className="space-y-3">
                  {accounts.map(acc => (
                    <div key={acc.id} className="flex justify-between items-center p-3 border-b border-slate-50">
                      <div className="flex items-center gap-3">
                        <div className="text-blue-500">{getAccountIcon(acc.type)}</div>
                        <div>
                          <p className="font-bold text-slate-700">{acc.name}</p>
                          <p className="text-[10px] text-slate-400 uppercase font-bold">{acc.providerName}</p>
                        </div>
                      </div>
                      <p className="font-black text-slate-800">৳{getAccountBalance(acc.name).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Orders View */}
        {activeTab === 'orders' && (
          <div className="space-y-6 animate-fadeIn">
            <header>
              <h2 className="text-2xl font-bold text-slate-800">অর্ডার ম্যানেজমেন্ট (WP Style)</h2>
              <p className="text-slate-500">আপনার স্টোরের সকল অর্ডারের তথ্য ম্যানেজ করুন</p>
            </header>

            <Card title="নতুন অর্ডার যোগ করুন">
              <form className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4" onSubmit={(e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                addOrder(
                  (form.elements.namedItem('orderNum') as HTMLInputElement).value,
                  (form.elements.namedItem('customer') as HTMLInputElement).value,
                  Number((form.elements.namedItem('amount') as HTMLInputElement).value),
                  (form.elements.namedItem('status') as HTMLSelectElement).value as OrderStatus,
                  (form.elements.namedItem('note') as HTMLInputElement).value
                );
                form.reset();
              }}>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">অর্ডার নাম্বার</label>
                  <input name="orderNum" type="text" placeholder="যেমন: 1234" required className="w-full px-3 py-2 text-sm rounded-lg border outline-none focus:ring-1 focus:ring-blue-500" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">কাস্টমার নাম</label>
                  <input name="customer" type="text" placeholder="নাম" required className="w-full px-3 py-2 text-sm rounded-lg border outline-none focus:ring-1 focus:ring-blue-500" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">টাকার পরিমাণ</label>
                  <input name="amount" type="number" placeholder="৳" required className="w-full px-3 py-2 text-sm rounded-lg border outline-none focus:ring-1 focus:ring-blue-500" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">স্ট্যাটাস</label>
                  <select name="status" className="w-full px-3 py-2 text-sm rounded-lg border outline-none bg-white">
                    {Object.values(OrderStatus).map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <button type="submit" className="w-full bg-slate-800 text-white px-4 py-2 text-sm rounded-lg font-bold hover:bg-slate-900 transition-colors">অর্ডার সেভ করুন</button>
                </div>
              </form>
            </Card>

            <Card title="সকল অর্ডারের তালিকা">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="text-slate-400 border-b border-slate-100 text-xs uppercase tracking-wider">
                    <tr>
                      <th className="pb-4 font-bold">অর্ডার</th>
                      <th className="pb-4 font-bold">কাস্টমার</th>
                      <th className="pb-4 font-bold">তারিখ</th>
                      <th className="pb-4 font-bold">স্ট্যাটাস</th>
                      <th className="pb-4 font-bold text-right">টোটাল</th>
                      <th className="pb-4 font-bold text-center">অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {orders.map(o => (
                      <tr key={o.id} className="hover:bg-slate-50 group">
                        <td className="py-4">
                          <span className="font-bold text-blue-600 cursor-pointer hover:underline">#{o.orderNumber}</span>
                        </td>
                        <td className="py-4 font-medium text-slate-700">{o.customerName}</td>
                        <td className="py-4 text-slate-500 text-sm">{o.date}</td>
                        <td className="py-4">
                           <div className="flex items-center gap-2">
                              <StatusBadge status={o.status} />
                              <select 
                                value={o.status} 
                                onChange={(e) => updateOrderStatus(o.id, e.target.value as OrderStatus)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] border rounded bg-white px-1 outline-none"
                              >
                                 {Object.values(OrderStatus).map(s => <option key={s} value={s}>{s}</option>)}
                              </select>
                           </div>
                        </td>
                        <td className="py-4 text-right font-black text-slate-800">৳{o.amount.toLocaleString()}</td>
                        <td className="py-4 text-center">
                          <button onClick={() => deleteOrder(o.id)} className="text-slate-200 hover:text-rose-600 transition-colors">
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* Dollar Trading View */}
        {activeTab === 'dollar' && (
           <div className="space-y-6 animate-fadeIn">
              <header><h2 className="text-2xl font-bold text-slate-800">ডলার ইনভেস্টমেন্ট ও ট্রেডিং</h2></header>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard label="ট্রেডিং প্রফিট (৳)" value={totalDollarProfit} icon={<TrendingUp />} color="bg-indigo-500" />
                <StatCard label="হোল্ডিং ডলার ($)" value={totalHoldingDollars} icon={<DollarSign />} color="bg-orange-500" prefix="$" />
                <StatCard label="হোল্ডিং ইনভেস্টমেন্ট (৳)" value={totalHoldingInvestment} icon={<Wallet />} color="bg-blue-500" />
              </div>

              <Card title="নতুন ডলার বাই/সেল রেকর্ড করুন">
                <form className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4" onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.target as HTMLFormElement;
                  const buy = Number((form.elements.namedItem('buy') as HTMLInputElement).value);
                  const qty = Number((form.elements.namedItem('qty') as HTMLInputElement).value);
                  const sell = (form.elements.namedItem('sell') as HTMLInputElement).value;
                  const acc = (form.elements.namedItem('acc') as HTMLSelectElement).value;
                  addDollarTx(buy, sell ? Number(sell) : undefined, qty, "", acc || undefined);
                  form.reset();
                }}>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">ক্রয় মূল্য (৳)</label>
                    <input name="buy" type="number" step="any" placeholder="৳ রেট" required className="w-full px-4 py-2 text-sm border rounded-lg outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">পরিমাণ ($)</label>
                    <input name="qty" type="number" step="any" placeholder="কত ডলার" required className="w-full px-4 py-2 text-sm border rounded-lg outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">বিক্রয় মূল্য (ঐচ্ছিক)</label>
                    <input name="sell" type="number" step="any" placeholder="খালি রাখলে হোল্ডিং" className="w-full px-4 py-2 text-sm border rounded-lg outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">অ্যাকাউন্ট সিলেক্ট করুন</label>
                    <select name="acc" className="w-full px-4 py-2 text-sm border rounded-lg outline-none bg-white">
                       <option value="">সিলেক্ট করুন (ঐচ্ছিক)</option>
                       {accounts.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button type="submit" className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-indigo-700 transition-colors">সেভ করুন</button>
                  </div>
                </form>
              </Card>

              <Card title="ডলার লেনদেন এবং হোল্ডিং তালিকা">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="text-slate-400 border-b border-slate-100 text-xs uppercase tracking-wider">
                      <tr>
                        <th className="pb-4 font-bold">তারিখ</th>
                        <th className="pb-4 font-bold">অ্যাকাউন্ট</th>
                        <th className="pb-4 font-bold text-center">পরিমাণ ($)</th>
                        <th className="pb-4 font-bold text-right">ক্রয় (৳)</th>
                        <th className="pb-4 font-bold text-right">বিক্রয় (৳)</th>
                        <th className="pb-4 font-bold text-right">লাভ/অবস্থা</th>
                        <th className="pb-4 font-bold text-center">অ্যাকশন</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {dollarTransactions.map(t => {
                        const isHolding = t.sellRate === undefined;
                        const profit = isHolding ? 0 : (t.sellRate! - t.buyRate) * t.quantity;
                        
                        return (
                          <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-4 text-slate-500 text-xs">{t.date}</td>
                            <td className="py-4 text-xs font-medium text-slate-600">{t.accountName || '-'}</td>
                            <td className="py-4 font-bold text-slate-800 text-center">${t.quantity.toLocaleString()}</td>
                            <td className="py-4 text-right text-slate-600 text-sm">৳{t.buyRate.toFixed(2)}</td>
                            <td className="py-4 text-right">
                              {editingSellId === t.id ? (
                                <div className="flex items-center justify-end gap-2">
                                  <input 
                                    type="number" 
                                    value={tempSellRate} 
                                    onChange={(e) => setTempSellRate(e.target.value)}
                                    className="w-20 px-2 py-1 border rounded outline-none text-xs"
                                    placeholder="রেট"
                                    autoFocus
                                  />
                                  <button 
                                    onClick={() => updateDollarSellRate(t.id, Number(tempSellRate))}
                                    className="text-emerald-600 hover:text-emerald-700"
                                  >
                                    <CheckCircle size={18}/>
                                  </button>
                                  <button onClick={() => setEditingSellId(null)} className="text-rose-500"><X size={18}/></button>
                                </div>
                              ) : (
                                isHolding ? (
                                  <button 
                                    onClick={() => { setEditingSellId(t.id); setTempSellRate(''); }}
                                    className="bg-amber-50 text-amber-600 text-[10px] px-2 py-1 rounded font-bold uppercase border border-amber-200 hover:bg-amber-100 transition-colors"
                                  >
                                    Sell Now
                                  </button>
                                ) : <span className="text-sm">৳{t.sellRate!.toFixed(2)}</span>
                              )}
                            </td>
                            <td className="py-4 text-right font-bold">
                              {isHolding ? (
                                <span className="text-blue-500 text-[10px] flex items-center justify-end gap-1 font-bold uppercase">
                                   <Clock size={12}/> Holding
                                </span>
                              ) : (
                                <span className={profit >= 0 ? 'text-emerald-600 text-sm' : 'text-rose-600 text-sm'}>
                                  ৳{profit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </span>
                              )}
                            </td>
                            <td className="py-4 text-center">
                              <button onClick={() => deleteDollarTx(t.id)} className="text-slate-200 hover:text-rose-600">
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {dollarTransactions.length === 0 && (
                        <tr><td colSpan={7} className="py-10 text-center text-slate-400">কোনো লেনদেন পাওয়া যায়নি</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <Card title="টাকা টু ডলার ক্যালকুলেটর" className="bg-slate-50 border-dashed border-2">
                    <div className="space-y-4">
                      <input type="number" placeholder="৳ টাকার পরিমাণ" value={calcTaka} onChange={(e) => setCalcTaka(e.target.value)} className="w-full px-4 py-2 rounded-xl border outline-none" />
                      <input type="number" placeholder="৳ রেট" value={calcRate} onChange={(e) => setCalcRate(e.target.value)} className="w-full px-4 py-2 rounded-xl border outline-none" />
                      <div className="p-4 bg-white rounded-xl text-center shadow-sm">
                        <p className="text-[10px] font-bold text-slate-400">আপনি পাবেন</p>
                        <p className="text-3xl font-black text-blue-600">${calculatedDollarResult.toFixed(4)}</p>
                      </div>
                    </div>
                  </Card>
                  <Card title="ডলার রেট ক্যালকুলেটর" className="bg-slate-50 border-dashed border-2">
                    <div className="space-y-4">
                      <input type="number" placeholder="৳ মোট টাকা" value={rateCalcTaka} onChange={(e) => setRateCalcTaka(e.target.value)} className="w-full px-4 py-2 rounded-xl border outline-none" />
                      <input type="number" placeholder="$ মোট ডলার" value={rateCalcDollar} onChange={(e) => setRateCalcDollar(e.target.value)} className="w-full px-4 py-2 rounded-xl border outline-none" />
                      <div className="p-4 bg-white rounded-xl text-center shadow-sm">
                        <p className="text-[10px] font-bold text-slate-400">প্রতি ডলার রেট</p>
                        <p className="text-3xl font-black text-indigo-600">৳{calculatedRateResult.toFixed(2)}</p>
                      </div>
                    </div>
                  </Card>
              </div>
           </div>
        )}

        {/* Account View */}
        {activeTab === 'accounts' && (
          <div className="space-y-6 animate-fadeIn">
             <header><h2 className="text-2xl font-bold text-slate-800">অ্যাকাউন্টস এবং ডিটেইলস</h2></header>
             <Card title="নতুন অ্যাকাউন্ট যোগ করুন">
              <form className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" onSubmit={(e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                addAccount({
                  name: (form.elements.namedItem('accName') as HTMLInputElement).value,
                  type: (form.elements.namedItem('accType') as HTMLSelectElement).value as AccountType,
                  providerName: (form.elements.namedItem('provider') as HTMLInputElement).value,
                  accountNumber: (form.elements.namedItem('accNum') as HTMLInputElement).value,
                });
                form.reset();
              }}>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">নাম</label>
                  <input name="accName" type="text" required className="w-full px-4 py-2 rounded-lg border outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">ধরন</label>
                  <select name="accType" className="w-full px-4 py-2 rounded-lg border outline-none bg-white">
                    <option value="Mobile Wallet">মোবাইল ওয়ালেট</option>
                    <option value="Bank">ব্যাংক</option>
                    <option value="Cash">ক্যাশ</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">প্রোভাইডার</label>
                  <input name="provider" type="text" required className="w-full px-4 py-2 rounded-lg border outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">নাম্বার</label>
                  <input name="accNum" type="text" className="w-full px-4 py-2 rounded-lg border outline-none" />
                </div>
                <div className="lg:col-span-2 flex items-end">
                  <button type="submit" className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-bold">সেভ করুন</button>
                </div>
              </form>
            </Card>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {accounts.map(acc => (
                <div key={acc.id} className="bg-white p-6 rounded-2xl border relative">
                  <button onClick={() => deleteAccount(acc.id)} className="absolute top-4 right-4 text-slate-200 hover:text-rose-600"><Trash2 size={18}/></button>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">{getAccountIcon(acc.type)}</div>
                    <div>
                      <h4 className="font-bold text-slate-800">{acc.name}</h4>
                      <p className="text-xs text-blue-500 uppercase font-bold">{acc.providerName}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {acc.accountNumber && <p className="text-sm font-mono text-slate-600">ID: {acc.accountNumber}</p>}
                    <div className="bg-blue-600 p-3 rounded-xl text-white">
                      <p className="text-[10px] uppercase font-bold opacity-70">ব্য্যালেন্স</p>
                      <p className="text-2xl font-black">৳{getAccountBalance(acc.name).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Existing Tab Logic for Income/Expense/PersonalDollar/Vault/AI continues below... */}
        {(activeTab === 'income' || activeTab === 'expense') && (
           <div className="space-y-6 animate-fadeIn">
              <header><h2 className="text-2xl font-bold text-slate-800">{activeTab === 'income' ? 'আয়ের তথ্য' : 'ব্যয়ের তথ্য'}</h2></header>
              <Card title={`নতুন ${activeTab === 'income' ? 'আয়' : 'ব্যয়'} যোগ করুন`}>
                <form className="grid grid-cols-1 md:grid-cols-5 gap-4" onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.target as HTMLFormElement;
                  addTransaction(activeTab === 'income' ? TransactionType.INCOME : TransactionType.EXPENSE, Number((form.elements.namedItem('amount') as HTMLInputElement).value), (form.elements.namedItem('cat') as HTMLInputElement).value, "", (form.elements.namedItem('acc') as HTMLSelectElement).value);
                  form.reset();
                }}>
                  <input name="amount" type="number" placeholder="৳ পরিমাণ" required className="px-4 py-2 rounded-lg border outline-none" />
                  <input name="cat" type="text" placeholder="ক্যাটাগরি" required className="px-4 py-2 rounded-lg border outline-none" />
                  <select name="acc" className="px-4 py-2 rounded-lg border outline-none bg-white">
                    {accounts.map(acc => <option key={acc.id} value={acc.name}>{acc.name}</option>)}
                  </select>
                  <button type="submit" className="bg-blue-600 text-white rounded-lg font-bold">যোগ করুন</button>
                </form>
              </Card>
              <Card title="তালিকা">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="border-b"><tr><th className="pb-4">তারিখ</th><th className="pb-4">ক্যাটাগরি</th><th className="pb-4">অ্যাকাউন্ট</th><th className="pb-4 text-right">পরিমাণ</th></tr></thead>
                    <tbody>
                      {transactions.filter(t => t.type === (activeTab === 'income' ? TransactionType.INCOME : TransactionType.EXPENSE)).map(t => (
                        <tr key={t.id} className="border-b border-slate-50">
                          <td className="py-4 text-sm">{t.date}</td>
                          <td className="py-4 font-bold">{t.category}</td>
                          <td className="py-4 text-sm text-slate-500">{t.accountName}</td>
                          <td className={`py-4 text-right font-bold ${t.type === TransactionType.INCOME ? 'text-emerald-600' : 'text-rose-600'}`}>৳{t.amount.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
           </div>
        )}

        {activeTab === 'personal_dollar' && (
          <div className="space-y-6 animate-fadeIn">
            <header><h2 className="text-2xl font-bold text-slate-800">পার্সোনাল ডলার ব্যবহার</h2></header>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <StatCard label="মোট ডলার খরচ" value={totalPersonalDollarSpent} icon={<ShoppingBag />} color="bg-blue-600" prefix="$" />
               <StatCard label="মোট সমপরিমাণ টাকা" value={totalPersonalTakaSpent} icon={<Banknote />} color="bg-slate-800" />
            </div>
            <Card title="নতুন খরচ রেকর্ড করুন">
              <form className="grid grid-cols-1 md:grid-cols-4 gap-4" onSubmit={(e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                addPersonalDollarUsage(Number((form.elements.namedItem('a') as HTMLInputElement).value), Number((form.elements.namedItem('r') as HTMLInputElement).value), (form.elements.namedItem('p') as HTMLInputElement).value, "");
                form.reset();
              }}>
                <input name="a" type="number" step="any" placeholder="$ ডলার" required className="px-3 py-2 border rounded" />
                <input name="r" type="number" step="any" placeholder="৳ রেট" required className="px-3 py-2 border rounded" />
                <input name="p" type="text" placeholder="উদ্দেশ্য" required className="px-3 py-2 border rounded" />
                <button type="submit" className="bg-blue-600 text-white rounded font-bold">সেভ</button>
              </form>
            </Card>
          </div>
        )}

        {activeTab === 'vault' && (
          <div className="space-y-6 animate-fadeIn">
             <header><h2 className="text-2xl font-bold text-slate-800">পাসওয়ার্ড ভল্ট</h2></header>
             <Card title="নতুন পাসওয়ার্ড সেভ করুন">
              <form className="grid grid-cols-1 md:grid-cols-4 gap-4" onSubmit={(e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                addVaultItem((form.elements.namedItem('s') as HTMLInputElement).value, (form.elements.namedItem('u') as HTMLInputElement).value, (form.elements.namedItem('p') as HTMLInputElement).value, "");
                form.reset();
              }}>
                <input name="s" placeholder="সাইট" required className="px-4 py-2 border rounded-lg" />
                <input name="u" placeholder="ইউজার" required className="px-4 py-2 border rounded-lg" />
                <input name="p" type="password" placeholder="পাসওয়ার্ড" required className="px-4 py-2 border rounded-lg" />
                <button type="submit" className="bg-indigo-600 text-white rounded-lg font-bold">সেভ করুন</button>
              </form>
            </Card>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {vault.map(v => (
                <div key={v.id} className="bg-white p-6 rounded-xl border relative">
                  <button onClick={() => deleteVaultItem(v.id)} className="absolute top-4 right-4 text-slate-200"><Trash2 size={16}/></button>
                  <h4 className="font-bold mb-2 flex items-center gap-2"><Lock size={16}/>{v.siteName}</h4>
                  <p className="text-sm text-slate-500">ইউজার: {v.username}</p>
                  <div className="flex mt-2 bg-slate-50 p-2 rounded">
                    <input type={showPasswordMap[v.id] ? 'text' : 'password'} value={v.password} readOnly className="bg-transparent w-full outline-none" />
                    <button onClick={() => togglePasswordVisibility(v.id)}>{showPasswordMap[v.id] ? <EyeOff size={16}/> : <Eye size={16}/>}</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="h-[calc(100vh-120px)] flex flex-col space-y-4 animate-fadeIn">
            <header><h2 className="text-2xl font-bold text-slate-800">এআই ফিন্যান্সিয়াল অ্যাসিস্ট্যান্ট</h2></header>
            <div className="flex-1 bg-white rounded-xl shadow-sm border flex flex-col overflow-hidden">
              <div className="flex-1 p-6 overflow-y-auto space-y-4">
                {aiResponse && <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 leading-relaxed text-blue-900">{aiResponse}</div>}
                {aiLoading && <div className="animate-pulse text-blue-600 font-bold">Gemini হিসাব নিকাশ করছে...</div>}
              </div>
              <div className="p-4 bg-slate-50 border-t flex gap-2">
                <input type="text" value={aiQuery} onChange={(e) => setAiQuery(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleAiAsk()} placeholder="আপনার প্রশ্নটি..." className="flex-1 px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500" />
                <button onClick={handleAiAsk} disabled={aiLoading} className="bg-blue-600 text-white px-6 rounded-xl font-bold hover:bg-blue-700 transition-colors">জিজ্ঞেস করুন</button>
              </div>
            </div>
          </div>
        )}
      </main>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default App;
