import { DashboardShell } from "@/components/dashboard-shell"
import { EnrollmentForm } from "@/components/enrollment-form"

export default function EnrollmentPage() {
  return (
    <DashboardShell title="Salesperson Enrollment">
      <EnrollmentForm />
    </DashboardShell>
  )
}
