"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  RefreshCw, 
  Loader2, 
  Calendar as CalendarIcon,
  Send,
  BookUser,
  AlertCircle
} from "lucide-react"
import { format, parseISO } from "date-fns"
import { id as localeID } from "date-fns/locale"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { GOOGLE_CONFIG } from "@/lib/google-config"
import { callAppsScript } from "@/app/agenda/actions"
import { useUser, useDoc, useFirestore, useMemoFirebase } from "@/firebase"
import { doc } from "firebase/firestore"

interface CalendarEvent {
  id: string;
  summary: string;
  location: string;
  htmlLink: string;
  start: { dateTime: string };
  end: { dateTime: string };
  description: string;
}

export function RincianKegiatan() {
  const [searchDate, setSearchDate] = useState<string>(format(new Date(), "yyyy-MM-dd"))
  const [searchEvents, setSearchEvents] = useState<CalendarEvent[]>([])
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [notulensi, setNotulensi] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const { toast } = useToast()

  const { user } = useUser()
  const db = useFirestore()
  const userDocRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, "users", user.uid);
  }, [db, user]);
  const { data: userData } = useDoc(userDocRef);

  const fetchAgendaData = useCallback(async (date: string) => {
    setIsSearching(true)
    setSearchEvents([])
    setSelectedEvent(null)
    setErrorMsg(null)
    
    try {
      const calendarId = userData?.googleCalendarId || GOOGLE_CONFIG.calendarId;
      const res = await callAppsScript({
        action: 'getCalendar',
        calendarId: calendarId,
        date: date
      });
      
      if (res && res.success) {
        const items = res.items || [];
        setSearchEvents(items);
        if (items.length === 0) {
          toast({ variant: "default", title: "Informasi", description: `Tidak ada agenda pada tanggal terpilih.` })
        }
      } else {
        setErrorMsg(res.error || "Gagal memproses data dari Google.");
      }

    } catch (err: any) {
      console.error("Fetch Agenda Error:", err);
      setErrorMsg("Koneksi gagal. Pastikan deployment Apps Script sudah benar.");
    } finally {
      setIsSearching(false);
    }
  }, [toast, userData])

  useEffect(() => {
    if (userData) {
      fetchAgendaData(format(new Date(), "yyyy-MM-dd"));
    }
  }, [fetchAgendaData, userData])

  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedEvent(event)
    const description = event.description || "";
    const separator = "--- NOTULENSI ---";
    const parts = description.split(separator);
    setNotulensi(parts.length > 1 ? parts[1].trim() : "");
  }

  const handleSaveNotulensi = async () => {
    if (!selectedEvent || !notulensi) {
      toast({ variant: "destructive", title: "Gagal Simpan", description: "Pilih acara dan isi notulensi terlebih dahulu." });
      return;
    }

    setIsSaving(true);
    try {
      const calendarId = userData?.googleCalendarId || GOOGLE_CONFIG.calendarId;
      const result = await callAppsScript({
        action: 'updateEventDescription',
        calendarId: calendarId,
        eventId: selectedEvent.id,
        newContent: notulensi
      });

      if (!result.success) {
        throw new Error(result.error || 'Gagal memperbarui acara.');
      }

      toast({ title: "Berhasil", description: "Notulensi disimpan ke Google Calendar." });
      fetchAgendaData(searchDate);

    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
      <div className="space-y-6">
        <Card className="border-none shadow-xl shadow-slate-200/40 rounded-[2.5rem] bg-white">
            <CardContent className="p-8 space-y-4">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Pilih Tanggal Agenda</Label>
              <div className="flex gap-3">
                <Input 
                  type="date" 
                  value={searchDate}
                  onChange={(e) => setSearchDate(e.target.value)}
                  className="h-14 rounded-2xl bg-slate-50 border-slate-100 font-bold text-slate-700 text-base"
                />
                <Button 
                  onClick={() => fetchAgendaData(searchDate)}
                  disabled={isSearching}
                  className="h-14 w-14 rounded-2xl shadow-lg shadow-primary/20"
                >
                  <RefreshCw className={cn("h-5 w-5", isSearching && "animate-spin")} />
                </Button>
              </div>
            </CardContent>
        </Card>

        {errorMsg && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 text-red-800 animate-in fade-in zoom-in-95">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <p className="text-xs font-bold leading-relaxed">{errorMsg}</p>
          </div>
        )}

        <div className="space-y-2">
          {isSearching ? (
            <div className="text-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary/30 mx-auto" /></div>
          ) : searchEvents.length > 0 ? (
            searchEvents.map((event) => (
              <button 
                key={event.id || event.start} 
                onClick={() => handleSelectEvent(event)}
                className={cn(
                  "w-full text-left p-4 rounded-2xl bg-white border shadow-sm transition-all hover:border-primary/60 hover:bg-primary/5",
                  selectedEvent?.id === event.id && "bg-primary/5 border-primary/80 ring-2 ring-primary/20"
                )}
              >
                <p className="font-bold text-sm text-slate-800">{event.summary}</p>
                <p className="text-xs text-muted-foreground font-medium">{event.location || "Lokasi belum diatur"}</p>
              </button>
            ))
          ) : !errorMsg && (
            <div className="text-center py-10 border-2 border-dashed rounded-2xl">
                <p className="text-sm font-semibold text-muted-foreground">Tidak ada agenda ditemukan.</p>
            </div>
          )}
        </div>
      </div>

      <Card className="border-none shadow-xl shadow-slate-200/40 rounded-[2.5rem] bg-white lg:sticky lg:top-8">
        <CardHeader className="border-b">
            <div className="flex items-center gap-3">
                <BookUser className="h-6 w-6 text-primary" />
                <div>
                    <CardTitle className="text-lg font-black uppercase">Rincian & Notulensi</CardTitle>
                    <CardDescription>Pilih acara dari daftar untuk melihat detail dan mengisi notulensi.</CardDescription>
                </div>
            </div>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {selectedEvent ? (
            <div className="space-y-4 animate-in fade-in">
              <div>
                <Label className="text-xs text-muted-foreground">Judul Kegiatan</Label>
                <p className="font-bold text-primary">{selectedEvent.summary}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Waktu</Label>
                <p className="font-semibold">
                  {selectedEvent.start?.dateTime ? format(parseISO(selectedEvent.start.dateTime), "HH:mm", { locale: localeID }) : "--:--"} - 
                  {selectedEvent.end?.dateTime ? format(parseISO(selectedEvent.end.dateTime), "HH:mm", { locale: localeID }) : "--:--"} WIB
                </p>
              </div>
               <div>
                <Label className="text-xs text-muted-foreground">Lokasi</Label>
                <p className="font-semibold">{selectedEvent.location || "-"}</p>
              </div>
              <div>
                <Label htmlFor="notulensi" className="text-xs text-muted-foreground">Notulensi / Catatan Rapat</Label>
                <Textarea
                  id="notulensi"
                  value={notulensi}
                  onChange={(e) => setNotulensi(e.target.value)}
                  placeholder="Tulis hasil rapat atau catatan penting di sini..."
                  className="min-h-[200px] mt-1"
                />
              </div>
              <Button onClick={handleSaveNotulensi} disabled={isSaving || !notulensi} className="w-full gap-2">
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin"/> : <Send className="h-4 w-4"/>}
                Simpan Notulensi ke Kalender
              </Button>
            </div>
          ) : (
            <div className="text-center py-20">
                <p className="text-sm font-semibold text-muted-foreground">Pilih satu acara untuk memulai.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
