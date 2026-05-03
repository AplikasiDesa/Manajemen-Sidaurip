"use client"

import { useState, useEffect, useCallback } from "react"
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from "@/firebase"
import { doc, collection, query, where, orderBy, limit, setDoc } from "firebase/firestore"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  MapPin, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  LogOut, 
  Calendar as CalendarIcon,
  Navigation,
  Timer,
  RefreshCw
} from "lucide-react"
import { format } from "date-fns"
import { id as localeID } from "date-fns/locale"
import { useToast } from "@/hooks/use-toast"
import { calculateDistance, isHoliday, isWorkDay, parseTime } from "@/lib/attendance-utils"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

export default function AbsensiDashboard() {
  const { user, isUserLoading } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  const router = useRouter()
  
  const [currentTime, setCurrentTime] = useState(new Date())
  const [location, setLocation] = useState<{ lat: number, lng: number } | null>(null)
  const [isLocLoading, setIsLocLoading] = useState(false)
  const [isAbsenLoading, setIsAbsenLoading] = useState(false)
  const [distance, setDistance] = useState<number | null>(null)

  // 1. Validasi Login
  useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace("/absensi/login/")
    }
  }, [user, isUserLoading, router])

  // 2. Real-time clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // 3. Ambil Profil Personel (Wajib untuk validasi role)
  const personelRef = useMemoFirebase(() => 
    db && user ? doc(db, "personel", user.uid) : null, 
  [db, user])
  const { data: personelData, isLoading: isPersonelLoading } = useDoc(personelRef)

  // 4. Ambil Pengaturan Global
  const settingsRef = useMemoFirebase(() => 
    db && user ? doc(db, "absensi_settings", "global") : null, 
  [db, user])
  const { data: settings } = useDoc(settingsRef)

  // 5. Absensi Hari Ini
  const todayStr = format(new Date(), "yyyy-MM-dd")
  const absenId = user ? `${user.uid}_${todayStr}` : ""
  
  const todayAbsenRef = useMemoFirebase(() => 
    db && user && absenId ? doc(db, "absensi", absenId) : null, 
  [db, user, absenId])
  const { data: todayAbsen } = useDoc(todayAbsenRef)

  // 6. Riwayat Terakhir
  // Menjamin query mengandung filter 'personel_id' agar tidak ditolak Rules
  const historyQuery = useMemoFirebase(() => {
    if (!db || !user || !personelData) return null
    
    return query(
      collection(db, "absensi"),
      where("personel_id", "==", user.uid),
      orderBy("created_at", "desc"),
      limit(10)
    )
  }, [db, user, personelData])

  const { data: history } = useCollection(historyQuery)

  const getGeolocation = useCallback(() => {
    setIsLocLoading(true)
    if (!navigator.geolocation) {
      toast({ variant: "destructive", title: "GPS Error", description: "Browser tidak mendukung lokasi." })
      setIsLocLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setLocation(coords)
        if (settings?.lokasi_kantor) {
          const d = calculateDistance(coords.lat, coords.lng, settings.lokasi_kantor.lat, settings.lokasi_kantor.lng)
          setDistance(d)
        }
        setIsLocLoading(false)
      },
      (err) => {
        toast({ variant: "destructive", title: "GPS Gagal", description: "Izinkan akses lokasi di browser." })
        setIsLocLoading(false)
      },
      { enableHighAccuracy: true }
    )
  }, [settings, toast])

  useEffect(() => {
    if (settings && !location) getGeolocation()
  }, [settings, location, getGeolocation])

  const handleAbsenMasuk = async () => {
    if (!user || !settings || !location || !db) return
    
    if (!isWorkDay(currentTime, settings.hari_kerja)) {
      toast({ variant: "destructive", title: "Bukan Hari Kerja", description: "Absensi tidak tersedia hari ini." })
      return
    }
    if (isHoliday(currentTime, settings.hari_libur)) {
      toast({ variant: "destructive", title: "Hari Libur", description: "Anda sedang libur." })
      return
    }
    if (distance && distance > (settings.radius_lokasi || 100)) {
      toast({ variant: "destructive", title: "Luar Jangkauan", description: "Anda berada di luar radius kantor." })
      return
    }

    setIsAbsenLoading(true)
    const jamMasukSetting = parseTime(settings.jam_masuk)
    const toleransiSetting = settings.toleransi_telat || 0
    const limitMasuk = new Date(jamMasukSetting.getTime() + toleransiSetting * 60000)
    
    const status = currentTime > limitMasuk ? "telat" : "hadir"

    try {
      await setDoc(doc(db, "absensi", absenId), {
        id: absenId,
        personel_id: user.uid,
        tanggal: todayStr,
        jam_masuk: format(currentTime, "HH:mm:ss"),
        status: status,
        lokasi_masuk: location,
        created_at: new Date().toISOString()
      }, { merge: true })
      toast({ title: "Berhasil!", description: `Absen masuk tercatat sebagai ${status}.` })
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Gagal menyimpan data." })
    } finally {
      setIsAbsenLoading(false)
    }
  }

  const handleAbsenPulang = async () => {
    if (!user || !todayAbsen || !location || !db) return
    setIsAbsenLoading(true)
    try {
      await setDoc(doc(db, "absensi", absenId), {
        jam_pulang: format(currentTime, "HH:mm:ss"),
        lokasi_pulang: location,
      }, { merge: true })
      toast({ title: "Selamat Beristirahat!", description: "Absen pulang telah tercatat." })
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Gagal menyimpan data." })
    } finally {
      setIsAbsenLoading(false)
    }
  }

  if (isUserLoading || isPersonelLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Memvalidasi Akses...</p>
        </div>
      </div>
    )
  }

  if (!user) return null
  const inRadius = distance !== null && distance <= (settings?.radius_lokasi || 100)

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 max-w-2xl mx-auto pb-24">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <CheckCircle2 className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-black text-primary uppercase tracking-tight">Portal Absensi</h1>
            <p className="text-xs text-muted-foreground font-bold uppercase">{personelData?.nama || "Perangkat Desa"}</p>
          </div>
        </div>
        <button onClick={() => { router.push("/"); }} className="p-2 text-muted-foreground hover:text-primary transition-colors">
          <LogOut className="h-5 w-5" />
        </button>
      </header>

      <section className="bg-primary text-primary-foreground p-8 rounded-[2.5rem] shadow-2xl shadow-primary/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-10"><Timer className="h-32 w-32" /></div>
        <div className="relative z-10 space-y-4">
          <p className="text-xs font-black uppercase tracking-[0.2em] opacity-80">{format(currentTime, "EEEE, d MMMM yyyy", { locale: localeID })}</p>
          <h2 className="text-6xl font-black tracking-tighter">{format(currentTime, "HH:mm")}<span className="text-xl ml-2 opacity-60">{format(currentTime, "ss")}</span></h2>
          <div className="flex items-center gap-3 bg-white/20 w-fit px-4 py-2 rounded-2xl backdrop-blur-md">
            <MapPin className="h-4 w-4" />
            <p className="text-[10px] font-bold uppercase">{location ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : "Mencari Lokasi..."}</p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-4">
        <Card className="border-none shadow-lg rounded-3xl bg-white overflow-hidden">
          <div className="p-5 space-y-1">
            <p className="text-[10px] font-black uppercase text-muted-foreground">Masuk</p>
            <p className="text-2xl font-black text-primary">{todayAbsen?.jam_masuk || "--:--"}</p>
            {todayAbsen?.status && <Badge variant="outline" className={cn("text-[8px] font-black uppercase mt-1", todayAbsen.status === 'telat' ? 'text-red-500 border-red-200' : 'text-green-500 border-green-200')}>{todayAbsen.status}</Badge>}
          </div>
        </Card>
        <Card className="border-none shadow-lg rounded-3xl bg-white overflow-hidden">
          <div className="p-5 space-y-1">
            <p className="text-[10px] font-black uppercase text-muted-foreground">Pulang</p>
            <p className="text-2xl font-black text-primary">{todayAbsen?.jam_pulang || "--:--"}</p>
          </div>
        </Card>
      </div>

      <div className="space-y-4">
        {!todayAbsen?.jam_masuk ? (
          <Button 
            onClick={handleAbsenMasuk} 
            disabled={isAbsenLoading || isLocLoading || !inRadius}
            className="w-full h-20 rounded-3xl text-lg font-black uppercase shadow-xl shadow-primary/20 gap-3"
          >
            {isAbsenLoading ? <Loader2 className="animate-spin" /> : <Navigation className="h-6 w-6" />}
            Absen Masuk
          </Button>
        ) : !todayAbsen?.jam_pulang ? (
          <Button 
            onClick={handleAbsenPulang} 
            disabled={isAbsenLoading || isLocLoading}
            variant="outline"
            className="w-full h-20 rounded-3xl text-lg font-black uppercase border-primary/20 text-primary hover:bg-primary/5 gap-3"
          >
            {isAbsenLoading ? <Loader2 className="animate-spin" /> : <Navigation className="h-6 w-6 rotate-180" />}
            Absen Pulang
          </Button>
        ) : (
          <div className="bg-green-50 border border-green-100 p-6 rounded-3xl text-center space-y-2">
            <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto" />
            <p className="text-sm font-black text-green-800 uppercase">Sudah Absen Hari Ini</p>
            <p className="text-xs text-green-600 font-medium">Terima kasih atas dedikasi Anda!</p>
          </div>
        )}

        <div className={cn("p-4 rounded-2xl flex items-center gap-3 border transition-colors", inRadius ? "bg-green-50 border-green-100" : "bg-red-50 border-red-100")}>
          {inRadius ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-red-500" />}
          <div className="flex-1">
            <p className="text-[10px] font-black uppercase text-slate-800">{inRadius ? "Dalam Radius Kantor" : "Luar Radius Kantor"}</p>
            <p className="text-[9px] text-slate-500 font-bold uppercase">{distance ? `${Math.round(distance)} meter dari titik pusat` : "Mengecek jangkauan..."}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={getGeolocation} disabled={isLocLoading} className="h-8 w-8"><RefreshCw className={cn("h-4 w-4", isLocLoading && "animate-spin")} /></Button>
        </div>
      </div>

      <section className="space-y-4">
        <h3 className="text-sm font-black text-primary uppercase tracking-widest flex items-center gap-2"><CalendarIcon className="h-4 w-4" /> Riwayat Kehadiran</h3>
        <div className="grid gap-3">
          {history?.map((h) => (
            <div key={h.id} className="p-4 bg-white border rounded-2xl shadow-sm flex items-center justify-between group hover:border-primary/40 transition-all">
              <div>
                <p className="text-xs font-bold text-slate-800">{format(new Date(h.tanggal), "EEEE, d MMM")}</p>
                <p className="text-[10px] text-muted-foreground uppercase font-bold">{h.jam_masuk} - {h.jam_pulang || "---"}</p>
              </div>
              <Badge className={cn("text-[9px] font-black uppercase", h.status === 'hadir' ? 'bg-green-500' : 'bg-red-500')}>{h.status}</Badge>
            </div>
          ))}
          {(!history || history.length === 0) && <p className="text-center text-xs text-muted-foreground py-8 border-2 border-dashed rounded-3xl uppercase font-bold">Belum ada riwayat.</p>}
        </div>
      </section>
    </div>
  )
}