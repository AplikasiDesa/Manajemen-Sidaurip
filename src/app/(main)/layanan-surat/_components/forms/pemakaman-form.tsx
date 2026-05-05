'use client';

import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, Loader2, Skull } from 'lucide-react';

import { cn, formatDbDateToForm } from '@/lib/utils';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { SubmissionSuccess } from '../submission-success';
import { addSubmission } from '@/lib/submissions';
import { useFirebase } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { getResidentByNik } from '@/lib/residents';

const FormSection = ({ title, icon: Icon, children }: { title: string; icon?: any; children: React.ReactNode }) => (
  <div className="space-y-6 rounded-md border p-4 md:p-6 bg-white shadow-sm">
    <div className="flex items-center gap-2 border-b pb-2">
      {Icon && <Icon className="h-5 w-5 text-primary" />}
      <h3 className="text-lg font-semibold">{title}</h3>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">{children}</div>
  </div>
);

const formSchema = z.object({
  nik: z.string().length(16, 'NIK harus 16 digit.'),
  name: z.string().min(1, 'Nama wajib diisi.'),
  birthPlace: z.string().min(1, 'Tempat lahir wajib diisi.'),
  birthDate: z.string().min(1, 'Tanggal lahir wajib diisi.'),
  religion: z.string().min(1, 'Agama wajib diisi.'),
  gender: z.string().min(1, 'Jenis kelamin wajib diisi.'),
  maritalStatus: z.string().min(1, 'Status perkawinan wajib diisi.'),
  job: z.string().min(1, 'Pekerjaan wajib diisi.'),
  nationality: z.string().min(1, 'Kewarganegaraan wajib diisi.'),
  address: z.string().min(1, 'Alamat wajib diisi.'),
  
  deathDate: z.date({ required_error: 'Tanggal kematian wajib diisi.' }),
  deathTime: z.string().min(1, 'Jam kematian wajib diisi.'),
  deathLocation: z.string().min(1, 'Tempat kematian wajib diisi.'),
  deathCause: z.string().min(1, 'Sebab kematian wajib diisi.'),
  burialLocation: z.string().min(1, 'Lokasi pemakaman wajib diisi.'),

  attachmentKtp: z.any().optional(),
  attachmentKk: z.any().optional(),
});

export function PemakamanForm() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [ticketNumber, setTicketNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  
  const { firestore, user } = useFirebase();
  const { toast } = useToast();
  const [ktpFile, setKtpFile] = useState<FileList | null>(null);
  const [kkFile, setKkFile] = useState<FileList | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        nik: '',
        name: '',
        birthPlace: '',
        birthDate: '',
        religion: '',
        gender: '',
        maritalStatus: '',
        job: '',
        nationality: 'WNI',
        address: '',
        deathTime: '09.00 WIB',
        deathLocation: '',
        deathCause: '',
        burialLocation: '',
    },
  });

  const nikValue = form.watch('nik');

  useEffect(() => {
    const fetchResident = async () => {
      if (nikValue?.length === 16 && firestore) {
        setIsSearching(true);
        try {
          const resident = await getResidentByNik(firestore, nikValue);
          if (resident) {
            form.setValue('name', resident.fullName.toUpperCase());
            form.setValue('gender', resident.gender);
            form.setValue('birthPlace', resident.placeOfBirth);
            form.setValue('birthDate', formatDbDateToForm(resident.dateOfBirth));
            form.setValue('religion', resident.religion);
            form.setValue('job', resident.occupation);
            form.setValue('maritalStatus', resident.maritalStatus);
            
            const fullAddress = `${resident.address}, RT ${resident.rt} RW ${resident.rw}, ${resident.kelurahan}, KEC. GANDRUNGMANGU, KAB. CILACAP`.toUpperCase();
            form.setValue('address', fullAddress);
            
            toast({ title: "Data Almarhum Ditemukan", description: "Data identitas telah diisi otomatis." });
          }
        } catch (error: any) {
          console.error("Auto-fill error:", error);
        } finally {
          setIsSearching(false);
        }
      }
    };
    fetchResident();
  }, [nikValue, firestore, form, toast]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user || !firestore) {
      toast({ title: "Gagal Mengajukan", description: "Layanan database tidak tersedia.", variant: "destructive" });
      return;
    }

    const filesToUpload: { fieldName: string; file: File }[] = [];
    if (ktpFile?.[0]) filesToUpload.push({ fieldName: 'KTP Almarhum', file: ktpFile[0] });
    if (kkFile?.[0]) filesToUpload.push({ fieldName: 'Kartu Keluarga', file: kkFile[0] });

    if (filesToUpload.length < 2) {
      toast({
        title: 'Berkas Tidak Lengkap',
        description: 'Harap unggah file KTP Almarhum dan Kartu Keluarga.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const docRef = await addSubmission(firestore, user.uid, {
        requesterName: values.name,
        nik: values.nik,
        letterType: 'Surat Keterangan Pemakaman',
        formData: values,
        files: filesToUpload,
      });
      setTicketNumber(docRef.id);
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
  };

  if (isSubmitted) {
    return <SubmissionSuccess ticketNumber={ticketNumber} onReset={handleReset} />;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormSection title="Identitas Almarhum/Almarhumah" icon={Skull}>
          <FormField control={form.control} name="nik" render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel className="font-bold text-primary">NIK Almarhum/ah</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input placeholder="3301xxxxxxxxxxxx" {...field} disabled={isSubmitting} maxLength={16} />
                  {isSearching && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    </div>
                  )}
                </div>
              </FormControl>
              <FormDescription>Masukkan NIK untuk pengisian otomatis data jenazah.</FormDescription>
              <FormMessage />
            </FormItem>
          )} />
          
          <FormField control={form.control} name="name" render={({ field }) => (
            <FormItem>
              <FormLabel>Nama Lengkap</FormLabel>
              <FormControl><Input {...field} disabled={isSubmitting} className="uppercase" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          
          <FormField control={form.control} name="gender" render={({ field }) => (
            <FormItem>
              <FormLabel>Jenis Kelamin</FormLabel>
              <FormControl><Input placeholder="Laki-Laki / Perempuan" {...field} disabled={isSubmitting} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          
          <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="birthPlace" render={({ field }) => (
              <FormItem>
                <FormLabel>Tempat Lahir</FormLabel>
                <FormControl><Input {...field} disabled={isSubmitting} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="birthDate" render={({ field }) => (
              <FormItem>
                <FormLabel>Tgl Lahir</FormLabel>
                <FormControl><Input {...field} disabled={isSubmitting} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>
          
          <FormField control={form.control} name="religion" render={({ field }) => (
            <FormItem>
              <FormLabel>Agama</FormLabel>
              <FormControl><Input placeholder="Agama" {...field} disabled={isSubmitting} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          
          <FormField control={form.control} name="maritalStatus" render={({ field }) => (
            <FormItem>
              <FormLabel>Status Perkawinan</FormLabel>
              <FormControl><Input placeholder="KAWIN / BELUM KAWIN" {...field} disabled={isSubmitting} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          
          <FormField control={form.control} name="nationality" render={({ field }) => (
            <FormItem>
              <FormLabel>Kewarganegaraan</FormLabel>
              <FormControl><Input placeholder="WNI" {...field} disabled={isSubmitting} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          
          <FormField control={form.control} name="job" render={({ field }) => (
            <FormItem>
              <FormLabel>Pekerjaan</FormLabel>
              <FormControl><Input {...field} disabled={isSubmitting} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          
          <FormField control={form.control} name="address" render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel>Alamat Lengkap</FormLabel>
              <FormControl><Textarea {...field} disabled={isSubmitting} className="uppercase" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </FormSection>

        <FormSection title="Kejadian Meninggal Dunia">
          <FormField control={form.control} name="deathDate" render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Hari / Tanggal Kematian</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button variant={'outline'} className={cn('w-full pl-3 text-left font-normal', !field.value && 'text-muted-foreground')} disabled={isSubmitting}>
                      {field.value ? format(field.value, 'PPP') : <span>Pilih tanggal</span>}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date > new Date()} initialFocus />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )} />
          
          <FormField control={form.control} name="deathTime" render={({ field }) => (
            <FormItem>
              <FormLabel>Jam Kematian</FormLabel>
              <FormControl><Input placeholder="Contoh: 09.00 WIB" {...field} disabled={isSubmitting} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          
          <FormField control={form.control} name="deathLocation" render={({ field }) => (
            <FormItem>
              <FormLabel>Tempat Kematian</FormLabel>
              <FormControl><Input placeholder="Rumah / Rumah Sakit" {...field} disabled={isSubmitting} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          
          <FormField control={form.control} name="deathCause" render={({ field }) => (
            <FormItem>
              <FormLabel>Sebab Kematian</FormLabel>
              <FormControl><Input placeholder="Contoh: Sakit / Tua" {...field} disabled={isSubmitting} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          
          <FormField control={form.control} name="burialLocation" render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel>Dimakamkan di (Lokasi Pemakaman)</FormLabel>
              <FormControl><Textarea placeholder="Contoh: Makam Umum Dusun ... RT ... RW ... Desa Sidaurip" {...field} disabled={isSubmitting} /></FormControl>
              <FormDescription>Isi detail lokasi pemakaman secara lengkap.</FormDescription>
              <FormMessage />
            </FormItem>
          )} />
        </FormSection>

        <FormSection title="Unggah Berkas">
            <FormField
            control={form.control}
            name="attachmentKtp"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Scan/Foto KTP Almarhum</FormLabel>
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
        </FormSection>

        <Button type="submit" size="lg" disabled={isSubmitting} className="w-full md:w-auto px-12">
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Ajukan Surat'}
        </Button>
      </form>
    </Form>
  );
}
