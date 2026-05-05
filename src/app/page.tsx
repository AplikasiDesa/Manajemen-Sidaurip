'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';
import { ArrowRight, ShieldCheck, Zap, Users, FileCheck, Phone, Mail, MapPin, Facebook, Instagram, Menu } from 'lucide-react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export default function LandingPage() {
  const firestore = useFirestore();
  const heroRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'heroImage', 'default');
  }, [firestore]);
  
  const { data: heroData } = useDoc<{ imageUrl: string }>(heroRef);
  
  const defaultHeroImage = "https://images.unsplash.com/photo-1602989106211-81de671c23a9?q=80&w=2000";
  const heroImageUrl = heroData?.imageUrl || defaultHeroImage;

  const navLinks = [
    { href: "/profil-desa", label: "Profil" },
    { href: "/Kenali", label: "Kenali Kami" },
    { href: "/BeritaDesa", label: "Berita Desa" },
    { href: "/layanan-surat", label: "Layanan" },
    { href: "/pengumuman", label: "Pengumuman" },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* HEADER / NAVIGATION */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <Logo />
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className="text-sm font-bold text-slate-600 hover:text-primary transition-colors">
                {link.label}
              </Link>
            ))}
            <Link href="/login">
              <Button variant="outline" className="border-primary text-primary font-bold rounded-xl">Login Admin</Button>
            </Link>
            <Link href="/dashboard">
              <Button className="bg-secondary hover:bg-yellow-600 text-primary-foreground font-black px-6 rounded-xl shadow-lg shadow-secondary/20">Masuk Portal</Button>
            </Link>
          </nav>

          {/* Mobile Navigation */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] bg-primary text-white border-primary">
                <SheetHeader className="sr-only">
                  <SheetTitle>Menu</SheetTitle>
                  <SheetDescription>Akses cepat layanan desa</SheetDescription>
                </SheetHeader>
                <div className="flex flex-col gap-8 mt-12">
                  <Logo />
                  <div className="flex flex-col gap-4">
                    {navLinks.map((link) => (
                      <Link 
                        key={link.href} 
                        href={link.href} 
                        className="text-lg font-black uppercase tracking-widest text-white/80 hover:text-secondary border-b border-white/5 pb-2"
                      >
                        {link.label}
                      </Link>
                    ))}
                    <Link href="/login" className="text-lg font-black uppercase tracking-widest text-white/80 hover:text-secondary border-b border-white/5 pb-2">
                      Login Admin
                    </Link>
                  </div>
                  <Link href="/dashboard">
                    <Button className="w-full bg-secondary text-primary-foreground font-black h-14 rounded-2xl">
                      MASUK PORTAL
                    </Button>
                  </Link>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative h-[70vh] md:h-[80vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
           <img 
            src={heroImageUrl}
            alt="Desa Sidaurip"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-br from-primary/80 via-primary/50 to-accent/40" />
        <div className="container mx-auto px-4 relative z-10 text-white">
          <div className="max-w-3xl space-y-4 md:space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/20 border border-secondary/30 text-secondary backdrop-blur-sm">
              <Zap className="h-4 w-4" />
              <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest">Transformasi Digital Desa</span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tight leading-tight uppercase font-display">
              Selamat Datang di Portal Resmi <span className="text-secondary italic">Sidaurip</span>
            </h1>
            <p className="text-sm md:text-xl text-white/80 max-w-2xl font-medium leading-relaxed">
              Mewujudkan tata kelola pemerintahan desa yang modern, transparan, dan melayani sepenuh hati melalui inovasi digital.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link href="/dashboard">
                <Button size="lg" className="bg-secondary hover:bg-yellow-600 text-primary-foreground font-black h-12 md:h-14 px-8 md:px-10 text-base md:text-lg rounded-2xl transition-all active:scale-95 shadow-xl shadow-secondary/30">
                  Mulai Layanan Mandiri
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/profil-desa">
                <Button size="lg" variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20 font-bold h-12 md:h-14 px-8 md:px-10 text-base md:text-lg rounded-2xl backdrop-blur-sm transition-all">
                  Kenali Desa Kami
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* VISI MISI SECTION */}
      <section className="py-16 md:py-24 bg-background border-y border-slate-200">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-6 md:space-y-8">
            <div className="w-12 h-1 bg-secondary rounded-full mx-auto" />
            <h2 className="text-[10px] md:text-sm font-black text-primary uppercase tracking-[0.3em]">Komitmen Kami</h2>
            <blockquote className="text-2xl md:text-4xl font-display italic text-slate-800 leading-relaxed font-semibold">
              "Desa Sidaurip berkomitmen memberikan pelayanan publik berbasis digital yang cepat, transparan, dan akuntabel untuk seluruh masyarakat."
            </blockquote>
            <p className="text-slate-500 font-bold tracking-widest uppercase text-[10px] md:text-xs">Pemerintah Desa Sidaurip</p>
          </div>
        </div>
      </section>

      {/* STATISTICS SECTION */}
      <section className="py-16 md:py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-12">
            {[
              { label: 'Total Penduduk', value: '10.800+', icon: Users, color: 'text-emerald-600' },
              { label: 'Surat Terproses', value: '1.200+', icon: FileCheck, color: 'text-secondary' },
              { label: 'Transparansi', value: '100%', icon: ShieldCheck, color: 'text-accent' },
              { label: 'Kecepatan', value: '24/7', icon: Zap, color: 'text-amber-500' },
            ].map((stat, i) => (
              <div key={i} className="text-center space-y-2 md:space-y-4 group">
                <div className={`mx-auto w-12 h-12 md:w-16 md:h-16 rounded-2xl md:rounded-3xl bg-slate-50 flex items-center justify-center transition-all group-hover:bg-primary group-hover:text-white`}>
                  <stat.icon className={`h-6 w-6 md:h-8 md:w-8 ${stat.color} group-hover:text-white transition-colors`} />
                </div>
                <div className="space-y-0.5 md:space-y-1">
                  <h3 className="text-xl md:text-4xl font-black text-slate-900 tracking-tighter">{stat.value}</h3>
                  <p className="text-[8px] md:text-sm font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-primary text-white/70 py-16 mt-auto border-t border-white/5">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-16">
            <div className="space-y-6">
              <Logo />
              <div className="space-y-2">
                <p className="text-white font-black text-lg">Pemerintah Desa Sidaurip</p>
                <p className="text-sm">Kecamatan Gandrungmangu, Kabupaten Cilacap</p>
              </div>
            </div>

            <div className="space-y-6">
              <h4 className="text-white font-bold uppercase tracking-widest text-xs">Kontak Resmi</h4>
              <ul className="space-y-4 text-sm">
                <li className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-secondary shrink-0" />
                  <span>Jl. Perintis No.144, Sidaurip, Kec. Sidaurip, Cilacap</span>
                </li>
                <li className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-secondary shrink-0" />
                  <span>0851-3221-7144</span>
                </li>
                <li className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-secondary shrink-0" />
                  <span>sidaurip@gmail.id</span>
                </li>
              </ul>
            </div>

            <div className="space-y-6">
              <h4 className="text-white font-bold uppercase tracking-widest text-xs">Jam Pelayanan</h4>
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <p className="text-white font-bold text-sm">Senin - Jumat</p>
                  <p className="text-xs mt-1 opacity-80">08.00 - 16.00 WIB</p>
                </div>
              </div>
            </div>

            <div className="space-y-6 text-center md:text-left">
              <h4 className="text-white font-bold uppercase tracking-widest text-xs">Media Sosial</h4>
              <div className="flex justify-center md:justify-start gap-4">
                <Link href="#" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-secondary hover:text-primary transition-all">
                  <Facebook className="h-5 w-5" />
                </Link>
                <Link href="#" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-secondary hover:text-primary transition-all">
                  <Instagram className="h-5 w-5" />
                </Link>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-white/5 text-center text-[10px] font-bold uppercase tracking-widest">
            <p>© 2026 Pemerintah Desa Sidaurip</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
