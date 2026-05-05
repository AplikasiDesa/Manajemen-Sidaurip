'use client';

import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Loader2, ShieldCheck, User, Baby } from 'lucide-react';

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

const FormSection = ({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) => (
  <div className="space-y-6 rounded-md border p-4 md:p-6 bg-white shadow-sm">
    <div className="flex items-center gap-2 border-b pb-2">
      <Icon className="h-5 w-5 text-primary" />
      <h3 className="text-lg font-semibold">{title}</h3>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">{children}</div>
  </div>
);

const personSchema = z.object({
  nik: z.string().length(16, 'NIK harus 16 digit.'),
  name: z.string().min(1, 'Nama lengkap wajib diisi.'),
  gender: z.string().min(1, 'Jenis kelamin wajib diisi.'),
  birthPlace: z.string().min(1, 'Tempat lahir wajib diisi.'),
  birthDate: z.string().min(1, 'Tanggal lahir wajib diisi.'),
  job: z.string().optional(),
  address: z.string().min(1, 'Alamat wajib diisi.'),
});

const formSchema = z.object({
  purpose: z.string().min(1, 'Persyaratan/keperluan wajib diisi.'),
  wali: personSchema,
  anak: personSchema,
});

export function WaliForm() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [ticketNumber, setTicketNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSearchingWali, setIsSearchingWali] = useState(false);
  const [isSearchingAnak, setIsSearchingAnak] = useState(false);
  
  const { firestore, user } = useFirebase();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      purpose: '',
      wali: { nik: '', name: '', gender: '', birthPlace: '', birthDate: '', job: '', address: '' },
      anak: { nik: '', name: '', gender: '', birthPlace: '', birthDate: '', address: '' },
    },
  });

  const waliNik = form.watch('wali.nik');
  const anakNik = form.watch('anak.nik');

  const handleAutoFill = async (nik: string, prefix: 'wali' | 'anak') => {
    if (nik?.length === 16 && firestore) {
      prefix === 'wali' ? setIsSearchingWali(true) : setIsSearchingAnak(true);
      try {
        const resident = await getResidentByNik(firestore, nik);
        if (resident) {
          form.setValue(`${prefix}.name`, resident.fullName.toUpperCase());
          form.setValue(`${prefix}.gender`, resident.gender);
          form.setValue(`${prefix}.birthPlace`, resident.placeOfBirth);
          form.setValue(`${prefix}.birthDate`, formatDbDateToForm(resident.dateOfBirth));
          if (prefix === 'wali') form.setValue(`wali.job`, resident.occupation);
          
          const fullAddress = `${resident.address}, RT ${resident.rt} RW ${resident.rw}, ${resident.kelurahan}, KEC. GANDRUNGMANGU, KAB. CILACAP`.toUpperCase();
          form.setValue(`${prefix}.address`, fullAddress);
          
          toast({ title: "Data Ditemukan", description: `Data ${prefix === 'wali' ? 'Wali' : 'Anak'} telah diisi otomatis.` });
        }
      } catch (error) {
        console.error("Auto-fill error:", error);
      } finally {
        prefix === 'wali' ? setIsSearchingWali(false) : setIsSearchingAnak(false);
      }
    }
  };

  useEffect(() => { handleAutoFill(waliNik, 'wali'); }, [waliNik, firestore]);
  useEffect(() => { handleAutoFill(anakNik, 'anak'); }, [anakNik, firestore]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user || !firestore) return;

    setIsSubmitting(true);
    try {
      const docRef = await addSubmission(firestore, user.uid, {
          requesterName: values.wali.name,
          nik: values.wali.nik,
          letterType: 'Surat Keterangan Wali',
          formData: values,
      });
      setTicketNumber(docRef.id);
      setIsSubmitted(true);
    } catch (error: any) {
      toast({ title: "Gagal Mengajukan", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isSubmitted) {
    return <SubmissionSuccess ticketNumber={ticketNumber} onReset={() => setIsSubmitted(false)} />;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="p-4 bg-primary/5 border rounded-lg flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <FormField control={form.control} name="purpose" render={({ field }) => (
                <FormItem className="flex-1">
                    <FormLabel className="font-bold">Untuk Persyaratan / Keperluan</FormLabel>
                    <FormControl><Input placeholder="Contoh: Pengambilan Bantuan Program PIP di Bank BRI" {...field} disabled={isSubmitting} /></FormControl>
                    <FormMessage />
                </FormItem>
            )} />
        </div>

        <FormSection title="Menerangkan Bahwa (Data Wali / Nenek)" icon={User}>
          <FormField control={form.control} name="wali.nik" render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel className="font-bold text-primary">NIK Wali</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input placeholder="3301xxxxxxxxxxxx" {...field} disabled={isSubmitting} maxLength={16} />
                  {isSearchingWali && <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-primary" />}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
          
          <FormField control={form.control} name="wali.name" render={({ field }) => (
            <FormItem>
              <FormLabel>Nama Lengkap</FormLabel>
              <FormControl><Input placeholder="Sesuai KTP" {...field} disabled={isSubmitting} className="uppercase" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          
          <FormField control={form.control} name="wali.gender" render={({ field }) => (
            <FormItem>
              <FormLabel>Jenis Kelamin</FormLabel>
              <FormControl><Input placeholder="Laki-Laki / Perempuan" {...field} disabled={isSubmitting} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          
          <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="wali.birthPlace" render={({ field }) => (
              <FormItem><FormLabel>Tempat Lahir</FormLabel><FormControl><Input placeholder="Kota" {...field} disabled={isSubmitting} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="wali.birthDate" render={({ field }) => (
              <FormItem><FormLabel>Tgl Lahir</FormLabel><FormControl><Input placeholder="DD-MM-YYYY" {...field} disabled={isSubmitting} /></FormControl><FormMessage /></FormItem>
            )} />
          </div>
          
          <FormField control={form.control} name="wali.job" render={({ field }) => (
            <FormItem><FormLabel>Pekerjaan</FormLabel><FormControl><Input placeholder="Contoh: Ibu Rumah Tangga" {...field} disabled={isSubmitting} /></FormControl><FormMessage /></FormItem>
          )} />
          
          <FormField control={form.control} name="wali.address" render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel>Alamat Lengkap</FormLabel>
              <FormControl><Textarea placeholder="Alamat lengkap sesuai KTP" {...field} disabled={isSubmitting} className="uppercase" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </FormSection>

        <FormSection title="Adalah Wali / Nenek Dari (Data Anak)" icon={Baby}>
          <FormField control={form.control} name="anak.nik" render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel className="font-bold text-primary">NIK Anak</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input placeholder="3301xxxxxxxxxxxx" {...field} disabled={isSubmitting} maxLength={16} />
                  {isSearchingAnak && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-primary" />}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
          
          <FormField control={form.control} name="anak.name" render={({ field }) => (
            <FormItem>
              <FormLabel>Nama Lengkap Anak</FormLabel>
              <FormControl><Input placeholder="Nama Lengkap Anak" {...field} disabled={isSubmitting} className="uppercase" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          
          <FormField control={form.control} name="anak.gender" render={({ field }) => (
            <FormItem>
              <FormLabel>Jenis Kelamin</FormLabel>
              <FormControl><Input placeholder="Laki-Laki / Perempuan" {...field} disabled={isSubmitting} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          
          <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="anak.birthPlace" render={({ field }) => (
              <FormItem><FormLabel>Tempat Lahir</FormLabel><FormControl><Input placeholder="Kota" {...field} disabled={isSubmitting} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="anak.birthDate" render={({ field }) => (
              <FormItem><FormLabel>Tgl Lahir</FormLabel><FormControl><Input placeholder="DD-MM-YYYY" {...field} disabled={isSubmitting} /></FormControl><FormMessage /></FormItem>
            )} />
          </div>
          
          <FormField control={form.control} name="anak.address" render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel>Alamat Lengkap Anak</FormLabel>
              <FormControl><Textarea placeholder="Alamat lengkap" {...field} disabled={isSubmitting} className="uppercase" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </FormSection>

        <Button type="submit" size="lg" disabled={isSubmitting} className="w-full">
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Ajukan Surat Keterangan Wali'}
        </Button>
      </form>
    </Form>
  );
}
