import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import AdminDashboard from '@/components/admin/AdminDashboard';
import AdminOrders from '@/components/admin/AdminOrders';
import AdminMenu from '@/components/admin/AdminMenu';
import AdminPayments from '@/components/admin/AdminPayments';
import AdminReports from '@/components/admin/AdminReports';
import AdminUsers from '@/components/admin/AdminUsers';
import AdminExpenses from '@/components/admin/AdminExpenses';
import SetupAdmin from '@/components/admin/SetupAdmin';
import StorageSettings from '@/components/settings/StorageSettings';
import { LayoutDashboard, ClipboardList, UtensilsCrossed, CreditCard, BarChart3, Users, Wallet, Coffee, LogOut, ArrowLeft, Lock, Shield, User as UserIcon, Loader2, Mail, KeyRound, HardDrive } from 'lucide-react';

const pageTitles: Record<string, [string, string]> = {
  dashboard: ['Dashboard', 'Overview of today'],
  orders: ['Orders', 'All orders today'],
  menu: ['Menu Management', 'Robot & Staff menus'],
  payments: ['Payments & API', 'Configure payment providers'],
  reports: ['Financial Reports', 'Daily, weekly & monthly reports'],
  users: ['User Management', 'Admins & staff accounts'],
  expenses: ['Expenses', 'Track daily costs'],
  storage: ['Storage Settings', 'Image storage configuration'],
};

const AdminPanel = () => {
  const navigate = useNavigate();
  const { user, loading, signIn, signOut } = useAuth();
  const [page, setPage] = useState('dashboard');
  const [clock, setClock] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [needsSetup, setNeedsSetup] = useState<boolean | null>(null);

  useEffect(() => {
    const checkSetup = async () => {
      try {
        const { data } = await supabase.functions.invoke('setup-admin', {
          body: { action: 'check' },
        });
        setNeedsSetup(data?.needsSetup === true);
      } catch {
        setNeedsSetup(false);
      }
    };
    if (!loading && !user) checkSetup();
  }, [loading, user]);

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

  const handleLogin = async () => {
    if (!loginEmail || !loginPass) return;
    setLoginLoading(true);
    setLoginError('');
    const { error } = await signIn(loginEmail, loginPass);
    if (error) {
      setLoginError(error.message);
    }
    setLoginLoading(false);
  };

  const handleLogout = async () => {
    await signOut();
  };

  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', section: 'OVERVIEW' },
    { id: 'orders', icon: ClipboardList, label: 'Orders', section: 'OVERVIEW' },
    { id: 'menu', icon: UtensilsCrossed, label: 'Menu Items', section: 'MANAGEMENT', superOnly: true },
    { id: 'payments', icon: CreditCard, label: 'Payments & API', section: 'MANAGEMENT', superOnly: true },
    { id: 'reports', icon: BarChart3, label: 'Reports', section: 'MANAGEMENT', superOnly: true },
    { id: 'users', icon: Users, label: 'Users', section: 'MANAGEMENT', superOnly: true },
    { id: 'expenses', icon: Wallet, label: 'Expenses', section: 'MANAGEMENT', superOnly: true },
    { id: 'storage', icon: HardDrive, label: 'Storage', section: 'MANAGEMENT', superOnly: true },
  ];

  // Loading screen
  if (loading || needsSetup === null) {
    return (
      <div className="fixed inset-0 z-[9999] bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  // Initial setup
  if (needsSetup && !user) {
    return <SetupAdmin onComplete={() => setNeedsSetup(false)} />;
  }

  // Login screen
  if (!user) {
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
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                className="w-full p-3 pl-10 bg-secondary border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-primary/50 transition-colors"
                type="email" placeholder="Email address" value={loginEmail}
                onChange={e => setLoginEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
              />
            </div>
          </div>
          <div className="mb-4">
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                className="w-full p-3 pl-10 bg-secondary border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-primary/50 transition-colors"
                type="password" placeholder="Password" value={loginPass}
                onChange={e => setLoginPass(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
              />
            </div>
          </div>
          <button
            onClick={handleLogin}
            disabled={loginLoading}
            className="w-full py-3 bg-primary text-primary-foreground rounded-lg text-sm font-bold cursor-pointer transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loginLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            Sign In
          </button>
          {loginError && <div className="text-destructive text-sm mt-3 flex items-center gap-1.5 justify-center"><Lock className="w-3.5 h-3.5" /> {loginError}</div>}
        </div>
      </div>
    );
  }

  // No role assigned
  if (!user.role) {
    return (
      <div className="fixed inset-0 z-[9999] bg-background flex items-center justify-center">
        <div className="bg-card border border-border rounded-2xl p-8 w-[380px] text-center">
          <div className="w-14 h-14 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-7 h-7 text-destructive" />
          </div>
          <div className="text-foreground text-xl font-bold mb-2">Access Denied</div>
          <div className="text-muted-foreground text-sm mb-4">Your account has no admin role assigned. Contact a super admin.</div>
          <button onClick={handleLogout} className="w-full py-3 bg-destructive/10 text-destructive rounded-lg text-sm font-bold cursor-pointer hover:bg-destructive/20 transition-all">
            Sign Out
          </button>
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
      case 'storage': return <StorageSettings />;
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
          <div className={`w-7 h-7 rounded-md flex items-center justify-center ${user.role === 'super' ? 'bg-primary/10 text-primary' : 'bg-blue-500/10 text-blue-400'}`}>
            {user.role === 'super' ? <Shield className="w-3.5 h-3.5" /> : <UserIcon className="w-3.5 h-3.5" />}
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-semibold text-muted-foreground tracking-wider uppercase">{user.role === 'super' ? 'SUPER ADMIN' : 'STAFF'}</div>
            <div className="text-foreground text-xs font-medium truncate">{user.name}</div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-1">
          {navItems.map(item => {
            if (item.superOnly && user.role !== 'super') return null;
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
          <button onClick={handleLogout} className="w-full p-2 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive cursor-pointer text-xs flex items-center gap-2 hover:bg-destructive/20 transition-all">
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
