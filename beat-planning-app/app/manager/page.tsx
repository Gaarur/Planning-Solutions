import ManagerDashboard from "../../components/manager-dashboard"
import { DashboardShell } from "../../components/dashboard-shell"
import ManagerGuard from "../../components/manager-guard"

export const metadata = {
  title: "Manager dashboard",
}

export default function Page() {
  return (
    <DashboardShell title="Manager dashboard">
      <div className="p-6">
        <ManagerGuard>
          <ManagerDashboard />
        </ManagerGuard>
      </div>
    </DashboardShell>
  )
}
