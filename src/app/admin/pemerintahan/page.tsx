'use client';

import React, { useState, useMemo } from 'react';
import { PageHeader } from '@/components/page-header';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, UserPlus, FileUp, UserCircle2, ShieldCheck, Landmark } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { OfficialForm } from './_components/official-form';
import { ImportOfficialDialog } from './_components/import-official-dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type Official = {
  id: string;
  name: string;
  position: string;
  category: 'perangkat' | 'bpd' | 'rtrw';
};

export default function AdminPemerintahanPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'perangkat' | 'bpd' | 'rtrw'>('perangkat');
  const [editingOfficial, setEditingOfficial] = useState<Official | null>(null);
  
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();

  const officialsQuery = useMemoFirebase(() => {
    if (!firestore || isUserLoading || !user || user.email !== 'sidaurip@gmail.id') {
      return null;
    }
    return query(collection(firestore, 'officials'), orderBy('name', 'asc'));
  }, [firestore, user, isUserLoading]);

  const { data: officials, isLoading } = useCollection<Official>(officialsQuery);

  const processedData = useMemo(() => {
    if (!officials) return { perangkat: [], bpd: [], rtrw: [] };

    // Ranking Logic for Admin Table
    const getPerangkatRank = (pos: string) => {
      const p = pos.toLowerCase();
      if (p.includes('kepala desa')) return 1;
      if (p.includes('sekretaris')) return 2;
      if (p.includes('kasi')) return 3;
      if (p.includes('kaur')) return 4;
      if (p.includes('kadus') || p.includes('kepala dusun')) return 5;
      return 6;
    };

    const perangkat = [...officials]
      .filter(o => o.category === 'perangkat')
      .sort((a, b) => getPerangkatRank(a.position) - getPerangkatRank(b.position));

    const bpd = [...officials]
      .filter(o => o.category === 'bpd')
      .sort((a, b) => {
        if (a.position.toLowerCase().includes('ketua') && !b.position.toLowerCase().includes('ketua')) return -1;
        if (!a.position.toLowerCase().includes('ketua') && b.position.toLowerCase().includes('ketua')) return 1;
        return a.name.localeCompare(b.name);
      });

    const rtrw = [...officials]
      .filter(o => o.category === 'rtrw')
      .sort((a, b) => {
        const rwA = a.position.match(/RW\s?(\d+)/i)?.[1] || '0';
        const rwB = b.position.match(/RW\s?(\d+)/i)?.[1] || '0';
        if (rwA !== rwB) return parseInt(rwA) - parseInt(rwB);

        const isRwHeadA = a.position.toLowerCase().includes('ketua rw');
        const isRwHeadB = b.position.toLowerCase().includes('ketua rw');
        if (isRwHeadA && !isRwHeadB) return -1;
        if (!isRwHeadA && isRwHeadB) return 1;

        const rtA = a.position.match(/RT\s?(\d+)/i)?.[1] || '0';
        const rtB = b.position.match(/RT\s?(\d+)/i)?.[1] || '0';
        return parseInt(rtA) - parseInt(rtB);
      });

    return { perangkat, bpd, rtrw };
  }, [officials]);

  const handleDelete = async (id: string) => {
    if (!firestore) return;
    try {
      await deleteDoc(doc(firestore, 'officials', id));
      toast({ title: "Data Dihapus" });
    } catch (e: any) {
      toast({ title: "Gagal Menghapus", variant: "destructive" });
    }
  };

  if (isUserLoading || !user) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-1/3" />
        <Skeleton className="h-64 w-full rounded-3xl" />
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Pemerintahan Desa"
        description="Manajemen hierarki pengurus desa sesuai standar struktur organisasi."
      />

      <Tabs defaultValue="perangkat" className="w-full space-y-8" onValueChange={(v) => setActiveTab(v as any)}>
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <TabsList className="bg-slate-100 p-1 rounded-2xl h-auto flex-wrap justify-start shadow-inner">
            <TabsTrigger value="perangkat" className="rounded-xl px-6 py-3 font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm">
               <UserCircle2 className="mr-2 h-4 w-4" /> Perangkat Desa
            </TabsTrigger>
            <TabsTrigger value="bpd" className="rounded-xl px-6 py-3 font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm">
               <ShieldCheck className="mr-2 h-4 w-4" /> BPD Desa
            </TabsTrigger>
            <TabsTrigger value="rtrw" className="rounded-xl px-6 py-3 font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm">
               <Landmark className="mr-2 h-4 w-4" /> RT / RW
            </TabsTrigger>
          </TabsList>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsImportOpen(true)} className="rounded-xl font-bold h-11 px-6">
              <FileUp className="mr-2 h-4 w-4" />
              Impor {activeTab.toUpperCase()}
            </Button>
            <Button size="sm" onClick={() => { setEditingOfficial(null); setIsFormOpen(true); }} className="bg-primary hover:bg-slate-800 rounded-xl font-bold h-11 px-6">
              <UserPlus className="mr-2 h-4 w-4" />
              Tambah Manual
            </Button>
          </div>
        </div>

        <TabsContent value="perangkat" className="space-y-4 outline-none">
          <OfficialTable 
            data={processedData.perangkat} 
            isLoading={isLoading} 
            onEdit={(o) => { setEditingOfficial(o); setIsFormOpen(true); }} 
            onDelete={handleDelete}
          />
        </TabsContent>

        <TabsContent value="bpd" className="space-y-4 outline-none">
          <OfficialTable 
            data={processedData.bpd} 
            isLoading={isLoading} 
            onEdit={(o) => { setEditingOfficial(o); setIsFormOpen(true); }} 
            onDelete={handleDelete}
          />
        </TabsContent>

        <TabsContent value="rtrw" className="space-y-4 outline-none">
          <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl text-[10px] font-bold text-amber-800 uppercase tracking-widest mb-6">
            Sistem mengurutkan berdasarkan nomor RW lalu nomor RT di dalamnya.
          </div>
          <OfficialTable 
            data={processedData.rtrw} 
            isLoading={isLoading} 
            onEdit={(o) => { setEditingOfficial(o); setIsFormOpen(true); }} 
            onDelete={handleDelete}
            isRtrw
          />
        </TabsContent>
      </Tabs>

      <OfficialForm 
        open={isFormOpen} 
        onOpenChange={setIsFormOpen} 
        official={editingOfficial} 
      />
      <ImportOfficialDialog 
        open={isImportOpen} 
        onOpenChange={setIsImportOpen} 
        defaultCategory={activeTab}
      />
    </>
  );
}

function OfficialTable({ 
  data, 
  isLoading, 
  onEdit, 
  onDelete,
  isRtrw = false
}: { 
  data: Official[], 
  isLoading: boolean, 
  onEdit: (o: Official) => void, 
  onDelete: (id: string) => void,
  isRtrw?: boolean
}) {
  return (
    <div className="rounded-[2rem] border bg-white overflow-hidden shadow-sm">
      <Table>
        <TableHeader className="bg-slate-50/50">
          <TableRow>
            <TableHead className="pl-8 h-14 font-black uppercase text-[10px] tracking-widest text-slate-400">Nama Lengkap</TableHead>
            <TableHead className="h-14 font-black uppercase text-[10px] tracking-widest text-slate-400">Jabatan / Posisi</TableHead>
            <TableHead className="text-right pr-8 h-14 font-black uppercase text-[10px] tracking-widest text-slate-400">Kelola</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}><TableCell colSpan={3} className="px-8 py-4"><Skeleton className="h-10 w-full" /></TableCell></TableRow>
            ))
          ) : data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} className="h-32 text-center text-slate-400 font-medium italic">Data belum tersedia.</TableCell>
            </TableRow>
          ) : (
            data.map((official, idx) => {
              // Add divider if RW changes in RT/RW view
              let showDivider = false;
              if (isRtrw && idx > 0) {
                const prevRw = data[idx - 1].position.match(/RW\s?(\d+)/i)?.[1];
                const currRw = official.position.match(/RW\s?(\d+)/i)?.[1];
                if (prevRw !== currRw) showDivider = true;
              }

              return (
                <React.Fragment key={official.id}>
                  {showDivider && (
                    <TableRow className="bg-slate-50 hover:bg-slate-50">
                      <TableCell colSpan={3} className="h-10 py-0 text-center">
                        <div className="flex items-center gap-2">
                           <div className="h-px flex-1 bg-slate-200" />
                           <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Pemisah Wilayah RW</span>
                           <div className="h-px flex-1 bg-slate-200" />
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                  <TableRow className="hover:bg-slate-50/80 transition-colors group">
                    <TableCell className="font-black text-sm uppercase pl-8 py-5 text-slate-700">
                      {official.name}
                    </TableCell>
                    <TableCell>
                      <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-tighter ${
                        official.position.toLowerCase().includes('ketua') 
                        ? 'bg-emerald-100 text-emerald-700' 
                        : 'bg-slate-100 text-slate-500'
                      }`}>
                        {official.position}
                      </span>
                    </TableCell>
                    <TableCell className="text-right pr-8">
                      <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl border-slate-200 hover:text-blue-600" onClick={() => onEdit(official)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-slate-400 hover:text-red-600" onClick={() => onDelete(official.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}