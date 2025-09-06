"use client"

import { useEffect, useRef, useState } from "react"
import type { Route, Stop } from "@/store/use-app-store"
import "leaflet/dist/leaflet.css"
import chroma from "chroma-js"

type Props = { routes: Route[]; height?: number }

export function MapView({ routes, height = 420 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const layerGroupRef = useRef<any>(null)
  const [L, setL] = useState<any>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      const mod = await import("leaflet")
      if (!mounted) return
      setL(mod)
      if (!containerRef.current || mapRef.current) return
      mapRef.current = mod.map(containerRef.current, { zoomControl: true })
      mod
        .tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "&copy; OpenStreetMap contributors",
        })
        .addTo(mapRef.current)
      mapRef.current.setView([12.9716, 77.5946], 11)
      layerGroupRef.current = mod.layerGroup().addTo(mapRef.current)
    })()
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    if (!L || !mapRef.current || !layerGroupRef.current) return
    const bounds = L.latLngBounds([])
    layerGroupRef.current.clearLayers()

    // Generate a color palette for salespeople
    const salespersonIds = Array.from(new Set(routes.map(r => r.salespersonId || r.salespersonName || r.color || r.id)))
    const palette = chroma.scale(["#e41a1c", "#377eb8", "#4daf4a", "#984ea3", "#ff7f00", "#a65628", "#f781bf", "#999999"]).colors(salespersonIds.length)
    const colorMap: { [key: string]: string } = salespersonIds.reduce((acc, id, idx) => { acc[id] = palette[idx]; return acc }, {} as { [key: string]: string })

    routes.forEach((r, routeIdx) => {
      if (!r.stops?.length) return
      const routeColor = colorMap[r.salespersonId || r.salespersonName || r.color || r.id] || "#2563eb"
      const latlngs = r.stops.map((s) => {
        const ll = L.latLng(s.lat, s.lng)
        bounds.extend(ll)
        return ll
      })
      L.polyline(latlngs, { color: routeColor, weight: 4, opacity: 0.85 }).addTo(layerGroupRef.current)

      // Add avatar/tag marker at the start of the route
      const startStop = r.stops[0]
      if (startStop) {
        const initials = (r.salespersonName || "?").split(" ").map(w => w[0]).join("").toUpperCase()
        const avatarHtml = `<div style="background:${routeColor};border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:bold;font-size:1.1em;border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.15);">${initials}</div>`
        const avatarIcon = L.divIcon({ className: "salesperson-avatar", html: avatarHtml, iconSize: [32,32], iconAnchor: [16,16] })
        const avatarMarker = L.marker([startStop.lat, startStop.lng], { icon: avatarIcon })
        avatarMarker.bindTooltip(`${r.salespersonName || "Salesperson"}`)
        avatarMarker.addTo(layerGroupRef.current)
      }

      r.stops.forEach((s: Stop, idx: number) => {
        const m = L.circleMarker([s.lat, s.lng], {
          radius: 6,
          color: routeColor,
          weight: 2,
          fillOpacity: 0.9,
        })
        m.bindTooltip(`${r.salespersonName} • ${s.label ?? "Stop"} • #${s.sequence ?? idx + 1}`, { direction: "top" })
        m.addTo(layerGroupRef.current)
      })
    })

    if (bounds.isValid()) {
      mapRef.current.fitBounds(bounds.pad(0.2))
    }
  }, [L, routes])

  return (
    <div className="w-full rounded-md overflow-hidden border">
      <div ref={containerRef} style={{ height }} aria-label="Route map" />
    </div>
  )
}
