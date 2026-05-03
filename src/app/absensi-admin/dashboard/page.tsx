"use client"

import { useState, useMemo, useEffect } from "react"
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase"
import { collection, query, where, orderBy, doc } from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Search, 
  Settings, 
  Loader2,
  ShieldCheck,
  LogOut
} from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns"
import { id as localeID } from "date-fns/locale"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

export default function AdminAbsensiDashboard() {
  const { user, isUserLoading } = useUser()
  const db = useFirestore()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [filterMonth, setFilterMonth] = useState(format(new Date(), "MM"))
  const [filterYear, setFilterYear] = useState(format(new Date(), "yyyy"))

  // 1. Ambil Profil Admin (Gunakan UID untuk keamanan tinggi)
  const adminRef = useMemoFirebase(() => 
    db && user ? doc(db, "personel", user.uid) : null, 
  [db, user])
  const { data: adminData, isLoading: isAdminLoading } = useDoc(adminRef)

  // 2. GUARD PROTEKSI KETAT (Anti-Flicker & Anti-Bocor)
  useEffect(() => {
    if (isUserLoading || isAdminLoading) return

    if (!user) {
      router.replace("/absensi-admin/login/")
      return
    }

    const isAdmin =
      adminData?.role === "admin" ||
      adminData?.role === "admin_absensi" ||
      user.email === "adminsidaurip@gmail.id"

    if (!isAdmin) {
      router.replace("/absensi/dashboard/")
    }
  }, [user, adminData, isUserLoading, isAdminLoading, router])

  // 3. Query Seluruh Personel (Hanya jika Admin terverifikasi)
  const personnelRef = useMemoFirebase(() => {
    if (!db || !user || !adminData) return null
    // Validasi tambahan agar tidak kena permission error sebelum adminData siap
    const isAdmin = adminData.role === "admin" || adminData.role === "admin_absensi" || user.email === 'adminsidaurip@gmail.id'
    return isAdmin ? collection(db, "personel") : null
  }, [db, user, adminData])
  const { data: personnelList, isLoading: isPersonnelLoading } = useCollection(personnelRef)

  // 4. Query Absensi (Hanya jika Admin terverifikasi)
  const absensiQuery = useMemoFirebase(() => {
    if (!db || !user || !adminData) return null
    const isAdmin = adminData.role === "admin" || adminData.role === "admin_absensi" || user.email === 'adminsidaurip@gmail.id'
    
    if (isAdmin) {
      return query(collection(db, "absensi"), orderBy("created_at", "desc"))
    }
    // Non-admin query (seharusnya tidak sampai sini karena guard)
    return query(collection(db, "absensi"), where("personel_id", "==", user.uid), orderBy("created_at", "desc"))
  }, [db, user, adminData])

  const { data: attendance, isLoading: isAbsenLoading } = useCollection(absensiQuery)

  // 5. Pengaturan Global
  const settingsRef = useMemoFirebase(() => (db && user) ? doc(db, "absensi_settings", "global") : null, [db, user])
  const { data: settings } = useDoc(settingsRef)

  const stats = useMemo(() => {
    if (!attendance) return { hadir: 0, telat: 0, izin: 0, total: 0 }
    const currentMonthData = attendance.filter(a => a.tanggal?.startsWith(`${filterYear}-${filterMonth}`))
    return {
      hadir: currentMonthData.filter(a => a.status === 'hadir').length,
      telat: currentMonthData.filter(a => a.status === 'telat').length,
      izin: currentMonthData.filter(a => a.status === 'izin').length,
      total: currentMonthData.length
    }
  }, [attendance, filterMonth, filterYear])

  const rekapData = useMemo(() => {
    if (!personnelList || !attendance) return []
    
    const start = startOfMonth(new Date(parseInt(filterYear), parseInt(filterMonth) - 1))
    const end = endOfMonth(start)
    const workDaysInMonth = eachDayOfInterval({ start, end }).filter(date => {
      const dayName = format(date, "eeee", { locale: localeID }).toLowerCase()
      const dateStr = format(date, "yyyy-MM-dd")
      return settings?.hari_kerja?.includes(dayName) && !settings?.hari_libur?.includes(dateStr)
    }).length

    return personnelList
      .filter(p => p.role === 'perangkat')
      .map(p => {
        const userAbsen = attendance.filter(a => a.personel_id === p.uid && a.tanggal?.startsWith(`${filterYear}-${filterMonth}`))
        const hadir = userAbsen.filter(a => a.status === 'hadir').length
        const telat = userAbsen.filter(a => a.status === 'telat').length
        const izin = userAbsen.filter(a => a.status === 'izin').length
        const alpha = Math.max(0, workDaysInMonth - (hadir + telat + izin))
        const persentase = workDaysInMonth > 0 ? ((hadir + telat) / workDaysInMonth) * 100 : 0

        return {
          id: p.uid,
          nama: p.nama,
          jabatan: p.jabatan || "Perangkat",
          hadir,
          telat,
          alpha,
          persentase: persentase.toFixed(1)
        }
      })
      .filter(p => p.nama?.toLowerCase().includes(searchTerm.toLowerCase()))
  }, [personnelList, attendance, filterMonth, filterYear, settings, searchTerm])

  if (isUserLoading || isAdminLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-white mx-auto" />
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Memverifikasi Otoritas...</p>
        </div>
      </div>
    )
  }

  if (!user || (adminData?.role !== 'admin' && adminData?.role !== 'admin_absensi' && user.email !== 'adminsidaurip@gmail.id')) return null

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-slate-900 flex items-center justify-center shadow-lg">
            <ShieldCheck className="text-white h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Monitoring Absensi</h1>
            <p className="text-xs text-muted-foreground font-bold uppercase">Panel Administrasi • Desa Sidaurip</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild className="rounded-xl"><Link href="/absensi/settings/"><Settings className="h-4 w-4 mr-2" /> Pengaturan</Link></Button>
          <Button variant="ghost" size="icon" onClick={() => router.push("/")}><LogOut className="h-5 w-5" /></Button>
        </div>
      </header>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-blue-50 rounded-3xl">
          <p className="text-[10px] font-black uppercase text-blue-600">Total Hadir</p>
          <h3 className="text-2xl font-black text-blue-900">{stats.hadir}</h3>
        </div>
        <div className="p-5 bg-orange-50 rounded-3xl">
          <p className="text-[10px] font-black uppercase text-orange-600">Total Telat</p>
          <h3 className="text-2xl font-black text-orange-900">{stats.telat}</h3>
        </div>
        <div className="p-5 bg-primary/10 rounded-3xl">
          <p className="text-[10px] font-black uppercase text-primary">Bulan Ini</p>
          <h3 className="text-2xl font-black text-primary">{stats.total} Berkas</h3>
        </div>
        <div className="p-5 bg-slate-100 rounded-3xl">
          <p className="text-[10px] font-black uppercase text-slate-600">Perangkat</p>
          <h3 className="text-2xl font-black text-slate-900">{rekapData.length} Orang</h3>
        </div>
      </section>

      <Card className="border-none shadow-xl rounded-[2rem] overflow-hidden">
        <CardHeader className="bg-slate-50 border-b p-6 flex flex-row items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Cari perangkat..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9 h-10 rounded-xl" />
            </div>
            <div className="flex gap-2">
                <Select value={filterMonth} onValueChange={setFilterMonth}>
                    <SelectTrigger className="w-[120px] h-10 rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        {Array.from({ length: 12 }).map((_, i) => (
                            <SelectItem key={i+1} value={(i+1).toString().padStart(2, '0')}>
                                {format(new Date(2024, i, 1), "MMMM", { locale: localeID })}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </CardHeader>
        <CardContent className="p-0">
          {isAbsenLoading || isPersonnelLoading ? (
            <div className="py-20 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-slate-300" /></div>
          ) : (
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="text-[10px] font-black uppercase">Nama / Jabatan</TableHead>
                  <TableHead className="text-center text-[10px] font-black uppercase">Hadir</TableHead>
                  <TableHead className="text-center text-[10px] font-black uppercase">Telat</TableHead>
                  <TableHead className="text-center text-[10px] font-black uppercase">Alpha</TableHead>
                  <TableHead className="text-right text-[10px] font-black uppercase">% Kinerja</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rekapData.map((row) => (
                  <TableRow key={row.id} className="hover:bg-slate-50 transition-colors">
                    <TableCell>
                      <p className="font-bold text-sm text-slate-900">{row.nama}</p>
                      <p className="text-[9px] text-muted-foreground uppercase font-bold">{row.jabatan}</p>
                    </TableCell>
                    <TableCell className="text-center font-bold text-blue-600">{row.hadir}</TableCell>
                    <TableCell className="text-center font-bold text-orange-600">{row.telat}</TableCell>
                    <TableCell className="text-center font-bold text-red-600">{row.alpha}</TableCell>
                    <TableCell className="text-right">
                      <Badge className={cn("text-[9px] font-black", parseFloat(row.persentase) >= 80 ? "bg-green-500" : "bg-red-500")}>
                        {row.persentase}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}