import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { fetchStorageConfig } from '@/components/settings/StorageSettings';
import { toast } from 'sonner';
import { Upload, Camera, Loader2, ImageIcon, X } from 'lucide-react';

interface ImageUploadProps {
  onUpload: (url: string) => void;
  folder?: string;
  className?: string;
  currentImage?: string;
}

const ImageUpload = ({ onUpload, folder = 'items', className = '', currentImage }: ImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const uploadToCloud = async (file: File): Promise<string> => {
    const ext = file.name.split('.').pop();
    const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

    const { error } = await supabase.storage.from('menu-images').upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    });
    if (error) throw error;

    const { data } = supabase.storage.from('menu-images').getPublicUrl(fileName);
    return data.publicUrl;
  };

  const uploadToR2 = async (file: File, r2Config: any): Promise<string> => {
    if (!r2Config) throw new Error('R2 config not found');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('accountId', r2Config.accountId);
    formData.append('accessKeyId', r2Config.accessKeyId);
    formData.append('secretAccessKey', r2Config.secretAccessKey);
    formData.append('bucketName', r2Config.bucketName);
    formData.append('publicDomain', r2Config.publicDomain || '');
    formData.append('folder', folder);

    const { data, error } = await supabase.functions.invoke('upload-to-r2', {
      body: formData,
    });

    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    return data.url;
  };

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('تەنها فایلی وێنە قبوڵ دەکرێت');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('قەبارەی وێنە دەبێت کەمتر لە 5MB بێت');
      return;
    }

    setUploading(true);
    try {
      const config = await fetchStorageConfig();
      let url: string;

      if (config.storageType === 'cloudflare-r2') {
        url = await uploadToR2(file, config.r2Config);
      } else {
        url = await uploadToCloud(file);
      }

      setPreview(url);
      onUpload(url);
      toast.success('وێنە بە سەرکەوتوویی ئەپلۆد کرا');
    } catch (err: any) {
      toast.error(err.message || 'هەڵەیەک ڕوویدا لە کاتی ئەپلۆدکردن');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div dir="rtl" className={`space-y-3 ${className}`}>
      {preview ? (
        <div className="relative w-full h-32 rounded-xl overflow-hidden border border-border">
          <img src={preview} alt="" className="w-full h-full object-cover" />
          <button
            onClick={() => { setPreview(null); onUpload(''); }}
            className="absolute top-2 left-2 p-1 bg-background/80 rounded-md text-destructive hover:bg-background transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="w-full h-32 rounded-xl border-2 border-dashed border-border flex items-center justify-center bg-secondary/50">
          <div className="text-center">
            <ImageIcon className="w-8 h-8 text-muted-foreground mx-auto mb-1" />
            <p className="text-muted-foreground text-xs">وێنەیەک هەڵبژێرە</p>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
          className="flex-1 gap-1.5"
        >
          {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
          هەڵبژاردن
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading}
          onClick={() => cameraRef.current?.click()}
          className="flex-1 gap-1.5"
        >
          <Camera className="w-3.5 h-3.5" />
          کامێرا
        </Button>
      </div>

      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
    </div>
  );
};

export default ImageUpload;
