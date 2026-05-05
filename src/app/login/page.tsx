'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Logo } from '@/components/logo';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc } from 'firebase/firestore';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();

  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Ambil Gambar Hero secara dinamis dari Firestore
  const heroRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'heroImage', 'default');
  }, [firestore]);
  
  const { data: heroData } = useDoc<{ imageUrl: string }>(heroRef);
  const heroImageUrl = heroData?.imageUrl || "https://images.unsplash.com/photo-1602989106211-81de671c23a9?q=80&w=2000";

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
  
    if (!auth) {
      toast({ title: 'Auth tidak tersedia', variant: 'destructive' });
      setIsLoading(false);
      return;
    }
  
    try {
      await signInWithEmailAndPassword(auth, email, password);
  
      // MEKANISME FLAG ADMIN INSTAN: Otoritas ditanamkan di sistem lokal
      // Email target: sidaurip@gmail.id
      if (email.toLowerCase() === 'sidaurip@gmail.id') {
        localStorage.setItem('isAdmin', 'true');
        toast({ title: 'Login Berhasil', description: 'Selamat datang, Admin!' });
        
        // Hard redirect untuk menjamin perpindahan halaman tanpa loop
        window.location.href = '/admin/surat';
      } else {
        localStorage.removeItem('isAdmin');
        toast({ title: 'Akses Ditolak', description: 'Anda login sebagai warga umum.', variant: 'destructive' });
        router.replace('/dashboard');
      }
    
    } catch (error) {
      toast({ title: 'Login Gagal', description: "Email atau password salah.", variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2 bg-background font-sans">
      <div className="flex items-center justify-center py-12 px-4">
        <div className="mx-auto grid w-full max-w-[350px] gap-8">
          <div className="grid gap-2 text-center">
            <div className="flex justify-center mb-4">
              <Logo />
            </div>
            <h1 className="text-4xl font-semibold font-display text-primary uppercase">Admin Portal</h1>
            <p className="text-slate-500 font-medium">
              Sistem Pengelolaan Digital Desa Sidaurip.
            </p>
          </div>
          
          <form onSubmit={handleEmailLogin} className="grid gap-6">
            <div className="grid gap-2">
              <Label htmlFor="email" className="font-bold text-xs uppercase tracking-widest text-slate-400">Email Administrator</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@sidaurip.desa"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="h-12 rounded-xl border-slate-200 focus:ring-primary"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password" className="font-bold text-xs uppercase tracking-widest text-slate-400">Kata Sandi</Label>
              <Input 
                id="password" 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="h-12 rounded-xl border-slate-200 focus:ring-primary"
              />
            </div>
            <Button type="submit" className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 font-black text-white shadow-xl shadow-primary/20" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'MASUK KE SISTEM'}
            </Button>
          </form>
          <div className="text-center text-sm font-bold">
            <Link href="/dashboard" className="text-primary hover:underline">
              ← Kembali ke Portal Publik
            </Link>
          </div>
        </div>
      </div>
      <div className="hidden bg-primary lg:block relative overflow-hidden">
        <Image
          src={heroImageUrl}
          alt="Desa Sidaurip"
          fill
          className="object-cover opacity-60 grayscale-[50%] hover:grayscale-0 transition-all duration-1000"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary via-transparent to-transparent" />
        <div className="absolute bottom-12 left-12 right-12 text-white">
            <h2 className="text-5xl font-semibold font-display leading-tight italic">Melayani dengan Inovasi, Membangun dari Hati.</h2>
            <p className="mt-4 font-black uppercase tracking-[0.4em] text-white/50 text-xs">Pemerintah Desa Sidaurip</p>
        </div>
      </div>
    </div>
  );
}