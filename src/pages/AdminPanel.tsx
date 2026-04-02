import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useAdminLang, fetchCafeConfig } from '@/hooks/useAdminLang';
import AdminDashboard from '@/components/admin/AdminDashboard';
import AdminOrders from '@/components/admin/AdminOrders';
import AdminMenu from '@/components/admin/AdminMenu';
// AdminPayments moved to DevPanel
import AdminReports from '@/components/admin/AdminReports';
import AdminUsers from '@/components/admin/AdminUsers';
import AdminExpenses from '@/components/admin/AdminExpenses';
import AdminPLC from '@/components/admin/AdminPLC';
import AdminPLCLogs from '@/components/admin/AdminPLCLogs';
import AdminBridgeMonitor from '@/components/admin/AdminBridgeMonitor';
import AdminCafeSettings from '@/components/admin/AdminCafeSettings';
import AdminPermissions, { fetchPermissions, PermissionsConfig } from '@/components/admin/AdminPermissions';
import SetupAdmin from '@/components/admin/SetupAdmin';
// StorageSettings moved to DevPanel
import { LayoutDashboard, ClipboardList, UtensilsCrossed, CreditCard, BarChart3, Users, Wallet, Coffee, LogOut, ArrowLeft, Lock, Shield, User as UserIcon, Loader2, Mail, KeyRound, HardDrive, Cpu, Settings, Globe, Menu as MenuIcon, X, FileText, Activity } from 'lucide-react';
import { Language } from '@/types';

const AdminPanel = () => {
  const navigate = useNavigate();
  const { user, loading, signIn, signOut } = useAuth();
  const { lang, setLang, t, dir } = useAdminLang();
  const [page, setPage] = useState('dashboard');
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [clock, setClock] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [needsSetup, setNeedsSetup] = useState<boolean | null>(null);
  const [cafeName, setCafeNameState] = useState('PLC');
  const [permissions, setPermissions] = useState<PermissionsConfig | null>(null);

  useEffect(() => {
    fetchCafeConfig().then(cfg => setCafeNameState(cfg.name));
    fetchPermissions().then(p => setPermissions(p));
    const handler = () => fetchCafeConfig().then(cfg => setCafeNameState(cfg.name));
    window.addEventListener('cafe-config-updated', handler);
    return () => window.removeEventListener('cafe-config-updated', handler);
  }, []);

  useEffect(() => {
    const checkSetup = async () => {
      try {
        const { data } = await supabase.functions.invoke('setup-admin', { body: { action: 'check' } });
        setNeedsSetup(data?.needsSetup === true);
      } catch { setNeedsSetup(false); }
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
    if (error) setLoginError(error.message);
    setLoginLoading(false);
  };

  const handleLogout = async () => { await signOut(); };

  const pageTitles: Record<string, [string, string]> = {
    dashboard: [t.dashboardTitle, t.dashboardSub],
    orders: [t.ordersTitle, t.ordersSub],
    menu: [t.menuTitle, t.menuSub],
    // payments moved to DevPanel
    reports: [t.reportsTitle, t.reportsSub],
    users: [t.usersTitle, t.usersSub],
    expenses: [t.expensesTitle, t.expensesSub],
    storage: [t.storageTitle, t.storageSub],
    plc: [t.plcTitle, t.plcSub],
    plcLogs: [t.plcLogsTitle, t.plcLogsSub],
    bridgeMonitor: [lang === 'ku' ? 'مۆنیتۆری Bridge' : lang === 'ar' ? 'مراقب Bridge' : 'Bridge Monitor', lang === 'ku' ? 'سەیری دۆخی bridge.js و ئۆردەرەکان' : lang === 'ar' ? 'مراقبة حالة bridge.js' : 'Monitor bridge.js & order status'],
    cafeSettings: [t.cafeSettingsTitle, t.cafeSettingsSub],
    permissions: [lang === 'ku' ? 'دەسەڵاتەکان' : lang === 'ar' ? 'الصلاحيات' : 'Permissions', lang === 'ku' ? 'دەسەڵاتی ستاف و ئەدمین' : lang === 'ar' ? 'صلاحيات الموظفين والمدراء' : 'Staff & admin permissions'],
  };

  // Helper to check if staff can access a section
  const canAccess = (sectionId: string) => {
    if (!user) return false;
    if (user.role === 'super') return true;
    if (!permissions) return sectionId === 'dashboard' || sectionId === 'orders';
    return permissions.staffPermissions[sectionId] === true;
  };

  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: t.dashboard, section: t.overview },
    { id: 'orders', icon: ClipboardList, label: t.orders, section: t.overview },
    { id: 'menu', icon: UtensilsCrossed, label: t.menuItems, section: t.management, superOnly: false },
    // payments moved to DevPanel
    { id: 'reports', icon: BarChart3, label: t.reports, section: t.management, superOnly: false },
    { id: 'users', icon: Users, label: t.users, section: t.management, superOnly: true },
    { id: 'expenses', icon: Wallet, label: t.expenses, section: t.management, superOnly: false },
    // Storage removed - now in DevPanel
    { id: 'plc', icon: Cpu, label: t.plcIntegration, section: t.management, superOnly: false },
    { id: 'plcLogs', icon: FileText, label: t.plcLogsIntegration, section: t.management, superOnly: false },
    { id: 'bridgeMonitor', icon: Activity, label: lang === 'ku' ? 'مۆنیتۆری Bridge' : lang === 'ar' ? 'مراقب Bridge' : 'Bridge Monitor', section: t.management, superOnly: false },
    { id: 'permissions', icon: Shield, label: lang === 'ku' ? 'دەسەڵاتەکان' : lang === 'ar' ? 'الصلاحيات' : 'Permissions', section: t.management, superOnly: true },
    { id: 'cafeSettings', icon: Settings, label: t.settings, section: t.management, superOnly: false },
  ];

  if (loading || needsSetup === null) {
    return (
      <div className="fixed inset-0 z-[9999] bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (needsSetup && !user) {
    return <SetupAdmin onComplete={() => setNeedsSetup(false)} />;
  }

  if (!user) {
    return (
      <div className="fixed inset-0 z-[9999] bg-background flex items-center justify-center" dir={dir}>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[radial-gradient(ellipse,hsl(var(--primary)/0.05)_0%,transparent_70%)]" />
        <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 w-full max-w-[380px] mx-4 text-center relative z-10 animate-fade-up">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-7 h-7 text-primary" />
          </div>
          <div className="text-foreground text-xl font-bold mb-0.5">{cafeName} {t.adminPanel}</div>
          <div className="text-muted-foreground text-xs mb-4">{t.signInDesc}</div>
          {/* Language switcher */}
          <div className="flex gap-1.5 justify-center mb-4">
            {(['ku', 'ar', 'en'] as Language[]).map(l => (
              <button key={l} onClick={() => setLang(l)}
                className={`px-3 py-1 rounded-md text-[10px] font-semibold transition-all border ${lang === l ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-muted-foreground'}`}>
                {l === 'ku' ? 'کوردی' : l === 'ar' ? 'العربية' : 'EN'}
              </button>
            ))}
          </div>
          <div className="mb-3">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input className="w-full p-3 pl-10 bg-secondary border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-primary/50 transition-colors" type="email" placeholder={t.emailAddress} value={loginEmail} onChange={e => setLoginEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} />
            </div>
          </div>
          <div className="mb-4">
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input className="w-full p-3 pl-10 bg-secondary border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-primary/50 transition-colors" type="password" placeholder={t.password} value={loginPass} onChange={e => setLoginPass(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} />
            </div>
          </div>
          <button onClick={handleLogin} disabled={loginLoading} className="w-full py-3 bg-primary text-primary-foreground rounded-lg text-sm font-bold cursor-pointer transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
            {loginLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {t.signIn}
          </button>
          {loginError && <div className="text-destructive text-sm mt-3 flex items-center gap-1.5 justify-center"><Lock className="w-3.5 h-3.5" /> {loginError}</div>}
        </div>
      </div>
    );
  }

  if (!user.role) {
    return (
      <div className="fixed inset-0 z-[9999] bg-background flex items-center justify-center" dir={dir}>
        <div className="bg-card border border-border rounded-2xl p-8 w-[380px] text-center">
          <div className="w-14 h-14 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-7 h-7 text-destructive" />
          </div>
          <div className="text-foreground text-xl font-bold mb-2">{t.accessDenied}</div>
          <div className="text-muted-foreground text-sm mb-4">{t.noRoleDesc}</div>
          <button onClick={handleLogout} className="w-full py-3 bg-destructive/10 text-destructive rounded-lg text-sm font-bold cursor-pointer hover:bg-destructive/20 transition-all">
            {t.signOut}
          </button>
        </div>
      </div>
    );
  }

  const renderPage = () => {
    switch (page) {
      case 'dashboard': return <AdminDashboard lang={lang} />;
      case 'orders': return <AdminOrders lang={lang} />;
      case 'menu': return <AdminMenu lang={lang} />;
      // payments moved to DevPanel
      case 'reports': return <AdminReports lang={lang} />;
      case 'users': return <AdminUsers lang={lang} />;
      case 'expenses': return <AdminExpenses lang={lang} />;
      // storage removed - now in DevPanel
      case 'plc': return <AdminPLC lang={lang} />;
      case 'plcLogs': return <AdminPLCLogs lang={lang} />;
      case 'bridgeMonitor': return <AdminBridgeMonitor lang={lang} />;
      case 'permissions': return <AdminPermissions lang={lang} />;
      case 'cafeSettings': return <AdminCafeSettings lang={lang} />;
      default: return <AdminDashboard lang={lang} />;
    }
  };

  let currentSection = '';

  return (
    <div className="flex h-screen overflow-hidden bg-background" dir={dir}>
      {/* Mobile sidebar overlay */}
      {showMobileSidebar && <div className="fixed inset-0 bg-background/60 backdrop-blur-sm z-40 lg:hidden" onClick={() => setShowMobileSidebar(false)} />}

      {/* Sidebar */}
      <div className={`${showMobileSidebar ? 'fixed inset-y-0 left-0 z-50 w-64 shadow-2xl' : 'hidden'} lg:relative lg:block lg:w-56 shrink-0 bg-card border-r border-border flex flex-col`}>
        <div className="px-4 sm:px-5 py-4 sm:py-5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Coffee className="w-4 h-4 text-primary" />
            </div>
            <div>
              <div className="text-foreground text-sm font-bold">{cafeName}</div>
              <div className="text-muted-foreground text-[10px]">{t.adminPanel.toUpperCase()}</div>
            </div>
          </div>
          <button onClick={() => setShowMobileSidebar(false)} className="lg:hidden w-7 h-7 rounded-md bg-secondary flex items-center justify-center text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mx-3 my-3 bg-secondary border border-border rounded-lg p-2.5 flex items-center gap-2.5">
          <div className={`w-7 h-7 rounded-md flex items-center justify-center ${user.role === 'super' ? 'bg-primary/10 text-primary' : 'bg-blue-500/10 text-blue-400'}`}>
            {user.role === 'super' ? <Shield className="w-3.5 h-3.5" /> : <UserIcon className="w-3.5 h-3.5" />}
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-semibold text-muted-foreground tracking-wider uppercase">{user.role === 'super' ? t.superAdmin : t.staff}</div>
            <div className="text-foreground text-xs font-medium truncate">{user.name}</div>
          </div>
        </div>

        {/* Language switcher in sidebar */}
        <div className="mx-3 mb-2 flex gap-1">
          {(['ku', 'ar', 'en'] as Language[]).map(l => (
            <button key={l} onClick={() => setLang(l)}
              className={`flex-1 py-1.5 rounded-md text-[10px] font-semibold transition-all border ${lang === l ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-muted-foreground hover:text-foreground'}`}>
              {l === 'ku' ? 'کوردی' : l === 'ar' ? 'عربي' : 'EN'}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-1">
          {navItems.map(item => {
            if (item.superOnly && user.role !== 'super') return null;
            if (!item.superOnly && !canAccess(item.id)) return null;
            let sectionHeader = null;
            if (item.section !== currentSection) {
              currentSection = item.section;
              sectionHeader = <div className="text-muted-foreground text-[9px] tracking-widest uppercase px-3 pt-4 pb-1.5 font-semibold">{item.section}</div>;
            }
            const Icon = item.icon;
            return (
              <div key={item.id}>
                {sectionHeader}
                <button onClick={() => { setPage(item.id); setShowMobileSidebar(false); }} className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-all text-[13px] mb-0.5 text-left ${page === item.id ? 'bg-primary/10 text-primary font-semibold' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`}>
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              </div>
            );
          })}
        </div>

        <div className="p-3 border-t border-border space-y-1.5">
          <button onClick={() => navigate('/menu')} className="w-full p-2 bg-secondary border border-border rounded-lg text-muted-foreground cursor-pointer text-xs flex items-center gap-2 hover:text-foreground transition-all">
            <ArrowLeft className="w-3.5 h-3.5" /> {t.backToPos}
          </button>
          <button onClick={handleLogout} className="w-full p-2 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive cursor-pointer text-xs flex items-center gap-2 hover:bg-destructive/20 transition-all">
            <LogOut className="w-3.5 h-3.5" /> {t.logout}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="px-3 sm:px-6 py-3 sm:py-4 bg-card border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Mobile hamburger */}
            <button onClick={() => setShowMobileSidebar(true)} className="lg:hidden w-9 h-9 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground">
              <MenuIcon className="w-5 h-5" />
            </button>
            <div>
              <div className="text-foreground text-base sm:text-lg font-bold">{pageTitles[page]?.[0]}</div>
              <div className="text-muted-foreground text-[10px] sm:text-xs mt-0.5 hidden sm:block">{pageTitles[page]?.[1]}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Language switcher in header */}
            <div className="hidden sm:flex gap-1">
              {(['ku', 'ar', 'en'] as Language[]).map(l => (
                <button key={l} onClick={() => setLang(l)}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-semibold transition-all border ${lang === l ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-secondary text-muted-foreground'}`}>
                  {l === 'ku' ? 'کو' : l === 'ar' ? 'عر' : 'EN'}
                </button>
              ))}
            </div>
            <span className="text-foreground text-sm sm:text-lg font-semibold tabular-nums">{clock}</span>
            <span className="text-muted-foreground text-[10px] sm:text-xs hidden sm:inline">{dateStr}</span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-3 sm:p-6">
          {renderPage()}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
