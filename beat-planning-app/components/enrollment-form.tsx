"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAppStore } from "@/store/use-app-store"
import { useToast } from "@/hooks/use-toast"
import { toCsv, downloadAsFile } from "@/lib/csv"

export function EnrollmentForm() {
  const addSalesperson = useAppStore((s) => s.addSalesperson)
  const salespeople = useAppStore((s) => s.salespeople)
  const { toast } = useToast()
  const [name, setName] = useState("")
  const [contact, setContact] = useState("")
  const [startLat, setStartLat] = useState<string>("")
  const [startLng, setStartLng] = useState<string>("")
  const [startName, setStartName] = useState<string>("")
  const [submitting, setSubmitting] = useState(false)

  const submit = () => {
    if (!name.trim()) return
    setSubmitting(true)
    const sp = addSalesperson({
      name: name.trim(),
      contact: contact.trim() || undefined,
      startLat: startLat ? Number.parseFloat(startLat) : undefined,
      startLng: startLng ? Number.parseFloat(startLng) : undefined,
      // @ts-expect-error forwarded optional field supported in store
      startName: startName?.trim() || undefined,
    })
    toast({ title: "Salesperson enrolled", description: `Generated Sales ID: ${sp.id}` })
    setName("")
    setContact("")
    setStartLat("")
    setStartLng("")
    setStartName("")
    setSubmitting(false)
  }

  function downloadEnrolledCsv() {
    const headers = ["id", "name", "contact", "start_lat", "start_lng", "starting_point"]
    const rows = salespeople.map((sp) => ({
      id: sp.id,
      name: sp.name,
      contact: sp.contact ?? "",
      start_lat: sp.startLat ?? "",
      start_lng: sp.startLng ?? "",
      starting_point: sp.startName ?? "",
    }))
    downloadAsFile("enrolled.csv", toCsv(headers, rows))
  }

  function downloadAssignmentsCsv() {
    // Required columns: salesperson_id, starting_point
    const headers = ["salesperson_id", "starting_point"]
    const rows = salespeople.map((sp) => ({
      salesperson_id: sp.id,
      starting_point: sp.startName ?? "",
    }))
    downloadAsFile("assignments.csv", toCsv(headers, rows))
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Enroll Salesperson</CardTitle>
          <CardDescription>Enter details to generate a unique Sales ID.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="contact">Contact</Label>
            <Input
              id="contact"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="+1 555 123 4567"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="lat">Start Latitude</Label>
              <Input
                id="lat"
                type="number"
                value={startLat}
                onChange={(e) => setStartLat(e.target.value)}
                placeholder="12.9716"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="lng">Start Longitude</Label>
              <Input
                id="lng"
                type="number"
                value={startLng}
                onChange={(e) => setStartLng(e.target.value)}
                placeholder="77.5946"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="start-name">Starting Point Name</Label>
              <Input
                id="start-name"
                value={startName}
                onChange={(e) => setStartName(e.target.value)}
                placeholder="e.g. depot_north"
              />
            </div>
          </div>
          <Button onClick={submit} disabled={submitting} className="w-full bg-blue-600 hover:bg-blue-700">
            {submitting ? "Enrolling..." : "Enroll"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recently Registered</CardTitle>
          <CardDescription>Latest salespeople enrolled.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {salespeople.length === 0 && <div className="text-gray-600">No registrations yet.</div>}
          {salespeople.slice(0, 8).map((sp) => (
            <div key={sp.id} className="flex items-center justify-between border rounded-md p-3">
              <div>
                <div className="font-medium">{sp.name}</div>
                <div className="text-sm text-gray-600">{sp.contact || "—"}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500">Sales ID</div>
                <div className="font-mono text-sm">{sp.id}</div>
              </div>
            </div>
          ))}
          <div className="flex flex-wrap gap-2 pt-2">
            <Button variant="outline" onClick={downloadEnrolledCsv}>
              Download enrolled.csv
            </Button>
            <Button variant="ghost" onClick={downloadAssignmentsCsv}>
              Download assignments.csv
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
