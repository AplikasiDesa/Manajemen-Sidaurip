'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { ExternalLink, FileText } from 'lucide-react';

const capilForms = [
  { title: "Formulir Pendaftaran Permohonan Perubahan", href: "https://drive.google.com/file/d/1dibj7P8OXSENh8_PiLAny3NotXXJcTEq/view" },
  { title: "Formulir Biodata Keluarga (F1.01)", href: "https://drive.google.com/file/d/18zQnZ0_5vB-4qPRWCKVkQDLDrUd_4HtW/view" },
  { title: "Formulir Pendaftaran Peristiwa Kependudukan (F1.02)", href: "https://drive.google.com/file/d/1_0hKY4L0hO_hn_EMnBT0oblAAwwOWdyz/view" },
  { title: "Formulir Pendaftaran Perpindahan Penduduk (F1.03)", href: "https://drive.google.com/file/d/122oChJHdpFrCHanTF15GWjqsjuStAZgj/view" },
  { title: "Formulir Pelaporan Pencatatan Sipil (F-2.01)", href: "https://drive.google.com/file/d/1CNuv64NO03hdNGIPWxMlrGJpKToTqmT_/view" },
  { title: "SPTJM Kebenaran Data Kelahiran (F-2.03)", href: "https://drive.google.com/file/d/10DAw77PoIA_8vAwVJXAH9neiM0QnvGTJ/view" },
  { title: "SPTJM Kebenaran Pasangan Suami Istri (F2.04)", href: "https://drive.google.com/file/d/1QQWGC1TQA9gXTyD2RMwnURRstlByUAmo/view" },
  { title: "Surat Keterangan Kematian (F2.29)", href: "https://drive.google.com/file/d/1gY-KxZpaXYQNEsKhPuvQhLGDwe5jkaaN/view" },
  { title: "Surat Pernyataan Perubahan Elemen Data Kependudukan (F1.06)", href: "https://drive.google.com/file/d/1bzLH_xgTuUSXs_IhgLpRAqg2ty7iZPVt/view" },
  { title: "Surat Pernyataan Data Hilang", href: "https://drive.google.com/file/d/1Ze-q1mEu6TZzEcX6y98iWvyUrgKNTR7U/view" },
  { title: "Formulir Permohonan Pindah WNI", href: "https://drive.google.com/file/d/1p5xQrW3n9Z9oANONloZPwOADH2-CAio0/view" },
  { title: "Surat Permohonan Ganti Foto dan Tanda Tangan KTP-el", href: "https://drive.google.com/file/d/1sd865im36vfMdwcn4rFvvDr17bNrBzT_/view" },
  { title: "SPTJM Kebenaran Data Kematian", href: "https://drive.google.com/file/d/1LbZTkt02qe8YH6Effp7pOh8xVJ1n0gLI/view" },
  { title: "Surat Pengantar Pindah Ke Luar Negeri (Formulir F1.59)", href: "https://drive.google.com/file/d/13WT-sPWvI78Znb2JLBOYtyrjjBSBvz7_/view" },
  { title: "SPTJM Perkawinan/Perceraian Belum Tercatat", href: "https://drive.google.com/file/d/1l783ewmUodY2DXtjmXtKXQii8JGxFawx/view" },
  { title: "Syarat Pembuatan Akta Pencatatan Sipil Terbaru", href: "https://drive.google.com/file/d/1HUWd1fQzakshqbqon6GNHq_wtxgdN6_V/view" },
  { title: "Formulir Berita Acara Keabsahan dan Penelitian Akta Kelahiran", href: "https://drive.google.com/file/d/1pHb0ukFmzAl50UL6gSzYf6Jf4YZwoKhb/view" },
  { title: "Tutorial Permohonan Online Aplikasi Dolan Teluk Penyu", href: "https://drive.google.com/file/d/1NVAqryeIt9-Nd4MSCw0IHbpUPHeI7GW5/view" },
  { title: "SOP Penerbitan dan Pendaftaran Identitas Kependudukan Digital", href: "https://drive.google.com/file/d/1LkXo8dCG4wsUOE3kn97smVI7-GKyZ2mk/view" },
];

export default function AdminCapilFormsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Formulir Capil"
        description="Kumpulan formulir resmi kependudukan dari Dinas Kependudukan dan Pencatatan Sipil."
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {capilForms.map((form, index) => (
          <a 
            key={index} 
            href={form.href} 
            target="_blank" 
            rel="noopener noreferrer"
            className="group block"
          >
            <Card className="h-full transition-all hover:shadow-md hover:border-primary/50 bg-white border-slate-100 rounded-[1.5rem] overflow-hidden active:scale-95">
              <CardContent className="p-6 flex items-start gap-4">
                <div className="p-3 bg-primary/5 rounded-xl text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                  <FileText className="h-6 w-6" />
                </div>
                <div className="flex-1 space-y-1">
                  <h3 className="font-black text-[13px] leading-tight group-hover:text-primary transition-colors uppercase tracking-tight text-slate-800">
                    {form.title}
                  </h3>
                  <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] pt-2">
                    <span>Lihat Dokumen</span>
                    <ExternalLink className="h-3 w-3" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </a>
        ))}
      </div>
    </div>
  );
}