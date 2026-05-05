import { PageHeader } from '@/components/page-header';
import { LetterService } from './_components/letter-service';
import { TrackTicket } from './_components/track-ticket';

export default function LayananSuratPage() {
  return (
    <>
      <PageHeader
        title="Layanan Surat"
        description="Ajukan berbagai jenis surat resmi desa melalui formulir online."
      />
      <TrackTicket />
      <LetterService />
    </>
  );
}
