'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, User, ChevronRight, Share2, Tag, Search, TrendingUp } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { News } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { optimizeCloudinaryUrl } from '@/lib/utils';

export default function PublicBeritaListPage() {
  const firestore = useFirestore();

  const newsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'news'), orderBy('updatedAt', 'desc'));
  }, [firestore]);

  const { data: allNews, isLoading } = useCollection<News>(newsQuery);

  const { headline, trending, feed } = useMemo(() => {
    if (!allNews) return { headline: null, trending: [], feed: [] };
    
    const sorted = [...allNews];
    const headlines = sorted.filter(n => n.isHeadline);
    const mainHeadline = headlines.length > 0 ? headlines[0] : sorted[0];
    
    const others = sorted.filter(n => n.id !== mainHeadline.id);
    const topPicks = others.slice(0, 5);
    const remainingFeed = others.slice(5);

    return { headline: mainHeadline, trending: topPicks, feed: remainingFeed };
  }, [allNews]);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* HEADER */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur-sm shadow-sm font-sans">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <Logo />
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input placeholder="Cari berita desa..." className="pl-10 h-10 bg-slate-100 border-none rounded-full" />
            </div>
          </div>
          <Link href="/">
            <Button variant="ghost" className="font-bold gap-2 text-primary hover:bg-primary/10">
              <ArrowLeft className="h-4 w-4" />
              Kembali
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-10">
        
        {/* TOP PICKS */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)
          ) : trending.map((item) => (
            <Link key={item.id} href={`/BeritaDesa/${item.id}`} className="group">
              <div className="flex flex-col gap-2">
                <div className="aspect-video rounded-xl overflow-hidden shadow-sm">
                  <img src={optimizeCloudinaryUrl(item.imageUrl)} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                </div>
                <h4 className="text-[10px] font-black leading-tight line-clamp-2 uppercase tracking-tight group-hover:text-primary transition-colors font-sans">
                  {item.title}
                </h4>
              </div>
            </Link>
          ))}
        </div>

        {/* MAIN ROW */}
        <div className="grid lg:grid-cols-12 gap-8">
          
          <div className="lg:col-span-8">
            {isLoading ? (
               <Skeleton className="h-[500px] rounded-3xl" />
            ) : headline && (
               <Link href={`/BeritaDesa/${headline.id}`} className="group relative block rounded-[2.5rem] overflow-hidden shadow-2xl h-[500px] border-4 border-white">
                  <img src={optimizeCloudinaryUrl(headline.imageUrl)} alt={headline.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 p-8 md:p-12 space-y-6 w-full">
                    <Badge className="bg-secondary text-primary-foreground text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full border-none">
                      Berita Utama
                    </Badge>
                    <h2 className="text-3xl md:text-5xl font-semibold text-white leading-[1.1] tracking-tighter uppercase font-display">
                      {headline.title}
                    </h2>
                    <div className="flex items-center gap-6 text-[10px] font-bold text-white/70 uppercase tracking-widest font-sans">
                       <span className="flex items-center gap-2"><Calendar className="h-3 w-3 text-secondary" /> {headline.date}</span>
                       <span className="flex items-center gap-2"><User className="h-3 w-3 text-secondary" /> {headline.author}</span>
                    </div>
                  </div>
               </Link>
            )}
          </div>

          <div className="lg:col-span-4 space-y-8">
            <Card className="rounded-[2rem] border-none bg-primary text-white overflow-hidden shadow-xl">
               <CardContent className="p-8 space-y-6">
                  <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <h3 className="text-lg font-semibold uppercase font-display italic">Info <span className="text-secondary">Penting</span></h3>
                    <TrendingUp className="h-5 w-5 text-secondary" />
                  </div>
                  <div className="space-y-4">
                    {trending.slice(2, 5).map((item, i) => (
                       <Link key={item.id} href={`/BeritaDesa/${item.id}`} className="flex gap-4 group">
                          <span className="text-2xl font-black text-white/20 italic group-hover:text-secondary">0{i+1}</span>
                          <div className="space-y-1">
                             <h4 className="text-[11px] font-bold uppercase leading-tight line-clamp-2 font-sans group-hover:text-secondary">
                                {item.title}
                             </h4>
                             <p className="text-[9px] font-bold text-white/40 uppercase font-sans">{item.date}</p>
                          </div>
                       </Link>
                    ))}
                  </div>
               </CardContent>
            </Card>

            <div className="space-y-4 font-sans">
               <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] pl-2 border-l-4 border-secondary">Topik Populer</h3>
               <div className="flex flex-wrap gap-2">
                  {['Pertanian', 'Pembangunan', 'Cilacap', 'Desa Digital', 'Gotong Royong'].map(tag => (
                    <Badge key={tag} variant="outline" className="rounded-xl bg-white text-[9px] font-black py-1.5 px-4 text-slate-600 border-slate-200 uppercase">
                      # {tag}
                    </Badge>
                  ))}
               </div>
            </div>
          </div>
        </div>

        {/* FEED */}
        <div className="space-y-8 pt-10 border-t border-slate-200">
           <h2 className="text-2xl font-semibold text-slate-900 uppercase tracking-tighter font-display">Berita <span className="text-primary italic">Terbaru</span></h2>

           <div className="grid lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8 space-y-6">
                {isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-3xl" />)
                ) : feed.map((item) => (
                    <Link key={item.id} href={`/BeritaDesa/${item.id}`} className="flex flex-col md:flex-row gap-6 group bg-white p-4 rounded-[2rem] border border-slate-100 hover:shadow-lg transition-all">
                        <div className="w-full md:w-[260px] aspect-video rounded-2xl overflow-hidden shrink-0">
                           <img src={optimizeCloudinaryUrl(item.imageUrl)} alt={item.title} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        </div>
                        <div className="flex-1 space-y-3 py-2 font-sans">
                           <p className="text-[9px] font-black text-primary uppercase tracking-widest">{item.date}</p>
                           <h3 className="text-xl font-bold text-slate-900 leading-tight uppercase group-hover:text-primary transition-colors line-clamp-2">
                            {item.title}
                           </h3>
                           <p className="text-sm text-slate-500 line-clamp-2 font-medium">
                              {item.subtitle}
                           </p>
                        </div>
                    </Link>
                ))}
              </div>

              <div className="lg:col-span-4">
                <Card className="rounded-[2rem] border-none overflow-hidden bg-accent text-white shadow-xl p-8 space-y-6 text-center">
                   <Tag className="h-10 w-10 mx-auto text-white/30" />
                   <div className="space-y-2">
                      <h3 className="text-xl font-semibold font-display uppercase leading-tight">Ikuti Akun Resmi <span className="italic">Sidaurip</span></h3>
                      <p className="text-xs text-white/70 font-sans">Update pembangunan desa real-time.</p>
                   </div>
                   <Button className="bg-secondary text-primary font-black uppercase tracking-widest rounded-xl hover:bg-white w-full h-12">
                     Hubungi Admin
                   </Button>
                </Card>
              </div>
           </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="bg-primary text-white/50 py-16 mt-auto border-t border-white/5">
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
