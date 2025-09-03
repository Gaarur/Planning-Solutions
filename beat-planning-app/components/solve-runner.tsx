"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAppStore, type Route } from "@/store/use-app-store"

type LocationRow = {
  node?: string
  lat?: string | number
  long?: string | number
  node_type?: string
}

type AssignmentRow = {
  salesperson_id?: string
  starting_point?: string
}

const BLUE_SHADES = ["#1d4ed8", "#2563eb", "#3b82f6", "#60a5fa"]
const colorFor = (i: number) => BLUE_SHADES[i % BLUE_SHADES.length]

const API_DIRECT = "https://cute-beers-smoke.loca.lt/solve_beat_planning"
const API_PROXY = "/api/solve"

async function parseJsonSafely(res: Response) {
  const ct = res.headers.get("content-type") || ""
  // Prefer res.json when content-type says JSON
  if (ct.includes("application/json")) {
    return await res.json()
  }
  // Otherwise read text and try to JSON.parse
  const txt = await res.text().catch(() => "")
  try {
    return JSON.parse(txt)
  } catch {
    console.log("[v0] Solver non-JSON response text:", txt?.slice(0, 400))
    throw new Error(`Unexpected response format${txt ? `: ${txt.slice(0, 200)}` : ""}`)
  }
}

export function SolveRunner() {
  const [locationsFile, setLocationsFile] = useState<File | null>(null)
  const [assignmentsFile, setAssignmentsFile] = useState<File | null>(null)
  const [numSalespeople, setNumSalespeople] = useState<string>("")
  const [dailyWorkingHours, setDailyWorkingHours] = useState<string>("")
  const [maxDailyDistanceKm, setMaxDailyDistanceKm] = useState<string>("")
  const [targetStoresPerDay, setTargetStoresPerDay] = useState<string>("")

  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const setRoutes = useAppStore((s) => s.setRoutes)
  const setSolution = useAppStore((s) => s.setSolution)

  async function run() {
    if (!locationsFile || !assignmentsFile) {
      toast({ title: "Missing files", description: "Please select both locations.csv and assignments.csv" })
      return
    }
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append("locations_file", locationsFile)
      formData.append("assignments_file", assignmentsFile)
      if (numSalespeople) formData.append("num_salespeople", String(numSalespeople))
      if (dailyWorkingHours) formData.append("daily_working_hours", String(dailyWorkingHours))
      if (maxDailyDistanceKm) formData.append("max_daily_distance_km", String(maxDailyDistanceKm))
      if (targetStoresPerDay) formData.append("target_stores_per_day", String(targetStoresPerDay))

      // Debug where we're posting from (CORS hints)
      console.log("[v0] Posting to FastAPI from origin:", window.location.origin)

      let endpoint = API_DIRECT
      console.log("[v0] Solver endpoint chosen:", endpoint)

      let res: Response
      try {
        res = await fetch(endpoint, {
          method: "POST",
          body: formData,
          headers: {
            "Bypass-Tunnel-Reminder": "1",
            "ngrok-skip-browser-warning": "1",
          } as any,
        })
      } catch (err) {
        console.log("[v0] Primary solver call failed, retrying via proxy:", err)
        endpoint = API_PROXY
        res = await fetch(endpoint, { method: "POST", body: formData })
      }

      let data: any = null
      try {
        data = await parseJsonSafely(res)
      } catch (parseErr) {
        // If we were calling direct and parsing failed, retry via proxy
        if (endpoint === API_DIRECT) {
          console.log("[v0] Direct call returned non-JSON, retrying via proxy...")
          const proxyRes = await fetch(API_PROXY, { method: "POST", body: formData })
          data = await parseJsonSafely(proxyRes)
          res = proxyRes
        } else {
          throw parseErr
        }
      }

      console.log("[v0] Solver status:", res.status)
      console.log("[v0] Solver raw data:", data)

      if (!res.ok) {
        const msg = (data && (data.detail || data.message)) || `Solver error (${res.status})`
        throw new Error(msg)
      }

      // Accept multiple shapes and normalize
      const routesRaw: any[] =
        (Array.isArray(data?.routes) && data.routes) ||
        (Array.isArray(data?.solution?.routes) && data.solution.routes) ||
        (Array.isArray(data?.vehicles) && data.vehicles) ||
        (Array.isArray(data?.optimized_routes) && data.optimized_routes) ||
        []

      const total_distance =
        data?.total_distance ?? data?.summary?.total_distance ?? data?.total_distance_meters ?? data?.distance ?? null

      const total_time = data?.total_time ?? data?.summary?.total_time ?? data?.time_seconds ?? data?.duration ?? null

      const normalized = { ...data, routes: routesRaw, total_distance, total_time }
      setSolution(normalized)

      // Build UI routes from the normalized routes
      const toNum = (v: any) => (v == null ? undefined : Number(v))
      const firstDefined = (obj: any, keys: string[]) => {
        for (const k of keys) {
          if (obj?.[k] != null) return obj[k]
        }
        return undefined
      }

      const routes: Route[] = routesRaw.map((vr: any, idx: number) => {
        const spId = `vehicle_${vr?.vehicle_id ?? idx}`
        // Accept vr.route or vr.stops as the list of points
        const points = Array.isArray(vr?.route) ? vr.route : Array.isArray(vr?.stops) ? vr.stops : []
        const stops = points.map((p: any, i: number) => {
          const lat = firstDefined(p, ["lat", "latitude"])
          const lng = firstDefined(p, ["long", "lng", "lon", "longitude"])
          return {
            lat: Number(lat),
            lng: Number(lng),
            label: p?.node ?? p?.name ?? `Stop ${i + 1}`,
            sequence: i + 1,
          }
        })
        // Derive metrics with tolerant keys
        const distanceMeters = vr?.distance ?? vr?.total_distance ?? vr?.distance_meters ?? vr?.metrics?.distance
        const timeSeconds = vr?.time ?? vr?.total_time ?? vr?.time_seconds ?? vr?.metrics?.time
        const storesVisited =
          vr?.stores_visited ??
          (Array.isArray(points) ? points.filter((p: any) => p?.node_type === "store").length : undefined)

        return {
          id: spId,
          salespersonId: spId,
          salespersonName:
            (points?.[0]?.node as string) ??
            (typeof vr?.vehicle_id === "number" ? `Vehicle ${vr.vehicle_id}` : String(vr?.vehicle_id ?? idx + 1)),
          color: colorFor(idx),
          stops,
          metrics: {
            distanceKm: distanceMeters != null ? Math.round((Number(distanceMeters) / 1000) * 100) / 100 : undefined,
            etaMinutes: timeSeconds != null ? Math.round(Number(timeSeconds) / 60) : undefined,
            efficiency:
              storesVisited != null && normalized?.summary?.total_stores_covered
                ? Math.round((Number(storesVisited) / Number(normalized.summary.total_stores_covered)) * 100)
                : undefined,
          },
        }
      })

      setRoutes(routes)
      toast({ title: "Optimization complete", description: `Loaded ${routes.length} route(s) from solver.` })
    } catch (e: any) {
      console.log("[v0] Solver error:", e)
      setSolution(null)
      toast({ title: "Failed to run solver", description: e?.message || "Unknown error" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Run Optimization (Solver)</CardTitle>
        <CardDescription>Upload locations.csv and assignments.csv, then run the solver.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <div className="text-sm font-medium">locations.csv</div>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setLocationsFile(e.target.files?.[0] ?? null)}
              aria-label="Upload locations.csv"
            />
          </div>
          <div className="space-y-2">
            <div className="text-sm font-medium">assignments.csv</div>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setAssignmentsFile(e.target.files?.[0] ?? null)}
              aria-label="Upload assignments.csv"
            />
          </div>
          <div className="flex items-end">
            <Button className="bg-blue-600 hover:bg-blue-700 w-full" onClick={run} disabled={loading}>
              {loading ? "Running..." : "Run Optimization"}
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="numSalespeople">num_salespeople</Label>
            <Input
              id="numSalespeople"
              type="number"
              min={0}
              value={numSalespeople}
              onChange={(e) => setNumSalespeople(e.target.value)}
              placeholder="e.g., 2"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="dailyWorkingHours">daily_working_hours</Label>
            <Input
              id="dailyWorkingHours"
              type="number"
              min={0}
              step={0.25}
              value={dailyWorkingHours}
              onChange={(e) => setDailyWorkingHours(e.target.value)}
              placeholder="e.g., 8"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="maxDailyDistanceKm">max_daily_distance_km</Label>
            <Input
              id="maxDailyDistanceKm"
              type="number"
              min={0}
              step={0.1}
              value={maxDailyDistanceKm}
              onChange={(e) => setMaxDailyDistanceKm(e.target.value)}
              placeholder="e.g., 120"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="targetStoresPerDay">target_stores_per_day</Label>
            <Input
              id="targetStoresPerDay"
              type="number"
              min={0}
              value={targetStoresPerDay}
              onChange={(e) => setTargetStoresPerDay(e.target.value)}
              placeholder="e.g., 10"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
