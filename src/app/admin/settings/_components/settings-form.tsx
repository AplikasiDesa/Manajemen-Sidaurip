'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save } from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { KopSuratInfo } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

const defaultKopInfo: KopSuratInfo = {
  letterheadImageUrl: "https://placehold.co/1200x240/f0f0f0/333333?text=Unggah+Gambar+Kop+Surat"
};

export function SettingsForm() {
  const [formState, setFormState] = useState<KopSuratInfo>(defaultKopInfo);
  const [imagePreview, setImagePreview] = useState<string>(defaultKopInfo.letterheadImageUrl);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  
  const firestore = useFirestore();

  const kopSuratRef = useMemoFirebase(() => doc(firestore, 'kopSurat', 'default'), [firestore]);
  const { data: kopData, isLoading: isDataLoading } = useDoc<KopSuratInfo>(kopSuratRef);

  useEffect(() => {
    if (kopData) {
      setFormState(kopData);
      setImagePreview(kopData.letterheadImageUrl);
    }
  }, [kopData]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 700KB limit to avoid hitting Firestore's 1MiB document size limit after base64 encoding.
    if (file.size > 700 * 1024) { 
        toast({
            title: "Ukuran File Terlalu Besar",
            description: "Ukuran gambar kop surat tidak boleh melebihi 700KB.",
            variant: "destructive",
        });
        return;
    }

    setIsUploading(true);
    const reader = new FileReader();

    reader.onloadend = () => {
      const base64String = reader.result as string;
      setFormState({ letterheadImageUrl: base64String });
      setImagePreview(base64String);
      setIsUploading(false);
      toast({ title: "Gambar Siap Disimpan", description: "Pratinjau telah diperbarui. Klik 'Simpan Perubahan' untuk menerapkan gambar baru." });
    };

    reader.onerror = () => {
        console.error("Error reading file");
        toast({ title: "Gagal Membaca File", description: "Terjadi kesalahan saat memuat pratinjau gambar.", variant: "destructive" });
        setIsUploading(false);
    };
    
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      await setDoc(kopSuratRef, formState, { merge: true });
      toast({
        title: "Templete Kop Berhasil Diperbarui",
        description: "Gambar kop surat telah berhasil disimpan.",
      });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Gagal Menyimpan",
        description: "Terjadi kesalahan saat menyimpan pengaturan ke Firestore.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  if (isDataLoading) {
      return (
          <Card>
              <CardHeader>
                  <Skeleton className="h-8 w-1/2" />
                  <Skeleton className="h-4 w-3/4" />
              </CardHeader>
              <CardContent>
                  <div className="space-y-8">
                       <Skeleton className="h-48 w-full" />
                       <Skeleton className="h-11 w-48" />
                  </div>
              </CardContent>
          </Card>
      )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Templete Kop Surat</CardTitle>
        <CardDescription>Unggah satu gambar kop surat yang sudah jadi. Gambar ini akan digunakan di semua dokumen yang dicetak.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-4">
                <Label>Pratinjau Kop Surat</Label>
                <div className="p-4 border-2 border-dashed rounded-md flex items-center justify-center bg-muted/50 min-h-48">
                   {imagePreview ? (
                        <img src={imagePreview} alt="Pratinjau Kop Surat" className="object-contain max-w-full h-auto rounded-md"/>
                   ) : (
                        <p className="text-sm text-muted-foreground">Tidak ada gambar kop surat</p>
                   )}
                </div>
            </div>
        
            <div className="space-y-2">
                <Label htmlFor="logo-upload">Unggah Gambar Kop Surat Baru</Label>
                <div className="flex items-center gap-2">
                    <Input
                        id="logo-upload"
                        type="file"
                        accept="image/png, image/jpeg"
                        onChange={handleFileChange}
                        disabled={isSaving || isUploading}
                        className="pt-2 flex-grow"
                    />
                    {isUploading && <Loader2 className="h-5 w-5 animate-spin" />}
                </div>
                <p className="text-sm text-muted-foreground">
                    Ukuran maks: 700KB. Format: PNG, JPG.
                </p>
            </div>
            
            <Button type="submit" disabled={isSaving || isUploading || !formState.letterheadImageUrl || formState.letterheadImageUrl === defaultKopInfo.letterheadImageUrl}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Simpan Perubahan
            </Button>
        </form>
      </CardContent>
    </Card>
  );
}
