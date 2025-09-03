"use client"

import { useAppStore, type Assignment } from "@/store/use-app-store"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"

function StatusBadge({ status }: { status: Assignment["status"] }) {
  const map: Record<Assignment["status"], { label: string; className: string }> = {
    "not-started": { label: "Not Started", className: "bg-gray-100 text-gray-800" },
    "in-progress": { label: "In Progress", className: "bg-blue-100 text-blue-800" },
    completed: { label: "Completed", className: "bg-emerald-100 text-emerald-800" },
    blocked: { label: "Blocked", className: "bg-red-100 text-red-800" },
  }
  const info = map[status]
  return <Badge className={info.className}>{info.label}</Badge>
}

export function AssignmentsTable() {
  const assignments = useAppStore((s) => s.assignments)

  if (!assignments.length) {
    return <div className="text-gray-600">No assignments yet.</div>
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Salesperson</TableHead>
          <TableHead>Route</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Progress</TableHead>
          <TableHead className="text-right">Updated</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {assignments.map((a) => (
          <TableRow key={a.id}>
            <TableCell className="font-medium">{a.salespersonName}</TableCell>
            <TableCell className="text-gray-600">{a.routeId ?? "—"}</TableCell>
            <TableCell>
              <StatusBadge status={a.status} />
            </TableCell>
            <TableCell className="w-64">
              <div className="flex items-center gap-2">
                <Progress value={a.progress} />
                <span className="text-sm text-gray-700">{a.progress}%</span>
              </div>
            </TableCell>
            <TableCell className="text-right text-gray-600">{new Date(a.updatedAt).toLocaleString()}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
