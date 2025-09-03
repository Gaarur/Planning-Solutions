"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useMemo } from "react"
import { useAppStore } from "@/store/use-app-store"

export function MetricsCards() {
  const routes = useAppStore((s) => s.routes)
  const assignments = useAppStore((s) => s.assignments)

  const { totalStops, avgEfficiency, completionRate } = useMemo(() => {
    const totalStops = routes.reduce((acc, r) => acc + (r.stops?.length ?? 0), 0)
    const efficiencies = routes.map((r) => r.metrics?.efficiency ?? 0)
    const avgEfficiency = efficiencies.length
      ? Math.round(efficiencies.reduce((a, b) => a + b, 0) / efficiencies.length)
      : 0
    const completionRate = assignments.length
      ? Math.round((assignments.filter((a) => a.status === "completed").length / assignments.length) * 100)
      : 0
    return { totalStops, avgEfficiency, completionRate }
  }, [routes, assignments])

  const items = [
    { label: "Total Routes", value: routes.length },
    { label: "Total Stops", value: totalStops },
    { label: "Avg. Efficiency", value: `${avgEfficiency}%` },
    { label: "Completion Rate", value: `${completionRate}%` },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {items.map((it) => (
        <Card key={it.label}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600">{it.label}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{it.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
