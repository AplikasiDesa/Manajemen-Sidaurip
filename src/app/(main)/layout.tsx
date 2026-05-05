'use client';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarInset,
  useSidebar,
} from '@/components/ui/sidebar';
import { Logo } from '@/components/logo';
import {
  LayoutDashboard,
  FileText,
  MessageSquareWarning,
  Megaphone,
  Loader2,
  Home,
  Newspaper,
  ArrowLeft,
  Users2,
  Menu,
  X
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useFirebase } from '@/firebase';
import { useEffect, useState } from 'react';
import { getCitizenProfile } from '@/lib/citizens';
import { Button } from '@/components/ui/button';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard Utama' },
  { href: '/layanan-surat', icon: FileText, label: 'Layanan Surat' },
  { href: '/Kenali', icon: Users2, label: 'Kenali Kami' },
  { href: '/BeritaDesa', icon: Newspaper, label: 'Berita Desa' },
  { href: '/pengaduan', icon: MessageSquareWarning, label: 'Pengaduan Warga' },
  { href: '/pengumuman', icon: Megaphone, label: 'Pengumuman' },
];

function MobileHeader() {
  const { toggleSidebar, openMobile } = useSidebar();
  
  return (
    <header className="md:hidden sticky top-0 z-40 w-full h-16 bg-primary flex items-center justify-between px-6 shadow-md text-white">
      <Logo />
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={toggleSidebar}
        className="text-white hover:bg-white/10"
      >
        {openMobile ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </Button>
    </header>
  );
}

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { firestore, user, isUserLoading } = useFirebase();
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    const checkProfile = async () => {
      // Bypass untuk email admin
      if (user?.email?.toLowerCase() === 'sidaurip@gmail.id') {
        setIsVerifying(false);
        return;
      }

      if (!isUserLoading && user && firestore) {
        try {
          const profile = await getCitizenProfile(firestore, user.uid);
          if (!profile) {
            router.replace('/portal');
          } else {
            setIsVerifying(false);
          }
        } catch (e) {
          console.error("Profile check error:", e);
          setIsVerifying(false);
        }
      } else if (!isUserLoading && !user) {
        setIsVerifying(false);
      }
    };

    checkProfile();
  }, [user, isUserLoading, firestore, router]);

  if (isVerifying && !isUserLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-primary">
        <div className="flex flex-col items-center">
          <Loader2 className="h-12 w-12 animate-spin text-secondary mb-4" />
          <p className="text-[10px] font-black tracking-[0.4em] text-white/50 uppercase">Menyiapkan Ruang Desa...</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <Sidebar className="border-r border-white/10 bg-primary">
        <SidebarHeader className="p-8">
          <Logo />
        </SidebarHeader>
        <SidebarContent className="px-6">
          <div className="mb-6 px-4">
            <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">Navigasi Portal</p>
          </div>
          <SidebarMenu className="gap-3">
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Halaman Depan" className="rounded-2xl h-12 transition-all hover:bg-white/5">
                <Link href="/" className="flex items-center gap-3">
                  <Home className="text-white/40" />
                  <span className="font-bold">Beranda Publik</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton 
                  asChild 
                  isActive={pathname === item.href} 
                  tooltip={item.label}
                  className="rounded-2xl h-12 transition-all data-[active=true]:bg-secondary data-[active=true]:text-primary-foreground"
                >
                  <Link href={item.href} className="flex items-center gap-3">
                    <item.icon className={pathname === item.href ? 'text-primary-foreground' : 'text-white/40'} />
                    <span className="font-bold">{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-8">
          <div className="bg-white/5 rounded-3xl p-5 border border-white/10 space-y-4">
            <p className="text-[9px] text-white/40 font-black text-center uppercase tracking-[0.2em] leading-relaxed">
              Pelayanan Mandiri Digital Sidaurip
            </p>
            <SidebarMenuItem className="list-none">
                <SidebarMenuButton 
                  asChild
                  className="w-full justify-center bg-secondary text-primary-foreground rounded-2xl hover:bg-yellow-600 transition-all font-black shadow-lg shadow-secondary/20"
                >
                  <Link href="/">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    <span>KEMBALI</span>
                  </Link>
                </SidebarMenuButton>
             </SidebarMenuItem>
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="bg-background flex flex-col min-h-screen">
        <MobileHeader />
        <main className="max-w-[1400px] mx-auto w-full p-4 md:p-12 flex-1">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}