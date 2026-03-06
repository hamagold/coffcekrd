import { useState } from 'react';
import { useStore } from '@/store/StoreContext';

const expenseTypes = {
  electricity: '💡 Electricity',
  water: '💧 Water',
  salary: '👷 Staff Salary',
  supplies: '📦 Supplies',
  other: '📝 Other',
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
        <h2 className="text-foreground text-lg font-bold">💸 Daily Expenses</h2>
        <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-primary text-background rounded-lg text-sm font-bold cursor-pointer">+ Add Expense</button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { icon: '💡', label: 'Electricity', type: 'electricity', color: 'text-destructive' },
          { icon: '💧', label: 'Water', type: 'water', color: 'text-info' },
          { icon: '👷', label: 'Staff Salaries', type: 'salary', color: 'text-[hsl(var(--purple))]' },
        ].map(s => (
          <div key={s.type} className="bg-muted rounded-2xl p-5 border border-foreground/5">
            <div className="text-3xl mb-3">{s.icon}</div>
            <div className={`text-3xl font-black mb-1 ${s.color}`}>{totalByType(s.type).toLocaleString()} IQD</div>
            <div className="text-foreground/40 text-xs">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-muted rounded-2xl border border-foreground/5 overflow-hidden">
        <div className="px-5 py-4 border-b border-foreground/5 text-foreground font-bold">All Expenses</div>
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {['Date', 'Type', 'Description', 'Amount', 'Action'].map(h => (
                <th key={h} className="bg-secondary text-foreground/50 text-[11px] tracking-wider p-3 text-left font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {expenses.length === 0 ? (
              <tr><td colSpan={5} className="text-center text-foreground/30 py-5">No expenses recorded</td></tr>
            ) : (
              expenses.slice().reverse().map(e => (
                <tr key={e.id} className="border-b border-foreground/5">
                  <td className="p-3 text-foreground/50 text-sm">{new Date(e.date).toLocaleDateString()}</td>
                  <td className="p-3 text-foreground text-sm">{expenseTypes[e.type as keyof typeof expenseTypes] || e.type}</td>
                  <td className="p-3 text-foreground text-sm">{e.desc}</td>
                  <td className="p-3 text-destructive text-sm">{e.amount.toLocaleString()} IQD</td>
                  <td className="p-3">
                    <button onClick={() => deleteExpense(e.id)} className="px-3 py-1 bg-destructive/20 text-destructive border border-destructive/30 rounded text-[11px] font-bold cursor-pointer">🗑️</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-[1000] backdrop-blur-sm">
          <div className="bg-muted border border-primary/30 rounded-2xl p-8 min-w-[420px] animate-modal-in">
            <h3 className="text-primary text-xl font-bold mb-5">💸 Add Expense</h3>
            <div className="mb-4">
              <label className="text-foreground/60 text-xs tracking-wider block mb-1.5">EXPENSE TYPE</label>
              <select className="w-full p-2.5 bg-secondary border border-foreground/10 rounded-lg text-foreground text-sm" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                {Object.entries(expenseTypes).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div className="mb-4">
              <label className="text-foreground/60 text-xs tracking-wider block mb-1.5">DESCRIPTION</label>
              <input className="w-full p-2.5 bg-secondary border border-foreground/10 rounded-lg text-foreground text-sm focus:outline-none focus:border-primary" value={form.desc} onChange={e => setForm(p => ({ ...p, desc: e.target.value }))} placeholder="Monthly electricity bill" />
            </div>
            <div className="mb-4">
              <label className="text-foreground/60 text-xs tracking-wider block mb-1.5">AMOUNT (IQD)</label>
              <input className="w-full p-2.5 bg-secondary border border-foreground/10 rounded-lg text-foreground text-sm focus:outline-none focus:border-primary" type="number" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} placeholder="50000" />
            </div>
            <div className="mb-4">
              <label className="text-foreground/60 text-xs tracking-wider block mb-1.5">DATE</label>
              <input className="w-full p-2.5 bg-secondary border border-foreground/10 rounded-lg text-foreground text-sm focus:outline-none focus:border-primary" type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 bg-destructive/20 text-destructive border border-destructive/30 rounded-lg text-sm font-bold cursor-pointer">Cancel</button>
              <button onClick={handleSave} className="px-4 py-2 bg-primary text-background rounded-lg text-sm font-bold cursor-pointer">Save Expense</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminExpenses;
