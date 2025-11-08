"use client"

import { useEffect, useState } from "react"
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar"

type UserProfile = {
  username?: string
  role?: string
  uid?: number
  phone?: string
  address?: string
  email?: string
}

export default function ProfileView() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

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

  if (loading) {
    return <div className="text-sm text-slate-600">Loading profile…</div>
  }

  if (!user) {
    return <div className="text-sm text-red-600">No profile available.</div>
  }

  return (
    <div className="p-4">
      <div className="flex items-center gap-4">
        <Avatar>
          <AvatarImage src={user.email ? `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username || 'User')}&background=0D8ABC&color=fff` : undefined} />
          <AvatarFallback>{(user.username || 'U').charAt(0)}</AvatarFallback>
        </Avatar>
        <div>
          <div className="text-lg font-semibold">{user.username}</div>
          <div className="text-sm text-slate-500">{user.role}</div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-2 text-sm">
        <div><span className="text-slate-600">Email: </span>{user.email || '—'}</div>
        <div><span className="text-slate-600">Phone: </span>{user.phone || '—'}</div>
        <div><span className="text-slate-600">Address: </span>{user.address || '—'}</div>
      </div>
    </div>
  )
}
