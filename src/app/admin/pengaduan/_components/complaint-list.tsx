
'use client';

import { useState } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { Complaint } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Send, Lightbulb, MessageSquare, Tag, Calendar, Trash2, User, MapPin, Phone, Mail } from 'lucide-react';
import { updateComplaintResponse, deleteComplaint } from '@/lib/complaints';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

function AdminResponseForm({ complaintId, existingResponse }: { complaintId: string, existingResponse?: string }) {
    const [response, setResponse] = useState(existingResponse || '');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();
    const firestore = useFirestore();

    const handleSubmit = async () => {
        if (!response.trim() || !firestore) return;
        
        setIsSubmitting(true);
        try {
            await updateComplaintResponse(firestore, complaintId, response);
            toast({
                title: "Jawaban Terkirim",
                description: "Tanggapan Anda telah disimpan dan akan ditampilkan kepada warga.",
            });
        } catch (error) {
             toast({
                title: "Gagal Mengirim Jawaban",
                description: "Terjadi kesalahan saat mengirim tanggapan.",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="mt-4 space-y-2">
            <Textarea 
                placeholder="Tulis jawaban atau tanggapan Anda di sini..." 
                rows={4}
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                disabled={isSubmitting}
            />
            <Button onClick={handleSubmit} disabled={isSubmitting || !response.trim()}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                {existingResponse ? 'Perbarui Jawaban' : 'Kirim Jawaban'}
            </Button>
        </div>
    );
}

export function ComplaintList() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const complaintsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'complaints'), orderBy('submissionDate', 'desc'), limit(100));
  }, [firestore, user]);

  const { data: complaints, isLoading: isLoadingComplaints } = useCollection<Complaint>(complaintsQuery);
  
  const handleDelete = async (complaintId: string) => {
    if (!firestore) return;

    try {
        await deleteComplaint(firestore, complaintId);
        toast({
            title: "Pengaduan Dihapus",
            description: "Pengaduan telah berhasil dihapus dari sistem.",
        });
    } catch (error) {
        toast({
            title: "Gagal Menghapus",
            description: "Terjadi kesalahan saat menghapus pengaduan.",
            variant: "destructive",
        });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daftar Pengaduan Masuk</CardTitle>
        <CardDescription>Informasi pengadu menyertakan kontak untuk koordinasi lapangan.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoadingComplaints || !user ? (
             <div className="space-y-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
             </div>
        ) : (
            <Accordion
            type="single"
            collapsible
            className="w-full space-y-4"
            >
            {complaints?.length === 0 && <p className="text-center text-muted-foreground p-8">Belum ada pengaduan yang masuk.</p>}
            {complaints?.map((complaint) => (
                <AccordionItem
                value={complaint.id}
                key={complaint.id}
                className="border rounded-xl px-4"
                >
                <AccordionTrigger className="py-4 hover:no-underline">

                    <div className="flex flex-col gap-2 text-left w-full">
                    <div className="flex justify-between items-start gap-4">
                        <div className="space-y-1">
                          <p className="text-sm font-bold text-foreground">
                            {complaint.reporterName || 'Warga Sidaurip'}
                          </p>
                          <p className="text-xs text-muted-foreground line-clamp-1 italic">
                            "{complaint.description}"
                          </p>
                        </div>

                        <Badge
                        variant={complaint.adminResponse ? 'default' : 'secondary'}
                        className="capitalize shrink-0"
                        >
                        {complaint.adminResponse ? 'Dijawab' : 'Baru'}
                        </Badge>
                    </div>

                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase font-bold">
                        <Calendar className="h-3 w-3" />
                        {complaint.submissionDate?.toDate().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric'})}
                    </div>
                    </div>

                </AccordionTrigger>

                <AccordionContent className="space-y-6 pt-4">
                    {/* INFO PENGADU */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1.5"><User className="w-3 h-3"/> Pengadu</p>
                            <p className="text-sm font-bold">{complaint.reporterName}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1.5"><MapPin className="w-3 h-3"/> Alamat</p>
                            <p className="text-sm font-medium">{complaint.reporterAddress}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1.5"><Phone className="w-3 h-3"/> WhatsApp</p>
                            <p className="text-sm font-bold text-emerald-600">{complaint.phoneNumber || '-'}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1.5"><Mail className="w-3 h-3"/> Email</p>
                            <p className="text-sm font-medium">{complaint.email || '-'}</p>
                        </div>
                    </div>

                    <div>
                      <p className="font-semibold mb-2 flex items-center gap-2 text-sm">
                          <MessageSquare className="w-4 h-4 text-primary" />
                          Aduan Lengkap
                      </p>
                      <div className="p-4 rounded-lg bg-white border text-sm text-slate-700 leading-relaxed">
                          {complaint.description}
                      </div>
                    </div>

                    <div className="p-4 rounded-xl border bg-muted/40 space-y-4">
                      <h4 className="font-semibold flex items-center gap-2 text-sm">
                          <Lightbulb className="w-4 h-4 text-amber-500" />
                          Analisis AI
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <p className="font-bold text-[10px] uppercase text-muted-foreground">Ringkasan</p>
                            <p className="text-slate-600 text-sm italic">
                                "{complaint.summaryLLM}"
                            </p>
                        </div>
                        <div>
                            <p className="font-bold text-[10px] uppercase text-muted-foreground">Kata Kunci</p>
                            <div className="flex flex-wrap gap-2 mt-1">
                                {complaint.keywords?.map((kw, i) => (
                                <Badge key={i} variant="secondary" className="font-normal text-[10px]">
                                    <Tag className="mr-1.5 h-3 w-3" />
                                    {kw}
                                </Badge>
                                ))}
                            </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="border-t pt-4">
                      <AdminResponseForm complaintId={complaint.id} existingResponse={complaint.adminResponse} />
                      <div className="flex justify-end mt-4">
                          <AlertDialog>
                              <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="sm" className="text-slate-400 hover:text-red-600">
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Hapus Aduan
                                  </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                  <AlertDialogHeader>
                                  <AlertDialogTitle>Anda Yakin?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                      Tindakan ini tidak dapat dibatalkan. Aduan ini akan dihapus secara permanen dari server.
                                  </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                  <AlertDialogCancel>Batal</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(complaint.id)} className="bg-red-600">
                                      Ya, Hapus
                                  </AlertDialogAction>
                                  </AlertDialogFooter>
                              </AlertDialogContent>
                          </AlertDialog>
                      </div>
                    </div>

                </AccordionContent>
                </AccordionItem>
            ))}
            </Accordion>
        )}
      </CardContent>
    </Card>
  );
}
