"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export default function SolverPage() {
  const [locationsFile, setLocationsFile] = useState<File | null>(null)
  const [assignmentsFile, setAssignmentsFile] = useState<File | null>(null)
  const [numSalespeople, setNumSalespeople] = useState<string>("")
  const [dailyWorkingHours, setDailyWorkingHours] = useState<string>("")
  const [maxDailyDistanceKm, setMaxDailyDistanceKm] = useState<string>("")
  const [targetStoresPerDay, setTargetStoresPerDay] = useState<string>("")
  const [solution, setSolution] = useState<any>(null)
  const [error, setError] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSolution(null)
    setLoading(true)

    try {
      const formData = new FormData()
      if (locationsFile) formData.append("locations_file", locationsFile)
      if (assignmentsFile) formData.append("assignments_file", assignmentsFile)
      if (numSalespeople) formData.append("num_salespeople", numSalespeople as any)
      if (dailyWorkingHours) formData.append("daily_working_hours", dailyWorkingHours as any)
      if (maxDailyDistanceKm) formData.append("max_daily_distance_km", maxDailyDistanceKm as any)
      if (targetStoresPerDay) formData.append("target_stores_per_day", targetStoresPerDay as any)

      const response = await fetch("http://localhost:8000/solve_beat_planning", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()
      if (!response.ok) {
        setError((data && (data.detail || data.message)) || "API error")
      } else {
        setSolution(data)
      }
    } catch (err: any) {
      setError(err?.message || "Network error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="mx-auto max-w-2xl p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-pretty">Run Beat Planning (direct API)</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid gap-2">
              <Label htmlFor="locations">locations.csv</Label>
              <Input
                id="locations"
                type="file"
                accept=".csv"
                onChange={(e) => setLocationsFile(e.target.files?.[0] || null)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="assignments">assignments.csv</Label>
              <Input
                id="assignments"
                type="file"
                accept=".csv"
                onChange={(e) => setAssignmentsFile(e.target.files?.[0] || null)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="numSalespeople">num_salespeople</Label>
                <Input
                  id="numSalespeople"
                  type="number"
                  min="0"
                  value={numSalespeople}
                  onChange={(e) => setNumSalespeople(e.target.value)}
                  placeholder="e.g., 2"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="hours">daily_working_hours</Label>
                <Input
                  id="hours"
                  type="number"
                  min="0"
                  step="0.25"
                  value={dailyWorkingHours}
                  onChange={(e) => setDailyWorkingHours(e.target.value)}
                  placeholder="e.g., 8"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="distance">max_daily_distance_km</Label>
                <Input
                  id="distance"
                  type="number"
                  min="0"
                  step="0.1"
                  value={maxDailyDistanceKm}
                  onChange={(e) => setMaxDailyDistanceKm(e.target.value)}
                  placeholder="e.g., 120"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="targets">target_stores_per_day</Label>
                <Input
                  id="targets"
                  type="number"
                  min="0"
                  value={targetStoresPerDay}
                  onChange={(e) => setTargetStoresPerDay(e.target.value)}
                  placeholder="e.g., 10"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button type="submit" disabled={loading}>
                {loading ? "Solving..." : "Solve Beat Plan"}
              </Button>
              {error ? <span className="text-sm text-red-600">{error}</span> : null}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="output">Output (JSON)</Label>
              <Textarea
                id="output"
                className="min-h-40"
                value={solution ? JSON.stringify(solution, null, 2) : ""}
                placeholder="The API response will appear here"
                readOnly
              />
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
