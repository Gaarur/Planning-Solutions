"use client"

import { useEffect, useState } from "react"

export default function SalespersonDashboard() {
  const [metrics, setMetrics] = useState<any>(null)
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("bp_token") : null
        const headers: any = {}
        if (token) headers.Authorization = `Bearer ${token}`

        // get current user to know sales_id
        const meRes = await fetch("http://localhost:8000/me", { headers })
        if (!meRes.ok) return
        const me = await meRes.json()
        const sales_id = me.uid

        // load events for this salesperson
        const evRes = await fetch(`http://localhost:8000/visit/events?sales_id=${sales_id}`, { headers })
        if (!evRes.ok) return
        const evData = await evRes.json()
        const evList = Array.isArray(evData) ? evData : evData.events || []
        setEvents(evList.slice(0, 20))

        // compute simple metrics
        const now = new Date()
        const today = now.toISOString().slice(0, 10)
        const visits_today = evList.filter((e: any) => e.timestamp && e.timestamp.slice(0, 10) === today).length
        const total_visits = evList.length
        const last_checkin = evList.length ? evList[0].timestamp : null

        setMetrics({ visits_today, total_visits, last_checkin })
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <div>Loading your dashboard…</div>

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white border rounded shadow-sm">
          <div className="text-sm text-slate-500">Your visits today</div>
          <div className="text-2xl font-bold">{metrics?.visits_today ?? '—'}</div>
        </div>

        <div className="p-4 bg-white border rounded shadow-sm">
          <div className="text-sm text-slate-500">Total recorded visits</div>
          <div className="text-2xl font-bold">{metrics?.total_visits ?? '—'}</div>
        </div>

        <div className="p-4 bg-white border rounded shadow-sm col-span-2">
          <div className="text-sm text-slate-500">Last check-in</div>
          <div className="text-2xl font-bold">{metrics?.last_checkin ? new Date(metrics.last_checkin).toLocaleString() : '—'}</div>
        </div>
      </div>

      <div className="bg-white border rounded p-4">
        <h3 className="font-semibold mb-3">Your recent check-ins</h3>
        {events.length === 0 ? (
          <div className="text-sm text-slate-500">No events recorded yet.</div>
        ) : (
          <ul className="space-y-2 text-sm">
            {events.map((ev: any) => (
              <li key={ev.event_id} className="p-2 border rounded">
                <div className="text-sm font-medium">{new Date(ev.timestamp).toLocaleString()}</div>
                <div className="text-slate-600">Notes: {ev.notes || '—'}</div>
                <div className="text-slate-500 text-xs">Assignment: {ev.assignment_id ?? '—'} • Lat {ev.lat} • Lon {ev.long}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
