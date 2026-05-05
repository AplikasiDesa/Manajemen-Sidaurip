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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
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

const formSchema = z.object({
  submissionType: z.enum(['self', 'child'], {
    required_error: 'Pilih jenis pengajuan.',
  }),
  purpose: z.string().min(1, 'Keperluan wajib diisi.'),
  
  // Pemohon
  applicantNik: z.string().length(16, 'NIK harus 16 digit.'),
  applicantName: z.string().min(1, 'Nama pemohon wajib diisi.'),
  applicantGender: z.string().min(1, 'Jenis kelamin wajib diisi.'),
  applicantBirthPlace: z.string().min(1, 'Tempat lahir wajib diisi.'),
  applicantBirthDate: z.string().min(1, 'Tanggal lahir wajib diisi.'),
  applicantReligion: z.string().min(1, 'Agama wajib diisi.'),
  applicantJob: z.string().min(1, 'Pekerjaan wajib diisi.'),
  applicantAddress: z.string().min(1, 'Alamat wajib diisi.'),

  // Anak (Optional depending on submissionType)
  childNik: z.string().optional(),
  childName: z.string().optional(),
  childGender: z.string().optional(),
  childBirthPlace: z.string().optional(),
  childBirthDate: z.string().optional(),
  childReligion: z.string().optional(),
  childJob: z.string().optional(),
  childAddress: z.string().optional(),

  attachmentKtp: z.any().optional(),
  attachmentKk: z.any().optional(),
  attachmentRtRw: z.any().optional(),
});

export function SktmForm() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [ticketNumber, setTicketNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSearchingResident, setIsSearchingResident] = useState(false);
  const [isSearchingChild, setIsSearchingChild] = useState(false);
  
  const { firestore, user } = useFirebase();
  const { toast } = useToast();
  const [ktpFile, setKtpFile] = useState<FileList | null>(null);
  const [kkFile, setKkFile] = useState<FileList | null>(null);
  const [rtRwFile, setRtRwFile] = useState<FileList | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      submissionType: 'child',
      purpose: '',
      applicantNik: '',
      applicantName: '',
      applicantGender: '',
      applicantBirthPlace: '',
      applicantBirthDate: '',
      applicantReligion: '',
      applicantJob: '',
      applicantAddress: '',
      childNik: '',
      childName: '',
      childGender: '',
      childBirthPlace: '',
      childBirthDate: '',
      childReligion: '',
      childJob: '',
      childAddress: '',
    },
  });

  const submissionType = form.watch('submissionType');
  const applicantNikValue = form.watch('applicantNik');
  const childNikValue = form.watch('childNik');

  // Effect untuk Auto-fill Data Pemohon
  useEffect(() => {
    const fetchResident = async () => {
      if (applicantNikValue?.length === 16 && firestore) {
        setIsSearchingResident(true);
        try {
          const resident = await getResidentByNik(firestore, applicantNikValue);
          if (resident) {
            form.setValue('applicantName', resident.fullName.toUpperCase());
            form.setValue('applicantGender', resident.gender);
            form.setValue('applicantBirthPlace', resident.placeOfBirth);
            form.setValue('applicantBirthDate', formatDbDateToForm(resident.dateOfBirth));
            form.setValue('applicantReligion', resident.religion);
            form.setValue('applicantJob', resident.occupation);
            
            const fullAddress = `${resident.address}, RT ${resident.rt} RW ${resident.rw}, ${resident.kelurahan}, KEC. GANDRUNGMANGU, KAB. CILACAP`.toUpperCase();
            form.setValue('applicantAddress', fullAddress);
            
            toast({
              title: "Data Pemohon Ditemukan",
              description: `Data diri telah diisi otomatis.`,
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
  }, [applicantNikValue, firestore, form, toast]);

  // Effect untuk Auto-fill Data Anak
  useEffect(() => {
    const fetchChild = async () => {
      if (submissionType === 'child' && childNikValue?.length === 16 && firestore) {
        setIsSearchingChild(true);
        try {
          const resident = await getResidentByNik(firestore, childNikValue);
          if (resident) {
            form.setValue('childName', resident.fullName.toUpperCase());
            form.setValue('childGender', resident.gender);
            form.setValue('childBirthPlace', resident.placeOfBirth);
            form.setValue('childBirthDate', formatDbDateToForm(resident.dateOfBirth));
            form.setValue('childReligion', resident.religion);
            form.setValue('childJob', resident.occupation);
            
            const fullAddress = `${resident.address}, RT ${resident.rt} RW ${resident.rw}, ${resident.kelurahan}, KEC. GANDRUNGMANGU, KAB. CILACAP`.toUpperCase();
            form.setValue('childAddress', fullAddress);
            
            toast({
              title: "Data Anak Ditemukan",
              description: `Data anak telah diisi otomatis.`,
            });
          }
        } catch (error: any) {
          console.error("Auto-fill error:", error);
        } finally {
          setIsSearchingChild(false);
        }
      }
    };

    fetchChild();
  }, [childNikValue, firestore, form, toast, submissionType]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user || !firestore) {
      toast({ title: 'Gagal', description: 'Layanan database tidak tersedia.', variant: 'destructive' });
      return;
    }

    const filesToUpload: { fieldName: string; file: File }[] = [];
    if (ktpFile?.[0]) filesToUpload.push({ fieldName: 'KTP Pemohon', file: ktpFile[0] });
    if (kkFile?.[0]) filesToUpload.push({ fieldName: 'Kartu Keluarga', file: kkFile[0] });
    if (rtRwFile?.[0]) filesToUpload.push({ fieldName: 'Pengantar RT/RW', file: rtRwFile[0] });

    if (filesToUpload.length < 2 || !ktpFile?.[0] || !kkFile?.[0]) {
      toast({ title: 'Berkas Tidak Lengkap', description: 'Harap unggah berkas KTP dan KK.', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await addSubmission(firestore, user.uid, {
        requesterName: values.applicantName,
        nik: values.applicantNik,
        letterType: 'Surat Keterangan Tidak Mampu',
        formData: values,
        files: filesToUpload,
      });
      setTicketNumber(result.id);
      setIsSubmitted(true);
    } catch (error: any) {
      toast({ title: "Gagal Mengajukan", description: error.message, variant: 'destructive' });
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
        <div className="p-6 border rounded-xl bg-green-50/50 space-y-6 shadow-sm border-green-100">
            <FormField
              control={form.control}
              name="submissionType"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel className="text-base font-bold text-green-800">Jenis Pengajuan</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col sm:flex-row gap-4"
                    >
                      <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-lg border border-green-200">
                        <RadioGroupItem value="self" id="self" />
                        <Label htmlFor="self" className="cursor-pointer">Yang Bersangkutan</Label>
                      </div>
                      <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-lg border border-green-200">
                        <RadioGroupItem value="child" id="child" />
                        <Label htmlFor="child" className="cursor-pointer">Orang Tua / Wali (Untuk Anak)</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <FormField
                    control={form.control}
                    name="purpose"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel className="font-bold">Keperluan Surat</FormLabel>
                        <FormControl>
                            <Input placeholder="Contoh: Keringanan Biaya Sekolah / BPJS" {...field} disabled={isSubmitting} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="applicantNik"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel className="font-bold">NIK Pemohon {submissionType === 'child' ? '/ Orang Tua' : ''}</FormLabel>
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
            </div>
        </div>

        <FormSection title={submissionType === 'child' ? "Data Orang Tua / Wali" : "Data Pemohon"}>
          <FormField
            control={form.control}
            name="applicantName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nama Lengkap</FormLabel>
                <FormControl><Input placeholder="Sesuai KTP" {...field} disabled={isSubmitting} className="uppercase" /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="applicantGender"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Jenis Kelamin</FormLabel>
                <FormControl><Input placeholder="Jenis Kelamin" {...field} disabled={isSubmitting} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="applicantBirthPlace"
              render={({ field }) => (
                <FormItem><FormLabel>Tempat Lahir</FormLabel><FormControl><Input placeholder="Cilacap" {...field} disabled={isSubmitting} /></FormControl><FormMessage /></FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="applicantBirthDate"
              render={({ field }) => (
                <FormItem><FormLabel>Tanggal Lahir</FormLabel><FormControl><Input placeholder="DD-MM-YYYY" {...field} disabled={isSubmitting} /></FormControl><FormMessage /></FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="applicantReligion"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Agama</FormLabel>
                <FormControl><Input placeholder="Agama" {...field} disabled={isSubmitting} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="applicantJob"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pekerjaan</FormLabel>
                <FormControl>
                  <Input placeholder="Contoh: Buruh Tani" {...field} disabled={isSubmitting} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="applicantAddress"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Alamat Lengkap</FormLabel>
                <FormControl><Textarea placeholder="Alamat lengkap sesuai KTP" {...field} disabled={isSubmitting} className="uppercase" /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </FormSection>

        {submissionType === 'child' && (
          <FormSection title="Data Anak Yang Diusulkan">
            <FormField control={form.control} name="childNik" render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel className="font-bold text-primary">NIK Anak</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input placeholder="3301xxxxxxxxxxxx" {...field} disabled={isSubmitting} maxLength={16} />
                      {isSearchingChild && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormDescription>Masukkan NIK Anak untuk pengisian otomatis.</FormDescription>
                  <FormMessage />
                </FormItem>
            )} />
            <FormField control={form.control} name="childName" render={({ field }) => (
                <FormItem><FormLabel>Nama Anak</FormLabel><FormControl><Input placeholder="Nama Lengkap Anak" {...field} disabled={isSubmitting} className="uppercase" /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="childGender" render={({ field }) => (
                <FormItem><FormLabel>Jenis Kelamin</FormLabel><FormControl><Input placeholder="Jenis Kelamin" {...field} disabled={isSubmitting} /></FormControl><FormMessage /></FormItem>
            )} />
             <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="childBirthPlace" render={({ field }) => (
                  <FormItem><FormLabel>Tempat Lahir</FormLabel><FormControl><Input placeholder="Cilacap" {...field} disabled={isSubmitting} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="childBirthDate" render={({ field }) => (
                  <FormItem><FormLabel>Tanggal Lahir</FormLabel><FormControl><Input placeholder="DD-MM-YYYY" {...field} disabled={isSubmitting} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <FormField control={form.control} name="childReligion" render={({ field }) => (
                <FormItem>
                  <FormLabel>Agama</FormLabel>
                  <FormControl><Input placeholder="Agama" {...field} disabled={isSubmitting} /></FormControl>
                  <FormMessage />
                </FormItem>
            )} />
            <FormField control={form.control} name="childJob" render={({ field }) => (
                <FormItem><FormLabel>Pekerjaan/Status</FormLabel><FormControl><Input placeholder="Contoh: Belum Sekolah" {...field} disabled={isSubmitting} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="childAddress" render={({ field }) => (
                <FormItem className="md:col-span-2"><FormLabel>Alamat Anak</FormLabel><FormControl><Textarea placeholder="Alamat lengkap sesuai KTP" {...field} disabled={isSubmitting} className="uppercase" /></FormControl><FormMessage /></FormItem>
            )} />
          </FormSection>
        )}

        <FormSection title="Unggah Berkas Lampiran">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full md:col-span-2">
            <FormField control={form.control} name="attachmentKtp" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Scan/Foto KTP Pemohon</FormLabel>
                    <FormControl>
                      <Input type="file" accept="image/jpeg,image/png,application/pdf" onChange={(e) => setKtpFile(e.target.files)} disabled={isSubmitting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
              )} />
            <FormField control={form.control} name="attachmentKk" render={({ field }) => (
                <FormItem>
                  <FormLabel>Scan/Foto Kartu Keluarga</FormLabel>
                  <FormControl>
                    <Input type="file" accept="image/jpeg,image/png,application/pdf" onChange={(e) => setKkFile(e.target.files)} disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
            )} />
            <FormField control={form.control} name="attachmentRtRw" render={({ field }) => (
                <FormItem>
                  <FormLabel>Pengantar RT/RW (Opsional)</FormLabel>
                  <FormControl>
                    <Input type="file" accept="image/jpeg,image/png,application/pdf" onChange={(e) => setRtRwFile(e.target.files)} disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
            )} />
          </div>
          <p className="text-[10px] text-muted-foreground uppercase font-bold md:col-span-2">File: JPG, PNG, atau PDF. Maksimal 1MB per file.</p>
        </FormSection>

        <Button type="submit" size="lg" disabled={isSubmitting} className="w-full">
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isSubmitting ? 'Mengajukan...' : 'Ajukan Surat Keterangan'}
        </Button>
      </form>
    </Form>
  );
}
