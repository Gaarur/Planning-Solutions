"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Route } from "@/store/use-app-store"

export function RouteList({ routes }: { routes: Route[] }) {
  if (!routes.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Routes</CardTitle>
        </CardHeader>
        <CardContent className="text-gray-600">No routes yet. Upload a plan to get started.</CardContent>
      </Card>
    )
  }

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {routes.map((r) => (
        <Card key={r.id} className="overflow-hidden">
          <div className="h-1" style={{ backgroundColor: r.color }} />
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">{r.salespersonName}</CardTitle>
            <Badge variant="secondary">{r.stops.length} stops</Badge>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm text-gray-600">
              Distance: {r.metrics?.distanceKm ?? 0} km • ETA: {r.metrics?.etaMinutes ?? 0} min • Efficiency:{" "}
              {r.metrics?.efficiency ?? 0}%
            </div>
            <ol className="text-sm space-y-1">
              {r.stops.slice(0, 8).map((s, idx) => (
                <li key={`${r.id}-${idx}`} className="flex items-center gap-2">
                  <span
                    className="inline-flex h-5 w-5 items-center justify-center rounded-full text-white text-xs"
                    style={{ backgroundColor: r.color }}
                  >
                    {s.sequence ?? idx + 1}
                  </span>
                  <span className="truncate">{s.label ?? `Stop ${idx + 1}`}</span>
                  <span className="ml-auto text-gray-500">
                    {s.lat.toFixed(3)}, {s.lng.toFixed(3)}
                  </span>
                </li>
              ))}
              {r.stops.length > 8 && <li className="text-gray-500">+{r.stops.length - 8} more…</li>}
            </ol>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
