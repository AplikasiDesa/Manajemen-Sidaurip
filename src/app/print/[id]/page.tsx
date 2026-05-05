'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getSubmissionById } from '@/lib/submissions';
import { LetterSubmission } from '@/lib/types';
import { SkuPrintTemplate } from '../_components/sku-print-template';
import { Loader2 } from 'lucide-react';
import { SktmPrintTemplate } from '../_components/sktm-print-template';
import { SkckPrintTemplate } from '../_components/skck-print-template';
import { PindahPrintTemplate } from '../_components/pindah-print-template';
import { KelahiranPrintTemplate } from '../_components/kelahiran-print-template';
import { KematianPrintTemplate } from '../_components/kematian-print-template';
import { BelumMenikahPrintTemplate } from '../_components/belum-menikah-print-template';
import { DomisiliPrintTemplate } from '../_components/domisili-print-template';
import { IjinKeramaianPrintTemplate } from '../_components/ijin-keramaian-print-template';
import { MoyangPrintTemplate } from '../_components/moyang-print-template';
import { PemakamanPrintTemplate } from '../_components/pemakaman-print-template';
import { WaliPrintTemplate } from '../_components/wali-print-template';
import { ReaktivasiBpjsPrintTemplate } from '../_components/reaktivasi-bpjs-print-template';
import { PengantarUmumPrintTemplate } from '../_components/pengantar-umum-print-template';
import { KeteranganUmumPrintTemplate } from '../_components/keterangan-umum-print-template';
import { useFirebase } from '@/firebase';

export default function PrintPage() {
  const params = useParams();
  const id = params?.id as string;
  const [submission, setSubmission] = useState<LetterSubmission | 'not_found' | null>(null);
  const { firestore } = useFirebase();

  useEffect(() => {
    if (id && firestore) {
      const fetchSubmission = async () => {
        const foundSubmission = await getSubmissionById(firestore, id);
        if (foundSubmission?.documentNumber) {
          setSubmission(foundSubmission);
        } else {
          setSubmission(foundSubmission || 'not_found');
        }
      }
      fetchSubmission();
    }
  }, [id, firestore]);

  if (submission === null) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-100">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="ml-2">Memuat data...</p>
      </div>
    );
  }

  if (submission === 'not_found' || !submission.documentNumber) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-100 p-8">
        <div className="p-8 bg-white rounded-lg shadow-md text-center">
            <h2 className="text-xl font-bold text-destructive-foreground mb-2">Aksi Diperlukan</h2>
            <p className="text-destructive-foreground/80">
                Nomor surat belum dibuat untuk pengajuan ini. <br/>
                Silakan kembali ke dasbor admin dan klik <strong>"Buat Nomor"</strong>.
            </p>
        </div>
      </div>
    );
  }

  const renderTemplate = () => {
    switch (submission.letterType) {
      case 'Surat Keterangan Usaha':
        return <SkuPrintTemplate submission={submission} />;
      case 'Surat Keterangan Tidak Mampu':
        return <SktmPrintTemplate submission={submission} />;
      case 'Surat Pengantar SKCK':
        return <SkckPrintTemplate submission={submission} />;
      case 'Surat Pengantar Pindah':
        return <PindahPrintTemplate submission={submission} />;
      case 'Surat Keterangan Lahir':
        return <KelahiranPrintTemplate submission={submission} />;
      case 'Surat Keterangan Kematian':
        return <KematianPrintTemplate submission={submission} />;
      case 'Surat Keterangan Belum Menikah':
        return <BelumMenikahPrintTemplate submission={submission} />;
      case 'Surat Keterangan Domisili':
        return <DomisiliPrintTemplate submission={submission} />;
      case 'Surat Ijin Keramaian':
        return <IjinKeramaianPrintTemplate submission={submission} />;
      case 'Surat Keterangan Moyang':
        return <MoyangPrintTemplate submission={submission} />;
      case 'Surat Keterangan Pemakaman':
        return <PemakamanPrintTemplate submission={submission} />;
      case 'Surat Keterangan Wali':
        return <WaliPrintTemplate submission={submission} />;
      case 'Surat Keterangan Reaktivasi BPJS Kesehatan':
        return <ReaktivasiBpjsPrintTemplate submission={submission} />;
      case 'Surat Keterangan Umum':
        return <KeteranganUmumPrintTemplate submission={submission} />;
      case 'Surat Pengantar Umum':
        return <PengantarUmumPrintTemplate submission={submission} />;
      default:
        return (
          <div className="flex h-screen w-full items-center justify-center bg-gray-100">
            <p className="p-8 bg-white rounded-lg shadow-md">
              Template cetak untuk jenis surat <span className="font-semibold">"{submission.letterType}"</span> belum tersedia.
            </p>
          </div>
        );
    }
  };

  return <>{renderTemplate()}</>;
}
