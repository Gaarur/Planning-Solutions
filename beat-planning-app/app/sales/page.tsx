import SalespersonDashboard from "../../components/salesperson-dashboard"
import { DashboardShell } from "../../components/dashboard-shell"
import SalesGuard from "../../components/sales-guard"

export const metadata = {
  title: "Sales dashboard",
}

export default function Page() {
  return (
    <DashboardShell title="Sales dashboard">
      <div className="p-6">
        <SalesGuard>
          <SalespersonDashboard />
        </SalesGuard>
      </div>
    </DashboardShell>
  )
}
