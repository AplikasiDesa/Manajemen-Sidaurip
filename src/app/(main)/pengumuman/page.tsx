'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Megaphone } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { Announcement } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function PengumumanPage() {
  const firestore = useFirestore();
  const announcementsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    // Optimized: Added limit(50) to save quota
    return query(collection(firestore, 'announcements'), orderBy('publishDate', 'desc'), limit(50));
  }, [firestore]);

  const { data: announcements, isLoading } = useCollection<Announcement>(announcementsQuery);

  return (
    <>
      <PageHeader
        title="Pengumuman Desa"
        description="Informasi dan pengumuman penting dari administrasi Desa Sidaurip."
      />
      <div className="space-y-4">
        {isLoading && (
          <>
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
          </>
        )}
        {!isLoading && announcements && announcements.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              Belum ada pengumuman yang diterbitkan.
            </CardContent>
          </Card>
        )}
        {announcements?.map((announcement) => (
          <Card key={announcement.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Megaphone className="h-5 w-5 text-primary" />
                {announcement.title}
              </CardTitle>
              <CardDescription>
                Dipublikasikan pada {announcement.publishDate?.toDate().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{announcement.content}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
