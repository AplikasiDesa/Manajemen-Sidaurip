
"use client"

import { useState, useEffect } from "react"
import { useFirestore, useDoc, useMemoFirebase, useUser, useCollection } from "@/firebase"
import { doc, setDoc, collection, query, where, getDocs } from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Settings, 
  Save, 
  Loader2, 
  Clock, 
  MapPin, 
  Calendar as CalendarIcon,
  Plus,
  Trash2,
  KeyRound,
  UserCheck,
  Eye,
  EyeOff,
  ShieldCheck,
  RefreshCw,
  Timer
} from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const DAYS = [
  { id: 'senin', label: 'SENIN' },
  { id: 'selasa', label: 'SELASA' },
  { id: 'rabu', label: 'RABU' },
  { id: 'kamis', label: 'KAMIS' },
  { id: 'jumat', label: 'JUMAT' },
  { id: 'sabtu', label: 'SABTU' },
  { id: 'minggu', label: 'MINGGU' }
]

export default function AdminAbsensiSettings() {
  const db = useFirestore()
  const { user, isUserLoading } = useUser()
  const { toast } = useToast()
  
  const [isSaving, setIsSaving] = useState(false)
  const [isProcessingCred, setIsProcessingCred] = useState<string | null>(null)
  const [newHoliday, setNewHoliday] = useState("")

  // 1. Fetch Global Settings
  const settingsRef = useMemoFirebase(() => 
    (db && user) ? doc(db, "absensi_settings", "global") : null, 
  [db, user])
  const { data: initialSettings, isLoading: isSettingsLoading } = useDoc(settingsRef)

  // 2. Fetch Master Personnel List
  const personnelMasterRef = useMemoFirebase(() => 
    (db && user) ? collection(db, "personnel") : null, 
  [db, user])
  const { data: personnelMaster, isLoading: isMasterLoading } = useCollection(personnelMasterRef)

  // 3. Fetch Existing Credentials
  const credentialsRef = useMemoFirebase(() => 
    (db && user) ? collection(db, "personel") : null, 
  [db, user])
  const { data: existingCreds, isLoading: isCredsLoading } = useCollection(credentialsRef)

  const [formData, setFormData] = useState({
    jam_masuk: "08:00",
    jam_pulang: "16:00",
    toleransi_telat: 15,
    hari_kerja: ["senin", "selasa", "rabu", "kamis", "jumat"],
    hari_libur: [] as string[],
    radius_lokasi: 100,
    lokasi_kantor: { lat: -7.457829, lng: 108.862069 },
    jadwal: {
      senin: { masuk: "08:00", pulang: "15:30" },
      selasa: { masuk: "08:00", pulang: "15:30" },
      rabu: { masuk: "08:00", pulang: "15:30" },
      kamis: { masuk: "08:00", pulang: "15:30" },
      jumat: { masuk: "08:00", pulang: "11:00" },
      sabtu: { masuk: "08:00", pulang: "12:00" },
      minggu: { masuk: "08:00", pulang: "12:00" },
    }
  })

  useEffect(() => {
    if (initialSettings) {
      setFormData(prev => ({
        ...prev,
        ...initialSettings,
        jadwal: initialSettings.jadwal || prev.jadwal
      }))
    }
  }, [initialSettings])

  const handleSaveGlobal = async () => {
    if (!db || !user) return
    setIsSaving(true)
    try {
      await setDoc(doc(db, "absensi_settings", "global"), formData)
      toast({ title: "Berhasil", description: "Seluruh pengaturan absensi telah diperbarui." })
    } catch (e) {
      toast({ variant: "destructive", title: "Gagal", description: "Terjadi kesalahan saat menyimpan." })
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdateCredential = async (person: any, newUsername: string, newPass: string) => {
    if (!db) return
    setIsProcessingCred(person.id)
    try {
      const q = query(collection(db, "personel"), where("nama", "==", person.name.toUpperCase()))
      const snap = await getDocs(q)
      
      let targetId = person.id
      if (!snap.empty) {
        targetId = snap.docs[0].id
      }

      await setDoc(doc(db, "personel", targetId), {
        username: newUsername.toLowerCase().trim(),
        password: newPass.trim(),
        nama: person.name.toUpperCase(),
        jabatan: person.jabatan.toUpperCase(),
        role: "perangkat",
        aktif: true
      }, { merge: true })
      
      toast({ title: "Kredensial Diperbarui", description: `Akun ${person.name} telah diupdate.` })
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Gagal memperbarui kredensial." })
    } finally {
      setIsProcessingCred(null)
    }
  }

  const toggleDay = (day: string) => {
    setFormData(prev => ({
      ...prev,
      hari_kerja: prev.hari_kerja.includes(day) 
        ? prev.hari_kerja.filter(d => d !== day)
        : [...prev.hari_kerja, day]
    }))
  }

  const updateDailyTime = (day: string, field: 'masuk' | 'pulang', value: string) => {
    setFormData(prev => ({
      ...prev,
      jadwal: {
        ...prev.jadwal,
        [day]: {
          ...prev.jadwal[day as keyof typeof prev.jadwal],
          [field]: value
        }
      }
    }))
  }

  const addHoliday = () => {
    if (!newHoliday) return
    if (formData.hari_libur.includes(newHoliday)) return
    setFormData(prev => ({ ...prev, hari_libur: [...prev.hari_libur, newHoliday].sort() }))
    setNewHoliday("")
  }

  const removeHoliday = (date: string) => {
    setFormData(prev => ({ ...prev, hari_libur: prev.hari_libur.filter(d => d !== date) }))
  }

  if (isUserLoading || isSettingsLoading || isMasterLoading || isCredsLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary/40" />
      </div>
    )
  }

  const govtPersonnel = (personnelMaster || []).filter(p => p.category === 'Pemerintah Desa')

  return (
    <div className="flex flex-col gap-10 max-w-6xl mx-auto pb-24">
      <header>
        <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Konfigurasi Sistem</h1>
        <p className="text-xs text-muted-foreground font-bold uppercase mt-1">Kelola aturan kehadiran dan akses akun personel</p>
      </header>

      <div className="grid md:grid-cols-2 gap-8">
        {/* TITIK LOKASI */}
        <Card className="border-none shadow-[0_15px_50px_-15px_rgba(0,0,0,0.05)] rounded-[2.5rem] bg-white overflow-hidden">
          <CardHeader className="p-8 pb-4">
            <CardTitle className="text-lg font-black flex items-center gap-3 text-slate-800 uppercase tracking-tight">
              <MapPin className="h-6 w-6 text-primary" /> Titik Lokasi Kantor
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 pt-4 space-y-8">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.15em] ml-1">Latitude</Label>
                <Input 
                  type="number" 
                  value={formData.lokasi_kantor.lat} 
                  onChange={e => setFormData(p => ({ ...p, lokasi_kantor: { ...p.lokasi_kantor, lat: parseFloat(e.target.value) } }))}
                  className="h-14 rounded-2xl bg-slate-50 border-none font-black text-base focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.15em] ml-1">Longitude</Label>
                <Input 
                  type="number" 
                  value={formData.lokasi_kantor.lng} 
                  onChange={e => setFormData(p => ({ ...p, lokasi_kantor: { ...p.lokasi_kantor, lng: parseFloat(e.target.value) } }))}
                  className="h-14 rounded-2xl bg-slate-50 border-none font-black text-base focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.15em] ml-1">Radius Absensi (Meter)</Label>
              <Input 
                type="number" 
                value={formData.radius_lokasi} 
                onChange={e => setFormData(p => ({ ...p, radius_lokasi: parseInt(e.target.value) || 0 }))}
                className="h-14 rounded-2xl bg-slate-50 border-none font-black text-lg focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </CardContent>
        </Card>

        {/* TOLERANSI & UMUM */}
        <Card className="border-none shadow-[0_15px_50px_-15px_rgba(0,0,0,0.05)] rounded-[2.5rem] bg-white overflow-hidden">
          <CardHeader className="p-8 pb-4">
            <CardTitle className="text-lg font-black flex items-center gap-3 text-slate-800 uppercase tracking-tight">
              <Timer className="h-6 w-6 text-primary" /> Pengaturan Umum
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 pt-4 space-y-8">
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.15em] ml-1">Toleransi Telat Global (Menit)</Label>
              <Input 
                type="number" 
                value={formData.toleransi_telat} 
                onChange={e => setFormData(p => ({ ...p, toleransi_telat: parseInt(e.target.value) || 0 }))}
                className="h-14 rounded-2xl bg-slate-50 border-none font-black text-lg focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="p-6 bg-amber-50 border border-amber-100 rounded-3xl">
                <p className="text-[10px] font-bold text-amber-800 uppercase leading-relaxed">
                    Catatan: Jam kerja harian (Senin-Jumat) dapat diatur pada tabel di bawah. Jam global di atas hanya sebagai cadangan sistem.
                </p>
            </div>
          </CardContent>
        </Card>

        {/* DETAIL JADWAL HARIAN */}
        <Card className="border-none shadow-[0_15px_50px_-15px_rgba(0,0,0,0.05)] rounded-[3.5rem] bg-white md:col-span-2 overflow-hidden border-t-8 border-primary">
          <CardHeader className="p-10 pb-4">
            <CardTitle className="text-xl font-black flex items-center gap-4 text-slate-800 uppercase tracking-tight">
              <Clock className="h-7 w-7 text-primary" /> Detail Jadwal Harian (Senin - Jumat)
            </CardTitle>
            <CardDescription className="font-bold text-[10px] uppercase text-muted-foreground mt-2 tracking-widest">Atur jam masuk dan pulang spesifik per hari</CardDescription>
          </CardHeader>
          <CardContent className="p-0 pt-6">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow className="hover:bg-transparent border-slate-100">
                    <TableHead className="px-10 h-14 font-black text-[11px] uppercase text-slate-400 tracking-widest">Hari</TableHead>
                    <TableHead className="h-14 font-black text-[11px] uppercase text-slate-400 tracking-widest">Jam Masuk</TableHead>
                    <TableHead className="h-14 font-black text-[11px] uppercase text-slate-400 tracking-widest">Jam Pulang</TableHead>
                    <TableHead className="px-10 h-14 text-center font-black text-[11px] uppercase text-slate-400 tracking-widest">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {DAYS.filter(d => !['sabtu', 'minggu'].includes(d.id)).map((day) => (
                    <TableRow key={day.id} className="hover:bg-slate-50/50 transition-colors border-slate-50">
                      <TableCell className="px-10 py-4">
                        <span className="font-black text-slate-700 text-xs uppercase tracking-wider">{day.label}</span>
                      </TableCell>
                      <TableCell>
                        <Input 
                          type="time" 
                          value={formData.jadwal[day.id as keyof typeof formData.jadwal]?.masuk || "08:00"}
                          onChange={e => updateDailyTime(day.id, 'masuk', e.target.value)}
                          className="h-10 w-32 rounded-xl bg-slate-100/50 border-none font-bold text-slate-700"
                        />
                      </TableCell>
                      <TableCell>
                        <Input 
                          type="time" 
                          value={formData.jadwal[day.id as keyof typeof formData.jadwal]?.pulang || "15:30"}
                          onChange={e => updateDailyTime(day.id, 'pulang', e.target.value)}
                          className="h-10 w-32 rounded-xl bg-slate-100/50 border-none font-bold text-slate-700"
                        />
                      </TableCell>
                      <TableCell className="px-10 text-center">
                        <Checkbox 
                          checked={formData.hari_kerja.includes(day.id)} 
                          onCheckedChange={() => toggleDay(day.id)}
                          className="h-5 w-5 rounded-md border-slate-300 data-[state=checked]:bg-primary"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* HARI LIBUR */}
        <Card className="border-none shadow-[0_15px_50px_-15px_rgba(0,0,0,0.05)] rounded-[2.5rem] bg-white md:col-span-2 overflow-hidden">
          <CardHeader className="p-10 pb-4">
            <CardTitle className="text-xl font-black flex items-center gap-4 text-slate-800 uppercase tracking-tight">
              <CalendarIcon className="h-7 w-7 text-primary" /> Daftar Hari Libur Khusus
            </CardTitle>
          </CardHeader>
          <CardContent className="p-10 pt-6 space-y-8">
            <div className="flex flex-col sm:flex-row gap-4 max-w-xl">
              <Input 
                type="date" 
                value={newHoliday} 
                onChange={e => setNewHoliday(e.target.value)} 
                className="h-14 rounded-2xl bg-slate-50 border-none font-bold text-slate-700"
              />
              <Button onClick={addHoliday} variant="outline" className="h-14 rounded-2xl gap-3 border-slate-200 px-8 font-black uppercase text-xs hover:bg-slate-50">
                <Plus className="h-5 w-5" /> Tambah Libur
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-4 mt-6">
              {formData.hari_libur.map(date => (
                <div key={date} className="flex items-center gap-3 bg-slate-100 pl-5 pr-2 py-2 rounded-2xl border border-slate-200">
                  <span className="text-[12px] font-black text-slate-700">{date}</span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => removeHoliday(date)} 
                    className="h-8 w-8 rounded-xl hover:bg-red-50 text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {formData.hari_libur.length === 0 && (
                <p className="text-xs text-slate-300 font-bold uppercase italic py-4">Belum ada hari libur khusus yang ditambahkan.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* PENGATURAN KREDENSIAL PERSONEL */}
        <Card id="credentials-card" className="border-none shadow-[0_15_50px_-15px_rgba(0,0,0,0.05)] rounded-[3.5rem] bg-white md:col-span-2 overflow-hidden border-t-8 border-slate-900">
          <CardHeader className="p-10 pb-4 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl font-black flex items-center gap-4 text-slate-900 uppercase tracking-tight">
                <ShieldCheck className="h-7 w-7 text-primary" /> Akun & Kredensial Perangkat
              </CardTitle>
              <CardDescription className="font-bold text-[10px] uppercase text-muted-foreground mt-2 tracking-widest">Kelola akses portal masing-masing perangkat desa</CardDescription>
            </div>
            <UserCheck className="h-12 w-12 text-slate-100" />
          </CardHeader>
          <CardContent className="p-0 pt-6">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow className="hover:bg-transparent border-slate-100">
                    <TableHead className="px-10 h-16 font-black text-[11px] uppercase text-slate-400 tracking-widest">Nama Lengkap / Jabatan</TableHead>
                    <TableHead className="h-16 font-black text-[11px] uppercase text-slate-400 tracking-widest">Username (ID)</TableHead>
                    <TableHead className="h-16 font-black text-[11px] uppercase text-slate-400 tracking-widest">Password Baru</TableHead>
                    <TableHead className="px-10 h-16 text-right font-black text-[11px] uppercase text-slate-400 tracking-widest">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {govtPersonnel.map((person) => {
                    const cred = (existingCreds || []).find(c => c.nama === person.name.toUpperCase())
                    return (
                      <CredentialRow 
                        key={person.id} 
                        person={person} 
                        initialCred={cred}
                        onSave={handleUpdateCredential} 
                        isProcessing={isProcessingCred === person.id} 
                      />
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-center mt-6">
        <Button 
          onClick={handleSaveGlobal} 
          disabled={isSaving} 
          className="w-full max-w-md h-16 rounded-[2rem] bg-primary hover:bg-primary/90 text-white font-black text-lg uppercase tracking-tight shadow-xl shadow-primary/20 transition-all active:scale-[0.98] gap-4"
        >
          {isSaving ? <Loader2 className="animate-spin h-6 w-6" /> : <Save className="h-6 w-6" />}
          Simpan Seluruh Pengaturan
        </Button>
      </div>
    </div>
  )
}

function CredentialRow({ person, initialCred, onSave, isProcessing }: any) {
    const [u, setU] = useState(initialCred?.username || "")
    const [p, setP] = useState(initialCred?.password || "")
    const [show, setShow] = useState(false)

    useEffect(() => {
      if (initialCred) {
        setU(initialCred.username || "")
        setP(initialCred.password || "")
      }
    }, [initialCred])

    return (
        <TableRow className="hover:bg-slate-50/50 transition-colors border-slate-50">
            <TableCell className="px-10 py-5">
                <p className="font-black text-slate-900 uppercase text-xs leading-tight">{person.name}</p>
                <p className="text-[9px] text-muted-foreground font-bold uppercase mt-1 tracking-wider">{person.jabatan || 'Perangkat'}</p>
            </TableCell>
            <TableCell>
                <Input 
                    value={u} 
                    onChange={e => setU(e.target.value)} 
                    placeholder="ID Login"
                    className="h-10 w-40 rounded-xl bg-slate-100/50 border-none text-[11px] font-black uppercase tracking-widest focus:ring-2 focus:ring-primary/20"
                />
            </TableCell>
            <TableCell>
                <div className="relative w-48">
                    <Input 
                        type={show ? "text" : "password"} 
                        value={p} 
                        onChange={e => setP(e.target.value)} 
                        placeholder="Password"
                        className="h-10 pr-10 rounded-xl bg-slate-100/50 border-none text-[11px] font-black tracking-widest focus:ring-2 focus:ring-primary/20"
                    />
                    <button 
                        onClick={() => setShow(!show)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                </div>
            </TableCell>
            <TableCell className="px-10 text-right">
                <Button 
                    size="sm" 
                    onClick={() => onSave(person, u, p)} 
                    disabled={isProcessing}
                    className="rounded-xl h-10 px-5 font-black uppercase text-[10px] gap-2 shadow-md bg-slate-900 hover:bg-slate-800 transition-all active:scale-95"
                >
                    {isProcessing ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                    Update
                </Button>
            </TableCell>
        </TableRow>
    )
}
