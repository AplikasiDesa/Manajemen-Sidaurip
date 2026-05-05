
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, Image as ImageIcon } from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';

interface HeroImageInfo {
  imageUrl: string;
}

export function HeroSettingsForm() {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  
  const firestore = useFirestore();

  const heroRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'heroImage', 'default');
  }, [firestore]);

  const { data: heroData, isLoading: isDataLoading } = useDoc<HeroImageInfo>(heroRef);

  useEffect(() => {
    if (heroData?.imageUrl) {
      setImageUrl(heroData.imageUrl);
      setImagePreview(heroData.imageUrl);
    }
  }, [heroData]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 700KB limit for Firestore document size
    if (file.size > 700 * 1024) { 
        toast({
            title: "Ukuran File Terlalu Besar",
            description: "Ukuran gambar hero tidak boleh melebihi 700KB.",
            variant: "destructive",
        });
        return;
    }

    setIsUploading(true);
    const reader = new FileReader();

    reader.onloadend = () => {
      const base64String = reader.result as string;
      setImageUrl(base64String);
      setImagePreview(base64String);
      setIsUploading(false);
      toast({ title: "Gambar Siap", description: "Klik simpan untuk menerapkan ke beranda." });
    };

    reader.onerror = () => {
        toast({ title: "Gagal Membaca File", variant: "destructive" });
        setIsUploading(false);
    };
    
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !heroRef) return;
    setIsSaving(true);

    try {
      await setDoc(heroRef, { imageUrl }, { merge: true });
      toast({
        title: "Berhasil",
        description: "Gambar utama beranda telah diperbarui.",
      });
    } catch (error) {
      console.error("Error saving hero image:", error);
      toast({
        title: "Gagal Menyimpan",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isDataLoading) {
    return <Skeleton className="h-[300px] w-full" />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          Gambar Utama Beranda (Hero)
        </CardTitle>
        <CardDescription>Ganti gambar besar yang tampil di bagian atas halaman depan website.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <Label>Pratinjau Gambar</Label>
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl border-2 border-dashed bg-muted flex items-center justify-center">
              {imagePreview ? (
                <img src={imagePreview} alt="Hero Preview" className="h-full w-full object-cover" />
              ) : (
                <p className="text-sm text-muted-foreground">Belum ada gambar kustom</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="hero-upload">Pilih File Gambar (JPG/PNG)</Label>
            <div className="flex items-center gap-4">
              <Input
                id="hero-upload"
                type="file"
                accept="image/jpeg, image/png"
                onChange={handleFileChange}
                disabled={isSaving || isUploading}
                className="max-w-sm"
              />
              {isUploading && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
            </div>
            <p className="text-[10px] text-muted-foreground uppercase font-bold">Maksimal 700KB. Gunakan orientasi lanskap (melebar).</p>
          </div>

          <Button type="submit" disabled={isSaving || isUploading || !imageUrl}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Simpan Gambar Hero
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
