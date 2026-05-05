'use client';

import { PageHeader } from '@/components/page-header';
import { ResidentList } from './_components/resident-list';

export default function AdminPendudukPage() {
  return (
    <>
      <PageHeader
        title="Database Kependudukan"
        description="Manajemen data penduduk Desa Sidaurip. Gunakan fitur pencarian untuk menemukan warga dengan cepat."
      />
      
      <ResidentList />
    </>
  );
}
