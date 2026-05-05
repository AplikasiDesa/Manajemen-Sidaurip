'use client';

import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { VillageLogoInfo } from '@/lib/types';
import { doc } from 'firebase/firestore';
import Image from 'next/image';
import { Mountain } from "lucide-react";
import { Skeleton } from './ui/skeleton';

export function Logo() {
  const firestore = useFirestore();
  const logoRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'villageLogo', 'default');
  }, [firestore]);
  
  const { data: logoData, isLoading } = useDoc<VillageLogoInfo>(logoRef);

  return (
    <div className="flex items-center gap-3">
      {isLoading ? (
        <Skeleton className="h-9 w-9 rounded-xl" />
      ) : logoData?.logoImageUrl && logoData.logoImageUrl.startsWith('data:image') ? (
         <Image 
            src={logoData.logoImageUrl}
            alt="Logo Desa"
            width={36}
            height={36}
            className="h-9 w-9 object-contain"
         />
      ) : (
        <div className="h-9 w-9 bg-accent rounded-xl flex items-center justify-center text-white shadow-lg shadow-accent/20">
          <Mountain className="h-5 w-5" />
        </div>
      )}
      <div className="flex flex-col">
        <span className="text-sm font-display font-black leading-tight uppercase tracking-tighter">
          Sidaurip
        </span>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          Digital Portal
        </span>
      </div>
    </div>
  );
}
