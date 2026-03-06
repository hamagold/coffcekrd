import { useState } from 'react';
import { CreditCard, Smartphone, Zap, Building2, QrCode, Printer } from 'lucide-react';

const AdminPayments = () => {
  const [providers, setProviders] = useState([
    { id: 'fib', name: 'FIB Bank', icon: Building2, color: 'success', enabled: true, fields: [{ label: 'API KEY', type: 'password', placeholder: 'fib_live_xxxx' }, { label: 'MERCHANT ID', type: 'text', placeholder: 'FIB-MERCHANT-ID' }] },
    { id: 'zain', name: 'ZainCash', icon: Smartphone, color: 'destructive', enabled: false, fields: [{ label: 'MERCHANT TOKEN', type: 'password', placeholder: 'zain_token_xxxx' }, { label: 'MSISDN (Phone)', type: 'text', placeholder: '07801234567' }, { label: 'SECRET KEY', type: 'password', placeholder: 'secret_xxxx' }] },
    { id: 'qi', name: 'QI Card / Qi Bank Iraq', icon: CreditCard, color: 'info', enabled: false, fields: [{ label: 'API KEY', type: 'password', placeholder: 'qi_live_xxxx' }, { label: 'TERMINAL ID', type: 'text', placeholder: 'QI-TERM-00001' }, { label: 'CALLBACK URL', type: 'text', placeholder: 'https://your-domain.com/callback/qi' }] },
    { id: 'fast', name: 'FastPay', icon: Zap, color: 'warning', enabled: false, fields: [{ label: 'API KEY', type: 'password', placeholder: 'fp_live_xxxx' }, { label: 'WALLET ID', type: 'text', placeholder: 'FP-WALLET-XXXXX' }, { label: 'WEBHOOK SECRET', type: 'password', placeholder: 'whsec_xxxx' }] },
  ]);

  const toggleProvider = (id: string) => {
    setProviders(prev => prev.map(p => p.id === id ? { ...p, enabled: !p.enabled } : p));
  };

  return (
    <div>
      <h2 className="text-foreground text-base font-bold mb-5 flex items-center gap-2">
        <CreditCard className="w-4 h-4 text-muted-foreground" /> Payment Providers & API Keys
      </h2>
      <div className="grid grid-cols-2 gap-4 mb-6">
        {providers.map(p => {
          const Icon = p.icon;
          return (
            <div key={p.id} className="bg-card rounded-xl p-5 border border-border">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center bg-${p.color}/10`}>
                  <Icon className={`w-4.5 h-4.5 text-${p.color}`} />
                </div>
                <div className="flex-1">
                  <div className="text-foreground font-semibold text-sm">{p.name}</div>
                  <div className={`text-[10px] font-medium ${p.enabled ? 'text-success' : 'text-muted-foreground'}`}>● {p.enabled ? 'Active' : 'Inactive'}</div>
                </div>
                <button
                  onClick={() => toggleProvider(p.id)}
                  className={`w-10 h-5 rounded-full relative transition-all border-none cursor-pointer ${p.enabled ? 'bg-success' : 'bg-muted'}`}
                >
                  <div className={`absolute w-4 h-4 bg-foreground rounded-full top-[2px] transition-transform ${p.enabled ? 'translate-x-[22px]' : 'translate-x-[2px]'}`} />
                </button>
              </div>
              {p.fields.map((f, i) => (
                <div key={i} className="mb-3">
                  <div className="text-muted-foreground text-[10px] tracking-widest uppercase mb-1.5 font-semibold">{f.label}</div>
                  <input className="w-full p-2.5 bg-secondary border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-primary/50 transition-colors" type={f.type} placeholder={f.placeholder} />
                </div>
              ))}
              <button className="w-full mt-2 p-2.5 bg-primary text-primary-foreground rounded-lg text-xs font-semibold cursor-pointer hover:opacity-90 transition-all">Save & Test</button>
            </div>
          );
        })}
      </div>

      <h2 className="text-foreground text-base font-bold mb-4 flex items-center gap-2">
        <QrCode className="w-4 h-4 text-muted-foreground" /> QR Code Generator
      </h2>
      <div className="grid grid-cols-2 gap-5">
        <div className="bg-card rounded-xl p-5 border border-border">
          <div className="text-foreground font-semibold text-sm mb-1">Generate Payment QR</div>
          <div className="text-muted-foreground text-xs mb-4">For digital payments via banking apps</div>
          <div className="mb-3">
            <div className="text-muted-foreground text-[10px] tracking-widest uppercase mb-1.5 font-semibold">Amount (IQD)</div>
            <input className="w-full p-2.5 bg-secondary border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-primary/50 transition-colors" type="number" placeholder="5000" />
          </div>
          <div className="mb-3">
            <div className="text-muted-foreground text-[10px] tracking-widest uppercase mb-1.5 font-semibold">Order Number</div>
            <input className="w-full p-2.5 bg-secondary border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-primary/50 transition-colors" placeholder="#001" />
          </div>
          <div className="mb-3">
            <div className="text-muted-foreground text-[10px] tracking-widest uppercase mb-1.5 font-semibold">Provider</div>
            <select className="w-full p-2.5 bg-secondary border border-border rounded-lg text-foreground text-sm">
              <option>FIB Bank</option><option>ZainCash</option><option>QI Card</option><option>FastPay</option>
            </select>
          </div>
          <button className="w-full mt-2 p-2.5 bg-primary text-primary-foreground rounded-lg text-xs font-semibold cursor-pointer hover:opacity-90 transition-all">Generate QR Code</button>
        </div>
        <div className="bg-card rounded-xl p-5 border border-border text-center">
          <div className="text-foreground font-semibold text-sm mb-1">QR Preview</div>
          <div className="w-36 h-36 rounded-xl mx-auto my-4 bg-secondary border border-border flex items-center justify-center">
            <QrCode className="w-12 h-12 text-muted-foreground/30" />
          </div>
          <div className="text-muted-foreground text-xs mb-4">No QR generated yet</div>
          <button className="w-full p-2.5 bg-secondary text-foreground border border-border rounded-lg text-xs font-semibold cursor-pointer flex items-center justify-center gap-2 hover:bg-muted transition-all">
            <Printer className="w-3.5 h-3.5" /> Print QR Label
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminPayments;
