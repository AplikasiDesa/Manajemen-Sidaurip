
"use client"

import { useState, useMemo } from "react"
import { useFirestore, useCollection, useMemoFirebase, useUser } from "@/firebase"
import { collection, query, orderBy } from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Search, 
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Info,
  Filter,
  Loader2
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDate, getDaysInMonth } from "date-fns"
import { id as localeID } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

export default function MonitoringAbsensiGrid() {
  const db = useFirestore()
  const { user } = useUser()
  const [searchTerm, setSearchTerm] = useState("")
  const [filterMonth, setFilterMonth] = useState(format(new Date(), "MM"))
  const [filterYear, setFilterYear] = useState(format(new Date(), "yyyy"))

  // 1. Ambil Master Personel (Dari Profil)
  const personnelRef = useMemoFirebase(() => (db && user) ? collection(db, "personnel") : null, [db, user])
  const { data: personnelList, isLoading: isMasterLoading } = useCollection(personnelRef)

  // 2. Ambil Seluruh Data Absensi
  const absensiRef = useMemoFirebase(() => 
    (db && user) ? query(collection(db, "absensi"), orderBy("tanggal", "asc")) : null, 
  [db, user])
  const { data: attendanceData } = useCollection(absensiRef)

  // 3. Ambil Kredensial (Untuk pemetaan UID)
  const credsRef = useMemoFirebase(() => (db && user) ? collection(db, "personel") : null, [db, user])
  const { data: credentialsList } = useCollection(credsRef)

  // 4. Persiapan Grid Tanggal
  const daysInMonth = useMemo(() => {
    const start = startOfMonth(new Date(parseInt(filterYear), parseInt(filterMonth) - 1))
    const end = endOfMonth(start)
    return eachDayOfInterval({ start, end })
  }, [filterMonth, filterYear])

  const tableHeaderDays = useMemo(() => {
    return Array.from({ length: 31 }, (_, i) => i + 1)
  }, [])

  // 5. Mapping Data ke Tabel
  const rekapGrid = useMemo(() => {
    if (!personnelList || !attendanceData) return []

    return personnelList
      .filter(p => p.category === 'Pemerintah Desa')
      .filter(p => p.name?.toLowerCase().includes(searchTerm.toLowerCase()))
      .map(p => {
        const userMonthData: Record<number, any> = {}
        let s = 0, tk = 0, ct = 0, dl = 0

        // Cari UID dari kredensial berdasarkan nama
        const cred = credentialsList?.find(c => c.nama === p.name.toUpperCase());
        const uid = cred?.id || cred?.uid || p.uid;

        // Filter absensi untuk user ini di bulan ini
        const filteredAbsen = attendanceData.filter(a => {
           if (!uid) return false;
           const matchesUid = a.personel_id === uid || a.id.startsWith(uid);
           const matchesMonth = a.tanggal?.startsWith(`${filterYear}-${filterMonth}`);
           return matchesUid && matchesMonth;
        })

        filteredAbsen.forEach(a => {
          const d = getDate(new Date(a.tanggal))
          userMonthData[d] = a
          if (a.status === 'izin') s++
          if (a.status === 'alpha') tk++
          if (a.status === 'dinas_luar') dl++
        })

        return {
          ...p,
          attendance: userMonthData,
          stats: { s, tk, ct, dl }
        }
      })
  }, [personnelList, attendanceData, credentialsList, filterMonth, filterYear, searchTerm])

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Monitoring Absensi</h1>
          <p className="text-xs text-muted-foreground font-bold uppercase">Rekapitulasi Kehadiran Bulanan • Pemerintah Desa</p>
        </div>
        <div className="flex items-center gap-2">
            <div className="relative w-48 lg:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                    placeholder="Cari nama..." 
                    value={searchTerm} 
                    onChange={e => setSearchTerm(e.target.value)} 
                    className="pl-9 h-10 rounded-xl bg-white border-slate-200" 
                />
            </div>
            <Select value={filterMonth} onValueChange={setFilterMonth}>
                <SelectTrigger className="w-[140px] h-10 rounded-xl bg-white border-slate-200 font-bold">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {Array.from({ length: 12 }).map((_, i) => (
                        <SelectItem key={i+1} value={(i+1).toString().padStart(2, '0')} className="font-bold">
                            {format(new Date(2024, i, 1), "MMMM", { locale: localeID })}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
      </header>

      <Card className="border-none shadow-2xl rounded-3xl overflow-hidden bg-white">
        <CardContent className="p-0">
            <div className="overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-thumb-slate-200">
                {(isMasterLoading) ? (
                    <div className="py-20 text-center flex flex-col items-center gap-3">
                        <Loader2 className="h-8 w-8 animate-spin text-primary/30" />
                        <p className="text-[10px] font-black uppercase text-slate-400">Sinkronisasi Tabel...</p>
                    </div>
                ) : (
                <table className="w-full border-collapse text-[10px]">
                    <thead>
                        <tr className="bg-slate-900 text-white">
                            <th className="px-4 py-3 text-left font-black border border-white/10 min-w-[40px]">NO</th>
                            <th className="px-4 py-3 text-left font-black border border-white/10 min-w-[200px]">NAMA / JABATAN</th>
                            {tableHeaderDays.map(d => (
                                <th key={d} className="w-8 py-3 text-center font-black border border-white/10">{d}</th>
                            ))}
                            <th className="px-2 py-3 text-center font-black border border-white/10 bg-slate-800">S</th>
                            <th className="px-2 py-3 text-center font-black border border-white/10 bg-slate-800">TK</th>
                            <th className="px-2 py-3 text-center font-black border border-white/10 bg-slate-800">CT</th>
                            <th className="px-2 py-3 text-center font-black border border-white/10 bg-slate-800">DL</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rekapGrid.map((row, idx) => (
                            <tr key={row.id} className="hover:bg-slate-50 transition-colors border-b">
                                <td className="px-4 py-3 text-center font-bold text-slate-500 border-r">{idx + 1}</td>
                                <td className="px-4 py-2 border-r">
                                    <p className="font-black text-slate-900 uppercase leading-tight truncate w-[180px]">{row.name}</p>
                                    <p className="text-[8px] text-muted-foreground font-bold uppercase truncate w-[180px]">{row.jabatan}</p>
                                </td>
                                {tableHeaderDays.map(d => {
                                    const record = row.attendance[d]
                                    const isDayValid = d <= getDaysInMonth(new Date(parseInt(filterYear), parseInt(filterMonth) - 1))
                                    
                                    let statusColor = "bg-white"
                                    if (record) {
                                        if (record.status === 'hadir') statusColor = "bg-green-400"
                                        else if (record.status === 'telat') statusColor = "bg-orange-400"
                                        else if (record.status === 'alpha') statusColor = "bg-red-400"
                                        else if (record.status === 'izin' || record.status === 'dinas_luar') statusColor = "bg-blue-400"
                                    }

                                    return (
                                        <td key={d} className={cn("border-r text-center align-middle p-0.5", !isDayValid && "bg-slate-100")}>
                                            {isDayValid && (
                                                <div className={cn("w-full h-8 flex flex-col items-center justify-center rounded-sm transition-all", statusColor, record ? "text-white" : "text-transparent")}>
                                                    {record?.jam_masuk && <span className="font-black leading-none">{record.jam_masuk.substring(0,5)}</span>}
                                                    {record?.jam_pulang && <span className="font-bold text-[7px] mt-0.5">{record.jam_pulang.substring(0,5)}</span>}
                                                </div>
                                            )}
                                        </td>
                                    )
                                })}
                                <td className="text-center font-black bg-slate-50 border-r border-slate-200">{row.stats.s || 0}</td>
                                <td className="text-center font-black bg-slate-50 border-r border-slate-200 text-red-500">{row.stats.tk || 0}</td>
                                <td className="text-center font-black bg-slate-50 border-r border-slate-200">{row.stats.ct || 0}</td>
                                <td className="text-center font-black bg-slate-50 border-r border-slate-200 text-blue-600">{row.stats.dl || 0}</td>
                            </tr>
                        ))}
                        {rekapGrid.length === 0 && (
                            <tr>
                                <td colSpan={38} className="py-20 text-center font-bold text-slate-300 uppercase tracking-widest">Tidak ada data personel</td>
                            </tr>
                        )}
                    </tbody>
                </table>
                )}
            </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-6 px-4 py-3 bg-white border rounded-2xl shadow-sm">
        <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-400 rounded-sm" />
            <span className="text-[10px] font-black uppercase text-slate-500">Hadir</span>
        </div>
        <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-400 rounded-sm" />
            <span className="text-[10px] font-black uppercase text-slate-500">Telat</span>
        </div>
        <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-400 rounded-sm" />
            <span className="text-[10px] font-black uppercase text-slate-500">Alpha / TK</span>
        </div>
        <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-400 rounded-sm" />
            <span className="text-[10px] font-black uppercase text-slate-500">Izin / DL / CT</span>
        </div>
        <div className="ml-auto flex items-center gap-2 text-primary font-bold text-[10px]">
            <Info className="h-4 w-4" />
            <span>KETERANGAN: S=Sakit, TK=Tanpa Keterangan, CT=Cuti, DL=Dinas Luar</span>
        </div>
      </div>
    </div>
  )
}
