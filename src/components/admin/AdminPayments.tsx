import { useState } from 'react';

const AdminPayments = () => {
  const [providers, setProviders] = useState([
    { id: 'fib', name: 'FIB Bank', icon: '🏦', color: 'success', enabled: true, fields: [{ label: 'API KEY', type: 'password', placeholder: 'fib_live_xxxx' }, { label: 'MERCHANT ID', type: 'text', placeholder: 'FIB-MERCHANT-ID' }] },
    { id: 'zain', name: 'ZainCash', icon: '📱', color: 'destructive', enabled: false, fields: [{ label: 'MERCHANT TOKEN', type: 'password', placeholder: 'zain_token_xxxx' }, { label: 'MSISDN (Phone)', type: 'text', placeholder: '07801234567' }, { label: 'SECRET KEY', type: 'password', placeholder: 'secret_xxxx' }] },
    { id: 'qi', name: 'QI Card / Qi Bank Iraq', icon: '🏛️', color: 'info', enabled: false, fields: [{ label: 'API KEY', type: 'password', placeholder: 'qi_live_xxxx' }, { label: 'TERMINAL ID', type: 'text', placeholder: 'QI-TERM-00001' }, { label: 'CALLBACK URL', type: 'text', placeholder: 'https://your-domain.com/callback/qi' }] },
    { id: 'fast', name: 'FastPay', icon: '⚡', color: 'warning', enabled: false, fields: [{ label: 'API KEY', type: 'password', placeholder: 'fp_live_xxxx' }, { label: 'WALLET ID', type: 'text', placeholder: 'FP-WALLET-XXXXX' }, { label: 'WEBHOOK SECRET', type: 'password', placeholder: 'whsec_xxxx' }] },
  ]);

  const toggleProvider = (id: string) => {
    setProviders(prev => prev.map(p => p.id === id ? { ...p, enabled: !p.enabled } : p));
  };

  return (
    <div>
      <h2 className="text-foreground text-lg font-bold mb-5">💳 Payment Providers & API Keys</h2>
      <div className="grid grid-cols-2 gap-4 mb-6">
        {providers.map(p => (
          <div key={p.id} className="bg-muted rounded-2xl p-5 border border-foreground/5">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl bg-${p.color}/15`}>{p.icon}</div>
              <div className="flex-1">
                <div className="text-foreground font-bold">{p.name}</div>
                <div className={`text-[11px] ${p.enabled ? 'text-success' : 'text-foreground/40'}`}>● {p.enabled ? 'Active' : 'Inactive'}</div>
              </div>
              <button
                onClick={() => toggleProvider(p.id)}
                className={`w-11 h-6 rounded-full relative transition-all border-none cursor-pointer ${p.enabled ? 'bg-success' : 'bg-foreground/15'}`}
              >
                <div className={`absolute w-[18px] h-[18px] bg-foreground rounded-full top-[3px] transition-transform ${p.enabled ? 'translate-x-[23px]' : 'translate-x-[3px]'}`} />
              </button>
            </div>
            {p.fields.map((f, i) => (
              <div key={i} className="mb-3">
                <div className="text-foreground/50 text-[11px] tracking-wider mb-1.5">{f.label}</div>
                <input className="w-full p-2.5 bg-secondary border border-foreground/10 rounded-lg text-foreground text-sm focus:outline-none focus:border-primary" type={f.type} placeholder={f.placeholder} />
              </div>
            ))}
            <button className="w-full mt-2 p-2.5 bg-primary text-background rounded-lg text-sm font-bold cursor-pointer">Save & Test Connection</button>
          </div>
        ))}
      </div>

      <h2 className="text-foreground text-lg font-bold mb-4">📱 QR Code Generator</h2>
      <div className="grid grid-cols-2 gap-5">
        <div className="bg-muted rounded-2xl p-5 border border-foreground/5">
          <div className="text-foreground font-bold mb-1">Generate Payment QR</div>
          <div className="text-foreground/40 text-xs mb-4">For digital payments via banking apps</div>
          <div className="mb-3">
            <div className="text-foreground/50 text-[11px] tracking-wider mb-1.5">AMOUNT (IQD)</div>
            <input className="w-full p-2.5 bg-secondary border border-foreground/10 rounded-lg text-foreground text-sm focus:outline-none focus:border-primary" type="number" placeholder="5000" />
          </div>
          <div className="mb-3">
            <div className="text-foreground/50 text-[11px] tracking-wider mb-1.5">ORDER NUMBER</div>
            <input className="w-full p-2.5 bg-secondary border border-foreground/10 rounded-lg text-foreground text-sm focus:outline-none focus:border-primary" placeholder="#001" />
          </div>
          <div className="mb-3">
            <div className="text-foreground/50 text-[11px] tracking-wider mb-1.5">PROVIDER</div>
            <select className="w-full p-2.5 bg-secondary border border-foreground/10 rounded-lg text-foreground text-sm">
              <option>FIB Bank</option><option>ZainCash</option><option>QI Card</option><option>FastPay</option>
            </select>
          </div>
          <button className="w-full mt-2 p-2.5 bg-primary text-background rounded-lg text-sm font-bold cursor-pointer">Generate QR Code</button>
        </div>
        <div className="bg-muted rounded-2xl p-5 border border-foreground/5 text-center">
          <div className="text-foreground font-bold mb-1">QR Preview</div>
          <div className="bg-foreground w-[150px] h-[150px] rounded-xl mx-auto my-4 flex items-center justify-center text-8xl">📱</div>
          <div className="text-foreground/40 text-xs mb-4">No QR generated yet</div>
          <button className="w-full p-2.5 bg-primary text-background rounded-lg text-sm font-bold cursor-pointer">🖨️ Print QR Label</button>
        </div>
      </div>
    </div>
  );
};

export default AdminPayments;
