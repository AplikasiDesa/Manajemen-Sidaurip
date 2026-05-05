import { PageHeader } from '@/components/page-header';
import { ComplaintSystem } from './_components/complaint-system';

export default function PengaduanPage() {
  return (
    <>
      <PageHeader
        title="Pengaduan Warga"
        description="Sampaikan keluhan dan masukan Anda untuk kemajuan Desa Sidaurip."
      />
      <ComplaintSystem />
    </>
  );
}
