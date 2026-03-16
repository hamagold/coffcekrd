import { useState, useEffect, useCallback } from 'react';
import { Shield, Save, Loader2, ToggleLeft, ToggleRight } from 'lucide-react';
import { toast } from 'sonner';
import { Language } from '@/types';
import { adminT } from '@/data/adminTranslations';
import { supabase } from '@/integrations/supabase/client';

export interface PermissionsConfig {
  staffPermissions: Record<string, boolean>;
}

const ALL_SECTIONS = [
  'dashboard', 'orders', 'menu', 'reports', 'users', 'expenses', 'plc', 'plcLogs', 'cafeSettings',
];

const sectionLabels: Record<Language, Record<string, string>> = {
  ku: {
    dashboard: 'داشبۆرد',
    orders: 'ئۆردەرەکان',
    menu: 'مینۆ',
    reports: 'ڕاپۆرتەکان',
    users: 'بەکارهێنەرەکان',
    expenses: 'خەرجییەکان',
    plc: 'PLC یەکگرتن',
    plcLogs: 'لۆگی PLC',
    cafeSettings: 'ڕێکخستنەکان',
  },
  ar: {
    dashboard: 'لوحة القيادة',
    orders: 'الطلبات',
    menu: 'القائمة',
    reports: 'التقارير',
    users: 'المستخدمون',
    expenses: 'المصاريف',
    plc: 'تكامل PLC',
    plcLogs: 'سجل PLC',
    cafeSettings: 'الإعدادات',
  },
  en: {
    dashboard: 'Dashboard',
    orders: 'Orders',
    menu: 'Menu',
    reports: 'Reports',
    users: 'Users',
    expenses: 'Expenses',
    plc: 'PLC Integration',
    plcLogs: 'PLC Logs',
    cafeSettings: 'Settings',
  },
};

const DEFAULT_STAFF_PERMISSIONS: Record<string, boolean> = {
  dashboard: true,
  orders: true,
  menu: false,
  reports: false,
  users: false,
  expenses: false,
  plc: false,
  plcLogs: false,
  cafeSettings: false,
};

let cachedPermissions: PermissionsConfig | null = null;

export const fetchPermissions = async (): Promise<PermissionsConfig> => {
  if (cachedPermissions) return cachedPermissions;
  const { data } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', 'permissions_config')
    .single();
  cachedPermissions = (data?.value as any) || { staffPermissions: DEFAULT_STAFF_PERMISSIONS };
  return cachedPermissions!;
};

export const invalidatePermissionsCache = () => {
  cachedPermissions = null;
};

const AdminPermissions = ({ lang }: { lang: Language }) => {
  const dir = lang === 'en' ? 'ltr' : 'rtl';
  const [config, setConfig] = useState<PermissionsConfig>({ staffPermissions: { ...DEFAULT_STAFF_PERMISSIONS } });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPermissions().then(cfg => {
      // Ensure all sections exist
      const merged = { ...DEFAULT_STAFF_PERMISSIONS, ...cfg.staffPermissions };
      setConfig({ staffPermissions: merged });
      setLoading(false);
    });
  }, []);

  const toggle = (section: string) => {
    setConfig(prev => ({
      ...prev,
      staffPermissions: {
        ...prev.staffPermissions,
        [section]: !prev.staffPermissions[section],
      },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Check if exists
      const { data: existing } = await supabase
        .from('app_settings')
        .select('id')
        .eq('key', 'permissions_config')
        .single();

      if (existing) {
        const { error } = await supabase
          .from('app_settings')
          .update({ value: config as any, updated_at: new Date().toISOString() })
          .eq('key', 'permissions_config');
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('app_settings')
          .insert({ key: 'permissions_config', value: config as any });
        if (error) throw error;
      }

      invalidatePermissionsCache();
      toast.success(lang === 'ku' ? 'دەسەڵاتەکان پاشکەوت کران' : lang === 'ar' ? 'تم حفظ الصلاحيات' : 'Permissions saved');
    } catch (err: any) {
      toast.error(err.message || 'Error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>;
  }

  return (
    <div dir={dir}>
      <h2 className="text-foreground text-lg font-bold mb-2 flex items-center gap-2">
        <Shield className="w-5 h-5 text-muted-foreground" />
        {lang === 'ku' ? 'دەسەڵاتی ستاف' : lang === 'ar' ? 'صلاحيات الموظف' : 'Staff Permissions'}
      </h2>
      <p className="text-muted-foreground text-sm mb-6">
        {lang === 'ku' ? 'دیاری بکە ستاف بتوانیت چی ببینیت لە ئەدمین پانێڵ' : lang === 'ar' ? 'حدد ما يمكن للموظف رؤيته في لوحة التحكم' : 'Define which sections staff can access in admin panel'}
      </p>

      <div className="bg-card rounded-xl border border-border overflow-hidden mb-5">
        <div className="p-4 border-b border-border bg-secondary/30">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-foreground font-bold text-sm">
              {lang === 'ku' ? 'سوپەر ئەدمین — دەسەڵاتی تەواو بۆ هەموو بەشەکان' : lang === 'ar' ? 'المدير العام — صلاحية كاملة لجميع الأقسام' : 'Super Admin — Full access to all sections'}
            </span>
          </div>
        </div>
        <div className="p-4 border-b border-border">
          <div className="text-foreground font-bold text-sm mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-info" />
            {lang === 'ku' ? 'ستاف — دەسەڵاتی دیاریکراو' : lang === 'ar' ? 'موظف — صلاحيات محددة' : 'Staff — Limited access'}
          </div>
          <div className="space-y-2">
            {ALL_SECTIONS.map(section => (
              <div key={section} className="flex items-center justify-between py-2 px-3 bg-secondary/50 rounded-lg hover:bg-secondary transition-colors">
                <span className="text-foreground text-sm font-medium">{sectionLabels[lang][section]}</span>
                <button onClick={() => toggle(section)} className="transition-all">
                  {config.staffPermissions[section]
                    ? <ToggleRight className="w-7 h-7 text-green-500" />
                    : <ToggleLeft className="w-7 h-7 text-muted-foreground" />
                  }
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <button onClick={handleSave} disabled={saving} className="w-full py-3 bg-primary text-primary-foreground rounded-lg text-sm font-bold cursor-pointer hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {lang === 'ku' ? 'پاشکەوتکردنی دەسەڵاتەکان' : lang === 'ar' ? 'حفظ الصلاحيات' : 'Save Permissions'}
      </button>
    </div>
  );
};

export default AdminPermissions;
