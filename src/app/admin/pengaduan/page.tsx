import { PageHeader } from '@/components/page-header';
import { ComplaintList } from './_components/complaint-list';

export default function AdminPengaduanPage() {
  return (
    <>
      <PageHeader
        title="Jawab Pengaduan Warga"
        description="Tinjau dan berikan tanggapan untuk setiap pengaduan yang masuk."
      />
      <ComplaintList />
    </>
  );
}
