import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SubmissionList } from './_components/submission-list';

export default function AdminSuratPage() {
  return (
    <>
      <PageHeader
        title="Kelola Pengajuan Surat"
        description="Tinjau, setujui, atau tolak pengajuan surat dari warga."
      />
      <Card>
        <CardHeader>
          <CardTitle>Daftar Pengajuan Masuk</CardTitle>
        </CardHeader>
        <CardContent>
          <SubmissionList />
        </CardContent>
      </Card>
    </>
  );
}
