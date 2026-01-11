
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Wallet, TrendingDown, Lock, Bot, Trash2, Eye, EyeOff, Menu, X, 
  RefreshCw, TrendingUp, Calculator, CreditCard, Phone, Building2, Coins, 
  ShoppingBag, AlertCircle, CheckCircle, XCircle, Send, KeyRound, LogIn, Cloud
} from 'lucide-react';
import { Transaction, TransactionType, VaultItem, AppState, DollarTransaction, Account, AccountType, PersonalDollarUsage } from './types';
import { getFinancialAdvice } from './services/gemini';
import { dbService } from './services/api';

// --- CONFIGURATION ---
const APP_PASSWORD = "admin123"; // আপনার পাসওয়ার্ডটি এখানে পরিবর্তন করুন
// ---------------------

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
      <p className="text-2xl font-bold text-slate-800">{prefix}{value.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 })}</p>
    </div>
  </div>
);

const App: React.FC = () => {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('is_auth') === 'true';
  });
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState(false);
  const [showLoginPass, setShowLoginPass] = useState(false);

  // App Navigation State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'income' | 'expense' | 'vault' | 'ai' | 'dollar' | 'accounts' | 'personal_dollar'>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [dbStatus, setDbStatus] = useState<'connected' | 'offline'>('connected');

  // App State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [vault, setVault] = useState<VaultItem[]>([]);
  const [dollarTransactions, setDollarTransactions] = useState<DollarTransaction[]>([]);
  const [personalDollarUsage, setPersonalDollarUsage] = useState<PersonalDollarUsage[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  
  const [showPasswordMap, setShowPasswordMap] = useState<Record<string, boolean>>({});

  // Calculator State
  const [calcAmount, setCalcAmount] = useState<string>('');
  const [calcRate, setCalcRate] = useState<string>('');

  // AI State
  const [aiQuery, setAiQuery] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // Edit states for Dollar Buy/Sell
  const [editingSellId, setEditingSellId] = useState<string | null>(null);
  const [tempSellRate, setTempSellRate] = useState<string>('');

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchData = async () => {
      setIsSyncing(true);
      try {
        const data = await dbService.getState();
        setTransactions(data.transactions || []);
        setVault(data.vault || []);
        setDollarTransactions(data.dollarTransactions || []);
        setPersonalDollarUsage(data.personalDollarUsage || []);
        setAccounts(data.accounts || []);
        setDbStatus('connected');
      } catch (e) {
        setDbStatus('offline');
      } finally {
        setIsSyncing(false);
      }
    };
    fetchData();
  }, [isAuthenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginPass === APP_PASSWORD) {
      setIsAuthenticated(true);
      sessionStorage.setItem('is_auth', 'true');
      setLoginError(false);
    } else {
      setLoginError(true);
      setLoginPass('');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('is_auth');
  };

  const syncModule = async (module: keyof AppState, data: any) => {
    setIsSyncing(true);
    await dbService.sync(module, data);
    setIsSyncing(false);
  };

  const addTransaction = (type: TransactionType, amount: number, category: string, note: string, accountName: string) => {
    const newTx: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      type, amount, category, note, accountName,
      date: new Date().toISOString().split('T')[0]
    };
    setTransactions(prev => {
      const updated = [newTx, ...prev];
      syncModule('transactions', updated);
      return updated;
    });
  };

  const deleteTransaction = (id: string) => {
    setTransactions(prev => {
      const updated = prev.filter(t => t.id !== id);
      syncModule('transactions', updated);
      return updated;
    });
  };

  const addVaultItem = (siteName: string, username: string, password: string, note: string) => {
    const newItem: VaultItem = {
      id: Math.random().toString(36).substr(2, 9),
      siteName, username, password, note
    };
    setVault(prev => {
      const updated = [newItem, ...prev];
      syncModule('vault', updated);
      return updated;
    });
  };

  const deleteVaultItem = (id: string) => {
    setVault(prev => {
      const updated = prev.filter(v => v.id !== id);
      syncModule('vault', updated);
      return updated;
    });
  };

  const addPersonalDollar = (amount: number, rate: number, purpose: string, note: string) => {
    const newItem: PersonalDollarUsage = {
      id: Math.random().toString(36).substr(2, 9),
      amount, rate, purpose, note,
      date: new Date().toISOString().split('T')[0]
    };
    setPersonalDollarUsage(prev => {
      const updated = [newItem, ...prev];
      syncModule('personalDollarUsage', updated);
      return updated;
    });
  };

  const deletePersonalDollar = (id: string) => {
    setPersonalDollarUsage(prev => {
      const updated = prev.filter(p => p.id !== id);
      syncModule('personalDollarUsage', updated);
      return updated;
    });
  };

  const addDollarTx = (buyRate: number, sellRate: number | undefined, quantity: number, note: string, accountName?: string) => {
    const newTx: DollarTransaction = {
      id: Math.random().toString(36).substr(2, 9),
      buyRate, sellRate, quantity, note, accountName,
      date: new Date().toISOString().split('T')[0]
    };
    
    // অটোমেটিক টাকা কাটা
    if (accountName) {
      addTransaction(
        TransactionType.EXPENSE, 
        buyRate * quantity, 
        "ডলার ক্রয়", 
        `পরিমাণ: $${quantity.toLocaleString(undefined, {minimumFractionDigits: 1})} (রেট: ৳${buyRate})`, 
        accountName
      );
    }

    setDollarTransactions(prev => {
      const updated = [newTx, ...prev];
      syncModule('dollarTransactions', updated);
      return updated;
    });
  };

  const updateDollarSellRate = (id: string, sellRate: number) => {
    const targetTx = dollarTransactions.find(t => t.id === id);
    if (!targetTx) return;

    const updated = dollarTransactions.map(t => t.id === id ? { 
      ...t, 
      sellRate, 
      sellDate: new Date().toISOString().split('T')[0] 
    } : t);
    
    setDollarTransactions(updated);
    syncModule('dollarTransactions', updated);

    // অটোমেটিক টাকা যোগ হওয়া
    if (targetTx.accountName) {
       addTransaction(
         TransactionType.INCOME, 
         sellRate * targetTx.quantity, 
         "ডলার বিক্রয়", 
         `পরিমাণ: $${targetTx.quantity.toLocaleString(undefined, {minimumFractionDigits: 1})} (বিক্রয় লব্ধ টাকা)`, 
         targetTx.accountName
       );
    }
    setEditingSellId(null);
  };

  const deleteDollarTx = (id: string) => {
    setDollarTransactions(prev => {
      const updated = prev.filter(t => t.id !== id);
      syncModule('dollarTransactions', updated);
      return updated;
    });
  };

  const addAccount = (account: Omit<Account, 'id'>) => {
    const newAccount: Account = { ...account, id: Math.random().toString(36).substr(2, 9) };
    setAccounts(prev => {
      const updated = [...prev, newAccount];
      syncModule('accounts', updated);
      return updated;
    });
  };

  const deleteAccount = (id: string) => {
    setAccounts(prev => {
      const updated = prev.filter(a => a.id !== id);
      syncModule('accounts', updated);
      return updated;
    });
  };

  const handleAiAsk = async () => {
    if (!aiQuery.trim()) return;
    setAiLoading(true);
    const advice = await getFinancialAdvice(transactions, aiQuery);
    setAiResponse(advice || "দুঃখিত, কোনো উত্তর পাওয়া যায়নি।");
    setAiLoading(false);
  };

  // Stats Calculations
  const totalIncome = transactions.filter(t => t.type === TransactionType.INCOME).reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === TransactionType.EXPENSE).reduce((s, t) => s + t.amount, 0);
  const balance = totalIncome - totalExpense;
  const soldTxs = dollarTransactions.filter(t => t.sellRate !== undefined);
  const totalDollarProfit = soldTxs.reduce((acc, curr) => acc + (curr.sellRate! - curr.buyRate) * curr.quantity, 0);

  const getAccountBalance = (accountName: string) => {
    const inc = transactions.filter(t => t.type === TransactionType.INCOME && t.accountName === accountName).reduce((s, t) => s + t.amount, 0);
    const exp = transactions.filter(t => t.type === TransactionType.EXPENSE && t.accountName === accountName).reduce((s, t) => s + t.amount, 0);
    return inc - exp;
  };

  const totalAccountBalance = accounts.reduce((acc, curr) => acc + getAccountBalance(curr.name), 0);

  const getAccountIcon = (type: AccountType) => {
    switch (type) {
      case 'Mobile Wallet': return <Phone size={24} />;
      case 'Bank': return <Building2 size={24} />;
      case 'Cash': return <Coins size={24} />;
      default: return <CreditCard size={24} />;
    }
  };

  const togglePassword = (id: string) => {
    setShowPasswordMap(prev => ({ ...prev, [id]: !prev[id] }));
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl shadow-blue-100 p-8 border border-slate-100 animate-fadeIn">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-200">
              <Wallet className="text-white w-10 h-10" />
            </div>
            <h1 className="text-2xl font-black text-slate-800">আমার হিসাব</h1>
            <p className="text-slate-400 text-sm font-medium mt-1">পাসওয়ার্ড দিয়ে লগইন করুন</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">অ্যাক্সেস পাসওয়ার্ড</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <KeyRound size={20} />
                </div>
                <input
                  type={showLoginPass ? "text" : "password"}
                  value={loginPass}
                  onChange={(e) => {
                    setLoginPass(e.target.value);
                    setLoginError(false);
                  }}
                  autoFocus
                  className={`w-full pl-12 pr-12 py-4 bg-slate-50 border-2 ${loginError ? 'border-rose-400' : 'border-transparent'} rounded-2xl outline-none focus:bg-white focus:border-blue-500 transition-all font-medium text-lg`}
                  placeholder="••••••••"
                />
                <button 
                  type="button" 
                  onClick={() => setShowLoginPass(!showLoginPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-500"
                >
                  {showLoginPass ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {loginError && (
                <p className="text-rose-500 text-xs font-bold mt-2 flex items-center gap-1">
                  <AlertCircle size={14} /> ভুল পাসওয়ার্ড! আবার চেষ্টা করুন।
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-all transform active:scale-[0.98] shadow-lg shadow-blue-200"
            >
              <LogIn size={20} />
              প্রবেশ করুন
            </button>
          </form>
          <p className="text-center text-[10px] text-slate-300 uppercase font-bold mt-8 tracking-tighter">Secure Financial System</p>
        </div>
        <style>{`.animate-fadeIn { animation: fadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; } @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }`}</style>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900 overflow-x-hidden">
      {isSyncing && (
        <div className="fixed top-0 left-0 w-full h-1 z-[100] bg-blue-100 overflow-hidden">
          <div className="h-full bg-blue-600 animate-syncProgress"></div>
        </div>
      )}

      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 bg-white rounded-lg shadow-md border border-slate-200">
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6">
          <h1 className="text-2xl font-bold text-blue-700 flex items-center gap-2"><Wallet className="w-8 h-8" />আমার হিসাব</h1>
          <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider font-semibold">Cloud Management</p>
        </div>
        <nav className="mt-4 px-4 space-y-2 overflow-y-auto max-h-[calc(100vh-320px)]">
          <SidebarItem icon={<LayoutDashboard size={20} />} label="ড্যাশবোর্ড" active={activeTab === 'dashboard'} onClick={() => { setActiveTab('dashboard'); setSidebarOpen(false); }} />
          <SidebarItem icon={<CreditCard size={20} />} label="অ্যাকাউন্টস" active={activeTab === 'accounts'} onClick={() => { setActiveTab('accounts'); setSidebarOpen(false); }} />
          <SidebarItem icon={<TrendingUp size={20} />} label="আয়ের তালিকা" active={activeTab === 'income'} onClick={() => { setActiveTab('income'); setSidebarOpen(false); }} />
          <SidebarItem icon={<TrendingDown size={20} />} label="ব্যয়ের তালিকা" active={activeTab === 'expense'} onClick={() => { setActiveTab('expense'); setSidebarOpen(false); }} />
          <SidebarItem icon={<RefreshCw size={20} />} label="ডলার বাই-সেল" active={activeTab === 'dollar'} onClick={() => { setActiveTab('dollar'); setSidebarOpen(false); }} />
          <SidebarItem icon={<ShoppingBag size={20} />} label="পার্সোনাল ইউজ" active={activeTab === 'personal_dollar'} onClick={() => { setActiveTab('personal_dollar'); setSidebarOpen(false); }} />
          <SidebarItem icon={<Lock size={20} />} label="পাসওয়ার্ড ভল্ট" active={activeTab === 'vault'} onClick={() => { setActiveTab('vault'); setSidebarOpen(false); }} />
          <div className="pt-4 mt-4 border-t border-slate-100">
            <SidebarItem icon={<Bot size={20} />} label="এআই অ্যাসিস্ট্যান্ট" active={activeTab === 'ai'} onClick={() => { setActiveTab('ai'); setSidebarOpen(false); }} />
          </div>
        </nav>
        <div className="absolute bottom-8 left-0 w-full px-6 space-y-3">
          <button onClick={handleLogout} className="w-full flex items-center gap-2 text-rose-500 text-xs font-bold uppercase p-2 hover:bg-rose-50 rounded-lg transition-colors mb-2"><XCircle size={14} /> সাইন আউট</button>
          <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 border rounded-lg">
             {/* Fix: Using the imported Cloud icon from lucide-react */}
             <Cloud size={14} className={dbStatus === 'connected' ? 'text-emerald-500' : 'text-rose-500'} />
             <span className="text-[10px] font-bold uppercase text-slate-500">{dbStatus === 'connected' ? 'Cloud Sync' : 'Offline'}</span>
          </div>
          <div className="bg-blue-600 p-4 rounded-xl text-white shadow-lg shadow-blue-200">
            <p className="text-[10px] font-bold uppercase opacity-80 mb-1">মোট ব্যালেন্স</p>
            <p className="text-xl font-black">৳{totalAccountBalance.toLocaleString(undefined, { minimumFractionDigits: 1 })}</p>
          </div>
        </div>
      </aside>

      <main className="flex-1 lg:ml-64 p-4 lg:p-8 mt-12 lg:mt-0">
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-fadeIn">
            <header><h2 className="text-2xl font-bold text-slate-800">ওভারভিউ</h2></header>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard label="মোট আয়" value={totalIncome} icon={<TrendingUp />} color="bg-emerald-500" />
              <StatCard label="মোট ব্যয়" value={totalExpense} icon={<TrendingDown />} color="bg-rose-500" />
              <StatCard label="ওয়ালেট ব্যালেন্স" value={totalAccountBalance} icon={<Wallet />} color="bg-blue-500" />
              <StatCard label="ডলার প্রফিট" value={totalDollarProfit} icon={<TrendingUp />} color="bg-indigo-500" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card title="সাম্প্রতিক লেনদেন">
                <div className="space-y-3">
                  {transactions.slice(0, 5).map(t => (
                    <div key={t.id} className="flex justify-between items-center p-3 rounded-lg bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${t.type === TransactionType.INCOME ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                          {t.type === TransactionType.INCOME ? <TrendingUp size={16}/> : <TrendingDown size={16}/>}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-sm">{t.category}</p>
                          <p className="text-[10px] text-slate-400 uppercase font-bold">{t.accountName}</p>
                        </div>
                      </div>
                      <p className={`font-black ${t.type === TransactionType.INCOME ? 'text-emerald-600' : 'text-rose-600'}`}>৳{t.amount.toLocaleString(undefined, { minimumFractionDigits: 1 })}</p>
                    </div>
                  ))}
                </div>
              </Card>
              <Card title="অ্যাকাউন্ট ব্যালেন্স">
                <div className="space-y-3">
                  {accounts.map(acc => (
                    <div key={acc.id} className="flex justify-between items-center p-3 border-b border-slate-50 last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="text-blue-500">{getAccountIcon(acc.type)}</div>
                        <div>
                          <p className="font-bold text-slate-700">{acc.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">{acc.providerName}</p>
                        </div>
                      </div>
                      <p className="font-black text-slate-800">৳{getAccountBalance(acc.name).toLocaleString(undefined, { minimumFractionDigits: 1 })}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        )}

        {(activeTab === 'income' || activeTab === 'expense') && (
          <div className="space-y-6 animate-fadeIn">
            <header><h2 className="text-2xl font-bold text-slate-800">{activeTab === 'income' ? 'আয়ের তালিকা' : 'ব্যয়ের তালিকা'}</h2></header>
            <Card title="নতুন রেকর্ড যোগ করুন">
              <form className="grid grid-cols-1 md:grid-cols-5 gap-4" onSubmit={(e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const amount = form.elements.namedItem('amount') as HTMLInputElement;
                const category = form.elements.namedItem('category') as HTMLInputElement;
                const account = form.elements.namedItem('account') as HTMLSelectElement;
                const note = form.elements.namedItem('note') as HTMLInputElement;
                addTransaction(activeTab === 'income' ? TransactionType.INCOME : TransactionType.EXPENSE, parseFloat(amount.value), category.value, note.value || "", account.value);
                form.reset();
              }}>
                <input name="amount" type="number" step="any" placeholder="টাকার পরিমাণ" required className="px-4 py-2 border rounded-lg text-sm outline-none focus:border-blue-500" />
                <input name="category" placeholder="ক্যাটাগরি" required className="px-4 py-2 border rounded-lg text-sm outline-none focus:border-blue-500" />
                <select name="account" required className="px-4 py-2 border rounded-lg text-sm bg-white outline-none focus:border-blue-500">
                  <option value="">অ্যাকাউন্ট সিলেক্ট</option>
                  {accounts.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
                </select>
                <input name="note" placeholder="নোট" className="px-4 py-2 border rounded-lg text-sm outline-none focus:border-blue-500" />
                <button type="submit" className={`px-4 py-2 text-white font-bold rounded-lg text-sm ${activeTab === 'income' ? 'bg-emerald-600' : 'bg-rose-600'}`}>সেভ</button>
              </form>
            </Card>
            <Card title="হিস্টোরি">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="text-[10px] uppercase text-slate-400 border-b">
                    <tr><th className="pb-3">তারিখ</th><th className="pb-3">ক্যাটাগরি</th><th className="pb-3">অ্যাকাউন্ট</th><th className="pb-3 text-right">টাকা</th><th className="pb-3 text-right">অ্যাকশন</th></tr>
                  </thead>
                  <tbody>
                    {transactions.filter(t => t.type === (activeTab === 'income' ? TransactionType.INCOME : TransactionType.EXPENSE)).map(t => (
                      <tr key={t.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                        <td className="py-4 text-xs text-slate-500">{t.date}</td>
                        <td className="py-4 font-bold text-slate-700">{t.category}</td>
                        <td className="py-4 text-sm text-slate-600">{t.accountName}</td>
                        <td className={`py-4 text-right font-black ${activeTab === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>৳{t.amount.toLocaleString(undefined, { minimumFractionDigits: 1 })}</td>
                        <td className="py-4 text-right"><button onClick={() => deleteTransaction(t.id)} className="text-slate-200 hover:text-rose-500"><Trash2 size={16}/></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'dollar' && (
          <div className="space-y-6 animate-fadeIn">
             <header><h2 className="text-2xl font-bold text-slate-800">ডলার ট্রেডিং</h2></header>
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 shadow-sm">
                <h3 className="font-bold flex items-center gap-2 mb-4 text-blue-700"><Calculator size={20}/>ক্যালকুলেটর</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input value={calcAmount} onChange={(e) => setCalcAmount(e.target.value)} type="number" step="any" placeholder="পরিমাণ ($)" className="px-4 py-2 border rounded-lg text-sm bg-white" />
                  <input value={calcRate} onChange={(e) => setCalcRate(e.target.value)} type="number" step="any" placeholder="রেট (৳)" className="px-4 py-2 border rounded-lg text-sm bg-white" />
                  <div className="bg-white px-4 py-2 border rounded-lg flex items-center justify-between shadow-inner">
                    <span className="text-[10px] font-bold text-slate-400">মোট:</span>
                    <span className="font-black text-blue-700">৳{(parseFloat(calcAmount || '0') * parseFloat(calcRate || '0')).toLocaleString(undefined, { minimumFractionDigits: 1 })}</span>
                  </div>
                </div>
              </div>
              <Card title="নতুন লেনদেন">
                <form className="grid grid-cols-1 md:grid-cols-4 gap-4" onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.target as HTMLFormElement;
                  const buy = form.elements.namedItem('buy') as HTMLInputElement;
                  const qty = form.elements.namedItem('qty') as HTMLInputElement;
                  const acc = form.elements.namedItem('acc') as HTMLSelectElement;
                  addDollarTx(parseFloat(buy.value), undefined, parseFloat(qty.value), "", acc.value);
                  form.reset();
                }}>
                  <input name="buy" type="number" step="any" placeholder="৳ বাই রেট" required className="px-4 py-2 border rounded-lg text-sm" />
                  <input name="qty" type="number" step="any" placeholder="$ পরিমাণ" required className="px-4 py-2 border rounded-lg text-sm" />
                  <select name="acc" required className="px-4 py-2 border rounded-lg text-sm bg-white">
                     <option value="">অ্যাকাউন্ট সিলেক্ট</option>
                     {accounts.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
                  </select>
                  <button type="submit" className="bg-indigo-600 text-white rounded-lg font-bold text-sm">বাই করুন</button>
                </form>
              </Card>
              <Card title="ট্রেডিং লিস্ট">
                <div className="overflow-x-auto">
                   <table className="w-full text-left">
                     <thead className="text-[10px] uppercase text-slate-400 border-b">
                        <tr><th className="pb-3">তারিখ</th><th className="pb-3">পরিমাণ</th><th className="pb-3 text-right">বাই</th><th className="pb-3 text-right">সেল</th><th className="pb-3 text-right">মোট লাভ</th><th className="pb-3 text-right">অ্যাকশন</th></tr>
                     </thead>
                     <tbody>
                       {dollarTransactions.map(t => {
                         const totalProfit = t.sellRate ? (t.sellRate - t.buyRate) * t.quantity : 0;
                         return (
                           <tr key={t.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                              <td className="py-4 text-xs text-slate-500">{t.date}</td>
                              <td className="py-4 font-bold">${t.quantity.toLocaleString(undefined, { minimumFractionDigits: 1 })}</td>
                              <td className="py-4 text-right">৳{t.buyRate.toLocaleString(undefined, { minimumFractionDigits: 1 })}</td>
                              <td className="py-4 text-right">
                                 {t.sellRate !== undefined ? <span className="text-emerald-600 font-bold">৳{t.sellRate.toLocaleString(undefined, { minimumFractionDigits: 1 })}</span> : 
                                   editingSellId === t.id ? (
                                     <div className="flex gap-1 justify-end">
                                        <input autoFocus type="number" step="any" onChange={(e) => setTempSellRate(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && updateDollarSellRate(t.id, parseFloat(tempSellRate))} className="w-16 border rounded text-xs px-1 outline-none" placeholder="রেট" />
                                        <button onClick={() => updateDollarSellRate(t.id, parseFloat(tempSellRate))} className="text-emerald-500"><CheckCircle size={14}/></button>
                                     </div>
                                   ) : (
                                     <button onClick={() => setEditingSellId(t.id)} className="text-[10px] font-bold bg-blue-600 text-white px-2 py-1 rounded">Sell Now</button>
                                   )
                                 }
                              </td>
                              <td className={`py-4 text-right font-black ${totalProfit > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>{t.sellRate !== undefined ? `৳${totalProfit.toLocaleString(undefined, { minimumFractionDigits: 1 })}` : '-'}</td>
                              <td className="py-4 text-right"><button onClick={() => deleteDollarTx(t.id)} className="text-slate-200 hover:text-rose-500"><Trash2 size={16}/></button></td>
                           </tr>
                         );
                       })}
                     </tbody>
                   </table>
                </div>
              </Card>
          </div>
        )}

        {/* --- Shared Tabs Style --- */}
        {activeTab === 'personal_dollar' && (
          <div className="space-y-6 animate-fadeIn">
            <header><h2 className="text-2xl font-bold text-slate-800">পার্সোনাল ডলার ইউজ</h2></header>
            <Card title="ব্যবহারের তথ্য">
              <form className="grid grid-cols-1 md:grid-cols-4 gap-4" onSubmit={(e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const amount = form.elements.namedItem('amount') as HTMLInputElement;
                const rate = form.elements.namedItem('rate') as HTMLInputElement;
                const purpose = form.elements.namedItem('purpose') as HTMLInputElement;
                addPersonalDollar(parseFloat(amount.value), parseFloat(rate.value), purpose.value, "");
                form.reset();
              }}>
                <input name="amount" type="number" step="any" placeholder="পরিমাণ ($)" required className="px-4 py-2 border rounded-lg text-sm outline-none focus:border-blue-500" />
                <input name="rate" type="number" step="any" placeholder="রেট (৳)" required className="px-4 py-2 border rounded-lg text-sm outline-none focus:border-blue-500" />
                <input name="purpose" placeholder="উদ্দেশ্য" required className="px-4 py-2 border rounded-lg text-sm outline-none focus:border-blue-500" />
                <button type="submit" className="bg-blue-600 text-white rounded-lg font-bold text-sm">সেভ করুন</button>
              </form>
            </Card>
            <Card title="ইউসেজ লিস্ট">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="text-[10px] uppercase text-slate-400 border-b">
                    <tr><th className="pb-3">তারিখ</th><th className="pb-3">উদ্দেশ্য</th><th className="pb-3 text-right">ডলার</th><th className="pb-3 text-right">রেট</th><th className="pb-3 text-right">মোট (৳)</th><th className="pb-3 text-right">অ্যাকশন</th></tr>
                  </thead>
                  <tbody>
                    {personalDollarUsage.map(p => (
                      <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                        <td className="py-4 text-xs text-slate-500">{p.date}</td>
                        <td className="py-4 font-bold text-slate-700">{p.purpose}</td>
                        <td className="py-4 text-right">${p.amount.toLocaleString(undefined, { minimumFractionDigits: 1 })}</td>
                        <td className="py-4 text-right text-slate-600">৳{p.rate.toLocaleString(undefined, { minimumFractionDigits: 1 })}</td>
                        <td className="py-4 text-right font-black">৳{(p.amount * p.rate).toLocaleString(undefined, { minimumFractionDigits: 1 })}</td>
                        <td className="py-4 text-right"><button onClick={() => deletePersonalDollar(p.id)} className="text-slate-200 hover:text-rose-500"><Trash2 size={16}/></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'accounts' && (
          <div className="space-y-6 animate-fadeIn">
             <header><h2 className="text-2xl font-bold text-slate-800">অ্যাকাউন্টস</h2></header>
             <Card title="নতুন অ্যাকাউন্ট">
              <form className="grid grid-cols-1 md:grid-cols-3 gap-4" onSubmit={(e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const accName = form.elements.namedItem('accName') as HTMLInputElement;
                const accType = form.elements.namedItem('accType') as HTMLSelectElement;
                const provider = form.elements.namedItem('provider') as HTMLInputElement;
                addAccount({ name: accName.value, type: accType.value as AccountType, providerName: provider.value });
                form.reset();
              }}>
                <input name="accName" placeholder="নাম" required className="px-4 py-2 border rounded-lg text-sm" />
                <select name="accType" className="px-4 py-2 border rounded-lg bg-white text-sm">
                    <option value="Mobile Wallet">মোবাইল ওয়ালেট</option>
                    <option value="Bank">ব্যাংক</option>
                    <option value="Cash">ক্যাশ</option>
                </select>
                <input name="provider" placeholder="প্রোভাইডার" className="px-4 py-2 border rounded-lg text-sm" />
                <button type="submit" className="bg-blue-600 text-white rounded-lg font-bold text-sm col-span-full py-2 shadow-md">অ্যাকাউন্ট সেভ করুন</button>
              </form>
            </Card>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {accounts.map(acc => (
                <div key={acc.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative group">
                  <button onClick={() => deleteAccount(acc.id)} className="absolute top-4 right-4 text-slate-200 hover:text-rose-600 opacity-0 group-hover:opacity-100"><Trash2 size={18}/></button>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">{getAccountIcon(acc.type)}</div>
                    <div>
                      <h4 className="font-bold text-slate-800">{acc.name}</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">{acc.providerName}</p>
                    </div>
                  </div>
                  <div className="bg-blue-600 p-4 rounded-xl text-white shadow-md">
                    <p className="text-[10px] font-bold opacity-70 uppercase mb-1">কারেন্ট ব্যালেন্স</p>
                    <p className="text-2xl font-black">৳{getAccountBalance(acc.name).toLocaleString(undefined, { minimumFractionDigits: 1 })}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'vault' && (
          <div className="space-y-6 animate-fadeIn">
            <header><h2 className="text-2xl font-bold text-slate-800">পাসওয়ার্ড ভল্ট</h2></header>
            <Card title="নতুন পাসওয়ার্ড সেভ করুন">
              <form className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" onSubmit={(e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const site = form.elements.namedItem('site') as HTMLInputElement;
                const user = form.elements.namedItem('user') as HTMLInputElement;
                const pass = form.elements.namedItem('pass') as HTMLInputElement;
                addVaultItem(site.value, user.value, pass.value, "");
                form.reset();
              }}>
                <input name="site" placeholder="সাইটের নাম" required className="px-4 py-2 border rounded-lg text-sm outline-none" />
                <input name="user" placeholder="ইউজারনেম" required className="px-4 py-2 border rounded-lg text-sm outline-none" />
                <input name="pass" type="password" placeholder="পাসওয়ার্ড" required className="px-4 py-2 border rounded-lg text-sm outline-none" />
                <button type="submit" className="bg-slate-800 text-white rounded-lg font-bold text-sm px-4">ভল্টে রাখুন</button>
              </form>
            </Card>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {vault.map(item => (
                <div key={item.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative group hover:shadow-md transition-shadow">
                  <button onClick={() => deleteVaultItem(item.id)} className="absolute top-4 right-4 text-slate-200 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={18}/></button>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Lock size={20}/></div>
                    <h4 className="font-bold text-slate-800 truncate pr-8">{item.siteName}</h4>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">ইউজারনেম</p>
                      <p className="text-sm font-medium text-slate-600">{item.username}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">পাসওয়ার্ড</p>
                      <div className="flex items-center justify-between bg-slate-50 px-3 py-2 rounded-lg border mt-1">
                        <span className="text-sm font-mono tracking-wider">{showPasswordMap[item.id] ? item.password : '••••••••'}</span>
                        <button onClick={() => togglePassword(item.id)} className="text-slate-400 hover:text-blue-500">
                          {showPasswordMap[item.id] ? <EyeOff size={16}/> : <Eye size={16}/>}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="space-y-6 animate-fadeIn h-full flex flex-col">
            <header><h2 className="text-2xl font-bold text-slate-800">এআই অ্যাসিস্ট্যান্ট</h2></header>
            <div className="flex-1 flex flex-col gap-4 bg-white border border-slate-100 rounded-2xl p-6 shadow-sm min-h-[500px]">
              <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                {!aiResponse && !aiLoading && (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                    <Bot size={64} className="mb-4 text-blue-600" />
                    <p className="font-bold text-lg">আমি আপনার পার্সোনাল হিসাবরক্ষক।</p>
                    <p className="text-sm mt-2">আপনার আয়-ব্যয় নিয়ে যেকোনো প্রশ্ন করতে পারেন।</p>
                  </div>
                )}
                {aiResponse && (
                  <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 shadow-sm animate-fadeIn">
                    <div className="flex items-center gap-2 mb-3 text-blue-600"><Bot size={20}/><span className="font-bold text-sm">AI পরামর্শ:</span></div>
                    <div className="prose prose-blue text-slate-700 leading-relaxed whitespace-pre-wrap font-medium">{aiResponse}</div>
                  </div>
                )}
              </div>
              <div className="mt-4 relative">
                  <input value={aiQuery} onChange={(e) => setAiQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAiAsk()} placeholder="আপনার প্রশ্ন এখানে লিখুন..." className="w-full pl-6 pr-14 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-inner" />
                  <button onClick={handleAiAsk} disabled={aiLoading} className="absolute right-3 top-2 bottom-2 bg-blue-600 text-white px-4 rounded-xl shadow-md transition-transform active:scale-95 disabled:opacity-50">
                    {aiLoading ? <RefreshCw className="animate-spin" size={20}/> : <Send size={20}/>}
                  </button>
              </div>
            </div>
          </div>
        )}

        <style>{`
          .animate-syncProgress { animation: syncProgress 1.5s infinite linear; }
          @keyframes syncProgress { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
          .animate-fadeIn { animation: fadeIn 0.3s ease-out forwards; }
          @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
          * { scrollbar-width: thin; scrollbar-color: #cbd5e1 transparent; }
          *::-webkit-scrollbar { width: 6px; }
          *::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 20px; }
        `}</style>
      </main>
    </div>
  );
};

export default App;
