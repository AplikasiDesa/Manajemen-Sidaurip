'use client';

import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { News } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Eye, Star } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { optimizeCloudinaryUrl } from '@/lib/utils';

export function NewsList() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const newsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'news'), orderBy('updatedAt', 'desc'));
  }, [firestore]);

  const { data: news, isLoading } = useCollection<News>(newsQuery);

  const handleDelete = async (id: string) => {
    if (!firestore) return;
    try {
      await deleteDoc(doc(firestore, 'news', id));
      toast({ title: "Berita Dihapus" });
    } catch (e: any) {
      toast({ title: "Gagal Menghapus", variant: "destructive" });
    }
  };

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div>;

  return (
    <div className="rounded-lg border bg-white overflow-hidden shadow-sm">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead className="w-[100px]">Gambar</TableHead>
            <TableHead>Judul Berita</TableHead>
            <TableHead>Tanggal</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {news?.length === 0 ? (
            <TableRow><TableCell colSpan={5} className="text-center h-24 text-muted-foreground">Belum ada berita.</TableCell></TableRow>
          ) : (
            news?.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <img src={optimizeCloudinaryUrl(item.imageUrl)} alt={item.title} className="h-10 w-16 object-cover rounded border" />
                </TableCell>
                <TableCell>
                  <p className="font-bold text-sm line-clamp-1">{item.title}</p>
                  <p className="text-[10px] text-muted-foreground">{item.author}</p>
                </TableCell>
                <TableCell className="text-[10px] whitespace-nowrap">{item.date}</TableCell>
                <TableCell>
                  {item.isHeadline && (
                    <Badge variant="default" className="bg-amber-100 text-amber-700 border-amber-200 text-[9px] gap-1 px-2 py-0">
                      <Star className="h-2.5 w-2.5 fill-amber-500" /> HEADLINE
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="icon" className="h-8 w-8" asChild>
                      <Link href={`/BeritaDesa/${item.id}`} target="_blank">
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button variant="outline" size="icon" className="h-8 w-8" asChild>
                      <Link href={`/admin/berita/edit/${item.id}`}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="icon" className="h-8 w-8"><Trash2 className="h-4 w-4" /></Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Hapus Berita?</AlertDialogTitle>
                          <AlertDialogDescription>Tindakan ini permanen. Berita tidak dapat dikembalikan.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Batal</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(item.id)} className="bg-red-600">Ya, Hapus</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
