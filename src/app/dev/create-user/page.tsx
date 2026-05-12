"use client"

import { useState, useEffect } from "react"
import { auth, firestore as db } from "@/firebase"
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth"
import { doc, setDoc } from "firebase/firestore"
import { Loader2 } from "lucide-react"
import { INTERNAL_USERS } from "@/lib/internal-users"

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export default function CreateUserPage() {
  const [logs, setLogs] = useState<{ msg: string, type: 'info' | 'success' | 'error' | 'warn' }[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  const addLog = (msg: string, type: 'info' | 'success' | 'error' | 'warn' = 'info') => {
    setLogs(prev => [{ msg: `${new Date().toLocaleTimeString()} - ${msg}`, type }, ...prev])
  }

  const runProcess = async () => {
    if (isProcessing) return
    setIsProcessing(true)
    addLog("🚀 Memulai sinkronisasi kredensial internal...", "info")

    for (const u of INTERNAL_USERS) {
      addLog(`⏳ Memproses: ${u.username}...`)
      await sleep(1500);

      try {
        let uid = "";
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, u.email, u.password)
          uid = userCredential.user.uid
          addLog(`✅ Auth: [${u.username}] Berhasil didaftarkan.`, 'success')
        } catch (authErr: any) {
          if (authErr.code === 'auth/email-already-in-use') {
            addLog(`⚠️ Auth: [${u.username}] Sudah terdaftar. Melakukan verifikasi login...`, 'warn')
            try {
              const userCredential = await signInWithEmailAndPassword(auth, u.email, u.password)
              uid = userCredential.user.uid
            } catch (loginErr: any) {
              addLog(`❌ Auth: Gagal verifikasi password [${u.username}].`, 'error')
              continue;
            }
          } else {
            throw authErr
          }
        }

        if (uid) {
          const personelRef = doc(db, "personel", uid)
          await setDoc(personelRef, {
            uid: uid,
            username: u.username.toLowerCase(),
            email: u.email,
            password: u.password,
            role: u.role,
            aktif: true,
            nama: u.username.replace(/_/g, " ").toUpperCase(),
            created_at: new Date().toISOString()
          }, { merge: true })
          addLog(`✅ Firestore: Data [${u.username}] sinkron.`, 'success')
        }

      } catch (err: any) {
        addLog(`❌ ERROR [${u.username}]: ${err.message}`, "error")
      }
    }

    addLog("🏁 Semua proses selesai. Silakan coba login kembali.", "info")
    setIsProcessing(false)
  }

  useEffect(() => {
    runProcess()
  }, [])

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-6 bg-slate-50 min-h-screen">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-black uppercase tracking-tighter text-slate-900">User Setup Utility</h1>
        {isProcessing && <Loader2 className="animate-spin text-primary" />}
      </div>
      <div className="bg-white rounded-3xl border shadow-xl p-6 h-[500px] overflow-y-auto space-y-2 font-mono text-xs">
        {logs.map((log, i) => (
          <div key={i} className={`p-2 rounded-lg border flex items-start gap-2 ${
            log.type === 'success' ? 'bg-green-50 border-green-100 text-green-700' :
            log.type === 'error' ? 'bg-red-50 border-red-100 text-red-700' :
            log.type === 'warn' ? 'bg-yellow-50 border-yellow-100 text-yellow-700' :
            'bg-slate-50 border-slate-100 text-slate-600'
          }`}>
            <span>{log.msg}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
