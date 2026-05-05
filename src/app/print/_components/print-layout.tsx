'use client';

import { Button } from '@/components/ui/button';
import { LetterSubmission, KopSuratInfo } from '@/lib/types';
import { Loader2, Printer, FileDown } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useFirestore } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useSearchParams } from 'next/navigation';

interface PrintLayoutProps {
  submission: LetterSubmission;
  children: React.ReactNode;
  requesterLabel?: string; 
  requesterNameOverride?: string;
  additionalFooter?: React.ReactNode; 
  hideRequesterSignature?: boolean;
  reverseSignatures?: boolean;
}

const fallbackKopInfo: KopSuratInfo = {
  letterheadImageUrl: "https://placehold.co/1200x240/f0f0f0/333333?text=Kop+Surat+Belum+Diatur"
};

const parseDateInput = (dateInput: any): Date | null => {
  if (!dateInput) return null;
  if (dateInput instanceof Date) return dateInput;
  if (typeof dateInput === 'object' && 'toDate' in dateInput) return dateInput.toDate();
  
  if (typeof dateInput === 'string') {
    const separators = /[-/]/;
    const parts = dateInput.split(separators);

    if (parts.length === 3) {
      let d, m, y;
      if (parts[0].length === 4) {
        y = parseInt(parts[0], 10);
        m = parseInt(parts[1], 10) - 1;
        d = parseInt(parts[2], 10);
      } else {
        const p0 = parseInt(parts[0], 10);
        const p1 = parseInt(parts[1], 10);
        let p2 = parseInt(parts[2], 10);
        
        if (p2 < 100) {
          const currentYearShort = new Date().getFullYear() % 100;
          p2 += (p2 > currentYearShort + 2) ? 1900 : 2000;
        }

        if (p0 > 12) { d = p0; m = p1 - 1; y = p2; }
        else if (p1 > 12) { m = p0 - 1; d = p1; y = p2; }
        else { d = p0; m = p1 - 1; y = p2; }
      }
      const date = new Date(y, m, d);
      return isNaN(date.getTime()) ? null : date;
    }
    const parsed = new Date(dateInput);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
};

export const formatTTL = (place: string, dateInput: any) => {
  const dateObj = parseDateInput(dateInput);
  const city = place ? place.toUpperCase() : '';
  
  if (!dateObj) return city || '-';

  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  
  return `${city}, ${dateObj.getDate()} ${months[dateObj.getMonth()]} ${dateObj.getFullYear()}`;
};

export const formatFullDate = (dateInput: any) => {
  const dateObj = parseDateInput(dateInput);
  if (!dateObj) return dateInput || '-';

  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const dayName = days[dateObj.getDay()];
  const dayNum = String(dateObj.getDate()).padStart(2, '0');
  const monthName = months[dateObj.getMonth()];
  const year = dateObj.getFullYear();

  return `${dayName}, ${dayNum} ${monthName} ${year}`;
};

export function PrintLayout({ 
  submission, 
  children, 
  requesterLabel = "Pemohon", 
  requesterNameOverride,
  additionalFooter,
  hideRequesterSignature = false,
  reverseSignatures = false
}: PrintLayoutProps) {
  const [kopInfo, setKopInfo] = useState<KopSuratInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const firestore = useFirestore();
  const { toast } = useToast();
  const printAreaRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();

  const signerType = searchParams.get('signer') || 'kades';

  useEffect(() => {
    const fetchKopInfo = async () => {
      if (!firestore) return;
      setIsLoading(true);
      try {
        const kopSuratRef = doc(firestore, 'kopSurat', 'default');
        const docSnap = await getDoc(kopSuratRef);
        if (docSnap.exists()) {
          setKopInfo(docSnap.data() as KopSuratInfo);
        } else {
          setKopInfo(fallbackKopInfo);
        }
      } catch (error) {
        setKopInfo(fallbackKopInfo);
      } finally {
        setIsLoading(false);
      }
    };
    fetchKopInfo();
  }, [firestore]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!printAreaRef.current) return;
    
    setIsDownloading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));

      const dataUrl = await toPng(printAreaRef.current, {
        backgroundColor: '#ffffff',
        pixelRatio: 2,
        cacheBust: true,
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left',
          margin: '0',
          padding: '0'
        }
      });

      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = 210;
      const pdfHeight = 297;
      
      const marginLeft = 20;   // 2 cm
      const marginRight = 15;  // 1.5 cm
      const marginTop = 3;     // 0.3 cm
      const marginBottom = 0;

      const contentWidth = pdfWidth - marginLeft - marginRight;
      
      const imgProps = pdf.getImageProperties(dataUrl);
      const imgHeight = (imgProps.height * contentWidth) / imgProps.width;

      pdf.addImage(
        dataUrl,
        'PNG',
        0,
        0,
        pdfWidth,
        pdfHeight
      );
         
      const fileName = `${submission.letterType.replace(/\s+/g, '_')}_${submission.requesterName.replace(/\s+/g, '_')}.pdf`;
      pdf.save(fileName);

      toast({
        title: "Berhasil Mengunduh",
        description: "Dokumen PDF telah disimpan ke perangkat Anda.",
      });
    } catch (error) {
      console.error('PDF Generation Error:', error);
      toast({
        title: "Gagal Mengunduh",
        description: "Terjadi kesalahan saat membuat file PDF.",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };
  
  if (isLoading) {
      return (
          <div className="flex h-screen w-full items-center justify-center bg-gray-100">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="ml-2">Memuat templat kop...</p>
          </div>
      )
  }

  const formattedDate = new Date(submission.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  const displayRequesterName = requesterNameOverride || submission.requesterName;

  return (
    <div className="bg-slate-200 text-black font-arial-print print:bg-white min-h-screen py-10 print:p-0">
        <div 
          ref={printAreaRef} 
          className="mx-auto bg-white shadow-2xl print:shadow-none print:border-none overflow-hidden flex flex-col"
          style={{ 
            width: '210mm', 
            minHeight: '297mm',
            boxSizing: 'border-box'
          }}
        >
            <header className="pl-[2cm] pr-[1.5cm] pt-[0.3cm]">
              {kopInfo?.letterheadImageUrl && (
                <img
                  src={kopInfo.letterheadImageUrl}
                  alt="Kop Surat"
                  className="w-full h-auto"
                  crossOrigin="anonymous"
                />
              )}
            </header>

            <main className="pl-[2cm] pr-[1.5cm] pt-[0.3cm] pb-[0cm] text-base">
              <div className="text-center mb-8">
                  <p className="font-bold underline text-lg tracking-wider">{submission.letterType.toUpperCase()}</p>
                  <p>Nomor : {submission.documentNumber}</p>
              </div>

              {children}
            </main>
            
            <footer className="px-[2cm] pb-[0cm] pt-4">
                <div className={cn("flex justify-between text-center items-start", reverseSignatures && "flex-row-reverse")}>
                    <div className={cn("w-[40%]", hideRequesterSignature && "invisible")}>
                        {reverseSignatures ? (
                            <p className="mb-1">Sidaurip, {formattedDate}</p>
                        ) : (
                            <p className="invisible mb-1">Sidaurip, 00 Bulan 0000</p> 
                        )}
                        <p>{requesterLabel}</p>
                        <div className="h-16"></div>
                        <p className="font-bold underline tracking-wider uppercase">
                            {displayRequesterName}
                        </p>
                    </div>

                    <div className="w-[45%]">
                        {!reverseSignatures ? (
                            <p className="mb-1">Sidaurip, {formattedDate}</p>
                        ) : (
                            <p className="invisible mb-1">Sidaurip, 00 Bulan 0000</p>
                        )}
                        
                        {signerType === 'sekdes' ? (
                          <>
                            <p>A.n. Kepala Desa Sidaurip</p>
                            <p>Sekretaris Desa Sidaurip</p>
                            <div className="h-16"></div>
                            <p className="font-bold underline tracking-wider uppercase">SOFA BURHANI</p>
                          </>
                        ) : (
                          <>
                            <p>Kepala Desa Sidaurip</p>
                            <div className="h-16"></div>
                            <p className="font-bold underline tracking-wider uppercase">TASIMIN</p>
                          </>
                        )}
                    </div>
                </div>

                {additionalFooter && (
                  <div className="mt-10">
                    {additionalFooter}
                  </div>
                )}
            </footer>
        </div>

      <div className="fixed bottom-6 right-6 flex flex-col sm:flex-row gap-3 print:hidden">
        <Button onClick={handleDownloadPdf} variant="secondary" size="lg" className="shadow-lg h-12" disabled={isDownloading}>
          {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileDown className="mr-2 h-5 w-5" />}
          Unduh PDF
        </Button>
        <Button onClick={handlePrint} size="lg" className="shadow-lg h-12">
          <Printer className="mr-2 h-5 w-5" />
          Cetak Dokumen
        </Button>
      </div>

      <style jsx global>{`
        .font-arial-print {
            font-family: Arial, sans-serif;
        }
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          html, body {
            width: 210mm;
            height: 297mm;
            background: white;
          }
          body {
            margin: 0;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .fixed {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}

export const DataRow = ({ label, value }: { label: string; value: any }) => {
    const displayValue = value || '-';
    return (
        <tr>
            <td className="w-[30%] py-1 align-top">{label}</td>
            <td className="w-[2%] py-1 align-top text-center">:</td>
            <td className="py-1 align-top pl-1">{displayValue}</td>
        </tr>
    );
};
