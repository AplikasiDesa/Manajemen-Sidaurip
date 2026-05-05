'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Share2 } from 'lucide-react';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { News } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { optimizeCloudinaryUrl } from '@/lib/utils';

export default function PublicBeritaDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const firestore = useFirestore();

  const newsRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'news', id);
  }, [firestore, id]);

  const { data: news, isLoading } = useDoc<News>(newsRef);

  if (isLoading) return <div className="container mx-auto p-8"><Skeleton className="h-screen w-full rounded-3xl" /></div>;
  if (!news) return <div className="p-24 text-center">Berita tidak ditemukan.</div>;

  return (
    <div className="flex flex-col min-h-screen bg-background font-sans">
      {/* HEADER */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <Logo />
          <Button variant="ghost" onClick={() => router.back()} className="font-bold gap-2 text-primary hover:bg-primary/10">
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </Button>
        </div>
      </header>

      <main className="flex-1">
        <article className="container mx-auto px-4 max-w-4xl py-12 md:py-20">
          
          {/* HEADER BERITA */}
          <div className="text-center space-y-6 mb-12">
            <h1 className="text-3xl md:text-5xl font-semibold text-primary leading-tight tracking-tight uppercase font-display">
              {news.title}
            </h1>
            
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider">
                <span className="text-slate-900">{news.author}</span>
                <span className="text-slate-300">-</span>
                <span className="text-secondary">Tim Media Desa</span>
              </div>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">
                {news.date}
              </p>
            </div>
            
            {news.subtitle && (
              <p className="text-xl text-slate-500 italic border-y border-slate-200 py-6 max-w-2xl mx-auto font-display">
                "{news.subtitle}"
              </p>
            )}
          </div>

          {/* GAMBAR UTAMA */}
          <figure className="mb-12 space-y-3">
             <div className="rounded-[2.5rem] overflow-hidden shadow-2xl border-8 border-white">
                <img 
                  src={optimizeCloudinaryUrl(news.imageUrl)} 
                  alt={news.title} 
                  className="w-full h-auto object-cover max-h-[600px]"
                />
             </div>
             <figcaption className="text-center text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] px-4">
                Kegiatan Pemerintah Desa Sidaurip.
             </figcaption>
          </figure>

          {/* ISI BERITA */}
          <div className="prose prose-slate max-w-none">
             <p className="text-lg leading-relaxed text-slate-800 whitespace-pre-wrap font-sans">
                <span className="font-black text-primary uppercase mr-2">Sidaurip —</span>
                {news.content}
             </p>
          </div>

          {/* FOOTER ARTIKEL */}
          <footer className="mt-16 pt-8 border-t border-slate-200 flex items-center justify-between">
            <Button variant="outline" size="sm" className="rounded-xl gap-2 font-bold border-primary text-primary">
              <Share2 className="h-4 w-4" />
              Bagikan
            </Button>
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
              Redaksi Sidaurip Digital
            </p>
          </footer>

        </article>
      </main>

      {/* FOOTER LAYOUT */}
      <footer className="bg-primary text-white/50 py-16 border-t border-white/5">
        <div className="container mx-auto px-4 text-center">
          <Logo />
          <p className="mt-8 text-[10px] font-bold uppercase tracking-widest">
            © 2026 Pemerintah Desa Sidaurip • Website Resmi Pemerintahan Desa
          </p>
        </div>
      </footer>
    </div>
  );
}
