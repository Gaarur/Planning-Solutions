"use client"

import { useState } from "react"
import Papa from "papaparse"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAppStore, type Route } from "@/store/use-app-store"
import { useToast } from "@/hooks/use-toast"

type CsvRow = {
  salesperson?: string
  salespersonId?: string
  stop_name?: string
  label?: string
  sequence?: string | number
  lat?: string | number
  lng?: string | number
}

const BLUE_SHADES = ["#1d4ed8", "#2563eb", "#3b82f6", "#60a5fa"] // blue-700..blue-300

function colorFor(index: number) {
  return BLUE_SHADES[index % BLUE_SHADES.length]
}

export function FileUploader() {
  const setRoutes = useAppStore((s) => s.setRoutes)
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const handleFile = (file: File) => {
    setLoading(true)
    Papa.parse<CsvRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data
        if (!rows?.length) {
          toast({ title: "No data found", description: "Please upload a CSV with header rows." })
          setLoading(false)
          return
        }

        const groups = new Map<string, CsvRow[]>()
        for (const r of rows) {
          const key = (r.salespersonId || r.salesperson || "Unknown") as string
          if (!groups.has(key)) groups.set(key, [])
          groups.get(key)!.push(r)
        }

        const routes: Route[] = Array.from(groups.entries()).map(([key, list], idx) => {
          const name = list.find((r) => r.salesperson)?.salesperson || `Salesperson ${idx + 1}`
          const stops = list
            .map((r) => {
              const lat = typeof r.lat === "string" ? Number.parseFloat(r.lat) : (r.lat as number | undefined)
              const lng = typeof r.lng === "string" ? Number.parseFloat(r.lng) : (r.lng as number | undefined)
              const seq =
                typeof r.sequence === "string"
                  ? Number.parseInt(r.sequence as string, 10)
                  : (r.sequence as number | undefined)
              if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
              return {
                lat: lat as number,
                lng: lng as number,
                label: (r.label || r.stop_name) as string | undefined,
                sequence: seq,
              }
            })
            .filter(Boolean) as Route["stops"]

          stops.sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0))

          return {
            id: `route_${key}_${idx}`,
            salespersonId: (list.find((r) => r.salespersonId)?.salespersonId as string) || key,
            salespersonName: name as string,
            color: colorFor(idx),
            stops,
            metrics: {
              distanceKm: stops.length ? Math.max(1, Math.round(stops.length * 2.5)) : 0,
              etaMinutes: stops.length ? stops.length * 12 : 0,
              efficiency: stops.length ? Math.min(100, Math.round(80 + Math.random() * 20)) : 0,
            },
          }
        })

        setRoutes(routes)
        toast({
          title: "Plan uploaded",
          description: `Parsed ${routes.length} route${routes.length === 1 ? "" : "s"}.`,
        })
        setLoading(false)
      },
      error: (err) => {
        toast({ title: "Upload failed", description: err.message })
        setLoading(false)
      },
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Beat Plan</CardTitle>
        <CardDescription>
          Upload a CSV with columns: salesperson, salespersonId, lat, lng, label/stop_name, sequence.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex items-center gap-3">
        <input
          type="file"
          accept=".csv"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFile(file)
          }}
        />
        <Button disabled={loading} className="bg-blue-600 hover:bg-blue-700">
          {loading ? "Uploading..." : "Upload Plan"}
        </Button>
      </CardContent>
    </Card>
  )
}
