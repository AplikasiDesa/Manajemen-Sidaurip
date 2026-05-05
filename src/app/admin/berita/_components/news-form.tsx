'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, Image as ImageIcon, Star, CloudUpload } from 'lucide-react';
import { doc, setDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { News } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { Checkbox } from '@/components/ui/checkbox';
import { optimizeCloudinaryUrl } from '@/lib/utils';

interface NewsFormProps {
  initialData?: News | null;
}

export function NewsForm({ initialData }: NewsFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    date: '',
    content: '',
    author: '',
    imageUrl: '',
    isHeadline: false,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();
  const router = useRouter();

  const CLOUD_NAME = 'dgsxujjb1';
  const UPLOAD_PRESET = 'ml_default'; // Gunakan 'ml_default' atau preset unsigned yang telah dibuat di Cloudinary

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title,
        subtitle: initialData.subtitle,
        date: initialData.date,
        content: initialData.content,
        author: initialData.author,
        imageUrl: initialData.imageUrl,
        isHeadline: initialData.isHeadline || false,
      });
    }
  }, [initialData]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Terlalu Besar",
        description: "Maksimal ukuran gambar adalah 5MB.",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    // Buat preview lokal
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
    uploadData.append('folder', 'sidaurip_news');

    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
      method: 'POST',
      body: uploadData,
    });

    if (!response.ok) {
      throw new Error('Gagal mengunggah gambar ke Cloudinary');
    }

    const data = await response.json();
    return data.secure_url;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore) return;

    setIsSubmitting(true);
    try {
      let finalImageUrl = formData.imageUrl;

      // Jika ada file baru yang dipilih, unggah dulu ke Cloudinary
      if (selectedFile) {
        toast({ title: "Mengunggah Gambar...", description: "Sedang mengirim media ke server Cloudinary." });
        finalImageUrl = await uploadToCloudinary(selectedFile);
      }

      if (!finalImageUrl) {
        throw new Error('Harap unggah gambar terlebih dahulu.');
      }

      const newsData = {
        ...formData,
        imageUrl: finalImageUrl,
        updatedAt: serverTimestamp(),
      };

      if (initialData) {
        await setDoc(doc(firestore, 'news', initialData.id), newsData, { merge: true });
        toast({ title: "Berhasil Diperbarui", description: "Berita telah disimpan dengan penyimpanan Cloudinary." });
      } else {
        await addDoc(collection(firestore, 'news'), {
          ...newsData,
          createdAt: serverTimestamp(),
        });
        toast({ title: "Berita Berhasil Dibuat", description: "Berita baru telah diterbitkan menggunakan Cloudinary." });
      }
      router.push('/admin/berita');
    } catch (error: any) {
      toast({ title: "Gagal Menyimpan", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="max-w-4xl mx-auto border-none shadow-xl rounded-[2.5rem] overflow-hidden">
      <CardHeader className="bg-primary text-white p-8">
        <CardTitle className="text-2xl font-black uppercase tracking-tight flex items-center gap-3">
          <CloudUpload className="h-6 w-6 text-secondary" />
          {initialData ? 'Perbarui Berita' : 'Publikasi Berita Baru'}
        </CardTitle>
        <CardDescription className="text-white/60 font-medium">
          Media disimpan di Cloudinary secara efisien.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
               <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pratinjau Media</Label>
               <div className="relative aspect-video w-full overflow-hidden rounded-3xl border-4 border-slate-50 bg-slate-100 flex items-center justify-center group shadow-inner">
                  {formData.imageUrl ? (
                    <img src={optimizeCloudinaryUrl(formData.imageUrl)} alt="Preview" className="h-full w-full object-cover" />
                  ) : (
                    <div className="text-center space-y-2">
                       <ImageIcon className="h-10 w-10 text-slate-300 mx-auto" />
                       <p className="text-[10px] font-bold text-slate-400 uppercase">Belum ada gambar</p>
                    </div>
                  )}
               </div>
               <div className="space-y-2">
                  <Input type="file" accept="image/*" onChange={handleFileChange} disabled={isSubmitting} className="rounded-xl border-slate-200 cursor-pointer" />
                  <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">
                    unggah foto kegiatan di kolom atas
                  </p>
               </div>
            </div>

            <div className="space-y-6">
               <div className="flex items-center space-x-3 bg-secondary/10 p-5 rounded-3xl border border-secondary/20">
                <Checkbox 
                  id="isHeadline" 
                  checked={formData.isHeadline} 
                  onCheckedChange={(checked) => setFormData(p => ({ ...p, isHeadline: !!checked }))}
                />
                <Label htmlFor="isHeadline" className="flex items-center gap-2 cursor-pointer font-black text-primary uppercase text-xs tracking-tight">
                  <Star className="h-4 w-4 fill-secondary text-secondary" />
                  Berita Utama (Headline)
                </Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tanggal Terbit</Label>
                <Input 
                  id="date" 
                  value={formData.date} 
                  onChange={e => setFormData(p => ({ ...p, date: e.target.value }))} 
                  placeholder="Contoh: Senin, 20 Jan 2026"
                  required 
                  className="rounded-xl h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="author" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Penulis / Redaksi</Label>
                <Input 
                  id="author" 
                  value={formData.author} 
                  onChange={e => setFormData(p => ({ ...p, author: e.target.value }))} 
                  placeholder="Nama Penulis"
                  required 
                  className="rounded-xl h-12"
                />
              </div>
            </div>
          </div>

          <div className="h-px bg-slate-100" />

          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Judul Berita</Label>
              <Input 
                id="title" 
                value={formData.title} 
                onChange={e => setFormData(p => ({ ...p, title: e.target.value }))} 
                placeholder="Masukkan judul berita..."
                required 
                className="rounded-xl h-14 text-lg font-bold"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subtitle" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Subtitle</Label>
              <Input 
                id="subtitle" 
                value={formData.subtitle} 
                onChange={e => setFormData(p => ({ ...p, subtitle: e.target.value }))} 
                placeholder="Ringkasan singkat berita..."
                className="rounded-xl h-12 italic"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Isi Berita</Label>
              <Textarea 
                id="content" 
                value={formData.content} 
                onChange={e => setFormData(p => ({ ...p, content: e.target.value }))} 
                placeholder="Tulis detail kejadian..."
                rows={12}
                required 
                className="rounded-2xl p-4 leading-relaxed"
              />
            </div>
          </div>

          <Button type="submit" size="lg" disabled={isSubmitting} className="w-full h-16 rounded-2xl bg-primary hover:bg-slate-800 text-white font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20">
            {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
            {initialData ? 'SIMPAN PERUBAHAN' : 'TERBITKAN BERITA'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
