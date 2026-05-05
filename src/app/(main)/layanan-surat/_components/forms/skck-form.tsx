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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { skckPurposeOptions } from '@/lib/options';
import { SubmissionSuccess } from '../submission-success';
import { addSubmission } from '@/lib/submissions';
import { useFirebase } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { getResidentByNik } from '@/lib/residents';
import { formatDbDateToForm } from '@/lib/utils';

const formSchema = z.object({
  nik: z.string().length(16, 'NIK harus 16 digit.'),
  purpose: z.string().min(1, 'Keperluan wajib dipilih.'),
  otherPurpose: z.string().optional(),
  name: z.string().min(1, 'Nama lengkap wajib diisi.'),
  gender: z.string().min(1, 'Jenis kelamin wajib diisi.'),
  birthPlace: z.string().min(1, 'Tempat lahir wajib diisi.'),
  birthDate: z.string().min(1, 'Tanggal lahir wajib diisi.'),
  nationality: z.string().min(1, 'Kewarganegaraan wajib diisi.'),
  religion: z.string().min(1, 'Agama wajib diisi.'),
  job: z.string().min(1, 'Pekerjaan wajib diisi.'),
  address: z.string().min(1, 'Alamat wajib diisi.'),
});

export function SkckForm() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [ticketNumber, setTicketNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  
  const { firestore, user } = useFirebase();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nik: '',
      purpose: '',
      otherPurpose: '',
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
  const purposeValue = form.watch('purpose');

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
            form.setValue('religion', res.religion);
            form.setValue('job', res.occupation);
            
            const fullAddress = `${res.address}, RT ${res.rt} RW ${res.rw}, ${res.kelurahan}, KEC. GANDRUNGMANGU, KAB. CILACAP`.toUpperCase();
            form.setValue('address', fullAddress);
            
            toast({ title: "Data Berhasil Dimuat" });
          } else {
            toast({ title: "NIK Tidak Terdaftar", variant: "destructive" });
          }
        } catch (error: any) {
          toast({ title: "Gangguan Sistem", description: error.message, variant: "destructive" });
        } finally {
          setIsSearching(false);
        }
      }
    };
    fetchResident();
  }, [nikValue, firestore, form, toast]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user || !firestore) return;

    // Jika memilih lainnya, gunakan nilai dari input manual
    const finalPurpose = values.purpose === 'Lainnya' ? values.otherPurpose : values.purpose;
    
    if (values.purpose === 'Lainnya' && !values.otherPurpose) {
        form.setError('otherPurpose', { message: 'Silakan isi keperluan manual.' });
        return;
    }

    setIsSubmitting(true);
    try {
      const docRef = await addSubmission(firestore, user.uid, {
        requesterName: values.name,
        nik: values.nik,
        letterType: 'Surat Pengantar SKCK',
        formData: {
            ...values,
            purpose: finalPurpose // Gunakan tujuan yang sudah diproses
        },
      });
      setTicketNumber(docRef.id);
      setIsSubmitted(true);
    } catch (error: any) {
      toast({ title: "Gagal Mengajukan", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isSubmitted) return <SubmissionSuccess ticketNumber={ticketNumber} onReset={() => setIsSubmitted(false)} />;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="nik"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-bold text-primary">NIK Pemohon (16 Digit)</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input placeholder="Masukkan NIK untuk mengisi otomatis..." {...field} disabled={isSubmitting} maxLength={16} />
                  {isSearching && <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-primary" />}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
            control={form.control}
            name="purpose"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Keperluan SKCK</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Pilih Keperluan" /></SelectTrigger></FormControl>
                    <SelectContent>{skckPurposeOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )}
            />

            {purposeValue === 'Lainnya' && (
                <FormField
                control={form.control}
                name="otherPurpose"
                render={({ field }) => (
                    <FormItem className="animate-in fade-in slide-in-from-top-2 duration-300">
                    <FormLabel className="font-bold text-accent">Sebutkan Keperluan Manual</FormLabel>
                    <FormControl>
                        <Input placeholder="Contoh: Persyaratan Ijin Usaha Khusus" {...field} disabled={isSubmitting} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-muted/20 rounded-lg border">
          <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Nama Lengkap</FormLabel><FormControl><Input className="uppercase" {...field} /></FormControl></FormItem>)} />
          
          <FormField control={form.control} name="gender" render={({ field }) => (
            <FormItem>
              <FormLabel>Jenis Kelamin</FormLabel>
              <FormControl><Input placeholder="Laki-Laki / Perempuan" {...field} /></FormControl>
            </FormItem>
          )} />
          
          <FormField control={form.control} name="birthPlace" render={({ field }) => (<FormItem><FormLabel>Tempat Lahir</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
          <FormField control={form.control} name="birthDate" render={({ field }) => (<FormItem><FormLabel>Tanggal Lahir</FormLabel><FormControl><Input {...field} placeholder="DD-MM-YYYY" /></FormControl></FormItem>)} />
          
          <FormField control={form.control} name="religion" render={({ field }) => (
            <FormItem>
              <FormLabel>Agama</FormLabel>
              <FormControl><Input placeholder="Agama" {...field} /></FormControl>
            </FormItem>
          )} />
          
          <FormField control={form.control} name="job" render={({ field }) => (<FormItem><FormLabel>Pekerjaan</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
          <FormField control={form.control} name="address" render={({ field }) => (<FormItem className="md:col-span-2"><FormLabel>Alamat Sesuai KTP</FormLabel><FormControl><Textarea {...field} className="uppercase" /></FormControl></FormItem>)} />
        </div>

        <Button type="submit" size="lg" disabled={isSubmitting} className="w-full">
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Ajukan Pengantar SKCK'}
        </Button>
      </form>
    </Form>
  );
}
