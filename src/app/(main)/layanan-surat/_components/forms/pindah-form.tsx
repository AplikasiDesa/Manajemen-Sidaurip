'use client';

import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { Loader2, Users } from 'lucide-react';

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

const FormSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="space-y-6">
    <h3 className="text-lg font-semibold border-b pb-2">{title}</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">{children}</div>
  </div>
);

const formSchema = z.object({
  nik: z.string().length(16, 'NIK harus 16 digit.'),
  name: z.string().min(1, 'Nama lengkap wajib diisi.'),
  kkNumber: z.string().min(1, 'Nomor KK wajib diisi.'),
  kkHead: z.string().min(1, 'Nama kepala keluarga wajib diisi.'),
  currentAddressRt: z.string().min(1, 'RT wajib diisi.'),
  currentAddressRw: z.string().min(1, 'RW wajib diisi.'),
  destinationAddress: z.string().min(1, 'Desa tujuan wajib diisi.'),
  destinationAddressRt: z.string().min(1, 'RT tujuan wajib diisi.'),
  destinationAddressRw: z.string().min(1, 'RW tujuan wajib diisi.'),
  destinationKecamatan: z.string().min(1, 'Kecamatan tujuan wajib diisi.'),
  destinationKabupaten: z.string().min(1, 'Kabupaten/Kota tujuan wajib diisi.'),
  destinationProvinsi: z.string().min(1, 'Provinsi tujuan wajib diisi.'),
  familyCount: z.coerce.number().min(1, 'Jumlah keluarga wajib diisi.'),
  familyMembers: z.array(z.object({
    nik: z.string().length(16, 'NIK harus 16 digit.'),
    name: z.string().min(1, 'Nama harus diisi.'),
    relationship: z.string().min(1, 'Hubungan harus diisi.'),
  })).optional(),
  attachmentKtp: z.any().optional(),
  attachmentKk: z.any().optional(),
});

export function PindahForm() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [ticketNumber, setTicketNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSearchingResident, setIsSearchingResident] = useState(false);
  const { firestore, user } = useFirebase();
  const { toast } = useToast();
  const [ktpFile, setKtpFile] = useState<FileList | null>(null);
  const [kkFile, setKkFile] = useState<FileList | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nik: '',
      name: '',
      kkNumber: '',
      kkHead: '',
      currentAddressRt: '',
      currentAddressRw: '',
      destinationAddress: '',
      destinationAddressRt: '',
      destinationAddressRw: '',
      destinationKecamatan: '',
      destinationKabupaten: '',
      destinationProvinsi: '',
      familyCount: 1,
      familyMembers: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "familyMembers",
  });

  const nikValue = form.watch('nik');
  const familyCount = form.watch('familyCount');

  useEffect(() => {
    const fetchResident = async () => {
      if (nikValue.length === 16 && firestore) {
        setIsSearchingResident(true);
        try {
          const resident = await getResidentByNik(firestore, nikValue);
          if (resident) {
            form.setValue('name', resident.fullName.toUpperCase());
            
            if (resident.rtRw) {
              const parts = resident.rtRw.split('/');
              if (parts.length === 2) {
                form.setValue('currentAddressRt', parts[0].trim());
                form.setValue('currentAddressRw', parts[1].trim());
              }
            }

            toast({
              title: "Data Pemohon Ditemukan",
              description: `Data telah diisi otomatis berdasarkan NIK.`,
            });
          }
        } catch (e) {
          console.error("Auto-fill error:", e);
        } finally {
          setIsSearchingResident(false);
        }
      }
    };

    fetchResident();
  }, [nikValue, firestore, form, toast]);

  // Efek untuk menambah/mengurangi input anggota keluarga secara otomatis
  useEffect(() => {
    const count = Math.max(0, familyCount);
    const currentLength = fields.length;
    
    if (count > currentLength) {
      for (let i = currentLength; i < count; i++) {
        append({ nik: '', name: '', relationship: '' }, { shouldFocus: false });
      }
    } else if (count < currentLength) {
      for (let i = currentLength - 1; i >= count; i--) {
        remove(i);
      }
    }
  }, [familyCount, fields.length, append, remove]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user || !firestore) {
      toast({ title: 'Database error.', variant: 'destructive' });
      return;
    }

    const filesToUpload: { fieldName: string; file: File }[] = [];
    if (ktpFile?.[0]) filesToUpload.push({ fieldName: 'KTP Pemohon', file: ktpFile[0] });
    if (kkFile?.[0]) filesToUpload.push({ fieldName: 'Kartu Keluarga', file: kkFile[0] });

    if (filesToUpload.length < 2) {
      toast({ title: 'Harap unggah berkas KTP dan KK.', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      const docRef = await addSubmission(firestore, user.uid, {
        requesterName: values.name,
        nik: values.nik,
        letterType: 'Surat Pengantar Pindah',
        formData: values,
        files: filesToUpload,
      });
      setTicketNumber(docRef.id);
      setIsSubmitted(true);
    } catch (error: any) {
      toast({ title: error.message, variant: 'destructive' });
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
        <div className="space-y-6 rounded-md border p-4 md:p-6 bg-white shadow-sm">
          <FormField
            control={form.control}
            name="nik"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-bold text-primary">NIK Pemohon (Auto-fill)</FormLabel>
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
                <FormDescription>Masukkan NIK untuk pengisian otomatis data asal.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormSection title="Data Pemohon">
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
              name="kkNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nomor Kartu Keluarga</FormLabel>
                  <FormControl>
                    <Input placeholder="3301xxxxxxxxxxxxxxxx" {...field} disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="kkHead"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Kepala Keluarga</FormLabel>
                  <FormControl>
                    <Input placeholder="Sesuai KK" {...field} disabled={isSubmitting} className="uppercase" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </FormSection>

          <FormSection title="Alamat Sekarang (Asal)">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="currentAddressRt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>RT</FormLabel>
                    <FormControl>
                      <Input placeholder="001" {...field} disabled={isSubmitting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="currentAddressRw"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>RW</FormLabel>
                    <FormControl>
                      <Input placeholder="001" {...field} disabled={isSubmitting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormItem><FormLabel>Desa</FormLabel><FormControl><Input value="Sidaurip" disabled /></FormControl></FormItem>
            <FormItem><FormLabel>Kecamatan</FormLabel><FormControl><Input value="Sidaurip" disabled /></FormControl></FormItem>
            <FormItem><FormLabel>Kabupaten / Kota</FormLabel><FormControl><Input value="Cilacap" disabled /></FormControl></FormItem>
            <FormItem><FormLabel>Provinsi</FormLabel><FormControl><Input value="Jawa Tengah" disabled /></FormControl></FormItem>
          </FormSection>

          <FormSection title="Alamat Tujuan Pindah">
            <div className="grid grid-cols-2 gap-4">
               <FormField
                control={form.control}
                name="destinationAddressRt"
                render={({ field }) => (
                  <FormItem><FormLabel>RT</FormLabel><FormControl><Input placeholder="001" {...field} disabled={isSubmitting} /></FormControl><FormMessage /></FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="destinationAddressRw"
                render={({ field }) => (
                  <FormItem><FormLabel>RW</FormLabel><FormControl><Input placeholder="001" {...field} disabled={isSubmitting} /></FormControl><FormMessage /></FormItem>
                )}
              />
            </div>
            <FormField control={form.control} name="destinationAddress" render={({ field }) => (
                <FormItem><FormLabel>Desa Tujuan</FormLabel><FormControl><Input placeholder="Desa Tujuan" {...field} disabled={isSubmitting} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="destinationKecamatan" render={({ field }) => (
                <FormItem><FormLabel>Kecamatan Tujuan</FormLabel><FormControl><Input placeholder="Kecamatan" {...field} disabled={isSubmitting} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="destinationKabupaten" render={({ field }) => (
                <FormItem><FormLabel>Kabupaten / Kota Tujuan</FormLabel><FormControl><Input placeholder="Kabupaten" {...field} disabled={isSubmitting} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="destinationProvinsi" render={({ field }) => (
                <FormItem><FormLabel>Provinsi Tujuan</FormLabel><FormControl><Input placeholder="Provinsi" {...field} disabled={isSubmitting} /></FormControl><FormMessage /></FormItem>
            )} />
          </FormSection>
          
          <div className="space-y-6">
            <FormField
                control={form.control}
                name="familyCount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold">Jumlah Keluarga Yang Pindah</FormLabel>
                    <FormControl><Input type="number" placeholder="1" {...field} disabled={isSubmitting} min={1} /></FormControl>
                    <FormDescription>Isi jumlah orang yang ikut pindah, lalu lengkapi daftar di bawah.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

            {fields.length > 0 && (
              <div className="space-y-4 rounded-xl border-2 border-dashed p-4 bg-muted/30">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-5 w-5 text-primary" />
                  <h4 className="font-bold text-sm">Daftar Anggota Keluarga Yang Pindah</h4>
                </div>
                
                {fields.map((item, index) => (
                  <div key={item.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-background border rounded-lg shadow-sm relative">
                    <div className="absolute -left-3 -top-3 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs shadow-md">
                      {index + 1}
                    </div>
                    
                    <FormField
                      control={form.control}
                      name={`familyMembers.${index}.nik`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">NIK</FormLabel>
                          <FormControl><Input placeholder="NIK 16 digit" {...field} disabled={isSubmitting} maxLength={16} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name={`familyMembers.${index}.name`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Nama Lengkap</FormLabel>
                          <FormControl><Input placeholder="Nama Lengkap" {...field} disabled={isSubmitting} className="uppercase" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name={`familyMembers.${index}.relationship`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Hubungan (SHDK)</FormLabel>
                          <FormControl><Input placeholder="Contoh: Istri / Anak" {...field} disabled={isSubmitting} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
            
            <FormSection title="Unggah Berkas">
                <FormField
                control={form.control}
                name="attachmentKtp"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Scan/Foto KTP Pemohon</FormLabel>
                    <FormControl><Input type="file" accept="image/jpeg,image/png,application/pdf" onChange={(e) => setKtpFile(e.target.files)} disabled={isSubmitting} /></FormControl>
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
                    <FormControl><Input type="file" accept="image/jpeg,image/png,application/pdf" onChange={(e) => setKkFile(e.target.files)} disabled={isSubmitting} /></FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </FormSection>
        </div>
        
        <Button type="submit" size="lg" disabled={isSubmitting} className="w-full">
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isSubmitting ? 'Mengajukan...' : 'Ajukan Surat Pindah'}
        </Button>
      </form>
    </Form>
  );
}