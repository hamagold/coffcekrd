import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { Cloud, HardDrive, Eye, EyeOff, Save, CheckCircle } from 'lucide-react';

export type StorageType = 'lovable-cloud' | 'cloudflare-r2';

export interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicDomain: string;
}

export const getStorageType = (): StorageType => {
  return (localStorage.getItem('image_storage_type') as StorageType) || 'lovable-cloud';
};

export const getR2Config = (): R2Config | null => {
  const raw = localStorage.getItem('r2_config');
  return raw ? JSON.parse(raw) : null;
};

const StorageSettings = () => {
  const [storageType, setStorageType] = useState<StorageType>(getStorageType());
  const [r2Config, setR2Config] = useState<R2Config>(
    getR2Config() || { accountId: '', accessKeyId: '', secretAccessKey: '', bucketName: '', publicDomain: '' }
  );
  const [showSecret, setShowSecret] = useState(false);

  const handleSave = () => {
    localStorage.setItem('image_storage_type', storageType);
    if (storageType === 'cloudflare-r2') {
      if (!r2Config.accountId || !r2Config.accessKeyId || !r2Config.secretAccessKey || !r2Config.bucketName) {
        toast.error('تکایە هەموو خانەکان پڕبکەرەوە');
        return;
      }
      localStorage.setItem('r2_config', JSON.stringify(r2Config));
    }
    toast.success('ڕێکخستنەکان پاشکەوت کران');
  };

  const updateR2 = (key: keyof R2Config, value: string) => {
    setR2Config(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div dir="rtl" className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-foreground text-base font-bold flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-muted-foreground" />
          ڕێکخستنی شوێنی هەگری وێنە
        </h2>
      </div>

      <RadioGroup value={storageType} onValueChange={(v) => setStorageType(v as StorageType)} className="space-y-3">
        <div className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${storageType === 'lovable-cloud' ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}>
          <RadioGroupItem value="lovable-cloud" id="lovable-cloud" />
          <Label htmlFor="lovable-cloud" className="flex items-center gap-2 cursor-pointer flex-1">
            <Cloud className="w-5 h-5 text-primary" />
            <div>
              <div className="text-foreground font-semibold text-sm">Lovable Cloud Storage</div>
              <div className="text-muted-foreground text-xs">هەگری سەر کلاوود (بەردەست بە شێوەی ئۆتۆماتیکی)</div>
            </div>
          </Label>
        </div>

        <div className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${storageType === 'cloudflare-r2' ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}>
          <RadioGroupItem value="cloudflare-r2" id="cloudflare-r2" />
          <Label htmlFor="cloudflare-r2" className="flex items-center gap-2 cursor-pointer flex-1">
            <HardDrive className="w-5 h-5 text-orange-500" />
            <div>
              <div className="text-foreground font-semibold text-sm">Cloudflare R2</div>
              <div className="text-muted-foreground text-xs">هەگری سەر Cloudflare R2 بۆ کۆنترۆڵی زیاتر</div>
            </div>
          </Label>
        </div>
      </RadioGroup>

      {storageType === 'cloudflare-r2' && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-4 animate-fade-up">
          <h3 className="text-foreground text-sm font-bold mb-3">ڕێکخستنی Cloudflare R2</h3>

          <div className="space-y-2">
            <Label className="text-muted-foreground text-xs font-semibold">Account ID</Label>
            <Input value={r2Config.accountId} onChange={e => updateR2('accountId', e.target.value)} placeholder="ئایدی هەژمار" className="bg-secondary" />
          </div>

          <div className="space-y-2">
            <Label className="text-muted-foreground text-xs font-semibold">Access Key ID</Label>
            <Input value={r2Config.accessKeyId} onChange={e => updateR2('accessKeyId', e.target.value)} placeholder="کلیلی دەستگەیشتن" className="bg-secondary" />
          </div>

          <div className="space-y-2">
            <Label className="text-muted-foreground text-xs font-semibold">Secret Access Key</Label>
            <div className="relative">
              <Input
                type={showSecret ? 'text' : 'password'}
                value={r2Config.secretAccessKey}
                onChange={e => updateR2('secretAccessKey', e.target.value)}
                placeholder="کلیلی نهێنی"
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
            <Input value={r2Config.bucketName} onChange={e => updateR2('bucketName', e.target.value)} placeholder="ناوی باکێت" className="bg-secondary" />
          </div>

          <div className="space-y-2">
            <Label className="text-muted-foreground text-xs font-semibold">Public Domain <span className="text-muted-foreground/60">(ئارەزوومەندانە)</span></Label>
            <Input value={r2Config.publicDomain} onChange={e => updateR2('publicDomain', e.target.value)} placeholder="https://pub-xxx.r2.dev" className="bg-secondary" />
            <p className="text-muted-foreground text-[10px]">دۆمەینی گشتی باکێت (r2.dev subdomain یان دۆمەینی تایبەت)</p>
          </div>
        </div>
      )}

      <Button onClick={handleSave} className="w-full gap-2">
        <Save className="w-4 h-4" />
        پاشکەوتکردن
      </Button>
    </div>
  );
};

export default StorageSettings;
