import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store/StoreContext';
import AdminDashboard from '@/components/admin/AdminDashboard';
import AdminOrders from '@/components/admin/AdminOrders';
import AdminMenu from '@/components/admin/AdminMenu';
import AdminPayments from '@/components/admin/AdminPayments';
import AdminReports from '@/components/admin/AdminReports';
import AdminUsers from '@/components/admin/AdminUsers';
import AdminExpenses from '@/components/admin/AdminExpenses';
import { LayoutDashboard, ClipboardList, UtensilsCrossed, CreditCard, BarChart3, Users, Wallet, Coffee, LogOut, ArrowLeft, Lock, Shield, User as UserIcon } from 'lucide-react';

const pageTitles: Record<string, [string, string]> = {
  dashboard: ['Dashboard', 'Overview of today'],
  orders: ['Orders', 'All orders today'],
  menu: ['Menu Management', 'Robot & Staff menus'],
  payments: ['Payments & API', 'Configure payment providers'],
  reports: ['Financial Reports', 'Daily, weekly & monthly reports'],
  users: ['User Management', 'Admins & staff accounts'],
  expenses: ['Expenses', 'Track daily costs'],
};

const AdminPanel = () => {
  const navigate = useNavigate();
  const { currentUser, login, logout } = useStore();
  const [page, setPage] = useState('dashboard');
  const [clock, setClock] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState(false);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setClock(now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
      setDateStr(now.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleLogin = () => {
    if (login(loginUser, loginPass)) {
      setLoginError(false);
    } else {
      setLoginError(true);
    }
  };

  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', section: 'OVERVIEW' },
    { id: 'orders', icon: ClipboardList, label: 'Orders', section: 'OVERVIEW' },
    { id: 'menu', icon: UtensilsCrossed, label: 'Menu Items', section: 'MANAGEMENT', superOnly: true },
    { id: 'payments', icon: CreditCard, label: 'Payments & API', section: 'MANAGEMENT', superOnly: true },
    { id: 'reports', icon: BarChart3, label: 'Reports', section: 'MANAGEMENT', superOnly: true },
    { id: 'users', icon: Users, label: 'Users', section: 'MANAGEMENT', superOnly: true },
    { id: 'expenses', icon: Wallet, label: 'Expenses', section: 'MANAGEMENT', superOnly: true },
  ];

  // Login screen
  if (!currentUser) {
    return (
      <div className="fixed inset-0 z-[9999] bg-background flex items-center justify-center">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[radial-gradient(ellipse,hsl(var(--primary)/0.05)_0%,transparent_70%)]" />
        <div className="bg-card border border-border rounded-2xl p-8 w-[380px] text-center relative z-10 animate-fade-up">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-7 h-7 text-primary" />
          </div>
          <div className="text-foreground text-xl font-bold mb-0.5">PLC Admin</div>
          <div className="text-muted-foreground text-xs mb-6">Sign in to manage your cafeteria</div>
          <div className="mb-3">
            <input
              className="w-full p-3 bg-secondary border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-primary/50 transition-colors"
              type="text" placeholder="Username" value={loginUser}
              onChange={e => setLoginUser(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
            />
          </div>
          <div className="mb-4">
            <input
              className="w-full p-3 bg-secondary border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-primary/50 transition-colors"
              type="password" placeholder="Password" value={loginPass}
              onChange={e => setLoginPass(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
            />
          </div>
          <button
            onClick={handleLogin}
            className="w-full py-3 bg-primary text-primary-foreground rounded-lg text-sm font-bold cursor-pointer transition-all hover:opacity-90"
          >
            Sign In
          </button>
          {loginError && <div className="text-destructive text-sm mt-3 flex items-center gap-1.5 justify-center"><Lock className="w-3.5 h-3.5" /> Invalid credentials</div>}
          <div className="mt-5 text-muted-foreground text-xs">
            Super Admin: admin / admin123 &nbsp;|&nbsp; Staff: staff / staff123
          </div>
        </div>
      </div>
    );
  }

  const renderPage = () => {
    switch (page) {
      case 'dashboard': return <AdminDashboard />;
      case 'orders': return <AdminOrders />;
      case 'menu': return <AdminMenu />;
      case 'payments': return <AdminPayments />;
      case 'reports': return <AdminReports />;
      case 'users': return <AdminUsers />;
      case 'expenses': return <AdminExpenses />;
      default: return <AdminDashboard />;
    }
  };

  let currentSection = '';

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <div className="w-56 shrink-0 bg-card border-r border-border flex flex-col">
        <div className="px-5 py-5 border-b border-border flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Coffee className="w-4 h-4 text-primary" />
          </div>
          <div>
            <div className="text-foreground text-sm font-bold">PLC</div>
            <div className="text-muted-foreground text-[10px]">ADMIN PANEL</div>
          </div>
        </div>

        <div className="mx-3 my-3 bg-secondary border border-border rounded-lg p-2.5 flex items-center gap-2.5">
          <div className={`w-7 h-7 rounded-md flex items-center justify-center ${currentUser.role === 'super' ? 'bg-primary/10 text-primary' : 'bg-info/10 text-info'}`}>
            {currentUser.role === 'super' ? <Shield className="w-3.5 h-3.5" /> : <UserIcon className="w-3.5 h-3.5" />}
          </div>
          <div>
            <div className="text-[10px] font-semibold text-muted-foreground tracking-wider uppercase">{currentUser.role === 'super' ? 'SUPER ADMIN' : 'STAFF'}</div>
            <div className="text-foreground text-xs font-medium">{currentUser.name}</div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-1">
          {navItems.map(item => {
            if (item.superOnly && currentUser.role !== 'super') return null;
            let sectionHeader = null;
            if (item.section !== currentSection) {
              currentSection = item.section;
              sectionHeader = <div className="text-muted-foreground text-[9px] tracking-widest uppercase px-3 pt-4 pb-1.5 font-semibold">{item.section}</div>;
            }
            const Icon = item.icon;
            return (
              <div key={item.id}>
                {sectionHeader}
                <button
                  onClick={() => setPage(item.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-all text-[13px] mb-0.5 text-left ${
                    page === item.id
                      ? 'bg-primary/10 text-primary font-semibold'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              </div>
            );
          })}
        </div>

        <div className="p-3 border-t border-border space-y-1.5">
          <button onClick={() => navigate('/menu')} className="w-full p-2 bg-secondary border border-border rounded-lg text-muted-foreground cursor-pointer text-xs flex items-center gap-2 hover:text-foreground transition-all">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to POS
          </button>
          <button onClick={logout} className="w-full p-2 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive cursor-pointer text-xs flex items-center gap-2 hover:bg-destructive/20 transition-all">
            <LogOut className="w-3.5 h-3.5" /> Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="px-6 py-4 bg-card border-b border-border flex items-center justify-between">
          <div>
            <div className="text-foreground text-lg font-bold">{pageTitles[page][0]}</div>
            <div className="text-muted-foreground text-xs mt-0.5">{pageTitles[page][1]}</div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-foreground text-lg font-semibold tabular-nums">{clock}</span>
            <span className="text-muted-foreground text-xs">{dateStr}</span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {renderPage()}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
