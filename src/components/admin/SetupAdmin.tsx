import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Shield, Loader2, Mail, KeyRound, User as UserIcon, CheckCircle } from 'lucide-react';

interface SetupAdminProps {
  onComplete: () => void;
}

const SetupAdmin = ({ onComplete }: SetupAdminProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSetup = async () => {
    if (!email || !password || !name) return;
    setLoading(true);
    setError('');

    const { data, error: fnError } = await supabase.functions.invoke('setup-admin', {
      body: { email, password, name },
    });

    if (fnError || data?.error) {
      setError(data?.error || fnError?.message || 'Setup failed');
      setLoading(false);
      return;
    }

    setSuccess(true);
    setTimeout(() => onComplete(), 1500);
    setLoading(false);
  };

  if (success) {
    return (
      <div className="fixed inset-0 z-[9999] bg-background flex items-center justify-center">
        <div className="bg-card border border-border rounded-2xl p-8 w-[380px] text-center animate-fade-up">
          <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-4" />
          <div className="text-foreground text-xl font-bold mb-2">Setup Complete!</div>
          <div className="text-muted-foreground text-sm">Redirecting to login...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-background flex items-center justify-center">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[radial-gradient(ellipse,hsl(var(--primary)/0.08)_0%,transparent_70%)]" />
      <div className="bg-card border border-border rounded-2xl p-8 w-[400px] text-center relative z-10 animate-fade-up">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
          <Shield className="w-7 h-7 text-primary" />
        </div>
        <div className="text-foreground text-xl font-bold mb-0.5">Initial Setup</div>
        <div className="text-muted-foreground text-xs mb-6">Create the first Super Admin account</div>

        {[
          { label: 'Full Name', value: name, setter: setName, type: 'text', placeholder: 'Administrator', icon: UserIcon },
          { label: 'Email', value: email, setter: setEmail, type: 'email', placeholder: 'admin@plc.com', icon: Mail },
          { label: 'Password', value: password, setter: setPassword, type: 'password', placeholder: '••••••••', icon: KeyRound },
        ].map(f => (
          <div key={f.label} className="mb-3 text-left">
            <label className="text-muted-foreground text-[10px] tracking-widest uppercase block mb-1.5 font-semibold">{f.label}</label>
            <div className="relative">
              <f.icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                className="w-full p-3 pl-10 bg-secondary border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-primary/50 transition-colors"
                type={f.type} placeholder={f.placeholder} value={f.value}
                onChange={e => f.setter(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSetup()}
              />
            </div>
          </div>
        ))}

        <button
          onClick={handleSetup}
          disabled={loading || !email || !password || !name}
          className="w-full py-3 mt-2 bg-primary text-primary-foreground rounded-lg text-sm font-bold cursor-pointer transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          Create Super Admin
        </button>
        {error && <div className="text-destructive text-sm mt-3">{error}</div>}
      </div>
    </div>
  );
};

export default SetupAdmin;
