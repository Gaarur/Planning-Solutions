"use client"

import { useState } from "react"

export default function CheckinForm() {
  const [salesId, setSalesId] = useState(1)
  const [lat, setLat] = useState(0)
  const [long, setLong] = useState(0)
  const [notes, setNotes] = useState("")
  const [photo, setPhoto] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState("")

  async function captureLocation() {
    if (!navigator.geolocation) {
      alert("Geolocation not supported")
      return
    }
    navigator.geolocation.getCurrentPosition((position) => {
      setLat(position.coords.latitude)
      setLong(position.coords.longitude)
    }, (err) => {
      alert("Failed to get location: " + err.message)
    })
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMsg("")
    try {
      const form = new FormData()
      form.append("sales_id", String(salesId))
      form.append("lat", String(lat))
      form.append("long", String(long))
      form.append("notes", notes)
      if (photo) form.append("photo", photo)

      const token = typeof window !== 'undefined' ? localStorage.getItem('bp_token') : null
      const res = await fetch("http://localhost:8000/visit/checkin", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: form,
      })
      const data = await res.json()
      if (!res.ok) {
        setMsg(data.detail || data.error || "Check-in failed")
      } else {
        setMsg("Check-in saved (event id: " + data.event_id + ")")
      }
    } catch (err: any) {
      setMsg(err.message || "Network error")
    }
    setLoading(false)
  }

  return (
    <form onSubmit={submit} className="max-w-md p-4 bg-card rounded">
      <h3 className="text-lg font-semibold mb-2">Check-in</h3>
      <div className="mb-2">
        <label className="block text-sm">Sales ID</label>
        <input type="number" value={salesId} onChange={(e) => setSalesId(Number(e.target.value))} className="input" />
      </div>
      <div className="mb-2">
        <label className="block text-sm">Latitude</label>
        <input value={lat} onChange={(e) => setLat(Number(e.target.value))} className="input" />
      </div>
      <div className="mb-2">
        <label className="block text-sm">Longitude</label>
        <input value={long} onChange={(e) => setLong(Number(e.target.value))} className="input" />
      </div>
      <div className="mb-2">
        <button type="button" onClick={captureLocation} className="btn">Capture location</button>
      </div>
      <div className="mb-2">
        <label className="block text-sm">Notes</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="input" />
      </div>
      <div className="mb-2">
        <label className="block text-sm">Photo (optional)</label>
        <input type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files ? e.target.files[0] : null)} />
      </div>
      <div className="flex items-center gap-2">
        <button type="submit" className="btn-primary" disabled={loading}>{loading ? "Saving..." : "Save Check-in"}</button>
      </div>
      {msg && <div className="mt-2 text-sm">{msg}</div>}
    </form>
  )
}
