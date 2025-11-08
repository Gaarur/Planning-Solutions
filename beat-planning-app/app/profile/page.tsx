import { DashboardShell } from "@/components/dashboard-shell"
import ProfileView from "@/components/profile-view"
export default function ProfilePage() {
  return (
    <DashboardShell title="My profile">
      <div className="max-w-3xl">
        <div className="bg-white border rounded p-6">
          <h2 className="text-lg font-semibold mb-4">Profile</h2>
          {/* Read-only view for the logged-in user's profile */}
          <ProfileView />
        </div>
      </div>
    </DashboardShell>
  )
}
