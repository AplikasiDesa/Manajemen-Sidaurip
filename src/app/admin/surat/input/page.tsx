
'use client';

import { PageHeader } from '@/components/page-header';
import { LetterService } from '@/app/(main)/layanan-surat/_components/letter-service';

export default function AdminInputSuratPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Pengajuan Surat"
        description="Input pengajuan surat secara langsung dari dashboard administrasi. Khusus admin, lampiran berkas bersifat opsional."
      />
      <LetterService isAdmin={true} />
    </div>
  );
}
