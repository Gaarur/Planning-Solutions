"use client"

import type React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const nav = [
  { href: "/", label: "Home" },
  { href: "/solution-viewer", label: "Solution Viewer" },
  { href: "/enrollment", label: "Salesperson Enrollment" },
  { href: "/assignments", label: "Assignments & Reporting" },
]

export function DashboardShell({ title, children }: { title: string; children: React.ReactNode }) {
  const pathname = usePathname()
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex">
        <aside className="hidden md:block w-64 border-r bg-white">
          <div className="p-4">
            <div className="font-semibold text-lg">Beat Planning</div>
          </div>
          <nav className="flex flex-col gap-1 p-2">
            {nav.map((item) => {
              const active = pathname === item.href
              return (
                <Link key={item.href} href={item.href} className="w-full">
                  <Button
                    variant={active ? "default" : "ghost"}
                    className={cn(
                      "w-full justify-start",
                      active ? "bg-blue-600 hover:bg-blue-600 text-white" : "text-gray-700",
                    )}
                  >
                    {item.label}
                  </Button>
                </Link>
              )
            })}
          </nav>
        </aside>

        <main className="flex-1">
          <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b">
            <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
              <h1 className="text-xl md:text-2xl font-semibold text-balance">{title}</h1>
              <div className="flex items-center gap-2">
                <Link href="/solution-viewer">
                  <Button className="bg-blue-600 hover:bg-blue-700">Upload Plan</Button>
                </Link>
                <Link href="/enrollment">
                  <Button variant="outline">Enroll</Button>
                </Link>
                <Link href="/assignments">
                  <Button variant="ghost">Reports</Button>
                </Link>
              </div>
            </div>
          </header>

          <div className="mx-auto max-w-6xl px-4 py-6">{children}</div>
        </main>
      </div>
    </div>
  )
}
