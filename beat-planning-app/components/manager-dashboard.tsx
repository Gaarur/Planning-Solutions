"use client"

import { useEffect, useState } from "react"

export default function ManagerDashboard() {
  const [metrics, setMetrics] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("bp_token") : null
        const headers: any = {}
        if (token) headers.Authorization = `Bearer ${token}`
        const res = await fetch("http://localhost:8000/admin/metrics", { headers })
        if (!res.ok) {
          console.error("Failed to load metrics", res.status)
          return
        }
        const data = await res.json()
        setMetrics(data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <div>Loading metrics…</div>

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white border rounded shadow-sm">
          <div className="text-sm text-slate-500">Total visits</div>
          <div className="text-2xl font-bold">{metrics?.total_events ?? '—'}</div>
        </div>

        <div className="p-4 bg-white border rounded shadow-sm">
          <div className="text-sm text-slate-500">Visits today</div>
          <div className="text-2xl font-bold">{metrics?.events_today ?? '—'}</div>
        </div>

        <div className="p-4 bg-white border rounded shadow-sm">
          <div className="text-sm text-slate-500">Active salespeople</div>
          <div className="text-2xl font-bold">{metrics?.unique_sales ?? '—'}</div>
        </div>

        <div className="p-4 bg-white border rounded shadow-sm">
          <div className="text-sm text-slate-500">Last 7 days</div>
          <div className="text-2xl font-bold">{metrics?.events_last_7_days ?? '—'}</div>
        </div>
      </div>

      <div className="bg-white border rounded p-4">
        <h3 className="font-semibold mb-3">Recent check-ins</h3>
        <RecentEvents />
      </div>
    </div>
  )
}

function RecentEvents() {
  const [events, setEvents] = useState<any[]>([])

  useEffect(() => {
    async function load() {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("bp_token") : null
        const headers: any = {}
        if (token) headers.Authorization = `Bearer ${token}`
        const res = await fetch("http://localhost:8000/visit/events", { headers })
        if (!res.ok) return
        const data = await res.json()
        const list = Array.isArray(data) ? data : data.events || []
        setEvents(list.slice(0, 10))
      } catch (err) {
        console.error(err)
      }
    }
    load()
  }, [])

  if (!events.length) return <div className="text-sm text-slate-500">No recent events</div>

  return (
    <ul className="space-y-2 text-sm">
      {events.map((ev) => (
        <li key={ev.event_id} className="p-2 border rounded">
          <div className="text-sm font-medium">Rep #{ev.sales_id} — {new Date(ev.timestamp).toLocaleString()}</div>
          <div className="text-slate-600">Notes: {ev.notes || '—'}</div>
        </li>
      ))}
    </ul>
  )
}
