'use client';

import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MoreHorizontal,
  Search,
  UserPlus,
  Edit,
  Trash2,
  Users,
  FileUp,
  Loader2,
  AlertCircle,
  ShieldAlert,
  Database,
} from 'lucide-react';
import { Resident } from '@/lib/types';
import { useFirestore } from '@/firebase';
import { 
  collection, 
  query, 
  deleteDoc, 
  doc, 
  getDocs, 
  where, 
  limit, 
  getCountFromServer,
  getDoc,
  writeBatch
} from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { ResidentForm } from './resident-form';
import { ImportResidentDialog } from './import-resident-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { seedResidents } from '@/lib/residents';

export function ResidentList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [editingResident, setEditingResident] = useState<Resident | null>(null);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  
  const [residents, setResidents] = useState<Resident[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  
  const firestore = useFirestore();
  const { toast } = useToast();

  const fetchTotalCount = async () => {
    if (!firestore) return;
    try {
      const coll = collection(firestore, 'residents');
      const snapshot = await getCountFromServer(coll);
      setTotalCount(snapshot.data().count);
    } catch (error) {
      console.error("Error fetching count:", error);
    }
  };

  useEffect(() => {
    fetchTotalCount();
  }, [firestore]);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!firestore) return;
    
    const term = searchTerm.trim();
    if (!term) return;

    setIsSearching(true);
    setHasSearched(true);
    
    try {
      const residentsCol = collection(firestore, 'residents');
      
      if (/^\d{16}$/.test(term)) {
        const docRef = doc(firestore, 'residents', term);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setResidents([{ id: docSnap.id, ...docSnap.data() } as Resident]);
          setIsSearching(false);
          return;
        }
        
        const qNik = query(residentsCol, where('nik', '==', term), limit(1));
        const snapNik = await getDocs(qNik);
        if (!snapNik.empty) {
          const results: Resident[] = [];
          snapNik.forEach(d => results.push({ id: d.id, ...d.data() } as Resident));
          setResidents(results);
          setIsSearching(false);
          return;
        }
      }

      const nameTerm = term.toUpperCase();
      const qName = query(
        residentsCol, 
        where('fullName', '>=', nameTerm), 
        where('fullName', '<=', nameTerm + '\uf8ff'),
        limit(20)
      );

      const querySnapshot = await getDocs(qName);
      const results: Resident[] = [];
      querySnapshot.forEach((doc) => {
        results.push({ id: doc.id, ...doc.data() } as Resident);
      });
      
      setResidents(results);
      
      if (results.length === 0) {
        toast({
          title: "Tidak Ditemukan",
          description: `Data "${term}" tidak ada di database.`,
        });
      }
    } catch (error: any) {
      console.error("Search error:", error);
      toast({
        variant: "destructive",
        title: "Gagal Mencari",
        description: "Terjadi kesalahan kuota atau jaringan."
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!firestore) return;
    try {
      await deleteDoc(doc(firestore, 'residents', id));
      setResidents(residents.filter(r => r.id !== id));
      if (totalCount !== null) setTotalCount(totalCount - 1);
      toast({ title: "Data Dihapus", description: "Data warga telah dihapus." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Gagal Menghapus", description: error.message });
    }
  };

  const handleDeleteAll = async () => {
    if (!firestore) return;
    setIsDeletingAll(true);
    
    try {
      const residentsCol = collection(firestore, 'residents');
      const snapshot = await getDocs(residentsCol);
      
      if (snapshot.empty) {
        toast({ title: "Database Kosong", description: "Tidak ada data yang bisa dihapus." });
        setIsDeletingAll(false);
        return;
      }

      let count = 0;
      const chunks = [];
      const allDocs = snapshot.docs;
      for (let i = 0; i < allDocs.length; i += 500) chunks.push(allDocs.slice(i, i + 500));

      for (const chunk of chunks) {
        const batch = writeBatch(firestore);
        chunk.forEach((d) => {
          batch.delete(d.ref);
          count++;
        });
        await batch.commit();
      }

      setResidents([]);
      setTotalCount(0);
      toast({ title: "Berhasil", description: `${count} data penduduk telah dihapus permanen.` });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Gagal Menghapus Semua", description: error.message });
    } finally {
      setIsDeletingAll(false);
    }
  };

  const handleSeedData = async () => {
    if (!firestore) return;
    setIsSeeding(true);
    try {
      await seedResidents(firestore);
      await fetchTotalCount();
      toast({
        title: "Data Testing Berhasil",
        description: "Beberapa data contoh telah ditambahkan ke database.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Gagal Menambah Data",
        description: error.message,
      });
    } finally {
      setIsSeeding(false);
    }
  };

  const handleEdit = (resident: Resident) => {
    setEditingResident(resident);
    setIsFormOpen(true);
  };

  const handleAdd = () => {
    setEditingResident(null);
    setIsFormOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Statistik Database
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalCount === null ? <Skeleton className="h-8 w-16" /> : totalCount.toLocaleString('id-ID')}
            </div>
            <p className="text-xs text-muted-foreground italic">Total dokumen penduduk</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-4">
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800 flex items-start gap-2">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p>Sistem dioptimalkan untuk mencari berdasarkan <strong>NIK 16 digit</strong> atau <strong>Nama Depan</strong>. Database tidak dimuat semua sekaligus demi kecepatan dan penghematan kuota.</p>
        </div>

        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Masukkan NIK atau Nama..."
              className="pl-10 h-11"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={isSearching}
            />
          </div>
          <Button type="submit" size="lg" className="px-8" disabled={isSearching}>
            {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
            Cari
          </Button>
        </form>
        
        <div className="flex flex-wrap justify-between gap-4">
          <div className="flex gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" disabled={isDeletingAll || totalCount === 0}>
                  {isDeletingAll ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                  Hapus Semua Data
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="border-red-200">
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                    <ShieldAlert className="h-5 w-5" />
                    PERINGATAN KERAS!
                  </AlertDialogTitle>
                  <AlertDialogDescription asChild>
                    <div className="space-y-4">
                      <p className="font-bold text-red-900">Tindakan ini akan menghapus SELURUH ({totalCount ?? 0}) data penduduk dari server secara permanen.</p>
                      <p>Pastikan Anda sudah memiliki cadangan data (backup) sebelum melanjutkan. Tindakan ini tidak dapat dibatalkan.</p>
                    </div>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Batal</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteAll} className="bg-red-600 text-white hover:bg-red-700">Ya, Hapus Semua Selamanya</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            
            <Button variant="outline" size="sm" onClick={handleSeedData} disabled={isSeeding}>
              {isSeeding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Database className="mr-2 h-4 w-4" />}
              Generate Data Testing
            </Button>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsImportOpen(true)}>
              <FileUp className="mr-2 h-4 w-4" />
              Impor Excel
            </Button>
            <Button variant="secondary" size="sm" onClick={handleAdd}>
              <UserPlus className="mr-2 h-4 w-4" />
              Tambah Manual
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-white overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>NIK</TableHead>
                <TableHead>KK</TableHead>
                <TableHead>Nama Lengkap</TableHead>
                <TableHead>Tgl Lahir</TableHead>
                <TableHead>JK</TableHead>
                <TableHead>Agama</TableHead>
                <TableHead>SHDK</TableHead>
                <TableHead>Alamat</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isSearching ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}><TableCell colSpan={9}><Skeleton className="h-12 w-full" /></TableCell></TableRow>
                ))
              ) : residents.length > 0 ? (
                residents.map((resident) => (
                  <TableRow key={resident.id} className="hover:bg-muted/30">
                    <TableCell className="font-mono text-[10px]">{resident.nik}</TableCell>
                    <TableCell className="font-mono text-[10px]">{resident.noKk}</TableCell>
                    <TableCell className="font-medium uppercase text-[10px]">{resident.fullName}</TableCell>
                    <TableCell className="text-[10px] whitespace-nowrap">{resident.dateOfBirth}</TableCell>
                    <TableCell className="text-[10px]">{resident.gender || '-'}</TableCell>
                    <TableCell className="text-[10px]">{resident.religion || '-'}</TableCell>
                    <TableCell className="text-[10px] font-semibold">{resident.relationshipToHeadOfFamily || '-'}</TableCell>
                    <TableCell className="text-[10px] min-w-[300px]">
                      <p className="uppercase leading-tight">
                        {`${resident.address}, RT ${resident.rt} RW ${resident.rw}, ${resident.kelurahan}, KEC. GANDRUNGMANGU, KAB. CILACAP`}
                      </p>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(resident)}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <div className="flex w-full items-center px-2 py-1.5 text-sm text-red-600 hover:bg-red-50 cursor-default">
                                <Trash2 className="mr-2 h-4 w-4" /> Hapus
                              </div>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Hapus Data?</AlertDialogTitle>
                                <AlertDialogDescription>Data {resident.fullName} akan dihapus permanen.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(resident.id)} className="bg-red-600 text-white">Ya, Hapus</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={9} className="h-48 text-center text-muted-foreground">
                    {hasSearched ? "Data tidak ditemukan." : "Gunakan pencarian untuk menampilkan data."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <ResidentForm open={isFormOpen} onOpenChange={setIsFormOpen} resident={editingResident} />
      <ImportResidentDialog open={isImportOpen} onOpenChange={setIsImportOpen} />
    </div>
  );
}
