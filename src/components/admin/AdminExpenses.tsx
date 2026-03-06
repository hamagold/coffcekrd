import { useState } from 'react';
import { useStore } from '@/store/StoreContext';
import { Wallet, Plus, Trash2, Lightbulb, Droplets, HardHat, Package, FileText, X } from 'lucide-react';

const expenseTypeConfig: Record<string, { icon: typeof Lightbulb; label: string; color: string }> = {
  electricity: { icon: Lightbulb, label: 'Electricity', color: 'text-destructive' },
  water: { icon: Droplets, label: 'Water', color: 'text-info' },
  salary: { icon: HardHat, label: 'Staff Salary', color: 'text-[hsl(var(--purple))]' },
  supplies: { icon: Package, label: 'Supplies', color: 'text-warning' },
  other: { icon: FileText, label: 'Other', color: 'text-muted-foreground' },
};

const AdminExpenses = () => {
  const { expenses, addExpense, deleteExpense } = useStore();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ type: 'electricity', desc: '', amount: '', date: new Date().toISOString().split('T')[0] });

  const totalByType = (type: string) => expenses.filter(e => e.type === type).reduce((s, e) => s + e.amount, 0);

  const handleSave = () => {
    addExpense({
      type: form.type as any,
      desc: form.desc || 'Expense',
      amount: parseInt(form.amount) || 0,
      date: form.date || new Date().toISOString(),
    });
    setShowModal(false);
    setForm({ type: 'electricity', desc: '', amount: '', date: new Date().toISOString().split('T')[0] });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-foreground text-base font-bold flex items-center gap-2">
          <Wallet className="w-4 h-4 text-muted-foreground" /> Daily Expenses
        </h2>
        <button onClick={() => setShowModal(true)} className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1.5 hover:opacity-90 transition-all">
          <Plus className="w-3.5 h-3.5" /> Add Expense
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {['electricity', 'water', 'salary'].map(type => {
          const config = expenseTypeConfig[type];
          const Icon = config.icon;
          return (
            <div key={type} className="bg-card rounded-xl p-5 border border-border">
              <div className={`w-10 h-10 rounded-lg bg-secondary flex items-center justify-center mb-3`}>
                <Icon className={`w-5 h-5 ${config.color}`} />
              </div>
              <div className={`text-2xl font-bold mb-0.5 ${config.color}`}>{totalByType(type).toLocaleString()} IQD</div>
              <div className="text-muted-foreground text-xs">{config.label}</div>
            </div>
          );
        })}
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border text-foreground font-semibold text-sm">All Expenses</div>
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {['Date', 'Type', 'Description', 'Amount', 'Action'].map(h => (
                <th key={h} className="bg-secondary text-muted-foreground text-[10px] tracking-widest uppercase p-3 text-left font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {expenses.length === 0 ? (
              <tr><td colSpan={5} className="text-center text-muted-foreground py-5 text-sm">No expenses recorded</td></tr>
            ) : (
              expenses.slice().reverse().map(e => {
                const config = expenseTypeConfig[e.type] || expenseTypeConfig.other;
                const TypeIcon = config.icon;
                return (
                  <tr key={e.id} className="border-b border-border hover:bg-secondary/50 transition-colors">
                    <td className="p-3 text-muted-foreground text-xs">{new Date(e.date).toLocaleDateString()}</td>
                    <td className="p-3 text-foreground text-xs flex items-center gap-1.5"><TypeIcon className="w-3.5 h-3.5 text-muted-foreground" /> {config.label}</td>
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

      {showModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-[1000]">
          <div className="bg-card border border-border rounded-xl p-6 min-w-[420px] animate-modal-in">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-foreground text-base font-bold flex items-center gap-2">
                <Plus className="w-4 h-4 text-primary" /> Add Expense
              </h3>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="mb-3">
              <label className="text-muted-foreground text-[10px] tracking-widest uppercase block mb-1.5 font-semibold">Expense Type</label>
              <select className="w-full p-2.5 bg-secondary border border-border rounded-lg text-foreground text-sm" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                {Object.entries(expenseTypeConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div className="mb-3">
              <label className="text-muted-foreground text-[10px] tracking-widest uppercase block mb-1.5 font-semibold">Description</label>
              <input className="w-full p-2.5 bg-secondary border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-primary/50 transition-colors" value={form.desc} onChange={e => setForm(p => ({ ...p, desc: e.target.value }))} placeholder="Monthly electricity bill" />
            </div>
            <div className="mb-3">
              <label className="text-muted-foreground text-[10px] tracking-widest uppercase block mb-1.5 font-semibold">Amount (IQD)</label>
              <input className="w-full p-2.5 bg-secondary border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-primary/50 transition-colors" type="number" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} placeholder="50000" />
            </div>
            <div className="mb-4">
              <label className="text-muted-foreground text-[10px] tracking-widest uppercase block mb-1.5 font-semibold">Date</label>
              <input className="w-full p-2.5 bg-secondary border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-primary/50 transition-colors" type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 bg-secondary text-foreground border border-border rounded-lg text-xs font-semibold cursor-pointer hover:bg-muted transition-all">Cancel</button>
              <button onClick={handleSave} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-semibold cursor-pointer hover:opacity-90 transition-all">Save Expense</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminExpenses;
