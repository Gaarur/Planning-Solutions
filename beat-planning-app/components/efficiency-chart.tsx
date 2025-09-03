"use client"

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { useAppStore } from "@/store/use-app-store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function EfficiencyChart() {
  const routes = useAppStore((s) => s.routes)
  const data = routes.map((r) => ({
    name: r.salespersonName,
    efficiency: r.metrics?.efficiency ?? Math.round(60 + Math.random() * 30),
  }))

  if (!routes.length) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Route Efficiency</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ left: 8, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Bar dataKey="efficiency" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
