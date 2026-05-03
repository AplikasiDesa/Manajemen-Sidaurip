"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth, useUser } from "@/firebase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LogIn, Loader2, KeyRound, User, ArrowLeft, ShieldCheck } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { signInWithEmailAndPassword, signOut } from "firebase/auth"
import Link from "next/link"
import { INTERNAL_USERS } from "@/app/dev/create-user/page"

const loginSchema = z.object({
  username: z.string().min(3, "Username admin diperlukan."),
  password: z.string().min(6, "Password minimal 6 karakter."),
})

export default function AdminAbsensiLoginPage() {
  const { user, isUserLoading } = useUser()
  const auth = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    signOut(auth).catch(() => {})
  }, [auth])

  useEffect(() => {
    if (user && !isUserLoading) {
      router.push("/absensi-admin/dashboard/")
    }
  }, [user, isUserLoading, router])

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  })

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    setIsProcessing(true)
    try {
      const cleanUsername = values.username.trim().toLowerCase()
      
      // MENCARI DATA DARI INTERNAL MAP
      const internalAdmin = INTERNAL_USERS.find(u => u.username === cleanUsername)

      if (!internalAdmin) {
        throw new Error("Admin dengan username '" + cleanUsername + "' tidak ditemukan.")
      }

      if (internalAdmin.role !== "admin_absensi" && internalAdmin.role !== "admin") {
        throw new Error("Akses ditolak: Akun '" + cleanUsername + "' bukan Administrator.")
      }

      // LOGIN
      await signInWithEmailAndPassword(auth, internalAdmin.email, values.password)
      
      toast({ title: "Login Admin Berhasil", description: "Membuka panel monitoring..." })
      router.push("/absensi-admin/dashboard/")
    } catch (error: any) {
      console.error("Admin Login Error:", error)
      let message = error.message || "Username atau kata sandi salah."
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        message = "Kata sandi salah."
      }

      toast({ variant: "destructive", title: "Gagal Masuk", description: message })
    } finally {
      setIsProcessing(false)
    }
  }

  if (isUserLoading) return <div className="flex h-screen items-center justify-center bg-slate-900"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-slate-900">
      <Card className="w-full max-w-md shadow-2xl border-none rounded-[2.5rem] overflow-hidden bg-card">
        <CardHeader className="text-center space-y-4 pb-4 pt-12 relative">
          <Button variant="ghost" size="icon" asChild className="absolute left-6 top-6 rounded-full"><Link href="/"><ArrowLeft className="h-5 w-5 text-white" /></Link></Button>
          <div className="mx-auto h-20 w-20 rounded-[2rem] bg-slate-900 flex items-center justify-center shadow-2xl">
            <ShieldCheck className="text-white h-10 w-10" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-2xl font-black tracking-tighter uppercase text-slate-900">MONITORING ABSENSI</CardTitle>
            <CardDescription className="font-bold text-[10px] uppercase tracking-widest opacity-60">Portal Kontrol Admin</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-8 sm:p-10 space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="username" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase text-muted-foreground">Username Admin</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="adminsidaurip" {...field} className="h-12 rounded-xl pl-10 text-sm" />
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
                      <Input type="password" placeholder="******" {...field} className="h-12 rounded-xl pl-10 text-sm" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <Button type="submit" className="w-full h-14 text-base font-black uppercase shadow-lg rounded-2xl bg-slate-900 hover:bg-slate-800 mt-4 text-white" disabled={isProcessing}>
                {isProcessing ? <Loader2 className="h-6 w-6 animate-spin" /> : <><ShieldCheck className="h-5 w-5" /> Masuk Panel Admin</>}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
