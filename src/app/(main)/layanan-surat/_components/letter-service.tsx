'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  ShieldCheck, 
  MapPinned, 
  Store, 
  Baby, 
  Skull, 
  Heart, 
  Home, 
  Music, 
  Users, 
  Flower2, 
  UserCheck, 
  Activity, 
  HandHelping,
  ArrowLeft,
  FileSpreadsheet
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SktmForm } from './forms/sktm-form';
import { SkckForm } from './forms/skck-form';
import { PindahForm } from './forms/pindah-form';
import { SkuForm } from './forms/sku-form';
import { KelahiranForm } from './forms/kelahiran-form';
import { KematianForm } from './forms/kematian-form';
import { BelumMenikahForm } from './forms/belum-menikah-form';
import { DomisiliForm } from './forms/domisili-form';
import { IjinKeramaianForm } from './forms/ijin-keramaian-form';
import { MoyangForm } from './forms/moyang-form';
import { PemakamanForm } from './forms/pemakaman-form';
import { WaliForm } from './forms/wali-form';
import { ReaktivasiBpjsForm } from './forms/reaktivasi-bpjs-form';
import { PengantarUmumForm } from './forms/pengantar-umum-form';
import { KeteranganUmumForm } from './forms/keterangan-umum-form';

interface LetterServiceProps {
  isAdmin?: boolean;
}

const letterOptions = [
  { type: 'Surat Keterangan Tidak Mampu', icon: HandHelping, color: 'bg-orange-100 text-orange-600', description: 'Untuk bantuan sosial & biaya sekolah.' },
  { type: 'Surat Pengantar SKCK', icon: ShieldCheck, color: 'bg-blue-100 text-blue-600', description: 'Persyaratan melamar pekerjaan / kepolisian.' },
  { type: 'Surat Pengantar Pindah', icon: MapPinned, color: 'bg-emerald-100 text-emerald-600', description: 'Keterangan pindah domisili antar wilayah.' },
  { type: 'Surat Keterangan Usaha', icon: Store, color: 'bg-purple-100 text-purple-600', description: 'Untuk pengajuan KUR / identitas UMKM.' },
  { type: 'Surat Keterangan Lahir', icon: Baby, color: 'bg-pink-100 text-pink-600', description: 'Data kelahiran baru bagi warga desa.' },
  { type: 'Surat Keterangan Kematian', icon: Skull, color: 'bg-slate-200 text-slate-700', description: 'Surat keterangan duka cita & lapor diri.' },
  { type: 'Surat Keterangan Belum Menikah', icon: Heart, color: 'bg-red-100 text-red-600', description: 'Syarat pernikahan atau status lajang.' },
  { type: 'Surat Keterangan Domisili', icon: Home, color: 'bg-amber-100 text-amber-700', description: 'Keterangan tempat tinggal sementara.' },
  { type: 'Surat Ijin Keramaian', icon: Music, color: 'bg-indigo-100 text-indigo-600', description: 'Syarat mengadakan acara / hajatan.' },
  { type: 'Surat Keterangan Moyang', icon: Users, color: 'bg-teal-100 text-teal-600', description: 'Keterangan silsilah keluarga / garis keturunan.' },
  { type: 'Surat Keterangan Pemakaman', icon: Flower2, color: 'bg-green-100 text-green-700', description: 'Ijin penguburan di makam umum desa.' },
  { type: 'Surat Keterangan Wali', icon: UserCheck, color: 'bg-sky-100 text-sky-600', description: 'Keterangan perwalian anak di bawah umur.' },
  { type: 'Surat Keterangan Reaktivasi BPJS Kesehatan', icon: Activity, color: 'bg-rose-100 text-rose-600', description: 'Pengurusan BPJS yang terblokir / nonaktif.' },
  { type: 'Surat Keterangan Umum', icon: FileSpreadsheet, color: 'bg-slate-200 text-slate-800', description: 'Surat berisi keterangan administrasi umum.' },
  { type: 'Surat Pengantar Umum', icon: FileText, color: 'bg-slate-300 text-slate-900', description: 'Surat pengantar untuk berbagai instansi.' },
];

export function LetterService({ isAdmin = false }: LetterServiceProps) {
  const [selectedLetter, setSelectedLetter] = useState<string>('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const renderForm = () => {
    const props = { isAdmin };
    switch (selectedLetter) {
      case 'Surat Keterangan Tidak Mampu': return <SktmForm {...props} />;
      case 'Surat Pengantar SKCK': return <SkckForm {...props} />;
      case 'Surat Pengantar Pindah': return <PindahForm {...props} />;
      case 'Surat Keterangan Usaha': return <SkuForm {...props} />;
      case 'Surat Keterangan Lahir': return <KelahiranForm {...props} />;
      case 'Surat Keterangan Kematian': return <KematianForm {...props} />;
      case 'Surat Keterangan Belum Menikah': return <BelumMenikahForm {...props} />;
      case 'Surat Keterangan Domisili': return <DomisiliForm {...props} />;
      case 'Surat Ijin Keramaian': return <IjinKeramaianForm {...props} />;
      case 'Surat Keterangan Moyang': return <MoyangForm {...props} />;
      case 'Surat Keterangan Pemakaman': return <PemakamanForm {...props} />;
      case 'Surat Keterangan Wali': return <WaliForm {...props} />;
      case 'Surat Keterangan Reaktivasi BPJS Kesehatan': return <ReaktivasiBpjsForm {...props} />;
      case 'Surat Keterangan Umum': return <KeteranganUmumForm {...props} />;
      case 'Surat Pengantar Umum': return <PengantarUmumForm {...props} />;
      default: return null;
    }
  };

  if (!mounted) return null;

  return (
    <div className="space-y-10">
      {!selectedLetter ? (
        <div className="space-y-8">
           <div className="text-center space-y-3">
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 uppercase tracking-tight font-display">
                Pilih <span className="text-primary italic">Jenis Surat</span>
              </h2>
              <p className="text-sm text-slate-500 font-medium max-w-lg mx-auto">
                Silakan pilih salah satu kartu di bawah ini untuk memulai pengisian formulir pengajuan surat resmi Anda.
              </p>
           </div>

           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {letterOptions.map((opt) => (
                <Card 
                  key={opt.type} 
                  className="cursor-pointer group relative hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border-none bg-white overflow-hidden rounded-[2.5rem] flex flex-col"
                  onClick={() => {
                    setSelectedLetter(opt.type);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  <CardContent className="p-8 flex flex-col h-full">
                    <div className={cn("w-16 h-16 rounded-3xl mb-6 flex items-center justify-center transition-transform group-hover:scale-110 group-hover:rotate-6 shadow-sm", opt.color)}>
                      <opt.icon className="h-8 w-8" />
                    </div>
                    <div className="space-y-2 flex-1">
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight leading-tight">
                        {opt.type}
                      </h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
                        {opt.description}
                      </p>
                    </div>
                    <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between">
                       <span className="text-[10px] font-black text-primary uppercase tracking-widest">BUKA FORMULIR</span>
                       <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                          <ArrowLeft className="h-4 w-4 rotate-180" />
                       </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
           </div>
        </div>
      ) : (
        <Card className="rounded-[2.5rem] border-none shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-500">
          <CardHeader className="bg-primary p-8 md:p-12 text-white relative">
            <div className="absolute top-0 right-0 p-12 opacity-10">
               <FileText className="w-32 h-32" />
            </div>
            <div className="space-y-6 relative z-10">
              <Button 
                variant="ghost" 
                onClick={() => setSelectedLetter('')} 
                className="text-white hover:bg-white/10 -ml-4 font-black uppercase text-[10px] tracking-[0.3em]"
              >
                <ArrowLeft className="h-4 w-4 mr-2" /> KEMBALI KE PILIHAN
              </Button>
              <div className="space-y-2">
                <CardTitle className="text-3xl md:text-4xl font-black uppercase font-display italic tracking-tight">
                  {selectedLetter}
                </CardTitle>
                <CardDescription className="text-white/60 font-medium text-lg italic">
                  Lengkapi data formulir pengajuan {isAdmin ? 'oleh Admin' : ''} secara akurat.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 md:p-12 bg-white">
            {renderForm()}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
