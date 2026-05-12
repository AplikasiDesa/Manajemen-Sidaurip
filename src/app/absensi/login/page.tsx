"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth, useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LogIn, Loader2, KeyRound, User, ArrowLeft, UserCheck } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { signInWithEmailAndPassword } from "firebase/auth"
import { doc } from "firebase/firestore"
import Link from "next/link"
import { INTERNAL_USERS } from "@/lib/internal-users"

const loginSchema = z.object({
  username: z.string().min(3, "Username minimal 3 karakter."),
  password: z.string().min(6, "Password minimal 6 karakter."),
})

export default function AbsensiLoginPage() {
  const { user, isUserLoading } = useUser()
  const db = useFirestore()
  const auth = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [isProcessing, setIsProcessing] = useState(false)
  const [mounted, setMounted] = useState(false)

  const personelRef = useMemoFirebase(() => 
    db && user ? doc(db, "personel", user.uid) : null, 
  [db, user])
  const { data: personelData, isLoading: isPersonelLoading } = useDoc(personelRef)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Efek ini hanya mengarahkan ke dashboard personal jika user yang login BUKAN admin
  // Jika admin login di sini, biarkan tetap di halaman login agar bisa ganti akun
  useEffect(() => {
    if (mounted && user && !isUserLoading && !isPersonelLoading) {
      const isAdmin = user.email === "adminsidaurip@gmail.id" || personelData?.role === "admin_absensi" || personelData?.role === "admin";
      
      if (!isAdmin) {
        router.push("/absensi/dashboard/")
      }
    }
  }, [user, isUserLoading, personelData, isPersonelLoading, router, mounted])

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  })

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    setIsProcessing(true)
    try {
      const cleanUsername = values.username.trim().toLowerCase()
      const internalUser = INTERNAL_USERS.find(u => u.username === cleanUsername)

      if (!internalUser) {
        throw new Error("Username '" + cleanUsername + "' tidak terdaftar di sistem.")
      }

      // Login personal tidak boleh masuk menggunakan akun admin di portal ini
      if (internalUser.role === "admin" || internalUser.role === "admin_absensi") {
        throw new Error("Akun Admin harus masuk melalui Portal Admin.")
      }

      await signInWithEmailAndPassword(auth, internalUser.email, values.password)
      toast({ title: "Berhasil Masuk", description: "Selamat datang, " + internalUser.username })
      router.push("/absensi/dashboard/")
    } catch (error: any) {
      console.error("Login Error:", error)
      let message = error.message || "Username atau kata sandi salah."
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        message = "Kata sandi yang Anda masukkan salah."
      }
      toast({ variant: "destructive", title: "Gagal Masuk", description: message })
    } finally {
      setIsProcessing(false)
    }
  }

  if (!mounted || isUserLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-slate-50">
      <Card className="w-full max-w-md shadow-2xl border-none rounded-[2.5rem] overflow-hidden bg-card">
        <CardHeader className="text-center space-y-4 pb-4 pt-12 relative">
          <Button variant="ghost" size="icon" asChild className="absolute left-6 top-6 rounded-full">
            <Link href="/"><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <div className="mx-auto h-20 w-20 rounded-[2rem] bg-primary flex items-center justify-center shadow-2xl shadow-primary/30">
            <UserCheck className="text-primary-foreground h-10 w-10" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-2xl font-black tracking-tighter uppercase text-primary">ABSENSI PERANGKAT</CardTitle>
            <CardDescription className="font-bold text-[10px] uppercase tracking-widest opacity-60">Gunakan Username Anda</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-8 sm:p-10 space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="username" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase text-muted-foreground">Username</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="tasimin" {...field} className="h-12 rounded-xl pl-10 text-sm border-primary/10 bg-muted/30" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="password" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase text-muted-foreground">Kata Sandi</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input type="password" placeholder="******" {...field} className="h-12 rounded-xl pl-10 text-sm border-primary/10 bg-muted/30" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <Button type="submit" className="w-full h-14 text-base font-black uppercase gap-4 shadow-lg rounded-2xl bg-primary hover:bg-primary/90 mt-4" disabled={isProcessing}>
                {isProcessing ? <Loader2 className="h-6 w-6 animate-spin" /> : <><LogIn className="h-5 w-5" /> Masuk Absensi</>}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}