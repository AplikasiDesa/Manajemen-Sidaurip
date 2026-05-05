'use client';

import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';

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
import { SubmissionSuccess } from '../submission-success';
import { addSubmission } from '@/lib/submissions';
import { useFirebase } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { getResidentByNik } from '@/lib/residents';
import { Textarea } from '@/components/ui/textarea';
import { formatDbDateToForm } from '@/lib/utils';

const FormSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold border-b pb-2">{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">{children}</div>
    </div>
  );

const formSchema = z.object({
  // Penanggung Jawab
  nik: z.string().length(16, 'NIK harus 16 digit.'),
  name: z.string().min(1, 'Nama lengkap wajib diisi.'),
  birthPlace: z.string().min(1, 'Tempat lahir wajib diisi.'),
  birthDate: z.string().min(1, 'Tanggal lahir wajib diisi.'),
  job: z.string().min(1, 'Pekerjaan wajib diisi.'),
  address: z.string().min(1, 'Alamat wajib diisi.'),
  
  // Ijin
  eventDate: z.string().min(1, 'Tanggal acara wajib diisi.'),
  eventEndDate: z.string().min(1, 'Sampai dengan tanggal wajib diisi.'),
  guestCount: z.string().min(1, 'Jumlah undangan wajib diisi.'),
  eventName: z.string().min(1, 'Nama acara wajib diisi.'),
  eventEntertainment: z.string().min(1, 'Hiburan wajib diisi.'),
  eventLocation: z.string().min(1, 'Tempat acara wajib diisi.'),

  // Attachments
  attachmentKtp: z.any().optional(),
  attachmentKk: z.any().optional(),
  attachmentRtRw: z.any().optional(),
});

export function IjinKeramaianForm() {
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
        birthPlace: '',
        birthDate: '',
        job: '',
        address: '',
        eventDate: '',
        eventEndDate: '',
        guestCount: '',
        eventName: '',
        eventEntertainment: '',
        eventLocation: '',
    },
  });

  const nikValue = form.watch('nik');

  useEffect(() => {
    const fetchResident = async () => {
      if (nikValue.length === 16 && firestore) {
        setIsSearchingResident(true);
        try {
          const resident = await getResidentByNik(firestore, nikValue);
          if (resident) {
            form.setValue('name', resident.fullName.toUpperCase());
            form.setValue('birthPlace', resident.placeOfBirth);
            form.setValue('birthDate', formatDbDateToForm(resident.dateOfBirth));
            form.setValue('job', resident.occupation);
            
            const fullAddress = `${resident.address}, RT ${resident.rt} RW ${resident.rw}, ${resident.kelurahan}, KEC. GANDRUNGMANGU, KAB. CILACAP`.toUpperCase();
            form.setValue('address', fullAddress);
            
            toast({
              title: "Data Ditemukan",
              description: `Data penanggung jawab telah diisi otomatis.`,
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

    if (filesToUpload.length < 2 || !ktpFile?.[0] || !kkFile?.[0]) {
      toast({
        title: 'Berkas Tidak Lengkap',
        description: 'Harap unggah file KTP dan Kartu Keluarga.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await addSubmission(firestore, user.uid, {
          requesterName: values.name,
          nik: values.nik,
          letterType: 'Surat Ijin Keramaian',
          formData: values,
          files: filesToUpload,
      });
      setTicketNumber(result.id);
      setIsSubmitted(true);
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

  if (isSubmitted) {
    return <SubmissionSuccess ticketNumber={ticketNumber} onReset={handleReset} />;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="space-y-6 rounded-md border p-4 md:p-6 bg-white shadow-sm">
            <FormSection title="Data Penanggung Jawab">
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
                    <FormDescription>Masukkan NIK untuk pengisian otomatis data diri.</FormDescription>
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
                name="job"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Pekerjaan</FormLabel>
                    <FormControl>
                        <Input placeholder="Contoh: Buruh Harian Lepas" {...field} disabled={isSubmitting} />
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
                    <FormDescription>Lengkap sesuai KTP</FormDescription>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </FormSection>

            <FormSection title="Persyaratan Ijin">
                 <FormField
                control={form.control}
                name="eventDate"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Tanggal Acara</FormLabel>
                    <FormControl>
                        <Input placeholder="DD-MM-YYYY" {...field} disabled={isSubmitting} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                 <FormField
                control={form.control}
                name="eventEndDate"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Sampai dengan Tanggal</FormLabel>
                    <FormControl>
                        <Input placeholder="DD-MM-YYYY" {...field} disabled={isSubmitting} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                 <FormField
                control={form.control}
                name="guestCount"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Jumlah Undangan</FormLabel>
                    <FormControl>
                        <Input placeholder="Contoh: 1000 orang" {...field} disabled={isSubmitting} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                 <FormField
                control={form.control}
                name="eventName"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Nama Acara</FormLabel>
                    <FormControl>
                        <Input placeholder="Contoh: Resepsi Pernikahan" {...field} disabled={isSubmitting} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="eventEntertainment"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Hiburan</FormLabel>
                    <FormControl>
                        <Input placeholder="Contoh: Organ Tunggal" {...field} disabled={isSubmitting} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                 <FormField
                control={form.control}
                name="eventLocation"
                render={({ field }) => (
                    <FormItem className="md:col-span-2">
                    <FormLabel>Tempat</FormLabel>
                    <FormControl>
                        <Textarea placeholder="Lokasi lengkap acara" {...field} disabled={isSubmitting} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </FormSection>
        </div>

        <div className="space-y-6 rounded-md border p-4 md:p-6 bg-white">
            <h3 className="text-lg font-semibold">Unggah Berkas Lampiran</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
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
            <p className="text-[10px] text-muted-foreground uppercase font-bold mt-2">File: JPG, PNG, atau PDF. Maksimal 1MB per file.</p>
        </div>

        <Button type="submit" size="lg" disabled={isSubmitting} className="w-full md:w-auto px-12">
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isSubmitting ? 'Mengajukan...' : 'Ajukan Surat Ijin'}
        </Button>
      </form>
    </Form>
  );
}
