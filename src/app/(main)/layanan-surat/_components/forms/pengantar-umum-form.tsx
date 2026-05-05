'use client';

import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Loader2, User, FileText } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { SubmissionSuccess } from '../submission-success';
import { addSubmission } from '@/lib/submissions';
import { useFirebase } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { getResidentByNik } from '@/lib/residents';
import { formatDbDateToForm } from '@/lib/utils';

const formSchema = z.object({
  nik: z.string().length(16, 'NIK harus 16 digit.'),
  name: z.string().min(1, 'Nama lengkap wajib diisi.'),
  gender: z.string().min(1, 'Jenis kelamin wajib diisi.'),
  birthPlace: z.string().min(1, 'Tempat lahir wajib diisi.'),
  birthDate: z.string().min(1, 'Tanggal lahir wajib diisi.'),
  job: z.string().min(1, 'Pekerjaan wajib diisi.'),
  purpose: z.string().min(1, 'Keperluan wajib diisi.'),
  address: z.string().min(1, 'Alamat wajib diisi.'),
  
  attachmentKtp: z.any().optional(),
  attachmentKk: z.any().optional(),
  attachmentRtRw: z.any().optional(),
});

export function PengantarUmumForm() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [ticketNumber, setTicketNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  
  const { firestore, user } = useFirebase();
  const { toast } = useToast();
  
  const [ktpFile, setKtpFile] = useState<FileList | null>(null);
  const [kkFile, setKkFile] = useState<FileList | null>(null);
  const [rtRwFile, setRtRwFile] = useState<FileList | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nik: '',
      name: '',
      gender: '',
      birthPlace: '',
      birthDate: '',
      job: '',
      purpose: '',
      address: '',
    },
  });

  const nikValue = form.watch('nik');

  useEffect(() => {
    const fetchResident = async () => {
      if (nikValue?.length === 16 && firestore) {
        setIsSearching(true);
        try {
          const res = await getResidentByNik(firestore, nikValue);
          if (res) {
            form.setValue('name', res.fullName.toUpperCase());
            form.setValue('gender', res.gender);
            form.setValue('birthPlace', res.placeOfBirth);
            form.setValue('birthDate', formatDbDateToForm(res.dateOfBirth));
            form.setValue('job', res.occupation);
            
            const fullAddress = `${res.address}, RT ${res.rt} RW ${res.rw}, ${res.kelurahan}, KEC. GANDRUNGMANGU, KAB. CILACAP`.toUpperCase();
            form.setValue('address', fullAddress);
            
            toast({ title: "Data Ditemukan" });
          }
        } finally {
          setIsSearching(false);
        }
      }
    };
    fetchResident();
  }, [nikValue, firestore, form, toast]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user || !firestore) return;

    const filesToUpload: { fieldName: string; file: File }[] = [];
    if (ktpFile?.[0]) filesToUpload.push({ fieldName: 'KTP Pemohon', file: ktpFile[0] });
    if (kkFile?.[0]) filesToUpload.push({ fieldName: 'Kartu Keluarga', file: kkFile[0] });
    if (rtRwFile?.[0]) filesToUpload.push({ fieldName: 'Pengantar RT/RW', file: rtRwFile[0] });

    setIsSubmitting(true);
    try {
      const result = await addSubmission(firestore, user.uid, {
        requesterName: values.name,
        nik: values.nik,
        letterType: 'Surat Pengantar Umum',
        formData: values,
        files: filesToUpload,
      });
      setTicketNumber(result.id);
      setIsSubmitted(true);
    } catch (error: any) {
      toast({ title: "Gagal Mengajukan", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleReset = () => {
    form.reset();
    setIsSubmitted(false);
    setTicketNumber('');
    setKtpFile(null);
    setKkFile(null);
    setRtRwFile(null);
  };

  if (isSubmitted) return <SubmissionSuccess ticketNumber={ticketNumber} onReset={handleReset} />;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="space-y-6 rounded-md border p-4 md:p-6 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b pb-2">
            <FileText className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Keperluan & Identitas (Surat Pengantar)</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="purpose"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel className="font-bold text-primary">Keperluan Surat (Isi Manual)</FormLabel>
                  <FormControl><Input placeholder="Contoh: Pengurusan Jamsostek / Persyaratan Kerja" {...field} disabled={isSubmitting} /></FormControl>
                  <FormDescription>Jelaskan tujuan Anda mengajukan surat pengantar ini.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="nik"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel className="font-bold text-primary">NIK (Nomor Induk Kependudukan)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input placeholder="3301xxxxxxxxxxxx" {...field} disabled={isSubmitting} maxLength={16} />
                      {isSearching && <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-primary" />}
                    </div>
                  </FormControl>
                  <FormDescription>Masukkan 16 digit NIK untuk memuat data otomatis.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem><FormLabel>Nama Lengkap</FormLabel><FormControl><Input className="uppercase" {...field} disabled={isSubmitting} /></FormControl><FormMessage /></FormItem>
            )} />

            <FormField control={form.control} name="gender" render={({ field }) => (
              <FormItem><FormLabel>Jenis Kelamin</FormLabel><FormControl><Input placeholder="Laki-Laki / Perempuan" {...field} disabled={isSubmitting} /></FormControl><FormMessage /></FormItem>
            )} />

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="birthPlace" render={({ field }) => (
                <FormItem><FormLabel>Tempat Lahir</FormLabel><FormControl><Input {...field} disabled={isSubmitting} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="birthDate" render={({ field }) => (
                <FormItem><FormLabel>Tgl Lahir</FormLabel><FormControl><Input placeholder="DD-MM-YYYY" {...field} disabled={isSubmitting} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>

            <FormField control={form.control} name="job" render={({ field }) => (
              <FormItem><FormLabel>Pekerjaan</FormLabel><FormControl><Input {...field} disabled={isSubmitting} /></FormControl><FormMessage /></FormItem>
            )} />

            <FormField control={form.control} name="address" render={({ field }) => (
              <FormItem className="md:col-span-2"><FormLabel>Alamat Lengkap Sesuai KTP</FormLabel><FormControl><Textarea {...field} className="uppercase" disabled={isSubmitting} /></FormControl><FormMessage /></FormItem>
            )} />
          </div>
        </div>

        <div className="space-y-6 rounded-md border p-4 md:p-6 bg-white">
            <h3 className="text-lg font-semibold">Unggah Berkas Lampiran (Opsional)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField control={form.control} name="attachmentKtp" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Foto KTP</FormLabel>
                        <FormControl><Input type="file" accept="image/*,application/pdf" onChange={(e) => setKtpFile(e.target.files)} disabled={isSubmitting} /></FormControl>
                    </FormItem>
                )} />
                <FormField control={form.control} name="attachmentKk" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Foto KK</FormLabel>
                        <FormControl><Input type="file" accept="image/*,application/pdf" onChange={(e) => setKkFile(e.target.files)} disabled={isSubmitting} /></FormControl>
                    </FormItem>
                )} />
                <FormField control={form.control} name="attachmentRtRw" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Pengantar RT/RW</FormLabel>
                        <FormControl><Input type="file" accept="image/*,application/pdf" onChange={(e) => setRtRwFile(e.target.files)} disabled={isSubmitting} /></FormControl>
                    </FormItem>
                )} />
            </div>
            <p className="text-[10px] text-muted-foreground uppercase font-bold mt-2">File: JPG, PNG, atau PDF. Maksimal 1MB per file.</p>
        </div>

        <Button type="submit" size="lg" disabled={isSubmitting} className="w-full">
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Ajukan Surat Pengantar Umum'}
        </Button>
      </form>
    </Form>
  );
}
