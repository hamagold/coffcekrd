import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { Cloud, HardDrive, Eye, EyeOff, Save, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Language } from '@/types';
import { adminT } from '@/data/adminTranslations';

export type StorageType = 'lovable-cloud' | 'cloudflare-r2';

export interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicDomain: string;
}

interface StorageConfig {
  storageType: StorageType;
  r2Config: R2Config;
}

// Cache for storage config to avoid repeated DB calls
let cachedConfig: StorageConfig | null = null;

export const fetchStorageConfig = async (): Promise<StorageConfig> => {
  if (cachedConfig) return cachedConfig;

  const { data, error } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', 'storage_config')
    .single();

  if (error || !data) {
    return { storageType: 'lovable-cloud', r2Config: { accountId: '', accessKeyId: '', secretAccessKey: '', bucketName: '', publicDomain: '' } };
  }

  const val = data.value as any;
  cachedConfig = {
    storageType: val.storageType || 'lovable-cloud',
    r2Config: val.r2Config || { accountId: '', accessKeyId: '', secretAccessKey: '', bucketName: '', publicDomain: '' },
  };
  return cachedConfig;
};

export const getStorageType = (): StorageType => {
  return cachedConfig?.storageType || 'lovable-cloud';
};

export const getR2Config = (): R2Config | null => {
  return cachedConfig?.r2Config || null;
};

export const invalidateStorageCache = () => {
  cachedConfig = null;
};

const StorageSettings = ({ lang }: { lang: Language }) => {
  const t = adminT[lang];
  const dir = lang === 'en' ? 'ltr' : 'rtl';
  const [storageType, setStorageType] = useState<StorageType>('lovable-cloud');
  const [r2Config, setR2Config] = useState<R2Config>({ accountId: '', accessKeyId: '', secretAccessKey: '', bucketName: '', publicDomain: '' });
  const [showSecret, setShowSecret] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const config = await fetchStorageConfig();
      setStorageType(config.storageType);
      setR2Config(config.r2Config);
      setLoading(false);
    };
    load();
  }, []);

  const handleSave = async () => {
    if (storageType === 'cloudflare-r2') {
      if (!r2Config.accountId || !r2Config.accessKeyId || !r2Config.secretAccessKey || !r2Config.bucketName) {
        toast.error(lang === 'ku' ? 'تکایە هەموو خانەکان پڕبکەرەوە' : lang === 'ar' ? 'يرجى ملء جميع الحقول' : 'Please fill all fields');
        return;
      }
    }

    setSaving(true);
    try {
      const value = { storageType, r2Config };
      const { error } = await supabase
        .from('app_settings')
        .update({ value: value as any, updated_at: new Date().toISOString() })
        .eq('key', 'storage_config');

      if (error) throw error;

      invalidateStorageCache();
      await fetchStorageConfig();
      toast.success(lang === 'ku' ? 'ڕێکخستنەکان پاشکەوت کران' : lang === 'ar' ? 'تم الحفظ' : 'Settings saved');
    } catch (err: any) {
      toast.error(err.message || 'Error');
    } finally {
      setSaving(false);
    }
  };

  const updateR2 = (key: keyof R2Config, value: string) => {
    setR2Config(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div dir={dir} className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-foreground text-base font-bold flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-muted-foreground" />
          {lang === 'ku' ? 'ڕێکخستنی شوێنی هەگری وێنە' : lang === 'ar' ? 'إعدادات تخزين الصور' : 'Image Storage Settings'}
        </h2>
      </div>

      <RadioGroup value={storageType} onValueChange={(v) => setStorageType(v as StorageType)} className="space-y-3">
        <div className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${storageType === 'lovable-cloud' ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}>
          <RadioGroupItem value="lovable-cloud" id="lovable-cloud" />
          <Label htmlFor="lovable-cloud" className="flex items-center gap-2 cursor-pointer flex-1">
            <Cloud className="w-5 h-5 text-primary" />
            <div>
              <div className="text-foreground font-semibold text-sm">Lovable Cloud Storage</div>
              <div className="text-muted-foreground text-xs">
                {lang === 'ku' ? 'هەگری سەر کلاوود (بەردەست بە شێوەی ئۆتۆماتیکی)' : lang === 'ar' ? 'تخزين سحابي (تلقائي)' : 'Cloud storage (automatic)'}
              </div>
            </div>
          </Label>
        </div>

        <div className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${storageType === 'cloudflare-r2' ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}>
          <RadioGroupItem value="cloudflare-r2" id="cloudflare-r2" />
          <Label htmlFor="cloudflare-r2" className="flex items-center gap-2 cursor-pointer flex-1">
            <HardDrive className="w-5 h-5 text-orange-500" />
            <div>
              <div className="text-foreground font-semibold text-sm">Cloudflare R2</div>
              <div className="text-muted-foreground text-xs">
                {lang === 'ku' ? 'هەگری سەر Cloudflare R2 بۆ کۆنترۆڵی زیاتر' : lang === 'ar' ? 'تخزين Cloudflare R2 لمزيد من التحكم' : 'Cloudflare R2 for more control'}
              </div>
            </div>
          </Label>
        </div>
      </RadioGroup>

      {storageType === 'cloudflare-r2' && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-4 animate-fade-up">
          <h3 className="text-foreground text-sm font-bold mb-3">
            {lang === 'ku' ? 'ڕێکخستنی Cloudflare R2' : lang === 'ar' ? 'إعدادات Cloudflare R2' : 'Cloudflare R2 Settings'}
          </h3>

          <div className="space-y-2">
            <Label className="text-muted-foreground text-xs font-semibold">Account ID</Label>
            <Input value={r2Config.accountId} onChange={e => updateR2('accountId', e.target.value)} placeholder="Account ID" className="bg-secondary" />
          </div>

          <div className="space-y-2">
            <Label className="text-muted-foreground text-xs font-semibold">Access Key ID</Label>
            <Input value={r2Config.accessKeyId} onChange={e => updateR2('accessKeyId', e.target.value)} placeholder="Access Key ID" className="bg-secondary" />
          </div>

          <div className="space-y-2">
            <Label className="text-muted-foreground text-xs font-semibold">Secret Access Key</Label>
            <div className="relative">
              <Input
                type={showSecret ? 'text' : 'password'}
                value={r2Config.secretAccessKey}
                onChange={e => updateR2('secretAccessKey', e.target.value)}
                placeholder="Secret Access Key"
                className="bg-secondary pl-10"
              />
              <button
                type="button"
                onClick={() => setShowSecret(!showSecret)}
                className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-muted-foreground text-xs font-semibold">Bucket Name</Label>
            <Input value={r2Config.bucketName} onChange={e => updateR2('bucketName', e.target.value)} placeholder="Bucket Name" className="bg-secondary" />
          </div>

          <div className="space-y-2">
            <Label className="text-muted-foreground text-xs font-semibold">Public Domain <span className="text-muted-foreground/60">({lang === 'ku' ? 'ئارەزوومەندانە' : 'optional'})</span></Label>
            <Input value={r2Config.publicDomain} onChange={e => updateR2('publicDomain', e.target.value)} placeholder="https://pub-xxx.r2.dev" className="bg-secondary" />
          </div>
        </div>
      )}

      <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {lang === 'ku' ? 'پاشکەوتکردن' : lang === 'ar' ? 'حفظ' : 'Save'}
      </Button>
    </div>
  );
};

export default StorageSettings;
