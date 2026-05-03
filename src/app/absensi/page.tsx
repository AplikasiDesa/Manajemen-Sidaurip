
"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase"
import { doc } from "firebase/firestore"
import { Loader2 } from "lucide-react"

export default function AbsensiRedirectPage() {
  const { user, isUserLoading } = useUser()
  const db = useFirestore()
  const router = useRouter()

  const userDocRef = useMemoFirebase(() => 
    db && user ? doc(db, "personel", user.uid) : null, 
  [db, user])
  
  const { data: personelData, isLoading: isPersonelLoading } = useDoc(userDocRef)

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace("/absensi/login/")
    } else if (user && personelData) {
      if (personelData.role === "perangkat") {
        router.replace("/absensi/dashboard/")
      } else if (personelData.role === "admin_absensi") {
        router.replace("/absensi-admin/dashboard/")
      } else {
        // Fallback if role is mixed or invalid
        router.replace("/absensi/login/")
      }
    }
  }, [user, isUserLoading, personelData, isPersonelLoading, router])

  return (
    <div className="flex h-screen w-full items-center justify-center">
      <Loader2 className="h-10 w-10 animate-spin text-primary/20" />
    </div>
  )
}
