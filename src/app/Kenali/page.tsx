
'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { ArrowLeft, UserCircle2, ShieldCheck, Landmark, User } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Official } from '@/lib/types';
import { optimizeCloudinaryUrl } from '@/lib/utils';

export default function KenaliKamiPage() {
  const firestore = useFirestore();

  const officialsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'officials'), orderBy('name', 'asc'));
  }, [firestore]);

  const { data: officials, isLoading } = useCollection<Official>(officialsQuery);

  const processedData = useMemo(() => {
    if (!officials) return { perangkat: [], bpd: [], rtrwGroups: [] };

    const getPerangkatRank = (pos: string) => {
      const p = pos.toLowerCase();
      if (p.includes('kepala desa')) return 1;
      if (p.includes('sekretaris')) return 2;
      if (p.includes('kasi')) return 3;
      if (p.includes('kaur')) return 4;
      if (p.includes('kadus') || p.includes('kepala dusun')) return 5;
      return 6;
    };

    const perangkat = officials
      .filter(o => o.category === 'perangkat')
      .sort((a, b) => getPerangkatRank(a.position) - getPerangkatRank(b.position));

    const bpd = officials
      .filter(o => o.category === 'bpd')
      .sort((a, b) => {
        if (a.position.toLowerCase().includes('ketua') && !b.position.toLowerCase().includes('ketua')) return -1;
        if (!a.position.toLowerCase().includes('ketua') && b.position.toLowerCase().includes('ketua')) return 1;
        return a.name.localeCompare(b.name);
      });

    const rtrwRaw = officials.filter(o => o.category === 'rtrw');
    const rwGroups: Record<string, Official[]> = {};

    rtrwRaw.forEach(item => {
      const rwMatch = item.position.match(/RW\s?(\d+)/i);
      const rwNum = rwMatch ? rwMatch[1].padStart(2, '0') : '99';
      if (!rwGroups[rwNum]) rwGroups[rwNum] = [];
      rwGroups[rwNum].push(item);
    });

    const sortedRwKeys = Object.keys(rwGroups).sort();
    const rtrwGroups = sortedRwKeys.map(key => {
      return {
        rwLabel: `Wilayah RW ${key}`,
        members: rwGroups[key].sort((a, b) => {
          if (a.position.toLowerCase().includes('ketua rw') && !b.position.toLowerCase().includes('ketua rw')) return -1;
          if (!a.position.toLowerCase().includes('ketua rw') && b.position.toLowerCase().includes('ketua rw')) return 1;
          const rtA = a.position.match(/RT\s?(\d+)/i)?.[1] || '0';
          const rtB = b.position.match(/RT\s?(\d+)/i)?.[1] || '0';
          return parseInt(rtA) - parseInt(rtB);
        })
      };
    });

    return { perangkat, bpd, rtrwGroups };
  }, [officials]);

  const categories = [
    { id: 'perangkat', label: 'Perangkat Desa', icon: UserCircle2 },
    { id: 'bpd', label: 'BPD Desa', icon: ShieldCheck },
    { id: 'rtrw', label: 'Ketua RT / RW', icon: Landmark },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md font-sans">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <Logo />
          <Link href="/">
            <Button variant="ghost" className="font-bold gap-2 text-primary hover:bg-primary/10">
              <ArrowLeft className="h-4 w-4" />
              Kembali
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 md:py-16">
        <div className="max-w-4xl mx-auto text-center mb-12 space-y-4">
           <h1 className="text-4xl md:text-5xl font-display font-semibold text-slate-900 uppercase tracking-tighter">
             Pemerintahan <span className="text-secondary italic">Desa</span>
           </h1>
           <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.3em] font-sans">Mengenal Struktur Organisasi Desa Sidaurip</p>
        </div>

        <Tabs defaultValue="perangkat" className="w-full">
          <div className="flex justify-center mb-16">
            <TabsList className="bg-slate-200/50 p-1.5 rounded-2xl h-auto flex flex-wrap justify-center border">
              {categories.map(cat => (
                <TabsTrigger 
                  key={cat.id} 
                  value={cat.id}
                  className="rounded-xl px-8 py-3 font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg transition-all"
                >
                  <cat.icon className="mr-2 h-4 w-4" />
                  {cat.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <TabsContent value="perangkat">
            {isLoading ? (
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-80 rounded-[2.5rem]" />)}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {processedData.perangkat.map(official => (
                  <OfficialCard key={official.id} official={official} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="bpd">
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-80 rounded-[2.5rem]" />)}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {processedData.bpd.map(official => (
                  <OfficialCard key={official.id} official={official} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="rtrw">
            {isLoading ? (
               <div className="space-y-12">
                  {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-64 w-full rounded-[2.5rem]" />)}
               </div>
            ) : (
              <div className="space-y-20">
                {processedData.rtrwGroups.map((group, i) => (
                  <div key={i} className="space-y-10">
                    <div className="flex items-center gap-6">
                       <div className="h-px flex-1 bg-slate-200" />
                       <h3 className="font-black text-[11px] uppercase tracking-[0.4em] text-slate-400 bg-white px-8 py-3 rounded-full border shadow-sm">
                         {group.rwLabel}
                       </h3>
                       <div className="h-px flex-1 bg-slate-200" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                      {group.members.map(official => (
                        <OfficialCard key={official.id} official={official} isSmall />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <footer className="bg-primary text-white/60 py-16 border-t border-white/5 mt-auto">
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

function OfficialCard({ official, isSmall = false }: { official: Official, isSmall?: boolean }) {
  return (
    <div className={`group relative bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 overflow-hidden flex flex-col ${isSmall ? 'p-6' : 'p-8'}`}>
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-[5rem] -mr-8 -mt-8 transition-all group-hover:bg-secondary/10" />
      
      {/* Profile Image Container */}
      <div className={`relative mx-auto mb-8 rounded-[2rem] overflow-hidden border-4 border-white shadow-xl ${isSmall ? 'w-24 h-24' : 'w-40 h-40'}`}>
        {official.imageUrl ? (
          <img 
            src={optimizeCloudinaryUrl(official.imageUrl)} 
            alt={official.name} 
            className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 scale-110 group-hover:scale-100"
          />
        ) : (
          <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-300">
             <User className={isSmall ? 'h-10 w-10' : 'h-16 w-16'} />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="space-y-4 text-center relative z-10 flex-1 flex flex-col justify-center">
        <div className="space-y-1">
          <h3 className={`${isSmall ? 'text-xs' : 'text-base'} font-black text-slate-900 uppercase leading-tight font-sans tracking-tight`}>
            {official.name}
          </h3>
          <div className={`w-8 h-1 bg-secondary mx-auto rounded-full transition-all duration-500 group-hover:w-20`} />
        </div>
        
        <p className={`${isSmall ? 'text-[9px]' : 'text-[11px]'} font-black text-primary/60 uppercase tracking-[0.2em] font-sans leading-relaxed`}>
          {official.position}
        </p>
      </div>

      {/* Card Footer Tag */}
      <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-center">
         <span className="text-[8px] font-black text-slate-300 uppercase tracking-[0.3em]">Otoritas Sidaurip</span>
      </div>
    </div>
  );
}
