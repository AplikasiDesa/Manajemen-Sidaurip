'use client';

import { useEffect } from 'react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { VillageLogoInfo } from '@/lib/types';
import { doc } from 'firebase/firestore';

/**
 * Komponen ini berfungsi untuk merubah logo pada tab browser (favicon)
 * secara dinamis berdasarkan logo yang disimpan di Firestore settings.
 */
export function FaviconManager() {
  const firestore = useFirestore();
  
  const logoRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'villageLogo', 'default');
  }, [firestore]);

  const { data: logoData } = useDoc<VillageLogoInfo>(logoRef);

  useEffect(() => {
    // Pastikan data logo tersedia dan merupakan format base64
    if (logoData?.logoImageUrl && logoData.logoImageUrl.startsWith('data:image')) {
      const updateFavicon = (href: string) => {
        // Cari elemen link icon yang sudah ada
        let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");

        // Jika tidak ada, buat elemen baru
        if (!link) {
          link = document.createElement('link');
          link.rel = 'icon';
          document.getElementsByTagName('head')[0].appendChild(link);
        }

        // Perbarui atribut href dengan data image base64 dari database
        link.href = href;

        // Juga perbarui apple-touch-icon untuk perangkat mobile jika ada
        const appleLink: HTMLLinkElement | null = document.querySelector("link[rel='apple-touch-icon']");
        if (appleLink) {
          appleLink.href = href;
        }
      };

      updateFavicon(logoData.logoImageUrl);
    }
  }, [logoData]);

  // Komponen ini tidak merender apa pun secara visual
  return null;
}
