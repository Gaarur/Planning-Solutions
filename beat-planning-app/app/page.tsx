import { DashboardShell } from "@/components/dashboard-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Page() {
  return (
    <DashboardShell title="Welcome">
      <div className="grid gap-6">
        <section className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Optimize Routes</CardTitle>
            </CardHeader>
            <CardContent className="text-gray-700">
              Upload beat plans and visualize optimized sales routes on an interactive map.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Enroll Team Quickly</CardTitle>
            </CardHeader>
            <CardContent className="text-gray-700">
              Add salespeople with one form and generate unique Sales IDs automatically.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Track Progress</CardTitle>
            </CardHeader>
            <CardContent className="text-gray-700">
              View assignments, progress, and efficiency metrics in one place.
            </CardContent>
          </Card>
        </section>

        <section className="flex flex-wrap gap-3">
          <Link href="/solution-viewer">
            <Button className="bg-blue-600 hover:bg-blue-700">Upload Plan</Button>
          </Link>
          <Link href="/enrollment">
            <Button variant="outline">Enroll</Button>
          </Link>
          <Link href="/assignments">
            <Button variant="ghost">Download Report</Button>
          </Link>
        </section>

        <section>
          <Card>
            <CardHeader>
              <CardTitle>Why Beat Planning System?</CardTitle>
            </CardHeader>
            <CardContent className="text-gray-700">
              Improve sales team efficiency through route optimization, streamlined enrollment, and clear analytics.
              Built with a modern, responsive dashboard layout and easy navigation.
            </CardContent>
          </Card>
        </section>
      </div>
    </DashboardShell>
  )
}
