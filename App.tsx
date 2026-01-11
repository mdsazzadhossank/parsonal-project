
import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, Wallet, TrendingDown, Lock, Bot, Trash2, Eye, EyeOff, Menu, X, 
  RefreshCw, TrendingUp, Calculator, CreditCard, Phone, Building2, Coins, 
  ShoppingBag, AlertCircle, CheckCircle, XCircle, Send, KeyRound, LogIn, Cloud
} from 'lucide-react';
import { Transaction, TransactionType, VaultItem, AppState, DollarTransaction, Account, AccountType, PersonalDollarUsage } from './types';
import { getFinancialAdvice } from './services/gemini';
import { dbService } from './services/api';

// --- CONFIGURATION ---
const APP_PASSWORD = "admin123"; 

const SidebarItem: React.FC<{ 
  icon: React.ReactNode; 
  label: string; 
  active: boolean; 
  onClick: () => void 
}> = ({ icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
      active 
        ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 translate-x-1' 
        : 'text-slate-600 hover:bg-blue-50 hover:text-blue-600'
    }`}
  >
    {icon}
    <span className="font-semibold text-sm">{label}</span>
  </button>
);

const Card: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className }) => (
  <div className={`bg-white rounded-2xl shadow-sm border border-slate-100 p-4 lg:p-6 ${className}`}>
    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-50 pb-2">{title}</h3>
    <div className="w-full">
      {children}
    </div>
  </div>
);

const StatCard: React.FC<{ label: string; value: number; icon: React.ReactNode; color: string; prefix?: string }> = ({ label, value, icon, color, prefix = "৳" }) => (
  <div className={`bg-white p-4 lg:p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4 transition-transform hover:scale-[1.02]`}>
    <div className={`p-3 lg:p-4 rounded-xl ${color} bg-opacity-10 text-${color.split('-')[1]}-600`}>
      {icon}
    </div>
    <div className="overflow-hidden">
      <p className="text-[10px] lg:text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">{label}</p>
      <p className="text-lg lg:text-2xl font-black text-slate-800 truncate">
        {prefix}{(value || 0).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
      </p>
    </div>
  </div>
);

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => sessionStorage.getItem('is_auth') === 'true');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState(false);
  const [showLoginPass, setShowLoginPass] = useState(false);

  const [activeTab, setActiveTab] = useState<'dashboard' | 'income' | 'expense' | 'vault' | 'ai' | 'dollar' | 'accounts' | 'personal_dollar'>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [dbStatus, setDbStatus] = useState<'connected' | 'offline'>('connected');

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [vault, setVault] = useState<VaultItem[]>([]);
  const [dollarTransactions, setDollarTransactions] = useState<DollarTransaction[]>([]);
  const [personalDollarUsage, setPersonalDollarUsage] = useState<PersonalDollarUsage[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  
  const [showPasswordMap, setShowPasswordMap] = useState<Record<string, boolean>>({});
  const [calcAmount, setCalcAmount] = useState<string>('');
  const [calcRate, setCalcRate] = useState<string>('');
  const [aiQuery, setAiQuery] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [editingSellId, setEditingSellId] = useState<string | null>(null);
  const [tempSellRate, setTempSellRate] = useState<string>('');

  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchData = async () => {
      setIsSyncing(true);
      try {
        const data = await dbService.getState();
        setTransactions(Array.isArray(data.transactions) ? data.transactions : []);
        setVault(Array.isArray(data.vault) ? data.vault : []);
        setDollarTransactions(Array.isArray(data.dollarTransactions) ? data.dollarTransactions : []);
        setPersonalDollarUsage(Array.isArray(data.personalDollarUsage) ? data.personalDollarUsage : []);
        setAccounts(Array.isArray(data.accounts) ? data.accounts : []);
        setDbStatus('connected');
      } catch (e) {
        console.error("Data fetch error:", e);
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
    
    if (accountName) {
      addTransaction(
        TransactionType.EXPENSE, 
        buyRate * quantity, 
        "ডলার ক্রয়", 
        `পরিমাণ: $${quantity.toLocaleString()}`, 
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

    const updated = dollarTransactions.map(t => t.id === id ? { ...t, sellRate, sellDate: new Date().toISOString().split('T')[0] } : t);
    setDollarTransactions(updated);
    syncModule('dollarTransactions', updated);

    if (targetTx.accountName) {
       addTransaction(
         TransactionType.INCOME, 
         sellRate * targetTx.quantity, 
         "ডলার বিক্রয়", 
         `পরিমাণ: $${targetTx.quantity.toLocaleString()} (বিক্রয় লব্ধ টাকা)`, 
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

  // Memoized calculations for performance and safety
  const stats = useMemo(() => {
    const inc = (transactions || []).filter(t => t.type === TransactionType.INCOME).reduce((s, t) => s + (t.amount || 0), 0);
    const exp = (transactions || []).filter(t => t.type === TransactionType.EXPENSE).reduce((s, t) => s + (t.amount || 0), 0);
    const profit = (dollarTransactions || []).filter(t => t.sellRate !== undefined).reduce((acc, curr) => acc + ((curr.sellRate! - curr.buyRate) * curr.quantity), 0);
    return { income: inc, expense: exp, dollarProfit: profit };
  }, [transactions, dollarTransactions]);

  const getAccountBalance = (accountName: string) => {
    const inc = (transactions || []).filter(t => t.type === TransactionType.INCOME && t.accountName === accountName).reduce((s, t) => s + (t.amount || 0), 0);
    const exp = (transactions || []).filter(t => t.type === TransactionType.EXPENSE && t.accountName === accountName).reduce((s, t) => s + (t.amount || 0), 0);
    return inc - exp;
  };

  const totalAccountBalance = useMemo(() => {
    return (accounts || []).reduce((acc, curr) => acc + getAccountBalance(curr.name), 0);
  }, [accounts, transactions]);

  const getAccountIcon = (type: AccountType) => {
    switch (type) {
      case 'Mobile Wallet': return <Phone size={24} />;
      case 'Bank': return <Building2 size={24} />;
      case 'Cash': return <Coins size={24} />;
      default: return <CreditCard size={24} />;
    }
  };

  const togglePassword = (id: string) => setShowPasswordMap(prev => ({ ...prev, [id]: !prev[id] }));

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="w-full max-w-md bg-white rounded-[2rem] shadow-2xl p-8 lg:p-10 border border-slate-100 animate-fadeIn">
          <div className="text-center mb-10">
            <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-xl shadow-blue-200">
              <Wallet className="text-white w-10 h-10" />
            </div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">আমার হিসাব</h1>
            <p className="text-slate-400 text-sm font-medium mt-2">পাসওয়ার্ড দিয়ে প্রবেশ করুন</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-1">আপনার পাসওয়ার্ড</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><KeyRound size={20} /></div>
                <input
                  type={showLoginPass ? "text" : "password"}
                  value={loginPass}
                  onChange={(e) => { setLoginPass(e.target.value); setLoginError(false); }}
                  autoFocus
                  className={`w-full pl-12 pr-12 py-4 bg-slate-50 border-2 ${loginError ? 'border-rose-400' : 'border-transparent'} rounded-2xl outline-none focus:bg-white focus:border-blue-500 transition-all font-semibold text-lg`}
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowLoginPass(!showLoginPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                  {showLoginPass ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {loginError && <p className="text-rose-500 text-xs font-bold mt-2 flex items-center gap-1"><AlertCircle size={14} /> ভুল পাসওয়ার্ড!</p>}
            </div>
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-all transform active:scale-[0.98]">
              <LogIn size={20} /> প্রবেশ করুন
            </button>
          </form>
        </div>
        <style>{`.animate-fadeIn { animation: fadeIn 0.5s ease-out; } @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }`}</style>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col lg:flex-row">
      {isSyncing && (
        <div className="fixed top-0 left-0 w-full h-1 z-[100] bg-blue-100 overflow-hidden">
          <div className="h-full bg-blue-600 animate-syncProgress w-1/3"></div>
        </div>
      )}

      {/* Sidebar Mobile Toggle */}
      <div className="lg:hidden h-16 bg-white border-b border-slate-200 px-4 flex items-center justify-between sticky top-0 z-50">
        <h1 className="text-xl font-bold text-blue-700 flex items-center gap-2"><Wallet size={24} /> আমার হিসাব</h1>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 bg-slate-50 rounded-xl border border-slate-200">
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar Overlay */}
      {sidebarOpen && <div className="lg:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40" onClick={() => setSidebarOpen(false)}></div>}

      {/* Sidebar Content */}
      <aside className={`fixed lg:sticky top-0 inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 transform transition-transform duration-300 lg:translate-x-0 h-screen flex flex-col ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-8 hidden lg:block">
          <h1 className="text-2xl font-black text-blue-700 flex items-center gap-2"><Wallet className="w-8 h-8" />আমার হিসাব</h1>
          <p className="text-[10px] text-slate-400 mt-2 uppercase tracking-widest font-black">Private Cloud System</p>
        </div>
        <nav className="flex-1 px-4 py-2 space-y-2 overflow-y-auto">
          <SidebarItem icon={<LayoutDashboard size={18}/>} label="ড্যাশবোর্ড" active={activeTab === 'dashboard'} onClick={() => { setActiveTab('dashboard'); setSidebarOpen(false); }} />
          <SidebarItem icon={<CreditCard size={18}/>} label="অ্যাকাউন্টস" active={activeTab === 'accounts'} onClick={() => { setActiveTab('accounts'); setSidebarOpen(false); }} />
          <SidebarItem icon={<TrendingUp size={18}/>} label="আয়ের তালিকা" active={activeTab === 'income'} onClick={() => { setActiveTab('income'); setSidebarOpen(false); }} />
          <SidebarItem icon={<TrendingDown size={18}/>} label="ব্যয়ের তালিকা" active={activeTab === 'expense'} onClick={() => { setActiveTab('expense'); setSidebarOpen(false); }} />
          <SidebarItem icon={<RefreshCw size={18}/>} label="ডলার বাই-সেল" active={activeTab === 'dollar'} onClick={() => { setActiveTab('dollar'); setSidebarOpen(false); }} />
          <SidebarItem icon={<ShoppingBag size={18}/>} label="পার্সোনাল ইউজ" active={activeTab === 'personal_dollar'} onClick={() => { setActiveTab('personal_dollar'); setSidebarOpen(false); }} />
          <SidebarItem icon={<Lock size={18}/>} label="পাসওয়ার্ড ভল্ট" active={activeTab === 'vault'} onClick={() => { setActiveTab('vault'); setSidebarOpen(false); }} />
          <div className="pt-4 mt-4 border-t border-slate-100">
            <SidebarItem icon={<Bot size={18}/>} label="এআই অ্যাসিস্ট্যান্ট" active={activeTab === 'ai'} onClick={() => { setActiveTab('ai'); setSidebarOpen(false); }} />
          </div>
        </nav>
        <div className="p-6 border-t border-slate-100 space-y-4">
          <button onClick={handleLogout} className="w-full flex items-center gap-2 text-rose-500 text-[11px] font-black uppercase p-3 hover:bg-rose-50 rounded-xl transition-colors">
            <XCircle size={16} /> সাইন আউট
          </button>
          <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 border rounded-lg">
             <Cloud size={14} className={dbStatus === 'connected' ? 'text-emerald-500' : 'text-rose-500'} />
             <span className="text-[10px] font-bold uppercase text-slate-500">{dbStatus}</span>
          </div>
          <div className="bg-blue-600 p-5 rounded-2xl text-white shadow-xl relative overflow-hidden group">
            <p className="text-[10px] font-bold uppercase opacity-80 mb-1">মোট ব্যালেন্স</p>
            <p className="text-xl lg:text-2xl font-black truncate">৳{totalAccountBalance.toLocaleString(undefined, { minimumFractionDigits: 1 })}</p>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 lg:p-8 w-full max-w-[1400px] mx-auto overflow-x-hidden">
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-fadeIn">
            <header>
              <h2 className="text-2xl lg:text-3xl font-black text-slate-800">ওভারভিউ</h2>
              <p className="text-slate-400 text-sm font-medium">আপনার বর্তমান আর্থিক অবস্থা</p>
            </header>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              <StatCard label="আয়" value={stats.income} icon={<TrendingUp size={20}/>} color="bg-emerald-500" />
              <StatCard label="ব্যয়" value={stats.expense} icon={<TrendingDown size={20}/>} color="bg-rose-500" />
              <StatCard label="ব্যালেন্স" value={totalAccountBalance} icon={<Wallet size={20}/>} color="bg-blue-500" />
              <StatCard label="ডলার প্রফিট" value={stats.dollarProfit} icon={<TrendingUp size={20}/>} color="bg-indigo-500" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
              <Card title="সাম্প্রতিক লেনদেন">
                <div className="space-y-3">
                  {transactions.slice(0, 5).map(t => (
                    <div key={t.id} className="flex justify-between items-center p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${t.type === TransactionType.INCOME ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                          {t.type === TransactionType.INCOME ? <TrendingUp size={16}/> : <TrendingDown size={16}/>}
                        </div>
                        <div className="min-w-0 overflow-hidden">
                          <p className="font-bold text-slate-800 text-xs lg:text-sm truncate">{t.category}</p>
                          <p className="text-[9px] text-slate-400 font-bold uppercase truncate">{t.accountName}</p>
                        </div>
                      </div>
                      <p className={`font-black text-sm lg:text-base whitespace-nowrap ${t.type === TransactionType.INCOME ? 'text-emerald-600' : 'text-rose-600'}`}>৳{t.amount.toLocaleString()}</p>
                    </div>
                  ))}
                  {transactions.length === 0 && <div className="py-8 text-center text-slate-400 text-xs">কোনো লেনদেন পাওয়া যায়নি</div>}
                </div>
              </Card>
              <Card title="অ্যাকাউন্ট ব্যালেন্স">
                <div className="space-y-3">
                  {accounts.map(acc => (
                    <div key={acc.id} className="flex justify-between items-center p-3 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="text-blue-500 bg-blue-50 p-2 rounded-lg">{getAccountIcon(acc.type)}</div>
                        <div>
                          <p className="font-bold text-slate-700 text-xs lg:text-sm">{acc.name}</p>
                          <p className="text-[9px] text-slate-400 font-bold uppercase">{acc.providerName}</p>
                        </div>
                      </div>
                      <p className="font-black text-slate-800 text-sm lg:text-base">৳{getAccountBalance(acc.name).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        )}

        {(activeTab === 'income' || activeTab === 'expense' || activeTab === 'dollar' || activeTab === 'personal_dollar') && (
          <div className="space-y-6 animate-fadeIn">
            <header><h2 className="text-2xl lg:text-3xl font-black text-slate-800">{activeTab === 'income' ? 'আয়' : activeTab === 'expense' ? 'ব্যয়' : activeTab === 'dollar' ? 'ডলার ট্রেডিং' : 'পার্সোনাল ইউজ'}</h2></header>
            <Card title="নতুন রেকর্ড">
              <form className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" onSubmit={(e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                if (activeTab === 'dollar') {
                  const buy = form.elements.namedItem('buy') as HTMLInputElement;
                  const qty = form.elements.namedItem('qty') as HTMLInputElement;
                  const acc = form.elements.namedItem('acc') as HTMLSelectElement;
                  addDollarTx(parseFloat(buy.value), undefined, parseFloat(qty.value), "", acc.value);
                } else if (activeTab === 'personal_dollar') {
                  const amt = form.elements.namedItem('amt') as HTMLInputElement;
                  const rate = form.elements.namedItem('rate') as HTMLInputElement;
                  const purpose = form.elements.namedItem('purpose') as HTMLInputElement;
                  addPersonalDollar(parseFloat(amt.value), parseFloat(rate.value), purpose.value, "");
                } else {
                  const amt = form.elements.namedItem('amt') as HTMLInputElement;
                  const cat = form.elements.namedItem('cat') as HTMLInputElement;
                  const acc = form.elements.namedItem('acc') as HTMLSelectElement;
                  addTransaction(activeTab === 'income' ? TransactionType.INCOME : TransactionType.EXPENSE, parseFloat(amt.value), cat.value, "", acc.value);
                }
                form.reset();
              }}>
                {activeTab === 'dollar' ? (
                  <>
                    <input name="buy" type="number" step="any" placeholder="৳ বাই রেট" required className="input-field" />
                    <input name="qty" type="number" step="any" placeholder="$ পরিমাণ" required className="input-field" />
                    <select name="acc" required className="input-field bg-white">
                       <option value="">অ্যাকাউন্ট</option>
                       {accounts.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
                    </select>
                  </>
                ) : activeTab === 'personal_dollar' ? (
                  <>
                    <input name="amt" type="number" step="any" placeholder="ডলার ($)" required className="input-field" />
                    <input name="rate" type="number" step="any" placeholder="রেট (৳)" required className="input-field" />
                    <input name="purpose" placeholder="উদ্দেশ্য" required className="input-field" />
                  </>
                ) : (
                  <>
                    <input name="amt" type="number" step="any" placeholder="টাকা" required className="input-field" />
                    <input name="cat" placeholder="ক্যাটাগরি" required className="input-field" />
                    <select name="acc" required className="input-field bg-white">
                      <option value="">অ্যাকাউন্ট</option>
                      {accounts.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
                    </select>
                  </>
                )}
                <button type="submit" className="btn-primary bg-blue-600 sm:col-span-full lg:col-span-1">সেভ করুন</button>
              </form>
            </Card>
            <Card title="হিস্টোরি">
              <div className="overflow-x-auto min-h-[300px]">
                <table className="w-full text-left min-w-[500px]">
                  <thead className="text-[10px] uppercase text-slate-400 font-black border-b">
                    <tr><th className="pb-3 px-2">তারিখ</th><th className="pb-3 px-2">বিস্তারিত</th><th className="pb-3 px-2 text-right">পরিমাণ</th><th className="pb-3 px-2 text-right">অ্যাকশন</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {activeTab === 'dollar' ? dollarTransactions.map(t => (
                       <tr key={t.id} className="hover:bg-slate-50">
                         <td className="py-4 px-2 text-[10px] text-slate-500">{t.date}</td>
                         <td className="py-4 px-2 text-xs font-bold">${t.quantity} <span className="text-slate-300 mx-1">@</span> ৳{t.buyRate}</td>
                         <td className="py-4 px-2 text-right">
                            {t.sellRate ? <span className="text-emerald-600 font-black">৳{t.sellRate}</span> : 
                              editingSellId === t.id ? (
                                <div className="flex gap-2 justify-end">
                                  <input type="number" step="any" autoFocus onChange={(e) => setTempSellRate(e.target.value)} className="w-16 border rounded text-xs p-1" />
                                  <button onClick={() => updateDollarSellRate(t.id, parseFloat(tempSellRate))}><CheckCircle className="text-emerald-500" size={18}/></button>
                                </div>
                              ) : <button onClick={() => setEditingSellId(t.id)} className="text-[9px] bg-indigo-600 text-white px-2 py-1 rounded">Sell</button>
                            }
                         </td>
                         <td className="py-4 px-2 text-right"><button onClick={() => deleteDollarTx(t.id)}><Trash2 className="text-slate-200 hover:text-rose-500" size={16}/></button></td>
                       </tr>
                    )) : transactions.filter(t => t.type === (activeTab === 'income' ? TransactionType.INCOME : TransactionType.EXPENSE)).map(t => (
                      <tr key={t.id} className="hover:bg-slate-50">
                        <td className="py-4 px-2 text-[10px] text-slate-500">{t.date}</td>
                        <td className="py-4 px-2 text-xs font-bold">{t.category}</td>
                        <td className={`py-4 px-2 text-right font-black ${activeTab === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>৳{t.amount.toLocaleString()}</td>
                        <td className="py-4 px-2 text-right"><button onClick={() => deleteTransaction(t.id)}><Trash2 className="text-slate-200 hover:text-rose-500" size={16}/></button></td>
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
              <header><h2 className="text-2xl lg:text-3xl font-black text-slate-800">অ্যাকাউন্টস</h2></header>
              <Card title="নতুন অ্যাকাউন্ট">
                <form className="grid grid-cols-1 sm:grid-cols-3 gap-4" onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.target as HTMLFormElement;
                  const name = (form.elements.namedItem('name') as HTMLInputElement).value;
                  const type = (form.elements.namedItem('type') as HTMLSelectElement).value as AccountType;
                  const prov = (form.elements.namedItem('prov') as HTMLInputElement).value;
                  addAccount({ name, type, providerName: prov });
                  form.reset();
                }}>
                  <input name="name" placeholder="নাম" required className="input-field" />
                  <select name="type" className="input-field bg-white">
                    <option value="Mobile Wallet">ওয়ালেট</option>
                    <option value="Bank">ব্যাংক</option>
                    <option value="Cash">নগদ/ক্যাশ</option>
                  </select>
                  <input name="prov" placeholder="প্রোভাইডার" className="input-field" />
                  <button type="submit" className="btn-primary bg-blue-600 sm:col-span-full">অ্যাড করুন</button>
                </form>
              </Card>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {accounts.map(acc => (
                  <div key={acc.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative group">
                    <button onClick={() => deleteAccount(acc.id)} className="absolute top-4 right-4 opacity-0 group-hover:opacity-100"><Trash2 size={16} className="text-slate-300 hover:text-rose-500"/></button>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl">{getAccountIcon(acc.type)}</div>
                      <h4 className="font-black text-slate-800">{acc.name}</h4>
                    </div>
                    <div className="bg-blue-600 p-4 rounded-2xl text-white">
                      <p className="text-[9px] font-bold opacity-70 uppercase mb-1">ব্যালেন্স</p>
                      <p className="text-2xl font-black truncate">৳{getAccountBalance(acc.name).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
           </div>
        )}

        {activeTab === 'vault' && (
          <div className="space-y-6 animate-fadeIn">
            <header><h2 className="text-2xl lg:text-3xl font-black text-slate-800">ভল্ট</h2></header>
            <Card title="নতুন পাসওয়ার্ড">
              <form className="grid grid-cols-1 sm:grid-cols-3 gap-4" onSubmit={(e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const site = (form.elements.namedItem('site') as HTMLInputElement).value;
                const user = (form.elements.namedItem('user') as HTMLInputElement).value;
                const pass = (form.elements.namedItem('pass') as HTMLInputElement).value;
                addVaultItem(site, user, pass, "");
                form.reset();
              }}>
                <input name="site" placeholder="সাইট" required className="input-field" />
                <input name="user" placeholder="ইউজার" required className="input-field" />
                <input name="pass" type="password" placeholder="পাসওয়ার্ড" required className="input-field" />
                <button type="submit" className="btn-primary bg-slate-800 sm:col-span-full">সেভ</button>
              </form>
            </Card>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {vault.map(v => (
                <div key={v.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative">
                  <button onClick={() => deleteVaultItem(v.id)} className="absolute top-4 right-4"><Trash2 size={16} className="text-slate-200 hover:text-rose-500"/></button>
                  <h4 className="font-black text-slate-800 text-lg mb-4 truncate pr-6">{v.siteName}</h4>
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">ইউজার: {v.username}</p>
                    <div className="bg-slate-50 p-3 rounded-xl flex items-center justify-between">
                      <span className="font-mono text-xs">{showPasswordMap[v.id] ? v.password : '••••••••'}</span>
                      <button onClick={() => togglePassword(v.id)} className="text-slate-400">
                        {showPasswordMap[v.id] ? <EyeOff size={16}/> : <Eye size={16}/>}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="space-y-6 animate-fadeIn h-full flex flex-col">
            <header><h2 className="text-2xl lg:text-3xl font-black text-slate-800">এআই</h2></header>
            <div className="flex-1 bg-white border border-slate-100 rounded-[2.5rem] p-6 lg:p-8 flex flex-col min-h-[500px]">
              <div className="flex-1 overflow-y-auto space-y-6">
                {aiResponse ? (
                  <div className="bg-blue-50/50 p-6 rounded-3xl border border-blue-100 prose prose-blue max-w-none text-slate-700 whitespace-pre-wrap font-medium">
                    {aiResponse}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center opacity-30">
                    <Bot size={48}/>
                    <p className="mt-4 font-bold">আমি আপনার পার্সোনাল ফিনান্স এক্সপার্ট।</p>
                  </div>
                )}
              </div>
              <div className="mt-6 relative">
                <input value={aiQuery} onChange={e => setAiQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAiAsk()} placeholder="প্রশ্ন করুন..." className="w-full pl-6 pr-14 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-500 focus:bg-white transition-all font-semibold" />
                <button onClick={handleAiAsk} disabled={aiLoading} className="absolute right-3 top-2 bottom-2 bg-blue-600 text-white px-4 rounded-xl">
                  {aiLoading ? <RefreshCw className="animate-spin" size={18}/> : <Send size={18}/>}
                </button>
              </div>
            </div>
          </div>
        )}

        <style>{`
          .input-field { @apply w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs lg:text-sm outline-none focus:border-blue-500 transition-all font-semibold; }
          .btn-primary { @apply text-white font-black py-3 px-6 rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50 text-xs; }
          .animate-syncProgress { animation: syncProgress 1.5s infinite linear; }
          @keyframes syncProgress { 0% { transform: translateX(-100%); } 100% { transform: translateX(200%); } }
          .animate-fadeIn { animation: fadeIn 0.4s ease-out; }
          @keyframes fadeIn { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
          * { scrollbar-width: thin; scrollbar-color: #cbd5e1 transparent; }
          *::-webkit-scrollbar { width: 4px; }
          *::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 20px; }
        `}</style>
      </main>
    </div>
  );
};

export default App;
