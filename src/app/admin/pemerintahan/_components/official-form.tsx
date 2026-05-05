
'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFirestore } from '@/firebase';
import { doc, setDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, UserCircle, UploadCloud } from 'lucide-react';
import { Official } from '@/lib/types';
import { optimizeCloudinaryUrl } from '@/lib/utils';

interface OfficialFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  official?: Official | null;
}

export function OfficialForm({ open, onOpenChange, official }: OfficialFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    position: '',
    category: 'perangkat' as 'perangkat' | 'bpd' | 'rtrw',
    imageUrl: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const firestore = useFirestore();
  const { toast } = useToast();

  const CLOUD_NAME = 'dgsxujjb1';
  const UPLOAD_PRESET = 'ml_default';

  useEffect(() => {
    if (official) {
      setFormData({
        name: official.name,
        position: official.position,
        category: official.category,
        imageUrl: official.imageUrl || '',
      });
    } else if (open) {
      setFormData({ name: '', position: '', category: 'perangkat', imageUrl: '' });
      setSelectedFile(null);
    }
  }, [official, open]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "File Terlalu Besar", description: "Maksimal ukuran foto adalah 2MB.", variant: "destructive" });
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, imageUrl: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const uploadToCloudinary = async (file: File): Promise<string> => {
    const uploadData = new FormData();
    uploadData.append('file', file);
    uploadData.append('upload_preset', UPLOAD_PRESET);
    uploadData.append('folder', 'sidaurip_officials');

    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
      method: 'POST',
      body: uploadData,
    });

    if (!response.ok) throw new Error('Gagal mengunggah foto ke Cloudinary');
    const data = await response.json();
    return data.secure_url;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore) return;
    setIsSubmitting(true);

    try {
      let finalImageUrl = formData.imageUrl;

      if (selectedFile) {
        toast({ title: "Mengunggah Foto...", description: "Sedang memproses media profil." });
        finalImageUrl = await uploadToCloudinary(selectedFile);
      }

      const officialData = {
        name: formData.name.toUpperCase(),
        position: formData.position,
        category: formData.category,
        imageUrl: finalImageUrl,
        updatedAt: serverTimestamp(),
      };

      if (official) {
        await setDoc(doc(firestore, 'officials', official.id), officialData, { merge: true });
        toast({ title: "Data Diperbarui" });
      } else {
        await addDoc(collection(firestore, 'officials'), {
          ...officialData,
          createdAt: serverTimestamp(),
        });
        toast({ title: "Data Ditambahkan" });
      }
      onOpenChange(false);
    } catch (error: any) {
      toast({ title: "Gagal Menyimpan", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{official ? 'Edit Pengurus' : 'Tambah Pengurus Baru'}</DialogTitle>
          <DialogDescription>Isi detail pengurus pemerintahan desa di bawah ini.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="flex flex-col items-center gap-4 mb-4">
             <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-slate-100 bg-slate-50 flex items-center justify-center group shadow-inner">
                {formData.imageUrl ? (
                    <img src={formData.imageUrl.startsWith('data:') ? formData.imageUrl : optimizeCloudinaryUrl(formData.imageUrl)} alt="Preview" className="h-full w-full object-cover" />
                ) : (
                    <UserCircle className="h-16 w-16 text-slate-300" />
                )}
                <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <UploadCloud className="h-8 w-8 text-white" />
                    <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                </label>
             </div>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Klik foto untuk ganti profil</p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
                <Label htmlFor="category">Kategori Jabatan</Label>
                <Select value={formData.category} onValueChange={(v: any) => setFormData(p => ({ ...p, category: v }))}>
                <SelectTrigger className="rounded-xl h-12"><SelectValue placeholder="Pilih Kategori" /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="perangkat">Perangkat Desa</SelectItem>
                    <SelectItem value="bpd">BPD Desa</SelectItem>
                    <SelectItem value="rtrw">RT / RW</SelectItem>
                </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label htmlFor="name">Nama Lengkap</Label>
                <Input id="name" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} placeholder="Contoh: BUDI SANTOSO" required className="rounded-xl h-12" />
            </div>

            <div className="space-y-2">
                <Label htmlFor="position">Jabatan</Label>
                <Input id="position" value={formData.position} onChange={e => setFormData(p => ({ ...p, position: e.target.value }))} placeholder="Contoh: Kepala Dusun / Ketua RT 01" required className="rounded-xl h-12" />
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl">Batal</Button>
            <Button type="submit" disabled={isSubmitting} className="rounded-xl bg-primary h-12 px-8">
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Simpan Data
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
