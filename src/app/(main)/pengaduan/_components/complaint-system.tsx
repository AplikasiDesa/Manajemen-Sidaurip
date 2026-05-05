
'use client';

import { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { summarizeComplaintFeedback } from '@/ai/flows/summarize-complaint-feedback-flow';
import { Complaint } from '@/lib/types';
import {
  Loader2,
  Send,
  Lightbulb,
  MessageSquare,
  Tag,
  ThumbsDown,
  ThumbsUp,
  Meh,
  Calendar,
  CornerDownRight,
  User,
  MapPin,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { addDoc, collection, serverTimestamp, query, orderBy, limit, where } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { getCitizenProfile } from '@/lib/citizens';

const sentimentIcons = {
  positive: <ThumbsUp className="h-4 w-4 text-green-500" />,
  negative: <ThumbsDown className="h-4 w-4 text-red-500" />,
  neutral: <Meh className="h-4 w-4 text-yellow-500" />,
};

export function ComplaintSystem() {
  const [newComplaintText, setNewComplaintText] = useState('');
  const [reporterName, setReporterName] = useState('');
  const [reporterAddress, setReporterAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { toast } = useToast();
  const { firestore, user } = useFirebase();

  const isAdmin = user?.email === 'sidaurip@gmail.id';

  const complaintsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    const baseQuery = collection(firestore, 'complaints');
    
    if (!isAdmin) {
      return query(
        baseQuery, 
        where('submitterAuthUid', '==', user.uid),
        limit(100)
      );
    }

    return query(baseQuery, orderBy('submissionDate', 'desc'), limit(100));
  }, [firestore, user, isAdmin]);

  const { data: rawComplaints, isLoading: isLoadingComplaints } = useCollection<Complaint>(complaintsQuery);

  const complaints = useMemo(() => {
    if (!rawComplaints) return null;
    if (isAdmin) return rawComplaints;

    return [...rawComplaints].sort((a, b) => {
      const dateA = a.submissionDate?.toMillis?.() || 0;
      const dateB = b.submissionDate?.toMillis?.() || 0;
      return dateB - dateA;
    });
  }, [rawComplaints, isAdmin]);

  const handleSubmit = async () => {
    if (!reporterName.trim() || !reporterAddress.trim() || !newComplaintText.trim()) {
      toast({
        title: 'Data Tidak Lengkap',
        description: 'Mohon isi nama, alamat, dan deskripsi pengaduan.',
        variant: 'destructive',
      });
      return;
    }

    if (!firestore) {
      toast({
        title: 'Gagal Mengirim',
        description: 'Koneksi ke database gagal. Coba lagi nanti.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { summary, sentiment, keywords } =
        await summarizeComplaintFeedback({
          complaintText: newComplaintText,
        });

      // Ambil profil kontak warga jika tersedia
      let profile = null;
      if (user) {
        profile = await getCitizenProfile(firestore, user.uid);
      }

      const complaintData = {
        description: newComplaintText,
        reporterName: reporterName.toUpperCase(),
        reporterAddress: reporterAddress.toUpperCase(),
        phoneNumber: profile?.phoneNumber || '',
        email: profile?.email || user?.email || '',
        summaryLLM: summary,
        sentiment: sentiment,
        keywords: keywords,
        submitterAuthUid: user ? user.uid : null,
        status: 'New',
        submissionDate: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      
      await addDoc(collection(firestore, 'complaints'), complaintData);

      setNewComplaintText('');
      setReporterName('');
      setReporterAddress('');

      toast({
        title: 'Pengaduan Terkirim',
        description: 'Terima kasih atas masukan Anda.',
      });
    } catch (error) {
      toast({
        title: 'Gagal Mengirim',
        description: 'Terjadi kesalahan. Coba lagi nanti.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto grid lg:grid-cols-3 gap-8">

      {/* FORM */}
      <div className="lg:col-span-1">
        <Card className="rounded-3xl shadow-sm overflow-hidden border-none bg-white">
          <CardHeader className="bg-slate-900 text-white p-8">
            <CardTitle className="text-xl font-black uppercase tracking-tight">Buat Pengaduan</CardTitle>
            <CardDescription className="text-slate-400 font-medium">
              Identitas Anda diperlukan untuk koordinasi tindak lanjut.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reporterName" className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <User className="w-3 h-3" /> Nama Pengadu
                </Label>
                <Input 
                  id="reporterName"
                  placeholder="Nama Lengkap Anda" 
                  value={reporterName}
                  onChange={(e) => setReporterName(e.target.value)}
                  disabled={isSubmitting}
                  className="rounded-xl border-slate-100 bg-slate-50 uppercase text-xs font-bold"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reporterAddress" className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <MapPin className="w-3 h-3" /> Alamat Lengkap
                </Label>
                <Input 
                  id="reporterAddress"
                  placeholder="Contoh: RT 01 RW 02 Dusun Kuripan" 
                  value={reporterAddress}
                  onChange={(e) => setReporterAddress(e.target.value)}
                  disabled={isSubmitting}
                  className="rounded-xl border-slate-100 bg-slate-50 uppercase text-xs font-bold"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <MessageSquare className="w-3 h-3" /> Isi Pengaduan
                </Label>
                <Textarea
                  id="description"
                  placeholder="Tuliskan keluhan atau saran Anda di sini..."
                  className="rounded-2xl border-slate-100 bg-slate-50 focus:ring-accent min-h-[150px] text-sm"
                  value={newComplaintText}
                  onChange={(e) => setNewComplaintText(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full bg-accent text-slate-900 font-black h-14 rounded-2xl hover:bg-yellow-600 transition-all active:scale-95"
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Send className="mr-2 h-5 w-5" />
              )}
              KIRIM PENGADUAN
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* DAFTAR */}
      <div className="lg:col-span-2">
        <Card className="rounded-3xl shadow-sm border-none bg-white">
          <CardHeader className="p-8 border-b border-slate-50">
            <CardTitle className="text-xl font-black uppercase tracking-tight text-slate-900">
               {isAdmin ? 'Seluruh Pengaduan Warga' : 'Riwayat Pengaduan Saya'}
            </CardTitle>
            <CardDescription className="font-medium text-slate-500">
              Daftar laporan dan status penanganannya.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-8 pt-6">
            {isLoadingComplaints || !user ? (
                 <div className="space-y-4">
                    <Skeleton className="h-20 w-full rounded-2xl" />
                    <Skeleton className="h-20 w-full rounded-2xl" />
                    <Skeleton className="h-20 w-full rounded-2xl" />
                 </div>
            ) : complaints?.length === 0 ? (
                <div className="text-center py-20 bg-slate-50 rounded-[2rem] border border-dashed">
                    <MessageSquare className="h-10 w-10 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-400 font-black uppercase text-xs tracking-widest">Belum ada pengaduan yang tercatat.</p>
                </div>
            ) : (
                <Accordion
                type="single"
                collapsible
                className="w-full space-y-4"
                >
                {complaints?.map((complaint) => (
                    <AccordionItem
                    value={complaint.id}
                    key={complaint.id}
                    className="border border-slate-100 rounded-[1.5rem] px-6 transition-all hover:border-accent hover:shadow-sm"
                    >
                    <AccordionTrigger className="py-5 hover:no-underline">

                        <div className="flex flex-col gap-2 text-left w-full">

                        <div className="flex justify-between items-start gap-4">

                            <p className="text-sm font-black text-slate-800 line-clamp-1 uppercase tracking-tight">
                            {complaint.description}
                            </p>

                            <Badge
                            variant={
                                complaint.sentiment === 'negative'
                                ? 'destructive'
                                : complaint.sentiment === 'positive'
                                ? 'default'
                                : 'secondary'
                            }
                            className="capitalize shrink-0 flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black"
                            >
                            {sentimentIcons[complaint.sentiment]}
                            {complaint.sentiment}
                            </Badge>
                        </div>

                        <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {complaint.submissionDate?.toDate().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric'})}</span>
                            {isAdmin && <span className="text-accent">DARI: {complaint.reporterName}</span>}
                        </div>
                        </div>

                    </AccordionTrigger>

                    <AccordionContent className="space-y-8 pt-2 pb-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div className="space-y-1">
                              <p className="font-black uppercase tracking-widest text-[9px] text-slate-400">Pengadu</p>
                              <p className="text-sm font-bold">{complaint.reporterName}</p>
                           </div>
                           <div className="space-y-1">
                              <p className="font-black uppercase tracking-widest text-[9px] text-slate-400">Alamat</p>
                              <p className="text-sm font-medium">{complaint.reporterAddress}</p>
                           </div>
                        </div>

                        <div className="space-y-3 pt-4 border-t border-slate-50">
                          <p className="font-black uppercase tracking-widest text-[10px] text-slate-400 flex items-center gap-2">
                              <MessageSquare className="w-3 h-3" />
                              Isi Aduan
                          </p>
                          <div className="p-5 rounded-2xl bg-slate-50 text-slate-700 text-sm font-medium border border-slate-100 leading-relaxed">
                              {complaint.description}
                          </div>
                        </div>

                        <div className="p-6 rounded-[2rem] border-2 border-dashed border-accent/20 bg-accent/5">
                          <h4 className="font-black uppercase tracking-widest text-[10px] text-accent mb-4 flex items-center gap-2">
                              <Lightbulb className="w-4 h-4" />
                              Analisis AI Desa
                          </h4>

                          <div className="space-y-6 text-sm">

                            <div className="space-y-2">
                              <p className="font-black text-slate-900 uppercase text-[10px]">Ringkasan Masalah:</p>
                              <p className="text-slate-600 leading-relaxed font-medium italic">
                                "{complaint.summaryLLM}"
                              </p>
                            </div>

                            <div className="space-y-3">
                              <p className="font-black text-slate-900 uppercase text-[10px]">Topik Terdeteksi:</p>
                              <div className="flex flex-wrap gap-2">
                                  {complaint.keywords?.map((kw, i) => (
                                  <Badge
                                      key={i}
                                      variant="outline"
                                      className="font-bold border-accent/30 text-accent uppercase text-[9px] px-3 py-1 bg-white"
                                  >
                                      <Tag className="mr-1.5 h-2 w-2" />
                                      {kw}
                                  </Badge>
                                  ))}
                              </div>
                            </div>
                          </div>
                        </div>

                        {complaint.adminResponse && (
                            <div className="p-6 rounded-[2rem] border bg-emerald-900 text-white space-y-4 shadow-xl">
                                <h4 className="font-black uppercase tracking-[0.2em] text-[10px] text-accent flex items-center gap-2">
                                    <CornerDownRight className="w-4 h-4" />
                                    Tanggapan Pemerintah Desa
                                </h4>
                                <p className="text-sm font-medium leading-relaxed italic text-emerald-50">
                                    "{complaint.adminResponse}"
                                </p>
                            </div>
                        )}

                    </AccordionContent>
                    </AccordionItem>
                ))}
                </Accordion>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
