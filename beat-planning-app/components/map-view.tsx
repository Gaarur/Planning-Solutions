"use client"

import { useEffect, useRef, useState } from "react"
import type { Route, Stop } from "@/store/use-app-store"
import "leaflet/dist/leaflet.css"

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

    routes.forEach((r) => {
      if (!r.stops?.length) return
      const latlngs = r.stops.map((s) => {
        const ll = L.latLng(s.lat, s.lng)
        bounds.extend(ll)
        return ll
      })
      L.polyline(latlngs, { color: r.color || "#2563eb", weight: 4, opacity: 0.85 }).addTo(layerGroupRef.current)
      r.stops.forEach((s: Stop, idx: number) => {
        const m = L.circleMarker([s.lat, s.lng], {
          radius: 6,
          color: r.color || "#2563eb",
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
