"use client"

import { useState } from "react"
import Papa from "papaparse"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAppStore, type Route } from "@/store/use-app-store"
import { useToast } from "@/hooks/use-toast"
import { useEffect, useRef } from "react"

const OPTIMIZER_API_BASIC = "http://localhost:8001/optimize_workers_basic"
const OPTIMIZER_API_ADVANCED = "http://localhost:8001/optimize_workers_advanced"

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

const ADVANCED_ALGORITHMS = [
  { value: "basic", label: "Basic" },
  { value: "greedy", label: "Greedy" },
  { value: "constraint_satisfaction", label: "Constraint Satisfaction" },
  { value: "linear_programming", label: "Linear Programming" },
  { value: "bin_packing", label: "Bin Packing" },
]

export function FileUploader() {
  const setRoutes = useAppStore((s) => s.setRoutes)
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [optimizerResult, setOptimizerResult] = useState<any>(null)
  const [routes, setLocalRoutes] = useState<Route[]>([])
  const [approach, setApproach] = useState<'basic' | 'advanced'>('advanced')
  const [algorithm, setAlgorithm] = useState<string>(ADVANCED_ALGORITHMS[0].value)

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
              distance_km: stops.length ? Math.max(1, Math.round(stops.length * 2.5)) : 0,
              eta_minutes: stops.length ? stops.length * 12 : 0,
              efficiency: stops.length ? Math.min(100, Math.round(80 + Math.random() * 20)) : 0,
            },
          }
        })

        setRoutes(routes)
        setLocalRoutes(routes)
        setOptimizerResult(null)
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

  const handleOptimize = async () => {
    setLoading(true)
    setOptimizerResult(null)
    const constraints = {
      max_daily_distance_km: 100,
      working_days_per_week: 5,
      working_hours_per_day: 8,
    }
    const apiUrl = approach === 'basic' ? OPTIMIZER_API_BASIC : OPTIMIZER_API_ADVANCED
    const body: any = {
      routes: routes.map(r => ({
        salespersonId: r.salespersonId,
        salespersonName: r.salespersonName,
        stops: r.stops,
        metrics: r.metrics
      })),
      constraints
    }
    if (approach === 'advanced') {
      body.algorithm = algorithm
    }
    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      })
      const data = await response.json()
      setOptimizerResult(data)
      toast({ title: "Optimization complete", description: `Best algorithm: ${data.comparison_summary?.best_algorithm}` })
    } catch (err: any) {
      toast({ title: "Optimizer error", description: err.message })
    }
    setLoading(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Beat Plan</CardTitle>
        <CardDescription>
          Upload a CSV with columns: salesperson, salespersonId, lat, lng, label/stop_name, sequence.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex  flex-col gap-3">
        <div className="flex items-center gap-3">
          <input
            type="file"
            accept=".csv"
            className="border rounded px-2 py-1"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFile(file)
            }}
          />
          <Button disabled={loading} className="bg-blue-600 hover:bg-blue-700">
            {loading ? "Uploading..." : "Upload Plan"}
          </Button>
        </div>
        {/* Show approach/algorithm only after file upload (routes parsed) */}
        {routes.length > 0 && (
          <>
            <div className="flex items-center gap-3">
              <label htmlFor="approach-select">Approach:</label>
              <select
                id="approach-select"
                value={approach}
                onChange={e => setApproach(e.target.value as 'basic' | 'advanced')}
                className="border rounded px-2 py-1"
              >
                <option value="basic">Basic</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            {approach === 'advanced' && (
              <div className="flex items-center gap-3">
                <label htmlFor="algorithm-select">Algorithm:</label>
                <select
                  id="algorithm-select"
                  value={algorithm}
                  onChange={e => setAlgorithm(e.target.value)}
                  className="border rounded px-2 py-1"
                >
                  {ADVANCED_ALGORITHMS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            )}
          </>
        )}
        {routes.length > 0 && (
          <Button disabled={loading} onClick={handleOptimize} className="bg-green-600 hover:bg-green-700 mt-2">
            {loading ? "Optimizing..." : `Run Optimizer (${approach.charAt(0).toUpperCase() + approach.slice(1)})`}
          </Button>
        )}
        {optimizerResult && (
          <div className="mt-4 p-3 rounded bg-gray-100 text-gray-800">
            <h4 className="font-bold mb-2">Optimizer Result</h4>
            {approach === 'advanced' && algorithm && optimizerResult[algorithm] ? (
              <pre className="text-xs whitespace-pre-wrap">
                {JSON.stringify(optimizerResult[algorithm], null, 2)}
              </pre>
            ) : (
              <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(optimizerResult, null, 2)}</pre>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
