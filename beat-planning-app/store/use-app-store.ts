"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

export type Stop = {
  lat: number
  lng: number
  label?: string
  sequence?: number
}

export type Route = {
  id: string
  salespersonId: string
  salespersonName: string
  color: string
  stops: Stop[]
  metrics?: {
    distanceKm?: number
    etaMinutes?: number
    efficiency?: number
  }
}

export type Salesperson = {
  id: string
  name: string
  contact?: string
  startLat?: number
  startLng?: number
  startName?: string
  createdAt: string
}

export type Assignment = {
  id: string
  salespersonId: string
  salespersonName: string
  routeId?: string
  status: "not-started" | "in-progress" | "completed" | "blocked"
  progress: number
  updatedAt: string
}

export type SolverSolution = {
  routes?: any[]
  total_distance?: number | null
  total_time?: number | null
  [key: string]: any
}

type AppState = {
  salespeople: Salesperson[]
  routes: Route[]
  assignments: Assignment[]
  solution: SolverSolution | null
  addSalesperson: (sp: Omit<Salesperson, "id" | "createdAt">) => Salesperson
  setRoutes: (routes: Route[]) => void
  setSolution: (solution: SolverSolution | null) => void
  upsertAssignment: (assignment: Omit<Assignment, "id" | "updatedAt"> & { id?: string }) => Assignment
  reset: () => void
}

function uid(prefix = "id") {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      salespeople: [],
      routes: [],
      assignments: [],
      solution: null,

      addSalesperson: (sp) => {
        const id = uid("sp")
        const newSp: Salesperson = {
          id,
          name: sp.name,
          contact: sp.contact,
          startLat: sp.startLat,
          startLng: sp.startLng,
          startName: sp.startName, // optional
          createdAt: new Date().toISOString(),
        }
        set((state) => ({ salespeople: [newSp, ...state.salespeople] }))
        set((state) => ({
          assignments: [
            {
              id: uid("as"),
              salespersonId: id,
              salespersonName: sp.name,
              status: "not-started",
              progress: 0,
              updatedAt: new Date().toISOString(),
            },
            ...state.assignments,
          ],
        }))
        return newSp
      },

      setRoutes: (routes) => {
        set({ routes })
        const { assignments } = get()
        const updated = assignments.map((a) => {
          const r = routes.find(
            (rt) => rt.salespersonId === a.salespersonId || rt.salespersonName === a.salespersonName,
          )
          if (!r) return a
          return { ...a, routeId: r.id }
        })
        set({ assignments: updated })
      },

      setSolution: (solution) => {
        set({ solution })
      },

      upsertAssignment: (assignment) => {
        const id = assignment.id ?? uid("as")
        const full: Assignment = {
          id,
          salespersonId: assignment.salespersonId,
          salespersonName: assignment.salespersonName,
          routeId: assignment.routeId,
          status: assignment.status,
          progress: Math.max(0, Math.min(100, Math.round(assignment.progress))),
          updatedAt: new Date().toISOString(),
        }
        set((state) => {
          const idx = state.assignments.findIndex((a) => a.id === id)
          if (idx >= 0) {
            const copy = state.assignments.slice()
            copy[idx] = full
            return { assignments: copy }
          }
          return { assignments: [full, ...state.assignments] }
        })
        return full
      },

      reset: () => set({ salespeople: [], routes: [], assignments: [], solution: null }),
    }),
    { name: "beat-planning-store" },
  ),
)
