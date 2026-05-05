'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useFirebase } from '@/firebase';
import { saveCitizenProfile } from '@/lib/citizens';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowRight, ShieldCheck, Phone, Mail } from 'lucide-react';
import { Logo } from '@/components/logo';

export default function PortalPage() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { firestore, user, isUserLoading } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !user) return;

    if (!phoneNumber.startsWith('08') || phoneNumber.length < 10) {
      toast({
        title: "No HP Tidak Valid",
        description: "Gunakan format Indonesia (contoh: 08123456789).",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await saveCitizenProfile(firestore, user.uid, { phoneNumber, email });
      toast({
        title: "Selamat Datang!",
        description: "Data Anda telah disimpan. Silakan gunakan layanan kami.",
      });
      router.push('/dashboard');
    } catch (error: any) {
      toast({
        title: "Gagal Menyimpan",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isUserLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-50 to-white p-4">
      <Card className="w-full max-w-md shadow-xl border-green-100">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <Logo />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold text-green-900">Portal Layanan Digital</CardTitle>
            <CardDescription className="text-gray-600">
              Silakan lengkapi data kontak Anda untuk memulai pengajuan layanan mandiri.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-green-600" />
                Nomor WhatsApp (Aktif)
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="Contoh: 081234567890"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
                disabled={isSubmitting}
                className="h-12 border-green-200 focus:ring-green-500"
              />
              <p className="text-[10px] text-muted-foreground">Kami akan menghubungi Anda melalui nomor ini jika pengajuan selesai.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-green-600" />
                Alamat Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isSubmitting}
                className="h-12 border-green-200 focus:ring-green-500"
              />
            </div>

            <Button type="submit" className="w-full h-12 bg-green-700 hover:bg-green-800 text-lg font-semibold" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <>
                  Masuk ke Dashboard
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="bg-gray-50 border-t flex items-center justify-center p-4">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <ShieldCheck className="h-4 w-4 text-green-600" />
            Data Anda dienkripsi dan hanya untuk keperluan administrasi.
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
