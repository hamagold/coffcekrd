import { useState, useEffect } from 'react';
import { useStore } from '@/store/StoreContext';
import { Wallet, Plus, Trash2, Lightbulb, Droplets, HardHat, Package, FileText, X, Users, Phone, CheckCircle2, XCircle, ChevronLeft, ChevronRight, Bell, AlertTriangle } from 'lucide-react';
import { Language } from '@/types';
import { adminT } from '@/data/adminTranslations';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface StaffMember {
  id: string;
  name: string;
  phone: string;
  salary: number;
  payments: Record<string, boolean>; // "2026-1": true means paid for Jan 2026
}

const MONTH_NAMES = {
  ku: ['کانوونی دووەم', 'شوبات', 'ئازار', 'نیسان', 'ئایار', 'حوزەیران', 'تەممووز', 'ئاب', 'ئەیلوول', 'تشرینی یەکەم', 'تشرینی دووەم', 'کانوونی یەکەم'],
  ar: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
};

const AdminExpenses = ({ lang }: { lang: Language }) => {
  const { expenses, addExpense, deleteExpense } = useStore();
  const t = adminT[lang];
  const dir = lang === 'en' ? 'ltr' : 'rtl';
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ type: 'electricity', desc: '', amount: '', date: new Date().toISOString().split('T')[0] });

  // Staff state
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [staffForm, setStaffForm] = useState({ name: '', phone: '', salary: '' });
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loadingStaff, setLoadingStaff] = useState(true);

  const expenseTypeConfig: Record<string, { icon: typeof Lightbulb; label: string; color: string }> = {
    electricity: { icon: Lightbulb, label: t.electricity, color: 'text-destructive' },
    water: { icon: Droplets, label: t.water, color: 'text-info' },
    salary: { icon: HardHat, label: t.staffSalary, color: 'text-primary' },
    supplies: { icon: Package, label: t.supplies, color: 'text-warning' },
    other: { icon: FileText, label: t.other, color: 'text-muted-foreground' },
  };

  const totalByType = (type: string) => expenses.filter(e => e.type === type).reduce((s, e) => s + e.amount, 0);

  // Load staff data
  useEffect(() => {
    const loadStaff = async () => {
      const { data } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'staff_salaries')
        .single();
      if (data?.value) {
        setStaff((data.value as any).staff || []);
      }
      setLoadingStaff(false);
    };
    loadStaff();
  }, []);

  const saveStaffToDb = async (updatedStaff: StaffMember[]) => {
    const { data: existing } = await supabase
      .from('app_settings')
      .select('id')
      .eq('key', 'staff_salaries')
      .maybeSingle();

    if (existing) {
      await supabase
        .from('app_settings')
        .update({ value: { staff: updatedStaff } as any, updated_at: new Date().toISOString() })
        .eq('key', 'staff_salaries');
    } else {
      await supabase
        .from('app_settings')
        .insert({ key: 'staff_salaries', value: { staff: updatedStaff } as any });
    }
  };

  const handleSave = () => {
    addExpense({ type: form.type as any, desc: form.desc || t.expenses, amount: parseInt(form.amount) || 0, date: form.date || new Date().toISOString() });
    setShowModal(false);
    setForm({ type: 'electricity', desc: '', amount: '', date: new Date().toISOString().split('T')[0] });
  };

  const handleAddStaff = async () => {
    if (!staffForm.name || !staffForm.salary) return;
    const newStaff: StaffMember = {
      id: crypto.randomUUID(),
      name: staffForm.name,
      phone: staffForm.phone,
      salary: parseInt(staffForm.salary) || 0,
      payments: {},
    };
    const updated = [...staff, newStaff];
    setStaff(updated);
    await saveStaffToDb(updated);
    setShowStaffModal(false);
    setStaffForm({ name: '', phone: '', salary: '' });
    toast.success(lang === 'ku' ? 'ستاف زیادکرا ✓' : lang === 'ar' ? 'تم إضافة الموظف ✓' : 'Staff added ✓');
  };

  const handleDeleteStaff = async (id: string) => {
    const updated = staff.filter(s => s.id !== id);
    setStaff(updated);
    await saveStaffToDb(updated);
    toast.success(lang === 'ku' ? 'ستاف سڕایەوە' : lang === 'ar' ? 'تم حذف الموظف' : 'Staff removed');
  };

  const togglePayment = async (staffId: string, month: number) => {
    const key = `${selectedYear}-${month}`;
    const updated = staff.map(s => {
      if (s.id === staffId) {
        const payments = { ...s.payments };
        payments[key] = !payments[key];
        return { ...s, payments };
      }
      return s;
    });
    setStaff(updated);
    await saveStaffToDb(updated);
  };

  const totalSalaries = staff.reduce((s, m) => s + m.salary, 0);
  const paidCount = (month: number) => staff.filter(s => s.payments[`${selectedYear}-${month}`]).length;

  return (
    <div dir={dir}>
      <Tabs defaultValue="expenses" className="w-full">
        <TabsList className="w-full grid grid-cols-2 h-11 mb-5">
          <TabsTrigger value="expenses" className="text-xs font-semibold gap-1.5">
            <Wallet className="w-3.5 h-3.5" />
            {t.dailyExpenses}
          </TabsTrigger>
          <TabsTrigger value="staff" className="text-xs font-semibold gap-1.5">
            <Users className="w-3.5 h-3.5" />
            {t.staffManagement}
          </TabsTrigger>
        </TabsList>

        {/* ===== Expenses Tab ===== */}
        <TabsContent value="expenses" className="mt-0 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-foreground text-base font-bold flex items-center gap-2">
              <Wallet className="w-4 h-4 text-muted-foreground" /> {t.dailyExpenses}
            </h2>
            <button onClick={() => setShowModal(true)} className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1.5 hover:opacity-90 transition-all">
              <Plus className="w-3.5 h-3.5" /> {t.addExpense}
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {['electricity', 'water', 'salary'].map(type => {
              const config = expenseTypeConfig[type];
              const Icon = config.icon;
              return (
                <div key={type} className="bg-card rounded-xl p-5 border border-border">
                  <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center mb-3"><Icon className={`w-5 h-5 ${config.color}`} /></div>
                  <div className={`text-2xl font-bold mb-0.5 ${config.color}`}>{totalByType(type).toLocaleString()} IQD</div>
                  <div className="text-muted-foreground text-xs">{config.label}</div>
                </div>
              );
            })}
          </div>

          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="px-5 py-3.5 border-b border-border text-foreground font-semibold text-sm">{t.allExpenses}</div>
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {[t.date, t.type, t.description, t.amount, t.actions].map(h => (
                    <th key={h} className="bg-secondary text-muted-foreground text-[10px] tracking-widest uppercase p-3 text-start font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {expenses.length === 0 ? (
                  <tr><td colSpan={5} className="text-center text-muted-foreground py-5 text-sm">{t.noExpensesRecorded}</td></tr>
                ) : (
                  expenses.slice().reverse().map(e => {
                    const config = expenseTypeConfig[e.type] || expenseTypeConfig.other;
                    const TypeIcon = config.icon;
                    return (
                      <tr key={e.id} className="border-b border-border hover:bg-secondary/50 transition-colors">
                        <td className="p-3 text-muted-foreground text-xs">{new Date(e.date).toLocaleDateString()}</td>
                        <td className="p-3 text-foreground text-xs"><span className="flex items-center gap-1.5"><TypeIcon className="w-3.5 h-3.5 text-muted-foreground" /> {config.label}</span></td>
                        <td className="p-3 text-foreground text-xs">{e.desc}</td>
                        <td className="p-3 text-destructive text-xs font-medium">{e.amount.toLocaleString()} IQD</td>
                        <td className="p-3">
                          <button onClick={() => deleteExpense(e.id)} className="p-1.5 bg-destructive/10 text-destructive border border-destructive/20 rounded-md cursor-pointer hover:bg-destructive/20 transition-all">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* ===== Staff Tab ===== */}
        <TabsContent value="staff" className="mt-0 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-foreground text-base font-bold flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" /> {t.staffManagement}
            </h2>
            <button onClick={() => setShowStaffModal(true)} className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1.5 hover:opacity-90 transition-all">
              <Plus className="w-3.5 h-3.5" /> {t.addStaff}
            </button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-card rounded-xl p-4 border border-border">
              <div className="text-muted-foreground text-[10px] font-semibold mb-1">{t.totalSalaries}</div>
              <div className="text-primary text-xl font-bold">{totalSalaries.toLocaleString()} IQD</div>
              <div className="text-muted-foreground text-[9px] mt-0.5">{staff.length} {lang === 'ku' ? 'ستاف' : lang === 'ar' ? 'موظف' : 'staff'}</div>
            </div>
            <div className="bg-card rounded-xl p-4 border border-border">
              <div className="text-muted-foreground text-[10px] font-semibold mb-1">{t.paidSalaries}</div>
              <div className="text-success text-xl font-bold">
                {staff.filter(s => s.payments[`${selectedYear}-${new Date().getMonth() + 1}`]).reduce((sum, s) => sum + s.salary, 0).toLocaleString()} IQD
              </div>
              <div className="text-success text-[9px] mt-0.5">{paidCount(new Date().getMonth() + 1)}/{staff.length}</div>
            </div>
            <div className="bg-card rounded-xl p-4 border border-border">
              <div className="text-muted-foreground text-[10px] font-semibold mb-1">{t.unpaidSalaries}</div>
              <div className="text-destructive text-xl font-bold">
                {staff.filter(s => !s.payments[`${selectedYear}-${new Date().getMonth() + 1}`]).reduce((sum, s) => sum + s.salary, 0).toLocaleString()} IQD
              </div>
              <div className="text-destructive text-[9px] mt-0.5">{staff.length - paidCount(new Date().getMonth() + 1)}/{staff.length}</div>
            </div>
          </div>

          {/* Year Selector */}
          <div className="flex items-center justify-center gap-3 bg-card rounded-xl border border-border p-2.5">
            <button onClick={() => setSelectedYear(y => y - 1)} className="w-8 h-8 rounded-lg bg-secondary hover:bg-accent border border-border flex items-center justify-center">
              {dir === 'rtl' ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
            <span className="text-foreground font-bold text-sm min-w-[80px] text-center">{t.yearLabel}: {selectedYear}</span>
            <button onClick={() => setSelectedYear(y => y + 1)} className="w-8 h-8 rounded-lg bg-secondary hover:bg-accent border border-border flex items-center justify-center">
              {dir === 'rtl' ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </div>

          {/* Staff Salary Table */}
          {loadingStaff ? (
            <div className="text-center text-muted-foreground py-10">{lang === 'ku' ? 'چاوەڕوان بە...' : 'Loading...'}</div>
          ) : staff.length === 0 ? (
            <div className="bg-card rounded-xl border border-border p-10 text-center text-muted-foreground text-sm">{t.noStaff}</div>
          ) : (
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse min-w-[900px]">
                  <thead>
                    <tr>
                      <th className="bg-secondary text-muted-foreground text-[9px] tracking-widest uppercase p-2.5 text-start font-semibold sticky left-0 bg-secondary z-10 min-w-[140px]">{t.staffName}</th>
                      <th className="bg-secondary text-muted-foreground text-[9px] tracking-widest uppercase p-2.5 text-start font-semibold min-w-[100px]">{t.staffPhone}</th>
                      <th className="bg-secondary text-muted-foreground text-[9px] tracking-widest uppercase p-2.5 text-center font-semibold min-w-[80px]">{t.monthlySalary}</th>
                      {Array.from({ length: 12 }, (_, i) => (
                        <th key={i} className="bg-secondary text-muted-foreground text-[9px] tracking-widest uppercase p-2 text-center font-semibold min-w-[65px]">
                          {MONTH_NAMES[lang][i]}
                        </th>
                      ))}
                      <th className="bg-secondary text-muted-foreground text-[9px] tracking-widest uppercase p-2.5 text-center font-semibold min-w-[50px]">{t.actions}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staff.map(member => (
                      <tr key={member.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                        <td className="p-2.5 text-foreground text-xs font-medium sticky left-0 bg-card z-10">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[10px] font-bold">
                              {member.name.charAt(0)}
                            </div>
                            {member.name}
                          </div>
                        </td>
                        <td className="p-2.5 text-muted-foreground text-xs">
                          <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{member.phone || '—'}</span>
                        </td>
                        <td className="p-2.5 text-primary text-xs font-bold text-center">{member.salary.toLocaleString()}</td>
                        {Array.from({ length: 12 }, (_, i) => {
                          const key = `${selectedYear}-${i + 1}`;
                          const paid = member.payments[key];
                          return (
                            <td key={i} className="p-1.5 text-center">
                              <button
                                onClick={() => togglePayment(member.id, i + 1)}
                                className={`w-full py-1.5 rounded-lg text-[9px] font-bold transition-all border ${
                                  paid
                                    ? 'bg-success/10 text-success border-success/20 hover:bg-success/20'
                                    : 'bg-destructive/5 text-destructive/50 border-border hover:bg-destructive/10 hover:text-destructive'
                                }`}
                              >
                                {paid ? (
                                  <span className="flex items-center justify-center gap-0.5"><CheckCircle2 className="w-3 h-3" /> {t.markPaid}</span>
                                ) : (
                                  <span className="flex items-center justify-center gap-0.5"><XCircle className="w-3 h-3" /> ✕</span>
                                )}
                              </button>
                            </td>
                          );
                        })}
                        <td className="p-2.5 text-center">
                          <button onClick={() => handleDeleteStaff(member.id)} className="p-1.5 bg-destructive/10 text-destructive border border-destructive/20 rounded-md hover:bg-destructive/20 transition-all">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Add Expense Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-[1000]">
          <div className="bg-card border border-border rounded-xl p-6 min-w-[420px] animate-modal-in">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-foreground text-base font-bold flex items-center gap-2"><Plus className="w-4 h-4 text-primary" /> {t.addExpense}</h3>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground transition-colors"><X className="w-4 h-4" /></button>
            </div>
            <div className="mb-3">
              <label className="text-muted-foreground text-[10px] tracking-widest uppercase block mb-1.5 font-semibold">{t.expenseType}</label>
              <select className="w-full p-2.5 bg-secondary border border-border rounded-lg text-foreground text-sm" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                {Object.entries(expenseTypeConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div className="mb-3">
              <label className="text-muted-foreground text-[10px] tracking-widest uppercase block mb-1.5 font-semibold">{t.description}</label>
              <input className="w-full p-2.5 bg-secondary border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-primary/50 transition-colors" value={form.desc} onChange={e => setForm(p => ({ ...p, desc: e.target.value }))} />
            </div>
            <div className="mb-3">
              <label className="text-muted-foreground text-[10px] tracking-widest uppercase block mb-1.5 font-semibold">{t.amountIqd}</label>
              <input className="w-full p-2.5 bg-secondary border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-primary/50 transition-colors" type="number" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} placeholder="50000" />
            </div>
            <div className="mb-4">
              <label className="text-muted-foreground text-[10px] tracking-widest uppercase block mb-1.5 font-semibold">{t.date}</label>
              <input className="w-full p-2.5 bg-secondary border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-primary/50 transition-colors" type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 bg-secondary text-foreground border border-border rounded-lg text-xs font-semibold cursor-pointer hover:bg-muted transition-all">{t.cancel}</button>
              <button onClick={handleSave} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-semibold cursor-pointer hover:opacity-90 transition-all">{t.saveExpense}</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Staff Modal */}
      {showStaffModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-[1000]">
          <div className="bg-card border border-border rounded-xl p-6 min-w-[420px] animate-modal-in">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-foreground text-base font-bold flex items-center gap-2"><Users className="w-4 h-4 text-primary" /> {t.addStaff}</h3>
              <button onClick={() => setShowStaffModal(false)} className="text-muted-foreground hover:text-foreground transition-colors"><X className="w-4 h-4" /></button>
            </div>
            <div className="mb-3">
              <label className="text-muted-foreground text-[10px] tracking-widest uppercase block mb-1.5 font-semibold">{t.staffName}</label>
              <input className="w-full p-2.5 bg-secondary border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-primary/50 transition-colors" value={staffForm.name} onChange={e => setStaffForm(p => ({ ...p, name: e.target.value }))} placeholder={lang === 'ku' ? 'ناوی ستاف' : 'Staff name'} />
            </div>
            <div className="mb-3">
              <label className="text-muted-foreground text-[10px] tracking-widest uppercase block mb-1.5 font-semibold">{t.staffPhone}</label>
              <input className="w-full p-2.5 bg-secondary border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-primary/50 transition-colors" value={staffForm.phone} onChange={e => setStaffForm(p => ({ ...p, phone: e.target.value }))} placeholder="07501234567" />
            </div>
            <div className="mb-4">
              <label className="text-muted-foreground text-[10px] tracking-widest uppercase block mb-1.5 font-semibold">{t.monthlySalary} (IQD)</label>
              <input className="w-full p-2.5 bg-secondary border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-primary/50 transition-colors" type="number" value={staffForm.salary} onChange={e => setStaffForm(p => ({ ...p, salary: e.target.value }))} placeholder="500000" />
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowStaffModal(false)} className="px-4 py-2 bg-secondary text-foreground border border-border rounded-lg text-xs font-semibold cursor-pointer hover:bg-muted transition-all">{t.cancel}</button>
              <button onClick={handleAddStaff} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-semibold cursor-pointer hover:opacity-90 transition-all">{t.addStaff}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminExpenses;
