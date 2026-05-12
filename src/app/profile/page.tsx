
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  User, 
  ArrowLeft, 
  Search, 
  Loader2, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Plus, 
  Upload, 
  Download,
  AlertTriangle,
  FileSpreadsheet
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import Link from "next/link"
import { useState, useRef } from "react"
import { useFirestore, useCollection, useMemoFirebase, useUser } from "@/firebase"
import { collection, doc, deleteDoc, setDoc, addDoc, writeBatch, getDocs } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import * as XLSX from "xlsx"

const CATEGORIES = [
  "Pemerintah Desa", 
  "BPD", 
  "RT/RW", 
  "Kader", 
  "KPM", 
  "Karang Taruna", 
  "Linmas", 
  "Pengurus BUMDes", 
  "Pengurus KDMP", 
  "Guru Ngaji", 
  "Guru TK & Paud"
];

export default function ProfilePage() {
  const db = useFirestore()
  const { user } = useUser()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Membaca data personel dari Firestore
  const personnelRef = useMemoFirebase(() => (db && user) ? collection(db, "personnel") : null, [db, user])
  const { data: officials, isLoading: isDataLoading } = useCollection(personnelRef)

  const [searchTerm, setSearchTerm] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState("Pemerintah Desa");

  // State Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteSingleConfirmOpen, setIsDeleteSingleConfirmOpen] = useState(false);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  
  const [newName, setNewName] = useState("");
  const [newJabatan, setNewJabatan] = useState("");
  const [editingOfficial, setEditingOfficial] = useState<any>(null);
  const [deletingOfficial, setDeletingOfficial] = useState<any>(null);

  const filteredOfficials = (officials || []).filter(o => 
    (o.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
    (o.jabatan?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  // CREATE (Firestore)
  const handleSaveAdd = async () => {
    if (!newName || !newJabatan || !db) return;
    setIsProcessing(true);
    try {
        await addDoc(collection(db, "personnel"), {
            name: newName.toUpperCase(),
            jabatan: newJabatan.toUpperCase(),
            category: activeTab,
            active: true,
            createdAt: new Date().toISOString()
        });
        toast({ title: "Berhasil", description: "Personel baru ditambahkan." });
        setIsAddModalOpen(false);
        setNewName(""); setNewJabatan("");
    } catch (err: any) {
        toast({ variant: "destructive", title: "Gagal", description: "Kesalahan perizinan atau koneksi." });
    } finally {
        setIsProcessing(false);
    }
  };

  // UPDATE (Firestore)
  const handleSaveEdit = async () => {
    if (!editingOfficial || !db) return;
    setIsProcessing(true);
    try {
        const docRef = doc(db, "personnel", editingOfficial.id);
        await setDoc(docRef, {
            ...editingOfficial,
            name: newName.toUpperCase(),
            jabatan: newJabatan.toUpperCase(),
        }, { merge: true });
        toast({ title: "Berhasil", description: "Data diperbarui." });
        setIsEditModalOpen(false);
    } catch (err: any) {
        toast({ variant: "destructive", title: "Gagal", description: "Kesalahan perizinan." });
    } finally {
        setIsProcessing(false);
    }
  };

  // DELETE (Firestore)
  const handleConfirmDeleteSingle = async () => {
    if (!deletingOfficial || !db) return;
    setIsProcessing(true);
    try {
        await deleteDoc(doc(db, "personnel", deletingOfficial.id));
        toast({ title: "Terhapus", description: "Data dihapus secara permanen." });
        setIsDeleteSingleConfirmOpen(false);
    } catch (err: any) {
        toast({ variant: "destructive", title: "Gagal", description: "Hanya Admin yang dapat menghapus." });
    } finally {
        setIsProcessing(false);
    }
  };

  const handleExport = () => {
    if (!officials || officials.length === 0) return;
    const exportData = filteredOfficials.map(o => ({
      'Nama': o.name,
      'Jabatan': o.jabatan,
      'Kategori': o.category
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Personel Desa");
    XLSX.writeFile(wb, "Data_Personel_Sidaurip.xlsx");
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !db) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      setIsProcessing(true);
      try {
        const bstr = event.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const jsonData: any[] = XLSX.utils.sheet_to_json(ws);
        
        const batch = writeBatch(db);
        jsonData.forEach((row) => {
          const name = row['Nama'] || row['nama'];
          const jabatan = row['Jabatan'] || row['jabatan'];
          const category = row['Kategori'] || row['kategori'] || activeTab;
          
          if (name && jabatan) {
            const newDocRef = doc(collection(db, "personnel"));
            batch.set(newDocRef, {
              name: String(name).toUpperCase(),
              jabatan: String(jabatan).toUpperCase(),
              category: category,
              active: true,
              createdAt: new Date().toISOString()
            });
          }
        });

        await batch.commit();
        toast({ title: "Impor Berhasil", description: `${jsonData.length} data berhasil ditambahkan.` });
      } catch (error) {
        console.error("Import error:", error);
        toast({ variant: "destructive", title: "Impor Gagal", description: "Format file tidak sesuai." });
      } finally {
        setIsProcessing(false);
        if(fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleDeleteAll = async () => {
    if (!db) return;
    setIsProcessing(true);
    try {
      const q = collection(db, "personnel");
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      toast({ title: "Berhasil", description: "Seluruh data personel telah dihapus." });
      setShowDeleteAllConfirm(false);
    } catch (e) {
      toast({ variant: "destructive", title: "Gagal", description: "Hanya Admin yang diizinkan." });
    } finally {
      setIsProcessing(false);
    }
  };

  if (isDataLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Sinkronisasi Database...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 max-w-6xl mx-auto pb-24">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild className="rounded-full">
                <Link href="/dashboard/"><ArrowLeft className="h-6 w-6" /></Link>
            </Button>
            <div>
                <h1 className="text-xl font-black uppercase text-primary tracking-tight">Database Personel</h1>
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Manajemen Perangkat & Lembaga Desa</p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-center">
            <input type="file" ref={fileInputRef} onChange={handleImport} className="hidden" accept=".xlsx, .xls" />
            <Button variant="outline" size="sm" className="h-9 rounded-xl gap-2 font-bold text-[10px] uppercase" onClick={() => fileInputRef.current?.click()} disabled={isProcessing}>
                <Upload className="h-3.5 w-3.5" /> Impor
            </Button>
            <Button variant="outline" size="sm" className="h-9 rounded-xl gap-2 font-bold text-[10px] uppercase" onClick={handleExport}>
                <Download className="h-3.5 w-3.5" /> Ekspor
            </Button>
            <Button variant="destructive" size="sm" className="h-9 rounded-xl gap-2 font-bold text-[10px] uppercase" onClick={() => setShowDeleteAllConfirm(true)} disabled={isProcessing}>
                <Trash2 className="h-3.5 w-3.5" /> Hapus Semua
            </Button>
          </div>
      </header>

      <section className="grid gap-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Cari nama atau jabatan..." 
            className="pl-11 h-14 rounded-2xl bg-white shadow-sm border-primary/10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Tabs defaultValue="Pemerintah Desa" className="w-full" onValueChange={setActiveTab}>
            <TabsList className="w-full h-auto p-1.5 bg-muted/50 flex flex-row overflow-x-auto no-scrollbar md:flex-wrap rounded-2xl">
                {CATEGORIES.map((cat) => (
                <TabsTrigger key={cat} value={cat} className="flex-shrink-0 px-5 py-3 text-[10px] font-black uppercase md:flex-1 md:min-w-[120px] rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white">
                    {cat}
                </TabsTrigger>
                ))}
            </TabsList>

          {CATEGORIES.map((cat) => (
            <TabsContent key={cat} value={cat} className="mt-6 space-y-4 animate-in fade-in slide-in-from-bottom-2">
                <div className="flex justify-between items-center px-1">
                    <h3 className="text-sm font-black uppercase text-slate-800">{cat}</h3>
                    <Button 
                        onClick={() => {
                            setNewName(""); setNewJabatan("");
                            setIsAddModalOpen(true);
                        }}
                        className="h-10 gap-2 text-[10px] font-black uppercase bg-primary shadow-lg rounded-xl"
                    >
                        <Plus className="h-4 w-4"/>
                        Tambah {cat}
                    </Button>
                </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredOfficials
                  .filter(o => o.category === cat)
                  .map((official) => (
                    <Card key={official.id} className="border-none shadow-sm rounded-[1.5rem] overflow-hidden group hover:shadow-xl transition-all bg-white border border-primary/5">
                        <CardHeader className="p-5 pb-2 flex-row items-start justify-between">
                          <div className="flex-1 overflow-hidden">
                              <Badge variant="outline" className="w-fit mb-2 text-[9px] uppercase font-black text-primary border-primary/20 bg-primary/5">
                                {official.jabatan}
                              </Badge>
                              <CardTitle className="text-base font-black truncate text-slate-800">{official.name}</CardTitle>
                           </div>
                           <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full"><MoreVertical className="h-4 w-4" /></Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="rounded-2xl font-black uppercase text-[10px] p-2">
                                <DropdownMenuItem className="rounded-xl cursor-pointer" onClick={() => {
                                    setEditingOfficial(official);
                                    setNewName(official.name);
                                    setNewJabatan(official.jabatan);
                                    setIsEditModalOpen(true);
                                }}>
                                  <Edit className="mr-2 h-4 w-4 text-primary"/> Edit Data
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive rounded-xl cursor-pointer" onClick={() => {
                                    setDeletingOfficial(official);
                                    setIsDeleteSingleConfirmOpen(true);
                                }}>
                                   <Trash2 className="mr-2 h-4 w-4"/> Hapus Permanen
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                        </CardHeader>
                        <CardContent className="p-5 pt-0">
                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase font-bold">
                                <User className="h-3 w-3 text-primary/40" /> 
                                Database ID: <span className="font-mono">{official.id.substring(0,6)}...</span>
                            </div>
                        </CardContent>
                    </Card>
                  ))}
                {filteredOfficials.filter(o => o.category === cat).length === 0 && (
                  <div className="col-span-full py-20 text-center border-2 border-dashed rounded-[2rem] text-muted-foreground border-primary/10">
                    <p className="font-bold text-[10px] uppercase tracking-widest">Belum ada data di kategori {cat}</p>
                  </div>
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </section>
      
      {/* Add Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="rounded-[2.5rem] border-none shadow-2xl p-8 max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-black uppercase text-lg text-primary">Tambah Personel</DialogTitle>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{activeTab}</p>
          </DialogHeader>
          <div className="space-y-5 py-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-500 ml-1">Nama Lengkap</Label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Contoh: BUDI SANTOSO" className="h-12 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-500 ml-1">Jabatan</Label>
              <Input value={newJabatan} onChange={(e) => setNewJabatan(e.target.value)} placeholder="Contoh: KEPALA DUSUN" className="h-12 rounded-xl" />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSaveAdd} disabled={isProcessing || !newName || !newJabatan} className="w-full h-14 rounded-2xl font-black uppercase shadow-lg shadow-primary/20">
              {isProcessing ? <Loader2 className="animate-spin h-5 w-5" /> : "Simpan Personel"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="rounded-[2.5rem] border-none shadow-2xl p-8 max-w-sm">
          <DialogHeader><DialogTitle className="font-black uppercase text-lg text-primary">Edit Data Personel</DialogTitle></DialogHeader>
          <div className="space-y-5 py-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-500 ml-1">Nama</Label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} className="h-12 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-500 ml-1">Jabatan</Label>
              <Input value={newJabatan} onChange={(e) => setNewJabatan(e.target.value)} className="h-12 rounded-xl" />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSaveEdit} disabled={isProcessing} className="w-full h-14 rounded-2xl font-black uppercase shadow-lg shadow-primary/20">
               {isProcessing ? <Loader2 className="animate-spin h-5 w-5" /> : "Perbarui Data"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Single Alert */}
      <Dialog open={isDeleteSingleConfirmOpen} onOpenChange={setIsDeleteSingleConfirmOpen}>
        <DialogContent className="rounded-[2.5rem] border-none shadow-2xl p-8 max-w-xs text-center">
          <DialogHeader className="items-center">
            <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mb-2">
                <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            <DialogTitle className="font-black uppercase text-destructive">Konfirmasi Hapus</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-xs font-bold uppercase text-slate-500 leading-relaxed">Hapus <strong>{deletingOfficial?.name}</strong> dari database secara permanen?</p>
          </div>
          <DialogFooter className="flex-col gap-2">
            <Button variant="destructive" onClick={handleConfirmDeleteSingle} disabled={isProcessing} className="w-full h-12 rounded-2xl font-black uppercase shadow-lg shadow-destructive/20">
                {isProcessing ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : "Ya, Hapus Data"}
            </Button>
            <Button variant="ghost" onClick={() => setIsDeleteSingleConfirmOpen(false)} className="w-full h-12 rounded-2xl font-bold uppercase">Batal</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete All Alert */}
      <AlertDialog open={showDeleteAllConfirm} onOpenChange={setShowDeleteAllConfirm}>
        <AlertDialogContent className="rounded-[2.5rem] border-none p-8">
            <AlertDialogHeader className="items-center text-center">
                <div className="h-20 w-20 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                    <Trash2 className="h-10 w-10 text-destructive" />
                </div>
                <AlertDialogTitle className="text-xl font-black uppercase text-destructive">Hapus Seluruh Database?</AlertDialogTitle>
                <AlertDialogDescription className="font-bold text-xs uppercase text-slate-500 leading-relaxed">
                    Tindakan ini akan menghapus SEMUA data personel di seluruh kategori dari Firestore. Pastikan Anda sudah memiliki cadangan (Ekspor Excel).
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col sm:flex-row gap-3 pt-6">
                <AlertDialogCancel className="h-12 rounded-2xl font-bold uppercase w-full">Batal</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteAll} className="h-12 rounded-2xl font-black uppercase bg-destructive hover:bg-destructive/90 shadow-lg shadow-destructive/20 w-full" disabled={isProcessing}>
                    {isProcessing ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : "Ya, Hapus Semua"}
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
