"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar"
import { Button } from "./ui/button"

type UserProfile = {
  username?: string
  role?: string
  uid?: number
  phone?: string
  address?: string
  email?: string
}

export default function ProfileCard() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    async function load() {
      const token = typeof window !== "undefined" ? localStorage.getItem("bp_token") : null
      if (!token) {
        setLoading(false)
        return
      }
      try {
        const res = await fetch("http://localhost:8000/me", {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) {
          setUser(null)
          setLoading(false)
          return
        }
        const data = await res.json()
        // backend /me returns username, role, uid
        setUser({
          username: data.username || data.sub,
          role: data.role,
          uid: data.uid,
          email: data.email,
          phone: data.phone,
          address: data.address,
        })
      } catch (err) {
        setUser(null)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  function logout() {
    if (typeof window !== "undefined") {
      localStorage.removeItem("bp_token")
    }
    router.push("/login")
  }

  return (
    <div className="p-3">
      <div className="flex items-center justify-between gap-3 cursor-pointer" onClick={() => setOpen((s) => !s)}>
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={user?.email ? `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username || 'User')}&background=0D8ABC&color=fff` : undefined} />
            <AvatarFallback>{(user?.username || 'U').charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-semibold">{user?.username || 'Guest'}</div>
            <div className="text-xs text-slate-500">{user?.role || 'visitor'}</div>
          </div>
        </div>
        <div className="text-slate-400">
          {/* chevron */}
          <svg className={`w-4 h-4 transform transition-transform ${open ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg>
        </div>
      </div>

      {open && (
        <div className="mt-3 text-sm space-y-2">
          {/* Only show actions in the sidebar profile popover. Contact details are available on the /profile page. */}
          <div className="mt-2 flex flex-col">
            <Button variant="ghost" className="w-full justify-start" onClick={() => router.push('/profile')}>
              Profile
            </Button>
            <Button variant="outline" className="w-full mt-1" onClick={logout}>
              Logout
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
