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
import { Textarea } from '@/components/ui/textarea';
import { SubmissionSuccess } from '../submission-success';
import { addSubmission } from '@/lib/submissions';
import { useFirebase } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { getResidentByNik } from '@/lib/residents';
import { formatDbDateToForm } from '@/lib/utils';

const FormSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="space-y-6 rounded-md border p-4 md:p-6 bg-white shadow-sm">
    <h3 className="text-lg font-semibold border-b pb-2">{title}</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">{children}</div>
  </div>
);

const personSchema = z.object({
  nik: z.string().length(16, 'NIK harus 16 digit.'),
  name: z.string().min(1, 'Nama lengkap wajib diisi.'),
  gender: z.string().min(1, 'Jenis kelamin wajib diisi.'),
  birthPlace: z.string().min(1, 'Tempat lahir wajib diisi.'),
  birthDate: z.string().min(1, 'Tanggal lahir wajib diisi.'),
  nationality: z.string().min(1, 'Kewarganegaraan wajib diisi.'),
  religion: z.string().min(1, 'Agama wajib diisi.'),
  job: z.string().min(1, 'Pekerjaan wajib diisi.'),
  address: z.string().min(1, 'Alamat wajib diisi.'),
});

const formSchema = z.object({
  moyang: personSchema,
  anak: personSchema,
  attachmentKtpMoyang: z.any().optional(),
  attachmentKtpAnak: z.any().optional(),
});

export function MoyangForm() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [ticketNumber, setTicketNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSearchingMoyang, setIsSearchingMoyang] = useState(false);
  const [isSearchingAnak, setIsSearchingAnak] = useState(false);
  
  const { firestore, user } = useFirebase();
  const { toast } = useToast();
  const [ktpMoyangFile, setKtpMoyangFile] = useState<FileList | null>(null);
  const [ktpAnakFile, setKtpAnakFile] = useState<FileList | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      moyang: { nik: '', name: '', gender: '', birthPlace: '', birthDate: '', nationality: 'WNI', religion: '', job: '', address: '' },
      anak: { nik: '', name: '', gender: '', birthPlace: '', birthDate: '', nationality: 'WNI', religion: '', job: '', address: '' },
    },
  });

  const moyangNik = form.watch('moyang.nik');
  const anakNik = form.watch('anak.nik');

  const handleAutoFill = async (nik: string, prefix: 'moyang' | 'anak') => {
    if (nik.length === 16 && firestore) {
      prefix === 'moyang' ? setIsSearchingMoyang(true) : setIsSearchingAnak(true);
      try {
        const resident = await getResidentByNik(firestore, nik);
        if (resident) {
          form.setValue(`${prefix}.name`, resident.fullName.toUpperCase());
          form.setValue(`${prefix}.gender`, resident.gender);
          form.setValue(`${prefix}.birthPlace`, resident.placeOfBirth);
          form.setValue(`${prefix}.birthDate`, formatDbDateToForm(resident.dateOfBirth));
          form.setValue(`${prefix}.religion`, resident.religion);
          form.setValue(`${prefix}.job`, resident.occupation);
          
          const fullAddress = `${resident.address}, RT ${resident.rt} RW ${resident.rw}, ${resident.kelurahan}, KEC. GANDRUNGMANGU, KAB. CILACAP`.toUpperCase();
          form.setValue(`${prefix}.address`, fullAddress);
          
          toast({ title: "Data Ditemukan", description: `Data ${prefix === 'moyang' ? 'Orang Tua' : 'Anak'} telah diisi otomatis.` });
        }
      } catch (error) {
        console.error("Auto-fill error:", error);
      } finally {
        prefix === 'moyang' ? setIsSearchingMoyang(false) : setIsSearchingAnak(false);
      }
    }
  };

  useEffect(() => { handleAutoFill(moyangNik, 'moyang'); }, [moyangNik, firestore]);
  useEffect(() => { handleAutoFill(anakNik, 'anak'); }, [anakNik, firestore]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user || !firestore) return;

    const filesToUpload: { fieldName: string; file: File }[] = [];
    if (ktpMoyangFile?.[0]) filesToUpload.push({ fieldName: 'KTP Orang tua kandung', file: ktpMoyangFile[0] });
    if (ktpAnakFile?.[0]) filesToUpload.push({ fieldName: 'KTP Anak Kandung', file: ktpAnakFile[0] });

    if (filesToUpload.length < 2) {
      toast({
        title: 'Berkas Tidak Lengkap',
        description: 'Harap unggah file KTP Orang Tua dan KTP Anak.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const docRef = await addSubmission(firestore, user.uid, {
          requesterName: values.moyang.name,
          nik: values.moyang.nik,
          letterType: 'Surat Keterangan Moyang',
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
    setKtpMoyangFile(null);
    setKtpAnakFile(null);
  };

  if (isSubmitted) {
    return <SubmissionSuccess ticketNumber={ticketNumber} onReset={handleReset} />;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormSection title="Data Moyang (Orang Tua Kandung)">
          <FormField control={form.control} name="moyang.nik" render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel className="font-bold text-primary">NIK Moyang</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input placeholder="3301xxxxxxxxxxxx" {...field} disabled={isSubmitting} maxLength={16} />
                  {isSearchingMoyang && <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-primary" />}
                </div>
              </FormControl>
              <FormDescription>Masukkan NIK Orang Tua untuk pengisian otomatis.</FormDescription>
              <FormMessage />
            </FormItem>
          )} />
          
          <FormField control={form.control} name="moyang.name" render={({ field }) => (
            <FormItem>
              <FormLabel>Nama Lengkap</FormLabel>
              <FormControl><Input placeholder="Sesuai KTP" {...field} disabled={isSubmitting} className="uppercase" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          
          <FormField control={form.control} name="moyang.gender" render={({ field }) => (
            <FormItem>
              <FormLabel>Jenis Kelamin</FormLabel>
              <FormControl><Input placeholder="Laki-Laki / Perempuan" {...field} disabled={isSubmitting} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          
          <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="moyang.birthPlace" render={({ field }) => (
              <FormItem><FormLabel>Tempat Lahir</FormLabel><FormControl><Input placeholder="Kota" {...field} disabled={isSubmitting} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="moyang.birthDate" render={({ field }) => (
              <FormItem><FormLabel>Tgl Lahir</FormLabel><FormControl><Input placeholder="DD-MM-YYYY" {...field} disabled={isSubmitting} /></FormControl><FormMessage /></FormItem>
            )} />
          </div>
          
          <FormField control={form.control} name="moyang.nationality" render={({ field }) => (
            <FormItem>
              <FormLabel>Kewarganegaraan</FormLabel>
              <FormControl><Input placeholder="WNI" {...field} disabled={isSubmitting} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          
          <FormField control={form.control} name="moyang.religion" render={({ field }) => (
            <FormItem>
              <FormLabel>Agama</FormLabel>
              <FormControl><Input placeholder="Agama" {...field} disabled={isSubmitting} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          
          <FormField control={form.control} name="moyang.job" render={({ field }) => (
            <FormItem><FormLabel>Pekerjaan</FormLabel><FormControl><Input placeholder="Contoh: Petani" {...field} disabled={isSubmitting} /></FormControl><FormMessage /></FormItem>
          )} />
          
          <FormField control={form.control} name="moyang.address" render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel>Alamat Domisili</FormLabel>
              <FormControl><Textarea placeholder="Alamat lengkap sesuai KTP" {...field} disabled={isSubmitting} className="uppercase" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </FormSection>

        <FormSection title="Data Anak Kandung">
          <FormField control={form.control} name="anak.nik" render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel className="font-bold text-primary">NIK Anak</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input placeholder="3301xxxxxxxxxxxx" {...field} disabled={isSubmitting} maxLength={16} />
                  {isSearchingAnak && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-primary" />}
                </div>
              </FormControl>
              <FormDescription>Masukkan NIK Anak Kandung untuk pengisian otomatis.</FormDescription>
              <FormMessage />
            </FormItem>
          )} />
          
          <FormField control={form.control} name="anak.name" render={({ field }) => (
            <FormItem>
              <FormLabel>Nama Lengkap</FormLabel>
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
          
          <FormField control={form.control} name="anak.nationality" render={({ field }) => (
            <FormItem>
              <FormLabel>Kewarganegaraan</FormLabel>
              <FormControl><Input placeholder="WNI" {...field} disabled={isSubmitting} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          
          <FormField control={form.control} name="anak.religion" render={({ field }) => (
            <FormItem>
              <FormLabel>Agama</FormLabel>
              <FormControl><Input placeholder="Agama" {...field} disabled={isSubmitting} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          
          <FormField control={form.control} name="anak.job" render={({ field }) => (
            <FormItem><FormLabel>Pekerjaan</FormLabel><FormControl><Input placeholder="Pekerjaan" {...field} disabled={isSubmitting} /></FormControl><FormMessage />
            </FormItem>
          )} />
          
          <FormField control={form.control} name="anak.address" render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel>Alamat Domisili</FormLabel>
              <FormControl><Textarea placeholder="Alamat lengkap" {...field} disabled={isSubmitting} className="uppercase" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </FormSection>

        <FormSection title="Unggah Berkas">
            <FormField
            control={form.control}
            name="attachmentKtpMoyang"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Scan/Foto KTP Orang Tua Kandung</FormLabel>
                <FormControl>
                    <Input type="file" accept="image/jpeg,image/png,application/pdf" onChange={(e) => setKtpMoyangFile(e.target.files)} disabled={isSubmitting} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="attachmentKtpAnak"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Scan/Foto KTP Anak Kandung</FormLabel>
                <FormControl>
                    <Input type="file" accept="image/jpeg,image/png,application/pdf" onChange={(e) => setKtpAnakFile(e.target.files)} disabled={isSubmitting} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </FormSection>

        <Button type="submit" size="lg" disabled={isSubmitting} className="w-full md:w-auto px-12">
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isSubmitting ? 'Mengajukan...' : 'Ajukan Surat'}
        </Button>
      </form>
    </Form>
  );
}
