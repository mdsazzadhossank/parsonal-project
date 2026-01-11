import React, { useState, useEffect, useCallback } from 'react';
import { 
  LayoutDashboard, Wallet, TrendingDown, Lock, Plus, Trash2, Eye, EyeOff, Menu, X, 
  RefreshCw, TrendingUp, DollarSign, Calculator, ArrowRightLeft, CreditCard, Banknote, 
  Phone, Building2, Coins, CheckCircle2, Clock, UserCheck, ShoppingBag, Package, 
  AlertCircle, CheckCircle, XCircle, RotateCcw, Cloud, Search
} from 'lucide-react';
import { Transaction, TransactionType, VaultItem, AppState, DollarTransaction, Account, AccountType, PersonalDollarUsage, Order, OrderStatus } from './types';
import { dbService } from './services/api';

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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'income' | 'expense' | 'vault' | 'dollar' | 'accounts' | 'personal_dollar' | 'orders'>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [dbStatus, setDbStatus] = useState<'connected' | 'offline'>('connected');

  // App State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [vault, setVault] = useState<VaultItem[]>([]);
  const [dollarTransactions, setDollarTransactions] = useState<DollarTransaction[]>([]);
  const [personalDollarUsage, setPersonalDollarUsage] = useState<PersonalDollarUsage[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  
  const [showPasswordMap, setShowPasswordMap] = useState<Record<string, boolean>>({});

  // Edit states for Dollar Buy/Sell
  const [editingSellId, setEditingSellId] = useState<string | null>(null);
  const [tempSellRate, setTempSellRate] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      setIsSyncing(true);
      try {
        const data = await dbService.getState();
        setTransactions(data.transactions || []);
        setVault(data.vault || []);
        setDollarTransactions(data.dollarTransactions || []);
        setPersonalDollarUsage(data.personalDollarUsage || []);
        setOrders(data.orders || []);
        setAccounts(data.accounts || []);
        setDbStatus('connected');
      } catch (e) {
        setDbStatus('offline');
      } finally {
        setIsSyncing(false);
      }
    };
    fetchData();
  }, []);

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
    const updated = [newTx, ...transactions];
    setTransactions(updated);
    syncModule('transactions', updated);
  };

  const deleteTransaction = (id: string) => {
    const updated = transactions.filter(t => t.id !== id);
    setTransactions(updated);
    syncModule('transactions', updated);
  };

  const addVaultItem = (siteName: string, username: string, password: string, note: string) => {
    const newItem: VaultItem = {
      id: Math.random().toString(36).substr(2, 9),
      siteName, username, password, note
    };
    const updated = [newItem, ...vault];
    setVault(updated);
    syncModule('vault', updated);
  };

  const deleteVaultItem = (id: string) => {
    const updated = vault.filter(v => v.id !== id);
    setVault(updated);
    syncModule('vault', updated);
  };

  const addPersonalDollar = (amount: number, rate: number, purpose: string, note: string) => {
    const newItem: PersonalDollarUsage = {
      id: Math.random().toString(36).substr(2, 9),
      amount, rate, purpose, note,
      date: new Date().toISOString().split('T')[0]
    };
    const updated = [newItem, ...personalDollarUsage];
    setPersonalDollarUsage(updated);
    syncModule('personalDollarUsage', updated);
  };

  const deletePersonalDollar = (id: string) => {
    const updated = personalDollarUsage.filter(p => p.id !== id);
    setPersonalDollarUsage(updated);
    syncModule('personalDollarUsage', updated);
  };

  const addOrder = (orderNumber: string, customerName: string, amount: number, status: OrderStatus, note: string) => {
    const newOrder: Order = {
      id: Math.random().toString(36).substr(2, 9),
      orderNumber, customerName, amount, status, note,
      date: new Date().toISOString().split('T')[0]
    };
    const updated = [newOrder, ...orders];
    setOrders(updated);
    syncModule('orders', updated);
  };

  const updateOrderStatus = (id: string, status: OrderStatus) => {
    const updated = orders.map(o => o.id === id ? { ...o, status } : o);
    setOrders(updated);
    syncModule('orders', updated);
  };

  const deleteOrder = (id: string) => {
    const updated = orders.filter(o => o.id !== id);
    setOrders(updated);
    syncModule('orders', updated);
  };

  const addDollarTx = (buyRate: number, sellRate: number | undefined, quantity: number, note: string, accountName?: string) => {
    const newTx: DollarTransaction = {
      id: Math.random().toString(36).substr(2, 9),
      buyRate, sellRate, quantity, note, accountName,
      date: new Date().toISOString().split('T')[0]
    };
    if (accountName) {
      addTransaction(TransactionType.EXPENSE, buyRate * quantity, "ডলার ক্রয়", `পরিমাণ: $${quantity}`, accountName);
    }
    const updated = [newTx, ...dollarTransactions];
    setDollarTransactions(updated);
    syncModule('dollarTransactions', updated);
  };

  const updateDollarSellRate = (id: string, sellRate: number) => {
    const updated = dollarTransactions.map(t => t.id === id ? { ...t, sellRate, sellDate: new Date().toISOString().split('T')[0] } : t);
    setDollarTransactions(updated);
    syncModule('dollarTransactions', updated);
    setEditingSellId(null);
  };

  const deleteDollarTx = (id: string) => {
    const updated = dollarTransactions.filter(t => t.id !== id);
    setDollarTransactions(updated);
    syncModule('dollarTransactions', updated);
  };

  const addAccount = (account: Omit<Account, 'id'>) => {
    const newAccount: Account = { ...account, id: Math.random().toString(36).substr(2, 9) };
    const updated = [...accounts, newAccount];
    setAccounts(updated);
    syncModule('accounts', updated);
  };

  const deleteAccount = (id: string) => {
    const updated = accounts.filter(a => a.id !== id);
    setAccounts(updated);
    syncModule('accounts', updated);
  };

  // Stats Calculations
  const totalIncome = transactions.filter(t => t.type === TransactionType.INCOME).reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === TransactionType.EXPENSE).reduce((s, t) => s + t.amount, 0);
  const balance = totalIncome - totalExpense;
  const soldTxs = dollarTransactions.filter(t => t.sellRate !== undefined);
  const totalDollarProfit = soldTxs.reduce((acc, curr) => acc + (curr.sellRate! - curr.buyRate) * curr.quantity, 0);
  const totalOrderSales = orders.filter(o => o.status === OrderStatus.COMPLETED).reduce((s, o) => s + o.amount, 0);

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

  const togglePassword = (id: string) => {
    setShowPasswordMap(prev => ({ ...prev, [id]: !prev[id] }));
  };

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
          <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider font-semibold">Financial Cloud Sync</p>
        </div>
        <nav className="mt-4 px-4 space-y-2 overflow-y-auto max-h-[calc(100vh-280px)]">
          <SidebarItem icon={<LayoutDashboard size={20} />} label="ড্যাশবোর্ড" active={activeTab === 'dashboard'} onClick={() => { setActiveTab('dashboard'); setSidebarOpen(false); }} />
          <SidebarItem icon={<Package size={20} />} label="অর্ডার ম্যানেজমেন্ট" active={activeTab === 'orders'} onClick={() => { setActiveTab('orders'); setSidebarOpen(false); }} />
          <SidebarItem icon={<CreditCard size={20} />} label="অ্যাকাউন্টস" active={activeTab === 'accounts'} onClick={() => { setActiveTab('accounts'); setSidebarOpen(false); }} />
          <SidebarItem icon={<TrendingUp size={20} />} label="আয়ের তালিকা" active={activeTab === 'income'} onClick={() => { setActiveTab('income'); setSidebarOpen(false); }} />
          <SidebarItem icon={<TrendingDown size={20} />} label="ব্যয়ের তালিকা" active={activeTab === 'expense'} onClick={() => { setActiveTab('expense'); setSidebarOpen(false); }} />
          <SidebarItem icon={<RefreshCw size={20} />} label="ডলার বাই-সেল" active={activeTab === 'dollar'} onClick={() => { setActiveTab('dollar'); setSidebarOpen(false); }} />
          <SidebarItem icon={<ShoppingBag size={20} />} label="পার্সোনাল ডলার ইউজ" active={activeTab === 'personal_dollar'} onClick={() => { setActiveTab('personal_dollar'); setSidebarOpen(false); }} />
          <SidebarItem icon={<Lock size={20} />} label="পাসওয়ার্ড ভল্ট" active={activeTab === 'vault'} onClick={() => { setActiveTab('vault'); setSidebarOpen(false); }} />
        </nav>
        <div className="absolute bottom-8 left-0 w-full px-6 space-y-3">
          <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 border rounded-lg">
             <Cloud size={14} className={dbStatus === 'connected' ? 'text-emerald-500' : 'text-rose-500'} />
             <span className="text-[10px] font-bold uppercase text-slate-500">{dbStatus === 'connected' ? 'MySQL Online' : 'Offline'}</span>
          </div>
          <div className="bg-blue-600 p-4 rounded-xl text-white shadow-lg shadow-blue-200">
            <p className="text-[10px] font-bold uppercase opacity-80 mb-1">মোট ব্যালেন্স</p>
            <p className="text-xl font-black">৳{balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
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
              <StatCard label="অর্ডার সেলস" value={totalOrderSales} icon={<Package />} color="bg-orange-500" />
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
                      <p className={`font-black ${t.type === TransactionType.INCOME ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {t.type === TransactionType.INCOME ? '+' : '-'}৳{t.amount.toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>
              <Card title="অ্যাকাউন্ট ব্যালেন্স">
                <div className="space-y-3">
                  {accounts.map(acc => (
                    <div key={acc.id} className="flex justify-between items-center p-3 border-b border-slate-50">
                      <div className="flex items-center gap-3">
                        <div className="text-blue-500">{getAccountIcon(acc.type)}</div>
                        <p className="font-bold text-slate-700">{acc.name}</p>
                      </div>
                      <p className="font-black text-slate-800">৳{getAccountBalance(acc.name).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Income & Expense View */}
        {(activeTab === 'income' || activeTab === 'expense') && (
          <div className="space-y-6 animate-fadeIn">
            <header><h2 className="text-2xl font-bold text-slate-800">{activeTab === 'income' ? 'আয়ের তালিকা' : 'ব্যয়ের তালিকা'}</h2></header>
            <Card title="নতুন রেকর্ড যোগ করুন">
              <form className="grid grid-cols-1 md:grid-cols-4 gap-4" onSubmit={(e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                addTransaction(
                  activeTab === 'income' ? TransactionType.INCOME : TransactionType.EXPENSE,
                  Number(form.amount.value),
                  form.category.value,
                  form.note.value,
                  form.account.value
                );
                form.reset();
              }}>
                <input name="amount" type="number" placeholder="টাকার পরিমাণ" required className="px-4 py-2 border rounded-lg text-sm" />
                <input name="category" placeholder="ক্যাটাগরি (উদা: স্যালারি, ভাড়া)" required className="px-4 py-2 border rounded-lg text-sm" />
                <select name="account" required className="px-4 py-2 border rounded-lg text-sm bg-white">
                  <option value="">অ্যাকাউন্ট সিলেক্ট</option>
                  {accounts.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
                </select>
                <button type="submit" className={`px-4 py-2 text-white font-bold rounded-lg text-sm ${activeTab === 'income' ? 'bg-emerald-600' : 'bg-rose-600'}`}>সেভ করুন</button>
              </form>
            </Card>
            <Card title="লেনদেনের হিস্টোরি">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="text-[10px] uppercase text-slate-400 border-b">
                    <tr><th className="pb-3">তারিখ</th><th className="pb-3">ক্যাটাগরি</th><th className="pb-3">অ্যাকাউন্ট</th><th className="pb-3 text-right">টাকা</th><th className="pb-3 text-right">অ্যাকশন</th></tr>
                  </thead>
                  <tbody>
                    {transactions.filter(t => t.type === (activeTab === 'income' ? TransactionType.INCOME : TransactionType.EXPENSE)).map(t => (
                      <tr key={t.id} className="border-b border-slate-50 hover:bg-slate-50">
                        <td className="py-4 text-xs text-slate-500">{t.date}</td>
                        <td className="py-4 font-bold text-slate-700">{t.category}</td>
                        <td className="py-4 text-sm text-slate-600">{t.accountName}</td>
                        <td className={`py-4 text-right font-black ${activeTab === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>৳{t.amount.toLocaleString()}</td>
                        <td className="py-4 text-right"><button onClick={() => deleteTransaction(t.id)} className="text-slate-200 hover:text-rose-500"><Trash2 size={16}/></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* Vault View */}
        {activeTab === 'vault' && (
          <div className="space-y-6 animate-fadeIn">
            <header><h2 className="text-2xl font-bold text-slate-800">পাসওয়ার্ড ভল্ট</h2></header>
            <Card title="নতুন পাসওয়ার্ড সেভ করুন">
              <form className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" onSubmit={(e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                addVaultItem(form.site.value, form.user.value, form.pass.value, "");
                form.reset();
              }}>
                <input name="site" placeholder="সাইটের নাম (উদা: ফেসবুক)" required className="px-4 py-2 border rounded-lg text-sm" />
                <input name="user" placeholder="ইউজারনেম/ইমেইল" required className="px-4 py-2 border rounded-lg text-sm" />
                <input name="pass" type="password" placeholder="পাসওয়ার্ড" required className="px-4 py-2 border rounded-lg text-sm" />
                <button type="submit" className="bg-slate-800 text-white rounded-lg font-bold text-sm px-4 py-2">ভল্টে রাখুন</button>
              </form>
            </Card>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {vault.map(item => (
                <div key={item.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative group">
                  <button onClick={() => deleteVaultItem(item.id)} className="absolute top-4 right-4 text-slate-200 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={18}/></button>
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

        {/* Personal Dollar Usage */}
        {activeTab === 'personal_dollar' && (
          <div className="space-y-6 animate-fadeIn">
            <header><h2 className="text-2xl font-bold text-slate-800">পার্সোনাল ডলার ইউজ</h2></header>
            <Card title="ডলার ব্যবহারের তথ্য">
              <form className="grid grid-cols-1 md:grid-cols-4 gap-4" onSubmit={(e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                addPersonalDollar(Number(form.amount.value), Number(form.rate.value), form.purpose.value, "");
                form.reset();
              }}>
                <input name="amount" type="number" placeholder="পরিমাণ ($)" required className="px-4 py-2 border rounded-lg text-sm" />
                <input name="rate" type="number" placeholder="রেট (৳)" required className="px-4 py-2 border rounded-lg text-sm" />
                <input name="purpose" placeholder="উদ্দেশ্য (উদা: Netflix)" required className="px-4 py-2 border rounded-lg text-sm" />
                <button type="submit" className="bg-blue-600 text-white rounded-lg font-bold text-sm">সেভ করুন</button>
              </form>
            </Card>
            <Card title="ইউসেজ লিস্ট">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="text-[10px] uppercase text-slate-400 border-b">
                    <tr><th className="pb-3">তারিখ</th><th className="pb-3">উদ্দেশ্য</th><th className="pb-3 text-right">ডলার ($)</th><th className="pb-3 text-right">রেট (৳)</th><th className="pb-3 text-right">মোট (৳)</th><th className="pb-3 text-right">অ্যাকশন</th></tr>
                  </thead>
                  <tbody>
                    {personalDollarUsage.map(p => (
                      <tr key={p.id} className="border-b border-slate-50">
                        <td className="py-4 text-xs text-slate-500">{p.date}</td>
                        <td className="py-4 font-bold text-slate-700">{p.purpose}</td>
                        <td className="py-4 text-right font-medium">${p.amount}</td>
                        <td className="py-4 text-right">৳{p.rate}</td>
                        <td className="py-4 text-right font-black">৳{(p.amount * p.rate).toLocaleString()}</td>
                        <td className="py-4 text-right"><button onClick={() => deletePersonalDollar(p.id)} className="text-slate-200 hover:text-rose-500"><Trash2 size={16}/></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* Re-using accounts, orders, dollar tabs logic from original file but making sure they stay intact */}
        {activeTab === 'accounts' && (
          <div className="space-y-6 animate-fadeIn">
             <header><h2 className="text-2xl font-bold text-slate-800">অ্যাকাউন্টস</h2></header>
             <Card title="নতুন অ্যাকাউন্ট">
              <form className="grid grid-cols-1 md:grid-cols-3 gap-4" onSubmit={(e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                addAccount({ name: form.accName.value, type: form.accType.value as AccountType, providerName: form.provider.value });
                form.reset();
              }}>
                <input name="accName" placeholder="নাম (উদা: পার্সোনাল বিকাশ)" required className="px-4 py-2 border rounded-lg text-sm" />
                <select name="accType" className="px-4 py-2 border rounded-lg bg-white text-sm">
                    <option value="Mobile Wallet">মোবাইল ওয়ালেট</option>
                    <option value="Bank">ব্যাংক</option>
                    <option value="Cash">ক্যাশ</option>
                </select>
                <input name="provider" placeholder="প্রোভাইডার (উদা: বিকাশ, ডাচ-বাংলা)" className="px-4 py-2 border rounded-lg text-sm" />
                <button type="submit" className="bg-blue-600 text-white rounded-lg font-bold text-sm col-span-full py-2">অ্যাকাউন্ট সেভ করুন</button>
              </form>
            </Card>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {accounts.map(acc => (
                <div key={acc.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative group">
                  <button onClick={() => deleteAccount(acc.id)} className="absolute top-4 right-4 text-slate-200 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={18}/></button>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">{getAccountIcon(acc.type)}</div>
                    <div>
                      <h4 className="font-bold text-slate-800">{acc.name}</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">{acc.providerName}</p>
                    </div>
                  </div>
                  <div className="bg-blue-600 p-4 rounded-xl text-white shadow-md shadow-blue-100">
                    <p className="text-[10px] font-bold opacity-70 uppercase mb-1">ব্যালেন্স</p>
                    <p className="text-2xl font-black">৳{getAccountBalance(acc.name).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="space-y-6 animate-fadeIn">
            <header>
              <h2 className="text-2xl font-bold text-slate-800">অর্ডার ম্যানেজমেন্ট</h2>
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
                  <label className="text-[10px] font-bold text-slate-500 uppercase">অর্ডার #</label>
                  <input name="orderNum" type="text" placeholder="1234" required className="w-full px-3 py-2 text-sm rounded-lg border outline-none focus:ring-1 focus:ring-blue-500" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">কাস্টমার</label>
                  <input name="customer" type="text" placeholder="নাম" required className="w-full px-3 py-2 text-sm rounded-lg border outline-none focus:ring-1 focus:ring-blue-500" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">টাকা</label>
                  <input name="amount" type="number" placeholder="৳" required className="w-full px-3 py-2 text-sm rounded-lg border outline-none focus:ring-1 focus:ring-blue-500" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">স্ট্যাটাস</label>
                  <select name="status" className="w-full px-3 py-2 text-sm rounded-lg border outline-none bg-white">
                    {Object.values(OrderStatus).map(status => <option key={status} value={status}>{status}</option>)}
                  </select>
                </div>
                <div className="flex items-end">
                  <button type="submit" className="w-full bg-slate-800 text-white px-4 py-2 text-sm rounded-lg font-bold">সেভ</button>
                </div>
              </form>
            </Card>
            <Card title="অর্ডার লিস্ট">
               <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="text-slate-400 border-b border-slate-100 text-[10px] uppercase">
                    <tr><th className="pb-4">অর্ডার</th><th className="pb-4">কাস্টমার</th><th className="pb-4">তারিখ</th><th className="pb-4">স্ট্যাটাস</th><th className="pb-4 text-right">টোটাল</th><th className="pb-4 text-center">অ্যাকশন</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {orders.map(o => (
                      <tr key={o.id} className="hover:bg-slate-50">
                        <td className="py-4 font-bold text-blue-600">#{o.orderNumber}</td>
                        <td className="py-4 text-slate-700">{o.customerName}</td>
                        <td className="py-4 text-slate-500 text-xs">{o.date}</td>
                        <td className="py-4"><StatusBadge status={o.status} /></td>
                        <td className="py-4 text-right font-black">৳{o.amount.toLocaleString()}</td>
                        <td className="py-4 text-center"><button onClick={() => deleteOrder(o.id)} className="text-slate-200 hover:text-rose-600"><Trash2 size={16} /></button></td>
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
              <Card title="নতুন লেনদেন">
                <form className="grid grid-cols-1 md:grid-cols-4 gap-4" onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.target as HTMLFormElement;
                  addDollarTx(Number(form.buy.value), undefined, Number(form.qty.value), "", form.acc.value);
                  form.reset();
                }}>
                  <input name="buy" type="number" placeholder="৳ বাই রেট" required className="px-4 py-2 border rounded-lg text-sm" />
                  <input name="qty" type="number" placeholder="$ পরিমাণ" required className="px-4 py-2 border rounded-lg text-sm" />
                  <select name="acc" className="px-4 py-2 border rounded-lg text-sm bg-white">
                     <option value="">অ্যাকাউন্ট সিলেক্ট</option>
                     {accounts.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
                  </select>
                  <button type="submit" className="bg-indigo-600 text-white rounded-lg font-bold text-sm">বাই করুন</button>
                </form>
              </Card>
              <Card title="ট্রেডিং টেবিল">
                <div className="overflow-x-auto">
                   <table className="w-full text-left">
                     <thead className="text-[10px] uppercase text-slate-400 border-b">
                        <tr><th className="pb-3">তারিখ</th><th className="pb-3">পরিমাণ</th><th className="pb-3 text-right">বাই</th><th className="pb-3 text-right">সেল</th><th className="pb-3 text-right">অ্যাকশন</th></tr>
                     </thead>
                     <tbody>
                       {dollarTransactions.map(t => (
                         <tr key={t.id} className="border-b border-slate-50 hover:bg-slate-50">
                            <td className="py-4 text-xs text-slate-500">{t.date}</td>
                            <td className="py-4 font-bold text-slate-800">${t.quantity}</td>
                            <td className="py-4 text-right">৳{t.buyRate}</td>
                            <td className="py-4 text-right">
                               {t.sellRate ? <span className="text-emerald-600 font-bold">৳{t.sellRate}</span> : 
                                 editingSellId === t.id ? (
                                   <div className="flex gap-1 justify-end">
                                      <input autoFocus type="number" onChange={(e) => setTempSellRate(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && updateDollarSellRate(t.id, Number(tempSellRate))} className="w-16 border rounded text-xs px-2 py-1" placeholder="রেট" />
                                      <button onClick={() => updateDollarSellRate(t.id, Number(tempSellRate))} className="text-emerald-500"><CheckCircle size={16}/></button>
                                   </div>
                                 ) : (
                                   <button onClick={() => setEditingSellId(t.id)} className="text-[10px] font-bold bg-blue-50 text-blue-600 px-3 py-1 rounded border border-blue-100 hover:bg-blue-600 hover:text-white transition-all">Sell Now</button>
                                 )
                               }
                            </td>
                            <td className="py-4 text-right"><button onClick={() => deleteDollarTx(t.id)} className="text-slate-200 hover:text-rose-500"><Trash2 size={16}/></button></td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                </div>
              </Card>
          </div>
        )}

        <style>{`
          @keyframes syncProgress {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          .animate-syncProgress {
            animation: syncProgress 1.5s infinite linear;
          }
          @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
          .animate-fadeIn { animation: fadeIn 0.3s ease-out forwards; }
        `}</style>
      </main>
    </div>
  );
};
export default App;