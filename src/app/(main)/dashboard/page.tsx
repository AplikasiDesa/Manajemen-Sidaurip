'use client';

import { useEffect, useState } from 'react';
import { DashboardStats } from './_components/dashboard-stats';
import { DocumentSummarizer } from './_components/document-summarizer';
import { Calendar, Bell, ChevronRight, Activity, Zap, Info, FileText, Newspaper, MessageSquareWarning, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';

export default function DashboardPage() {
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Selamat Pagi');
    else if (hour < 17) setGreeting('Selamat Siang');
    else setGreeting('Selamat Malam');
  }, []);

  return (
    <div className="space-y-8 md:space-y-10 pb-16">
      {/* Header Premium Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-accent font-black text-[10px] uppercase tracking-[0.3em]">
            <Activity className="h-3 w-3" />
            Sistem Informasi Digital
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900">
            {greeting}, Warga 👋
          </h1>
          <p className="text-sm text-slate-500 font-medium">Panel akses layanan mandiri Desa Sidaurip.</p>
        </div>
        
        <div className="hidden md:flex items-center gap-3 bg-white p-2 rounded-2xl border shadow-sm">
          <div className="p-3 bg-slate-100 rounded-xl">
            <Zap className="h-5 w-5 text-slate-600" />
          </div>
          <div className="pr-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Status Sistem</p>
            <p className="text-sm font-black text-emerald-600">AKTIF & STABIL</p>
          </div>
        </div>
      </div>

      {/* QUICK ACCESS CARDS - MOBILE ONLY */}
      <section className="grid grid-cols-1 gap-4 md:hidden">
        <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Akses Cepat Layanan</h2>
        
        <Link href="/layanan-surat">
          <Card className="rounded-3xl border-none shadow-sm bg-white overflow-hidden active:scale-95 transition-all">
            <CardContent className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-900 uppercase">Ajukan Surat</p>
                  <p className="text-[10px] text-slate-400 font-bold">Layanan Mandiri Online</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-slate-300" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/BeritaDesa">
          <Card className="rounded-3xl border-none shadow-sm bg-white overflow-hidden active:scale-95 transition-all">
            <CardContent className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                  <Newspaper className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-900 uppercase">Berita Desa</p>
                  <p className="text-[10px] text-slate-400 font-bold">Update Kegiatan Terbaru</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-slate-300" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/pengaduan">
          <Card className="rounded-3xl border-none shadow-sm bg-white overflow-hidden active:scale-95 transition-all">
            <CardContent className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
                  <MessageSquareWarning className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-900 uppercase">Pengaduan</p>
                  <p className="text-[10px] text-slate-400 font-bold">Lapor & Masukan Warga</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-slate-300" />
            </CardContent>
          </Card>
        </Link>
      </section>

      <div className="grid gap-10 lg:grid-cols-12 items-start">
        {/* Main Content */}
        <div className="lg:col-span-8 space-y-10">
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-6 bg-accent rounded-full" />
              <h2 className="text-lg font-black uppercase tracking-widest text-slate-800">
                Statistik & Transparansi
              </h2>
            </div>
            <DashboardStats />
          </section>

          <section className="bg-white rounded-3xl border shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 md:p-10 transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 md:p-4 bg-primary text-white rounded-2xl shadow-lg shadow-primary/20">
                <Calendar className="h-5 w-5 md:h-6 md:w-6" />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-black text-slate-900">Ringkasan Dokumen AI</h2>
                <p className="text-xs md:text-sm text-slate-500 font-medium">Gunakan kecerdasan buatan untuk merangkum surat resmi.</p>
              </div>
            </div>
            <DocumentSummarizer />
          </section>
        </div>

        {/* Sidebar Info */}
        <div className="lg:col-span-4 space-y-8">
          <Card className="rounded-3xl border-none bg-primary text-white overflow-hidden shadow-xl">
            <CardContent className="p-6 md:p-8 space-y-8">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-lg flex items-center gap-3">
                  <Bell className="h-5 w-5 text-secondary" />
                  Info Publik
                </h3>
                <span className="text-[10px] font-black bg-secondary text-primary px-3 py-1 rounded-full uppercase">Update</span>
              </div>

              <div className="space-y-4">
                {[
                  { title: 'Layanan Mandiri', status: 'Online', color: 'bg-emerald-500' },
                  { title: 'Antrian Loket', status: 'Lancar', color: 'bg-blue-500' },
                  { title: 'Validasi NIK', status: 'Otomatis', color: 'bg-secondary' }
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all cursor-default">
                    <div className="flex flex-col gap-1">
                      <span className="font-bold text-sm text-slate-200">{item.title}</span>
                      <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${item.color} animate-pulse`} />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.status}</span>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-white/20" />
                  </div>
                ))}
              </div>

              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                <div className="flex items-center gap-3">
                  <Info className="h-5 w-5 text-secondary" />
                  <p className="text-sm font-black uppercase tracking-widest">Bantuan</p>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Jika mengalami kesulitan dalam pengajuan surat, silakan hubungi tim teknis kami melalui WhatsApp.
                </p>
                <button className="w-full py-4 bg-secondary text-primary rounded-xl text-xs font-black uppercase tracking-[0.2em] hover:bg-yellow-600 transition-all active:scale-95">
                  Hubungi Admin
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
