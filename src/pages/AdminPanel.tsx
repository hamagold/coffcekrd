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
      setClock(now.toLocaleTimeString('en-GB'));
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
    { id: 'dashboard', icon: '📊', label: 'Dashboard', section: 'OVERVIEW' },
    { id: 'orders', icon: '🧾', label: 'Orders', section: 'OVERVIEW' },
    { id: 'menu', icon: '🍽️', label: 'Menu Items', section: 'MANAGEMENT', superOnly: true },
    { id: 'payments', icon: '💳', label: 'Payments & API', section: 'MANAGEMENT', superOnly: true },
    { id: 'reports', icon: '📈', label: 'Reports', section: 'MANAGEMENT', superOnly: true },
    { id: 'users', icon: '👥', label: 'Users', section: 'MANAGEMENT', superOnly: true },
    { id: 'expenses', icon: '💰', label: 'Expenses', section: 'MANAGEMENT', superOnly: true },
  ];

  // Login screen
  if (!currentUser) {
    return (
      <div className="fixed inset-0 z-[9999] bg-[radial-gradient(ellipse_at_center,hsl(43,30%,8%),hsl(0,0%,4%))] flex items-center justify-center">
        <div className="bg-muted border border-primary/30 rounded-3xl p-10 w-[380px] text-center">
          <div className="text-primary text-5xl font-black font-display mb-2">PLC</div>
          <div className="text-primary text-sm tracking-[3px] mb-1">ADMIN PANEL</div>
          <div className="text-foreground/40 text-sm mb-8">Premium Cafeteria System</div>
          <div className="mb-4">
            <input
              className="w-full p-3 bg-secondary border border-foreground/10 rounded-lg text-foreground text-sm focus:outline-none focus:border-primary"
              type="text" placeholder="Username" value={loginUser}
              onChange={e => setLoginUser(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
            />
          </div>
          <div className="mb-4">
            <input
              className="w-full p-3 bg-secondary border border-foreground/10 rounded-lg text-foreground text-sm focus:outline-none focus:border-primary"
              type="password" placeholder="Password" value={loginPass}
              onChange={e => setLoginPass(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
            />
          </div>
          <button
            onClick={handleLogin}
            className="w-full py-3.5 bg-gradient-to-r from-gold-dark to-primary border-none rounded-lg text-background text-base font-black cursor-pointer"
          >
            Login →
          </button>
          {loginError && <div className="text-destructive text-sm mt-2">❌ Invalid credentials</div>}
          <div className="mt-5 text-foreground/30 text-xs">
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
      <div className="w-60 shrink-0 bg-gradient-to-b from-[hsl(0,0%,5%)] to-secondary border-r border-primary/15 flex flex-col">
        <div className="px-5 py-6 border-b border-primary/15 text-center">
          <div className="text-primary text-3xl font-black font-display tracking-[4px]">PLC</div>
          <div className="text-primary/50 text-[11px] tracking-[2px]">ADMIN PANEL</div>
        </div>

        <div className="mx-4 my-3 bg-primary/10 border border-primary/30 rounded-lg p-2 flex items-center gap-2">
          <span>{currentUser.role === 'super' ? '👑' : '👤'}</span>
          <div>
            <div className="text-primary text-[11px] font-bold tracking-wider">{currentUser.role === 'super' ? 'SUPER ADMIN' : 'STAFF'}</div>
            <div className="text-foreground text-sm">{currentUser.name}</div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {navItems.map(item => {
            if (item.superOnly && currentUser.role !== 'super') return null;
            let sectionHeader = null;
            if (item.section !== currentSection) {
              currentSection = item.section;
              sectionHeader = <div className="text-foreground/30 text-[10px] tracking-[2px] px-3 py-2">{item.section}</div>;
            }
            return (
              <div key={item.id}>
                {sectionHeader}
                <button
                  onClick={() => setPage(item.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg cursor-pointer transition-all text-sm mb-0.5 text-left ${page === item.id ? 'bg-primary/15 text-primary border-l-[3px] border-l-primary' : 'text-foreground/50 hover:bg-primary/10 hover:text-foreground border-l-[3px] border-l-transparent'}`}
                >
                  <span className="text-lg w-6 text-center">{item.icon}</span>
                  {item.label}
                </button>
              </div>
            );
          })}
        </div>

        <div className="p-4 border-t border-foreground/5">
          <button onClick={() => navigate('/menu')} className="w-full p-2.5 bg-primary/10 border border-primary/30 rounded-lg text-primary cursor-pointer text-sm mb-2">← Back to POS</button>
          <button onClick={logout} className="w-full p-2 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive cursor-pointer text-sm">Logout</button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="px-6 py-4 bg-secondary border-b border-foreground/5 flex items-center justify-between">
          <div>
            <div className="text-foreground text-xl font-bold">{pageTitles[page][0]}</div>
            <div className="text-foreground/40 text-sm mt-0.5">{pageTitles[page][1]}</div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-primary text-xl tabular-nums">{clock}</div>
            <div className="text-foreground/40 text-xs">{dateStr}</div>
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
