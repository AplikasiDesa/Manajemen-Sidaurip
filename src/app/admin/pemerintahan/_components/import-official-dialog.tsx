'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, FileSpreadsheet, Save } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useFirestore } from '@/firebase';
import { doc, writeBatch, serverTimestamp, collection } from 'firebase/firestore';

interface ImportOfficialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultCategory?: 'perangkat' | 'bpd' | 'rtrw';
}

export function ImportOfficialDialog({ open, onOpenChange, defaultCategory = 'perangkat' }: ImportOfficialDialogProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [category, setCategory] = useState<'perangkat' | 'bpd' | 'rtrw'>(defaultCategory);
  const firestore = useFirestore();
  const { toast } = useToast();

  // Reset category when defaultCategory changes or dialog opens
  useEffect(() => {
    if (open) {
      setCategory(defaultCategory);
      setSelectedFile(null);
    }
  }, [open, defaultCategory]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
  };

  const handleImport = async () => {
    if (!selectedFile || !firestore) return;
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(worksheet) as any[];

        const batch = writeBatch(firestore);
        let count = 0;

        json.forEach((row) => {
          const name = row.Nama || row.NAMA || row.nama;
          const position = row.Jabatan || row.JABATAN || row.jabatan;

          if (name && position) {
            const newDocRef = doc(collection(firestore, 'officials'));
            batch.set(newDocRef, {
              name: String(name).toUpperCase(),
              position: String(position),
              category,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
            count++;
          }
        });

        await batch.commit();
        toast({ title: "Impor Berhasil", description: `${count} data pengurus disimpan ke kategori ${category}.` });
        onOpenChange(false);
      } catch (err: any) {
        toast({ title: "Gagal Impor", description: err.message, variant: "destructive" });
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsArrayBuffer(selectedFile);
  };

  const categoryLabels = {
    perangkat: 'Perangkat Desa',
    bpd: 'BPD Desa',
    rtrw: 'RT / RW'
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
            Impor Data {categoryLabels[category]}
          </DialogTitle>
          <DialogDescription>Unggah file Excel (.xlsx) khusus untuk kategori ini. Kolom wajib: **Nama**, **Jabatan**.</DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label>Konfirmasi Kategori</Label>
            <Select value={category} onValueChange={(v: any) => setCategory(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="perangkat">Perangkat Desa</SelectItem>
                <SelectItem value="bpd">BPD Desa</SelectItem>
                <SelectItem value="rtrw">RT / RW</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="file">Pilih File Excel (.xlsx)</Label>
            <Input id="file" type="file" accept=".xlsx" onChange={handleFileChange} disabled={isProcessing} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
          <Button onClick={handleImport} disabled={!selectedFile || isProcessing}>
            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Mulai Impor
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
