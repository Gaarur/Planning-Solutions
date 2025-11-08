"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function ManagerGuard({ children }: { children: React.ReactNode }) {
  const [ok, setOk] = useState<boolean | null>(null)
  const router = useRouter()

  useEffect(() => {
    async function check() {
      const token = typeof window !== "undefined" ? localStorage.getItem("bp_token") : null
      if (!token) {
        setOk(false)
        router.replace('/login')
        return
      }
      try {
        const res = await fetch("http://localhost:8000/me", {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) {
          setOk(false)
          router.replace('/login')
          return
        }
        const data = await res.json()
        if (data.role === 'manager' || data.role === 'admin') {
          setOk(true)
        } else {
          setOk(false)
          router.replace('/')
        }
      } catch (err) {
        setOk(false)
        router.replace('/login')
      }
    }
    check()
  }, [router])

  if (ok === null) return <div>Checking permissions…</div>
  if (!ok) return null
  return <>{children}</>
}
