
'use client';

import { PageHeader } from '@/components/page-header';
import { NewsList } from './_components/news-list';

export default function AdminRincianBeritaPage() {
  return (
    <>
      <PageHeader
        title="Rincian Berita"
        description="Kelola seluruh berita kegiatan desa yang telah diterbitkan."
      />
      <NewsList />
    </>
  );
}
