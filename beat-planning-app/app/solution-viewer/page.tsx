"use client"

import { DashboardShell } from "@/components/dashboard-shell"
import { FileUploader } from "@/components/file-uploader"
import { MapView } from "@/components/map-view"
import { RouteList } from "@/components/route-list"
import { MetricsCards } from "@/components/metrics-cards"
import { SolveRunner } from "@/components/solve-runner"
import { useAppStore } from "@/store/use-app-store"
import SolutionSummary from "@/components/solution-summary"

export default function SolutionViewerPage() {
  const routes = useAppStore((s) => s.routes)
  const solution = useAppStore((s) => s.solution) // read solution from store
  return (
    <DashboardShell title="Solution Viewer">
      <div className="grid gap-6">
        <SolveRunner />
        {solution ? <SolutionSummary solution={solution} /> : null}
        <FileUploader />
        <MetricsCards />
        <MapView routes={routes} />
        <RouteList routes={routes} />
      </div>
    </DashboardShell>
  )
}
