'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';
import { 
  ArrowLeft, 
  Navigation,
  CheckCircle2,
  Map,
  Briefcase,
  BookOpen,
  Building2,
  Sprout,
  Users,
  Landmark,
  TrendingUp,
  Music,
  Languages,
  Milestone,
  History,
  HeartHandshake,
  Target
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

export default function ProfilDesaPage() {
  const firestore = useFirestore();
  
  const heroRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'heroImage', 'default');
  }, [firestore]);
  
  const { data: heroData } = useDoc<{ imageUrl: string }>(heroRef);
  const heroImageUrl = heroData?.imageUrl || "https://images.unsplash.com/photo-1602989106211-81de671c23a9?q=80&w=2000";

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* HEADER */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <Logo />
          <Link href="/">
            <Button variant="ghost" className="font-bold gap-2 text-primary hover:bg-primary/10">
              <ArrowLeft className="h-4 w-4" />
              Kembali ke Beranda
            </Button>
          </Link>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative py-24 bg-primary text-white overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <Image 
            src={heroImageUrl}
            alt="Pemandangan Desa"
            fill
            className="object-cover"
            priority
          />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-secondary text-xs font-black uppercase tracking-[0.3em]">
              <Milestone className="h-3 w-3" />
              Kecamatan Gandrungmangu – Kabupaten Cilacap
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight uppercase font-display">
              PROFIL DESA <span className="text-secondary italic">SIDAURIP</span>
            </h1>
            <p className="text-lg md:text-xl text-white/80 leading-relaxed font-sans max-w-3xl mx-auto italic">
              "Tumbuh dari Kebersamaan, Maju dengan Kemandirian"
            </p>
            
            <div className="pt-12 grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
              <div className="bg-white/5 backdrop-blur-sm p-8 rounded-[2rem] border border-white/10 space-y-4">
                 <div className="flex items-center gap-3">
                    <History className="h-6 w-6 text-secondary" />
                    <h3 className="text-lg font-bold uppercase tracking-tight">Sejarah Singkat</h3>
                 </div>
                 <p className="text-sm leading-relaxed text-slate-200">
                    Terbentuk pada tahun 1984 hasil pemekaran dari Desa Cisumur. Nama "Sidaurip" mencerminkan harapan akan kehidupan yang lebih baik dan terus berkembang menjadi wilayah mandiri.
                 </p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm p-8 rounded-[2rem] border border-white/10 space-y-4">
                 <div className="flex items-center gap-3">
                    <HeartHandshake className="h-6 w-6 text-secondary" />
                    <h3 className="text-lg font-bold uppercase tracking-tight">Gambaran Umum</h3>
                 </div>
                 <p className="text-sm leading-relaxed text-slate-200">
                    Dikenal sebagai desa agraris dengan karakter masyarakat yang kuat dalam kebersamaan, kemandirian, dan semangat gotong royong yang masih terjaga hingga saat ini.
                 </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="container mx-auto px-4 py-16 space-y-24">
        
        {/* GEOGRAFIS & LUAS WILAYAH */}
        <section className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest">
                <Navigation className="h-3 w-3" />
                Letak & Karakter Alam
              </div>
              <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight font-display italic">Strategis & Produktif</h2>
              <p className="text-slate-600 leading-relaxed font-sans">
                Desa Sidaurip terletak di bagian selatan Kecamatan Gandrungmangu dengan akses yang baik untuk aktivitas sosial dan ekonomi. Memiliki luas wilayah sekitar ±2,5 km² yang didominasi oleh lahan pertanian subur.
              </p>
              <ul className="grid grid-cols-1 gap-3 pt-4">
                {[
                  "Lahan pertanian luas dan produktif",
                  "Posisi strategis penghubung antar desa",
                  "Potensi besar dalam ketahanan pangan"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm font-bold text-slate-700 bg-white p-4 rounded-2xl border shadow-sm">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="relative h-[500px] rounded-[3rem] overflow-hidden shadow-2xl border-8 border-white group">
            <Image 
              src={heroImageUrl}
              alt="Lahan Pertanian Sidaurip"
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-1000"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-8 left-8 right-8 text-white">
               <p className="text-xs font-black uppercase mb-1 tracking-widest text-secondary">Karakter Alam</p>
               <p className="text-xl font-bold">Lahan agraris yang menjadi fondasi ketahanan pangan desa.</p>
            </div>
          </div>
        </section>

        {/* PEMBAGIAN WILAYAH & KEPENDUDUKAN */}
        <section className="bg-primary rounded-[3rem] p-8 md:p-16 text-white shadow-2xl relative overflow-hidden">
          <div className="grid lg:grid-cols-2 gap-16 relative z-10">
            <div className="space-y-8">
               <div className="flex items-center gap-4">
                  <Landmark className="h-8 w-8 text-secondary" />
                  <h3 className="text-2xl font-display font-semibold italic uppercase">Pembagian Administratif</h3>
               </div>
               <p className="text-slate-200 leading-relaxed">Terbagi menjadi 4 dusun utama yang mendukung sistem pelayanan efektif dan koordinasi masyarakat:</p>
               <div className="grid grid-cols-2 gap-4">
                  {['Dusun Kuripan', 'Dusun Sidaurip', 'Dusun Sidasari', 'Dusun Gebangsari'].map((dusun) => (
                    <div key={dusun} className="bg-white/10 p-4 rounded-2xl border border-white/10 text-center font-bold text-sm tracking-wide">
                      {dusun}
                    </div>
                  ))}
               </div>
            </div>

            <div className="space-y-8">
               <div className="flex items-center gap-4">
                  <Users className="h-8 w-8 text-secondary" />
                  <h3 className="text-2xl font-display font-semibold italic uppercase">Kependudukan</h3>
               </div>
               <p className="text-slate-200 leading-relaxed">
                 Memiliki populasi sekitar 3.000 – 3.500 jiwa dengan komposisi usia produktif yang dominan, mencerminkan tenaga kerja yang potensial.
               </p>
               <div className="p-6 bg-secondary/20 rounded-3xl border-2 border-dashed border-secondary/30">
                  <p className="text-sm font-medium italic text-slate-100">
                    "Masyarakat Sidaurip dikenal memiliki semangat kerja yang tinggi serta keterikatan sosial yang sangat kuat antar warga."
                  </p>
               </div>
            </div>
          </div>
        </section>

        {/* SOSIAL, BUDAYA & EKONOMI */}
        <section className="space-y-16">
           <div className="text-center space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent text-white text-[10px] font-black uppercase tracking-[0.3em]">
                <Languages className="h-3 w-3" />
                Sosial & Budaya
              </div>
              <h2 className="text-4xl md:text-5xl font-display font-semibold italic text-slate-900 uppercase">Tradisi <span className="text-primary">Banyumasan</span></h2>
              <p className="text-slate-500 font-bold uppercase text-xs tracking-widest">Kehidupan Religi dan Seni yang Harmonis</p>
           </div>

           <div className="grid lg:grid-cols-3 gap-8">
              <Card className="rounded-[2.5rem] border-none shadow-sm bg-white overflow-hidden group hover:shadow-xl transition-all">
                <CardContent className="p-10 space-y-6">
                   <Users className="h-8 w-8 text-primary group-hover:scale-110 transition-transform" />
                   <h4 className="text-xl font-bold uppercase tracking-tight">Kekuatan Sosial</h4>
                   <ul className="space-y-3 text-sm font-medium text-slate-600">
                      <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-secondary shrink-0 mt-0.5" /> Gotong royong aktif setiap hari</li>
                      <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-secondary shrink-0 mt-0.5" /> Tradisi religi: Yasinan & Tahlilan</li>
                      <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-secondary shrink-0 mt-0.5" /> Rasa syukur: Slametan & Sedekah Bumi</li>
                   </ul>
                </CardContent>
              </Card>

              <Card className="rounded-[2.5rem] border-none shadow-sm bg-white overflow-hidden group hover:shadow-xl transition-all">
                <CardContent className="p-10 space-y-6">
                   <Music className="h-8 w-8 text-primary group-hover:scale-110 transition-transform" />
                   <h4 className="text-xl font-bold uppercase tracking-tight">Kesenian Rakyat</h4>
                   <p className="text-sm leading-relaxed text-slate-600">Pelestarian budaya melalui seni tradisional yang masih hidup di tengah masyarakat:</p>
                   <div className="flex flex-wrap gap-2">
                      {['Ebeg', 'Hadrah', 'Musik Rakyat'].map(tag => (
                        <span key={tag} className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-black uppercase text-slate-500">
                          {tag}
                        </span>
                      ))}
                   </div>
                </CardContent>
              </Card>

              <Card className="rounded-[2.5rem] border-none shadow-sm bg-white overflow-hidden group hover:shadow-xl transition-all">
                <CardContent className="p-10 space-y-6">
                   <Briefcase className="h-8 w-8 text-primary group-hover:scale-110 transition-transform" />
                   <h4 className="text-xl font-bold uppercase tracking-tight">Mata Pencaharian</h4>
                   <ul className="space-y-3 text-sm font-medium text-slate-600">
                      <li className="flex items-center gap-2"><Sprout className="h-4 w-4 text-secondary" /> Pertanian Padi & Palawija</li>
                      <li className="flex items-center gap-2"><Building2 className="h-4 w-4 text-secondary" /> Perdagangan & UMKM</li>
                      <li className="flex items-center gap-2"><Users className="h-4 w-4 text-secondary" /> Industri Rumahan</li>
                   </ul>
                </CardContent>
              </Card>
           </div>
        </section>

        {/* SARANA & POTENSI */}
        <section className="grid lg:grid-cols-2 gap-12">
           <div className="bg-slate-50 rounded-[3rem] p-10 space-y-8 border border-slate-100">
              <div className="flex items-center gap-3">
                 <Building2 className="h-6 w-6 text-primary" />
                 <h3 className="text-2xl font-black uppercase tracking-tight">Sarana Penunjang</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                 {[
                   { label: 'Akses', val: 'Jalan Desa Memadai', icon: Navigation },
                   { label: 'Edukasi', val: 'Fasilitas SD & SMP', icon: BookOpen },
                   { label: 'Kesehatan', val: 'Layanan Dasar Desa', icon: Users },
                   { label: 'Religi', val: 'Tempat Ibadah Dusun', icon: Landmark }
                 ].map((item, i) => (
                    <div key={i} className="flex gap-4">
                       <item.icon className="h-5 w-5 text-secondary mt-1" />
                       <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.label}</p>
                          <p className="font-bold text-slate-800">{item.val}</p>
                       </div>
                    </div>
                 ))}
              </div>
           </div>

           <div className="bg-secondary/5 rounded-[3rem] p-10 space-y-8 border border-secondary/10">
              <div className="flex items-center gap-3">
                 <TrendingUp className="h-6 w-6 text-primary" />
                 <h3 className="text-2xl font-black uppercase tracking-tight">Potensi Unggulan</h3>
              </div>
              <div className="space-y-4">
                 {[
                   "Lahan pertanian luas yang produktif",
                   "Kekuatan sosial dan solidaritas tinggi",
                   "Potensi pengembangan UMKM mandiri",
                   "Kemampuan adaptasi lingkungan"
                 ].map((text, i) => (
                   <div key={i} className="flex items-center gap-3 bg-white p-4 rounded-2xl border-l-4 border-secondary shadow-sm">
                      <div className="h-6 w-6 rounded-full bg-secondary/10 text-primary flex items-center justify-center font-black text-xs">{i+1}</div>
                      <p className="text-sm font-bold text-slate-700">{text}</p>
                   </div>
                 ))}
              </div>
           </div>
        </section>

        {/* ARAH PENGEMBANGAN & PENUTUP */}
        <section className="py-24 text-center space-y-10 max-w-5xl mx-auto border-t">
          <div className="space-y-4">
             <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary text-white text-[10px] font-black uppercase tracking-[0.4em]">
                <Target className="h-3 w-3" />
                Visi Masa Depan
             </div>
             <h2 className="text-4xl md:text-5xl font-display font-semibold text-slate-900 uppercase tracking-tight italic leading-relaxed">
               Menuju Desa Mandiri Berdaya Saing
             </h2>
          </div>
          
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
             {['Pertanian Berkelanjutan', 'Pemberdayaan Ekonomi', 'Kualitas SDM Unggul', 'Desa Tangguh Adaptif'].map(point => (
               <div key={point} className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm font-black text-[10px] uppercase tracking-widest text-slate-500">
                 {point}
               </div>
             ))}
          </div>

          <p className="text-slate-500 text-lg leading-relaxed font-medium italic font-sans px-4">
            "Dengan semangat kebersamaan dan kerja keras masyarakatnya, Desa Sidaurip optimis menjadi desa yang maju dan sejahtera."
          </p>
          
          <div className="pt-8">
            <Link href="/dashboard">
              <Button size="lg" className="bg-primary text-white font-black px-12 h-16 rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-primary/20 uppercase tracking-widest text-xs">
                MASUK PORTAL PELAYANAN
              </Button>
            </Link>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="bg-primary text-white/60 py-16 border-t border-white/5 mt-auto">
        <div className="container mx-auto px-4 text-center space-y-12">
          <div className="flex flex-col items-center gap-4">
            <Logo />
            <h4 className="text-2xl font-display italic font-semibold text-white">
              “Desa Sidaurip: Tumbuh dari Kebersamaan, Maju dengan Kemandirian”
            </h4>
          </div>
          <div className="pt-8 border-t border-white/5 text-[10px] font-bold uppercase tracking-[0.3em] opacity-40">
            <p>© 2026 Website Resmi Pemerintahan Desa Sidaurip</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
