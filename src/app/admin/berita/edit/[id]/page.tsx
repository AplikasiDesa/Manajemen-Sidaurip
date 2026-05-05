
'use client';

import { useParams } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { NewsForm } from '../../_components/news-form';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { News } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminEditBeritaPage() {
  const params = useParams();
  const id = params?.id as string;
  const firestore = useFirestore();

  const newsRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'news', id);
  }, [firestore, id]);

  const { data: news, isLoading } = useDoc<News>(newsRef);

  if (isLoading) return <div className="p-8"><Skeleton className="h-[500px] w-full" /></div>;

  return (
    <>
      <PageHeader
        title="Edit Berita"
        description="Perbarui informasi berita kegiatan desa."
      />
      <NewsForm initialData={news} />
    </>
  );
}
