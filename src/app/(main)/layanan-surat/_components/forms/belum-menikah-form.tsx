'use client';

import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Loader2, CheckCircle2 } from 'lucide-react';

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
import { Card, CardContent } from '@/components/ui/card';
import { formatDbDateToForm } from '@/lib/utils';

const formSchema = z.object({
  nik: z.string().length(16, 'NIK harus 16 digit.'),
  name: z.string().min(1, 'Nama lengkap wajib diisi.'),
  gender: z.string().min(1, 'Jenis kelamin wajib diisi.'),
  birthPlace: z.string().min(1, 'Tempat lahir wajib diisi.'),
  birthDate: z.string().min(1, 'Tanggal lahir wajib diisi.'),
  nationality: z.string().min(1, 'Kewarganegaraan wajib diisi.'),
  religion: z.string().min(1, 'Agama wajib diisi.'),
  job: z.string().min(1, 'Pekerjaan wajib diisi.'),
  address: z.string().min(1, 'Alamat wajib diisi.'),

  attachmentKtp: z.any().optional(),
  attachmentKk: z.any().optional(),
  attachmentRtRw: z.any().optional(),
});

export function BelumMenikahForm({ isAdmin = false }: { isAdmin?: boolean }) {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [ticketNumber, setTicketNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSearchingResident, setIsSearchingResident] = useState(false);
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
      nationality: 'WNI',
      religion: '',
      job: '',
      address: '',
    },
  });

  const nikValue = form.watch('nik');

  useEffect(() => {
    const fetchResident = async () => {
      if (nikValue?.length === 16 && firestore) {
        setIsSearchingResident(true);
        try {
          const resident = await getResidentByNik(firestore, nikValue);
          if (resident) {
            form.setValue('name', resident.fullName.toUpperCase());
            form.setValue('gender', resident.gender);
            form.setValue('birthPlace', resident.placeOfBirth);
            form.setValue('birthDate', formatDbDateToForm(resident.dateOfBirth));
            form.setValue('religion', resident.religion);
            form.setValue('job', resident.occupation);
            
            const fullAddress = `${resident.address}, RT ${resident.rt} RW ${resident.rw}, ${resident.kelurahan}, KEC. GANDRUNGMANGU, KAB. CILACAP`.toUpperCase();
            form.setValue('address', fullAddress);
            
            toast({
              title: "Data Ditemukan",
              description: `Data untuk NIK ${nikValue} telah diisi secara otomatis.`,
            });
          }
        } catch (error: any) {
          console.error("Auto-fill error:", error);
        } finally {
          setIsSearchingResident(false);
        }
      }
    };

    fetchResident();
  }, [nikValue, firestore, form, toast]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user || !firestore) {
      toast({
        title: "Gagal Mengajukan",
        description: "Layanan database tidak tersedia.",
        variant: "destructive",
      })
      return;
    }

    const filesToUpload: { fieldName: string; file: File }[] = [];
    if (ktpFile?.[0]) filesToUpload.push({ fieldName: 'KTP Pemohon', file: ktpFile[0] });
    if (kkFile?.[0]) filesToUpload.push({ fieldName: 'Kartu Keluarga', file: kkFile[0] });
    if (rtRwFile?.[0]) filesToUpload.push({ fieldName: 'Pengantar RT/RW', file: rtRwFile[0] });

    if (!isAdmin && (filesToUpload.length < 2 || !ktpFile?.[0] || !kkFile?.[0])) {
      toast({
        title: 'Berkas Tidak Lengkap',
        description: 'Harap unggah minimal file KTP dan Kartu Keluarga.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await addSubmission(firestore, user.uid, {
          requesterName: values.name,
          nik: values.nik,
          letterType: 'Surat Keterangan Belum Menikah',
          formData: values,
          files: filesToUpload,
      });
      setTicketNumber(result.id);
      setIsSubmitted(true);
      
      if (isAdmin) {
          toast({ title: "Berhasil", description: "Pengajuan surat telah disimpan." });
      }
    } catch (error: any) {
      toast({
          title: "Gagal Mengajukan",
          description: `Kesalahan: ${error.message}`,
          variant: "destructive",
      });
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

  if (isSubmitted && isAdmin) {
      return (
          <Card className="border-green-100 bg-green-50/50">
              <CardContent className="pt-6 text-center space-y-4">
                  <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto" />
                  <div className="space-y-1">
                      <p className="font-bold text-green-900">Pengajuan Berhasil Disimpan</p>
                      <p className="text-sm text-green-700">Data telah masuk ke daftar kelola surat.</p>
                      <p className="text-xs font-mono bg-white px-2 py-1 rounded border inline-block">TIKET: {ticketNumber}</p>
                  </div>
                  <Button onClick={handleReset} variant="outline" className="border-green-600 text-green-700">Input Baru</Button>
              </CardContent>
          </Card>
      );
  }

  if (isSubmitted) {
    return <SubmissionSuccess ticketNumber={ticketNumber} onReset={handleReset} />;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="space-y-6 rounded-md border p-4 md:p-6 bg-white shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="nik"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel className="font-bold text-primary">NIK (Nomor Induk Kependudukan)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input placeholder="3301xxxxxxxxxxxx" {...field} disabled={isSubmitting} maxLength={16} />
                      {isSearchingResident && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormDescription>Masukkan 16 digit NIK untuk pengisian otomatis.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Lengkap</FormLabel>
                  <FormControl>
                    <Input placeholder="Sesuai KTP" {...field} disabled={isSubmitting} className="uppercase" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Jenis Kelamin</FormLabel>
                  <FormControl>
                    <Input placeholder="Contoh: Laki-Laki" {...field} disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="birthPlace"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tempat Lahir</FormLabel>
                    <FormControl>
                      <Input placeholder="Cilacap" {...field} disabled={isSubmitting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="birthDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tanggal Lahir</FormLabel>
                    <FormControl>
                      <Input placeholder="DD-MM-YYYY" {...field} disabled={isSubmitting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="nationality"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kewarganegaraan</FormLabel>
                  <FormControl>
                    <Input placeholder="WNI" {...field} disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="religion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Agama</FormLabel>
                  <FormControl>
                    <Input placeholder="Contoh: Islam" {...field} disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="job"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pekerjaan</FormLabel>
                  <FormControl>
                    <Input placeholder="Contoh: Petani" {...field} disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Alamat</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Alamat lengkap sesuai KTP" {...field} disabled={isSubmitting} className="uppercase" />
                  </FormControl>
                  <FormDescription>Lengkap sesuai KTP.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="space-y-6 rounded-md border p-4 md:p-6">
            <h3 className="text-lg font-semibold">Unggah Berkas {isAdmin ? '(Opsional)' : ''}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField
              control={form.control}
              name="attachmentKtp"
              render={({ field }) => (
                  <FormItem>
                  <FormLabel>Scan/Foto KTP</FormLabel>
                  <FormControl>
                      <Input type="file" accept="image/jpeg,image/png,application/pdf" onChange={(e) => setKtpFile(e.target.files)} disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                  </FormItem>
              )}
              />
              <FormField
              control={form.control}
              name="attachmentKk"
              render={({ field }) => (
                  <FormItem>
                  <FormLabel>Scan/Foto Kartu Keluarga</FormLabel>
                  <FormControl>
                      <Input type="file" accept="image/jpeg,image/png,application/pdf" onChange={(e) => setKkFile(e.target.files)} disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                  </FormItem>
              )}
              />
              <FormField
              control={form.control}
              name="attachmentRtRw"
              render={({ field }) => (
                  <FormItem>
                  <FormLabel>Pengantar RT/RW (Opsional)</FormLabel>
                  <FormControl>
                      <Input type="file" accept="image/jpeg,image/png,application/pdf" onChange={(e) => setRtRwFile(e.target.files)} disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                  </FormItem>
              )}
              />
            </div>
            <p className="text-[10px] text-muted-foreground uppercase font-bold mt-4">File: JPG, PNG, atau PDF. Maksimal 1MB per file.</p>
        </div>

        <Button type="submit" size="lg" disabled={isSubmitting} className="w-full md:w-auto px-12">
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isSubmitting ? 'Mengajukan...' : 'Ajukan Surat'}
        </Button>
      </form>
    </Form>
  );
}
