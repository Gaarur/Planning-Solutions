"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [checking, setChecking] = useState(true)

  // public routes that don't require login
  const PUBLIC_ROUTES = ["/login", "/signup", "/", "/api"]

  useEffect(() => {
    // Only run on client
    const token = typeof window !== "undefined" ? localStorage.getItem("bp_token") : null

    // allow public routes
    const isPublic = PUBLIC_ROUTES.some((p) => pathname?.startsWith(p))
    if (!token && !isPublic) {
      // redirect to login
      router.push("/login")
      return
    }
    setChecking(false)
  }, [pathname, router])

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-slate-600">Checking authentication…</div>
      </div>
    )
  }

  return <>{children}</>
}
