import { DashboardShell } from "@/components/dashboard-shell"
import { AssignmentsTable } from "@/components/assignments-table"
import { EfficiencyChart } from "@/components/efficiency-chart"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function AssignmentsPage() {
  return (
    <DashboardShell title="Assignments & Reporting">
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent className="text-gray-700">
            Track progress per salesperson and visualize route efficiency. Download functionality can be added later.
          </CardContent>
        </Card>
        <AssignmentsTable />
        <EfficiencyChart />
      </div>
    </DashboardShell>
  )
}
