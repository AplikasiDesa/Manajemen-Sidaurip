import { PageHeader } from '@/components/page-header';
import { AnnouncementForm } from './_components/announcement-form';
import { AnnouncementList } from './_components/announcement-list';

export default function AdminPengumumanPage() {
  return (
    <>
      <PageHeader
        title="Kelola Pengumuman"
        description="Buat dan terbitkan pengumuman baru untuk ditampilkan kepada warga."
      />
      <AnnouncementForm />
      <AnnouncementList />
    </>
  );
}
