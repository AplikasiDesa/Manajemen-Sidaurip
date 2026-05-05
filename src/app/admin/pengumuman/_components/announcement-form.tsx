'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Send } from 'lucide-react';
import { useFirebase } from '@/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

export function AnnouncementForm() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { firestore } = useFirebase();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast({
        title: "Formulir tidak lengkap",
        description: "Judul dan isi pengumuman tidak boleh kosong.",
        variant: "destructive",
      });
      return;
    }

    if (!firestore) {
      toast({
        title: "Gagal Menerbitkan",
        description: "Koneksi ke database gagal. Silakan coba lagi.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const announcementsCollection = collection(firestore, 'announcements');
      await addDoc(announcementsCollection, {
        title,
        content,
        authorName: "Admin Desa",
        publishDate: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      toast({
        title: "Pengumuman Diterbitkan",
        description: "Pengumuman baru telah berhasil ditambahkan dan akan tampil di halaman publik.",
      });
      setTitle('');
      setContent('');
    } catch (error) {
      console.error("Gagal menerbitkan pengumuman:", error);
      toast({
        title: "Gagal Menerbitkan",
        description: "Terjadi kesalahan saat menyimpan pengumuman. Coba lagi nanti.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Buat Pengumuman Baru</CardTitle>
        <CardDescription>Isi formulir di bawah ini untuk menerbitkan pengumuman baru untuk warga.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Judul Pengumuman</Label>
            <Input
              id="title"
              placeholder="Contoh: Kerja Bakti Lingkungan"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="content">Isi Pengumuman</Label>
            <Textarea
              id="content"
              placeholder="Tulis isi lengkap pengumuman di sini..."
              rows={8}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>
          <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Terbitkan Pengumuman
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
