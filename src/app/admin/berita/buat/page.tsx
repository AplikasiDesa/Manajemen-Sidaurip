
'use client';

import { PageHeader } from '@/components/page-header';
import { NewsForm } from '../_components/news-form';

export default function AdminBuatBeritaPage() {
  return (
    <>
      <PageHeader
        title="Buat Berita"
        description="Publikasikan kegiatan desa terbaru untuk warga Desa Sidaurip."
      />
      <NewsForm />
    </>
  );
}
