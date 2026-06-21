
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth, useUser, useFirestore } from "@/firebase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Home, LogIn, Loader2, KeyRound, Mail, AlertCircle, ArrowLeft } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword } from "firebase/auth"
import Link from "next/link"

const loginSchema = z.object({
  email: z.string().email("Format email tidak valid."),
  password: z.string().min(1, "Password harus diisi."),
})

/**
 * Halaman Login Utama Manajemen Desa
 * KHUSUS ADMIN UTAMA
 */
export default function LoginPage() {
  const auth = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [isProcessing, setIsProcessing] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // SELALU KELUAR (LOGOUT) SAAT MASUK KE HALAMAN INI
    // Hal ini untuk memastikan sesi bersih setiap kali mengakses portal login
    if (auth && auth.currentUser) {
      signOut(auth).catch(() => {});
    }
  }, [auth])

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    // PROTEKSI KETAT: Hanya satu email dan password yang boleh masuk
    const ALLOWED_EMAIL = "sidaurip@gmail.id"
    const ALLOWED_PASS = "sidaurip123"

    if (values.email.toLowerCase().trim() !== ALLOWED_EMAIL || values.password !== ALLOWED_PASS) {
      toast({
        variant: "destructive",
        title: "Akses Ditolak",
        description: "Hanya Admin Utama (Manajemen) yang diperbolehkan masuk ke sistem ini.",
      })
      return
    }

    setIsProcessing(true)
    try {
      // 1. Coba login ke Firebase Auth
      try {
        await signInWithEmailAndPassword(auth, values.email.toLowerCase().trim(), values.password)
      } catch (authErr: any) {
        // 2. Jika gagal karena user belum terdaftar di Firebase (Initial Setup)
        // Kita otomatis buatkan akunnya karena kredensial sudah divalidasi hardcoded di atas
        if (authErr.code === 'auth/user-not-found' || authErr.code === 'auth/invalid-credential') {
           try {
              await createUserWithEmailAndPassword(auth, values.email.toLowerCase().trim(), values.password)
           } catch (createErr) {
             throw authErr // Lempar error asli jika gagal create
           }
        } else {
          throw authErr
        }
      }
      
      toast({
        title: "Login Berhasil",
        description: "Selamat datang di Panel Manajemen Desa.",
      })
      router.push("/dashboard/")
    } catch (error: any) {
      console.error("Login Error:", error);
      toast({
        variant: "destructive",
        title: "Gagal Masuk",
        description: "Terjadi kesalahan pada kredensial atau koneksi server.",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  if (!mounted) return null;

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-primary/5">
      <Card className="w-full max-w-md shadow-2xl border-none rounded-[3.5rem] overflow-hidden bg-card animate-in fade-in zoom-in-95 duration-500">
        <CardHeader className="text-center space-y-4 pb-4 pt-12 relative">
          <Button variant="ghost" size="icon" asChild className="absolute left-6 top-6 rounded-full hover:bg-primary/5 transition-all">
            <Link href="/"><ArrowLeft className="h-5 w-5 text-slate-400" /></Link>
          </Button>
          <div className="mx-auto h-20 w-20 rounded-[2.2rem] bg-primary flex items-center justify-center shadow-2xl shadow-primary/30">
            <Home className="text-primary-foreground h-10 w-10" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-3xl font-black tracking-tighter uppercase text-primary leading-[0.9]">MASUK SISTEM<br/>MANAJEMEN</CardTitle>
            <CardDescription className="font-bold text-[10px] uppercase tracking-widest opacity-40">Pemerintah Desa Sidaurip</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-8 sm:p-12 space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" autoComplete="off">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-[10px] font-black uppercase text-slate-500 tracking-wider ml-1">Email Admin</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input 
                          placeholder="sidaurip@gmail.id" 
                          {...field} 
                          className="h-14 rounded-2xl pl-12 text-sm border-none bg-slate-50 focus:ring-2 focus:ring-primary/20 font-bold" 
                          autoComplete="off"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-[10px] font-black uppercase text-slate-500 tracking-wider ml-1">Kata Sandi</FormLabel>
                    <FormControl>
                       <div className="relative">
                        <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input 
                          type="password" 
                          placeholder="••••••••" 
                          {...field} 
                          className="h-14 rounded-2xl pl-12 text-sm border-none bg-slate-50 focus:ring-2 focus:ring-primary/20 font-bold" 
                          autoComplete="new-password"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button 
                type="submit"
                className="w-full h-16 text-sm font-black uppercase gap-4 shadow-xl active:scale-[0.98] transition-all rounded-[1.5rem] bg-primary hover:bg-primary/90 mt-4 text-white" 
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <>
                    <LogIn className="h-5 w-5" />
                    Masuk Sekarang
                  </>
                )}
              </Button>
            </form>
          </Form>

          <div className="p-6 bg-slate-50 border-2 border-dashed border-slate-100 rounded-3xl flex items-start gap-4">
            <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <p className="text-[10px] text-slate-400 leading-relaxed font-bold uppercase tracking-tight">
              Sistem ini memiliki otoritas terbatas. Hanya admin resmi yang dapat mengakses database utama desa.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
