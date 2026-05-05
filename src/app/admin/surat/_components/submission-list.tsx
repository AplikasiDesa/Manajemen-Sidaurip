'use client';

import { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, CheckCircle, XCircle, Printer, Trash2, Eye, Loader2, FileSignature, Download, Phone, Mail, FileDown, UserCheck } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { LetterSubmission, UploadedFile } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import {
  getLetterRequestsQuery,
  updateSubmissionStatus,
  deleteSubmission,
  setSubmissionDocumentNumber,
} from '@/lib/submissions';
import { Skeleton } from '@/components/ui/skeleton';
import { generateDocumentNumber } from '@/ai/flows/generate-document-number-flow';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

// Helper to open Google Drive file download link
const openGoogleDriveDownloadLink = (fileId: string) => {
    const url = `https://drive.google.com/uc?export=download&id=${fileId}`;
    window.open(url, '_blank');
};


export function SubmissionList() {
  const [selectedSubmission, setSelectedSubmission] = useState<LetterSubmission | null>(null);
  const [manualNumberSubmission, setManualNumberSubmission] = useState<LetterSubmission | null>(null);
  const [manualNumberInput, setManualNumberInput] = useState<string>('');
  const [isSubmittingManualNumber, setIsSubmittingManualNumber] = useState<boolean>(false);
  
  // State for Signatory Choice
  const [signatorySubmission, setSignatorySubmission] = useState<LetterSubmission | null>(null);
  const [selectedSigner, setSelectedSigner] = useState<'kades' | 'sekdes'>('kades');

  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();

  const query = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return getLetterRequestsQuery(firestore);
  }, [firestore, user]);

  const { data: submissionsData, isLoading } = useCollection<LetterSubmission>(query);

  const submissions = useMemo(() => {
    if (!submissionsData) return [];
    return submissionsData.map(sub => ({
        ...sub,
        formData: sub.submissionData ? JSON.parse(sub.submissionData) : {},
        date: sub.createdAt?.toDate()?.toISOString() ?? new Date().toISOString(),
    }))
  }, [submissionsData]);

  const handleDownload = (file: UploadedFile) => {
    openGoogleDriveDownloadLink(file.fileId);
  };

  const handleManualNumberSubmit = async () => {
    if (!manualNumberSubmission || !manualNumberInput) return;

    const manualNumber = parseInt(manualNumberInput, 10);
    if (isNaN(manualNumber) || manualNumber <= 0) {
        toast({
            title: "Nomor Tidak Valid",
            description: "Silakan masukkan nomor surat yang valid.",
            variant: "destructive",
        });
        return;
    }

    setIsSubmittingManualNumber(true);
    try {
        const formattedNumber = await generateDocumentNumber({ manualNumber });
        await setSubmissionDocumentNumber(firestore, manualNumberSubmission.id, formattedNumber);

        toast({
            title: "Nomor Surat Dibuat",
            description: `Nomor baru ${formattedNumber} telah disimpan.`,
        });

    } catch (e: any) {
        toast({
            title: "Gagal Membuat Nomor",
            description: e.message,
            variant: "destructive",
        });
    } finally {
        setIsSubmittingManualNumber(false);
        setManualNumberInput('');
        setManualNumberSubmission(null);
    }
  };

  const handleStatusChange = (id: string, status: 'approved' | 'rejected') => {
    updateSubmissionStatus(firestore, id, status);
    toast({
        title: `Status Diperbarui`,
        description: `Pengajuan telah ${status === 'approved' ? 'Disetujui' : 'Ditolak'}.`,
    });
  };
  
  const confirmPrint = () => {
    if (!signatorySubmission) return;
    window.open(`/print/${signatorySubmission.id}?signer=${selectedSigner}`, '_blank');
    setSignatorySubmission(null);
  };

  const handleDelete = (id: string) => {
    deleteSubmission(firestore, id);
    toast({
        title: `Pengajuan Dihapus`,
        variant: 'destructive',
    });
  };

  const formatLabel = (key: string) => {
    const result = key.replace(/([A-Z])/g, ' $1');
    return result.charAt(0).toUpperCase() + result.slice(1);
  }

  const formatValue = (value: any) => {
    if (value instanceof Date) {
      return value.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
    }
    if (typeof value === 'object' && value !== null && 'name' in value) return value.name;
    if (value === null || value === undefined || value === '') return '-';
    return String(value);
  }

  const statusVariant = {
    pending: 'secondary',
    approved: 'default',
    rejected: 'destructive',
    processing: 'secondary',
  } as const;

  const statusText = {
    pending: 'Menunggu',
    approved: 'Disetujui',
    rejected: 'Ditolak',
    processing: 'Memproses',
  };

  if (isLoading || !user) {
      return (
          <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
          </div>
      )
  }

  return (
    <>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pemohon</TableHead>
              <TableHead className="hidden sm:table-cell">Jenis Surat</TableHead>
              <TableHead>Nomor Surat</TableHead>
              <TableHead className="hidden md:table-cell">Tanggal</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {submissions.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">Belum ada pengajuan.</TableCell></TableRow>
            ) : (
                submissions.map((submission) => (
                <TableRow key={submission.id}>
                    <TableCell>
                    <div className="font-medium">{submission.requesterName}</div>
                    <div className="text-[10px] text-muted-foreground font-mono">{submission.nik}</div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-xs">{submission.letterType}</TableCell>
                    <TableCell>
                        {submission.documentNumber ? (
                            <span className="font-mono text-xs font-bold text-primary">{submission.documentNumber}</span>
                        ) : (
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => setManualNumberSubmission(submission)}
                                disabled={submission.status !== 'approved'}
                                className="h-7 text-[10px]"
                            >
                                <FileSignature className="mr-1 h-3 w-3" />
                                Buat Nomor
                            </Button>
                        )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-xs">{new Date(submission.date).toLocaleDateString('id-ID')}</TableCell>
                    <TableCell className="text-center">
                    <Badge variant={statusVariant[submission.status]} className="text-[10px]">
                        {submission.status === 'processing' && <Loader2 className="mr-1 h-2 w-2 animate-spin" />}
                        {statusText[submission.status]}
                    </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => setSelectedSubmission(submission)}><Eye className="mr-2 h-4 w-4" /><span>Lihat Detail</span></DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleStatusChange(submission.id, 'approved')}><CheckCircle className="mr-2 h-4 w-4 text-green-500" /><span>Setujui</span></DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(submission.id, 'rejected')}><XCircle className="mr-2 h-4 w-4 text-red-500" /><span>Tolak</span></DropdownMenuItem>
                        
                        <DropdownMenuItem 
                          onClick={() => setSignatorySubmission(submission)} 
                          disabled={submission.status !== 'approved' || !submission.documentNumber}
                        >
                          <Printer className="mr-2 h-4 w-4" /><span>Cetak Dokumen</span>
                        </DropdownMenuItem>

                        <DropdownMenuItem 
                          onClick={() => setSignatorySubmission(submission)} 
                          disabled={submission.status !== 'approved' || !submission.documentNumber}
                        >
                          <FileDown className="mr-2 h-4 w-4" /><span>Unduh PDF</span>
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleDelete(submission.id)} className="text-red-500 focus:text-red-500"><Trash2 className="mr-2 h-4 w-4" /><span>Hapus</span></DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    </TableCell>
                </TableRow>
                ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selectedSubmission} onOpenChange={(isOpen) => !isOpen && setSelectedSubmission(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detail Pengajuan: {selectedSubmission?.letterType}</DialogTitle>
            <DialogDescription>ID Pengajuan: {selectedSubmission?.id}</DialogDescription>
          </DialogHeader>
          {selectedSubmission && (
            <div className="mt-4 max-h-[60vh] overflow-y-auto pr-4 space-y-6">
              {/* KONTAK WARGA */}
              <div className="bg-green-50 p-4 rounded-lg border border-green-100 flex flex-col sm:flex-row gap-4 justify-around">
                  <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-green-700" />
                      <div>
                          <p className="text-[10px] text-green-600 font-bold uppercase">No. WhatsApp</p>
                          <p className="text-sm font-semibold">{selectedSubmission.phoneNumber || 'Tidak ada'}</p>
                      </div>
                  </div>
                  <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-green-700" />
                      <div>
                          <p className="text-[10px] text-green-600 font-bold uppercase">Email</p>
                          <p className="text-sm font-semibold">{selectedSubmission.email || 'Tidak ada'}</p>
                      </div>
                  </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Data Formulir</h4>
                <Table>
                    <TableHeader><TableRow><TableHead className="w-[200px]">Kolom Isian</TableHead><TableHead>Data Pemohon</TableHead></TableRow></TableHeader>
                    <TableBody>
                    {Object.entries(selectedSubmission.formData).map(([key, value]) => (
                        <TableRow key={key}><TableCell className="font-medium capitalize text-xs">{formatLabel(key)}</TableCell><TableCell className="text-xs">{formatValue(value)}</TableCell></TableRow>
                    ))}
                    </TableBody>
                </Table>
              </div>

              {selectedSubmission.fileLinks && selectedSubmission.fileLinks.length > 0 && (
                 <div>
                    <h4 className="font-semibold mb-2">Berkas Lampiran</h4>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {selectedSubmission.fileLinks.map((file) => (
                        <Button key={file.fileId} variant="outline" className="justify-start h-auto py-2 text-xs" onClick={() => handleDownload(file)}>
                           <Download className="mr-2 h-3 w-3" /><span className="truncate">{formatLabel(file.fieldName)}</span>
                        </Button>
                        ))}
                    </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setSelectedSubmission(null)}>Tutup</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manual Number Dialog */}
      <Dialog open={!!manualNumberSubmission} onOpenChange={(isOpen) => !isOpen && setManualNumberSubmission(null)}>
        <DialogContent className="sm:max-w-[400px]">
            <DialogHeader><DialogTitle>Buat Nomor Surat</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="manual-number">Nomor Urut Surat</Label>
                    <Input id="manual-number" type="number" value={manualNumberInput} onChange={(e) => setManualNumberInput(e.target.value)} placeholder="Contoh: 152" disabled={isSubmittingManualNumber} />
                </div>
            </div>
            <DialogFooter><Button onClick={handleManualNumberSubmit} disabled={isSubmittingManualNumber || !manualNumberInput}>{isSubmittingManualNumber && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Simpan & Format</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Signatory Choice Dialog */}
      <Dialog open={!!signatorySubmission} onOpenChange={(isOpen) => !isOpen && setSignatorySubmission(null)}>
        <DialogContent className="sm:max-w-[450px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-primary" />
                Pilih Penandatangan
              </DialogTitle>
              <DialogDescription>
                Tentukan siapa yang akan menandatangani dokumen ini.
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-6">
              <RadioGroup value={selectedSigner} onValueChange={(v) => setSelectedSigner(v as any)} className="grid gap-4">
                <div className="flex items-center space-x-3 space-y-0 rounded-md border p-4 cursor-pointer hover:bg-muted/50 has-[:checked]:bg-primary/5 has-[:checked]:border-primary">
                  <RadioGroupItem value="kades" id="signer-kades" />
                  <Label htmlFor="signer-kades" className="flex-1 cursor-pointer">
                    <p className="font-bold">Kepala Desa</p>
                    <p className="text-xs text-muted-foreground uppercase">Tasimin</p>
                  </Label>
                </div>
                
                <div className="flex items-center space-x-3 space-y-0 rounded-md border p-4 cursor-pointer hover:bg-muted/50 has-[:checked]:bg-primary/5 has-[:checked]:border-primary">
                  <RadioGroupItem value="sekdes" id="signer-sekdes" />
                  <Label htmlFor="signer-sekdes" className="flex-1 cursor-pointer">
                    <p className="font-bold">A.n. Kepala Desa (Sekdes)</p>
                    <p className="text-xs text-muted-foreground uppercase">SOFA BURHANI</p>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setSignatorySubmission(null)}>Batal</Button>
              <Button onClick={confirmPrint}>Lanjutkan</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
