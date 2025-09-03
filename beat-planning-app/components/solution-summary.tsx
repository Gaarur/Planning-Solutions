import type React from "react"

type RouteStop = {
  node: string
  lat?: number | string
  long?: number | string
  [key: string]: any
}

type Vehicle = {
  vehicle_id?: number | string | null
  route?: RouteStop[]
  distance?: number | null
  time?: number | null
  stores_visited?: number | null
  [key: string]: any
}

export type SolverSolution = {
  routes: Vehicle[]
  total_distance?: number | null
  total_time?: number | null
  [key: string]: any
}

function formatDistance(d?: number | null) {
  if (d == null || Number.isNaN(d)) return "N/A"
  const meters = Number(d)
  if (meters >= 1000) return `${(meters / 1000).toFixed(2)} km`
  return `${Math.round(meters)} m`
}

function formatTime(s?: number | null) {
  if (s == null || Number.isNaN(s)) return "N/A"
  const total = Math.max(0, Math.floor(Number(s)))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const sec = total % 60
  const hh = h > 0 ? `${h}:` : ""
  const mm = h > 0 ? String(m).padStart(2, "0") : `${m}`
  const ss = String(sec).padStart(2, "0")
  return `${hh}${mm}:${ss}`
}

export function SolutionSummary({ solution }: { solution: SolverSolution }) {
  if (!solution || !Array.isArray(solution.routes)) return null

  return (
    <section aria-labelledby="solution-title" className="space-y-4">
      <h2 id="solution-title" className="text-lg font-semibold text-balance">
        Beat Planning Solution
      </h2>

      <div className="space-y-4">
        {solution.routes.map((vehicle, idx) => {
          const label =
            vehicle.vehicle_id != null && vehicle.vehicle_id !== ""
              ? Number.isFinite(Number(vehicle.vehicle_id))
                ? `Salesperson #${Number(vehicle.vehicle_id) + 1}`
                : `Salesperson ${String(vehicle.vehicle_id)}`
              : `Salesperson #${idx + 1}`

          return (
            <div
              key={(vehicle.vehicle_id as React.Key) ?? idx}
              className="rounded-lg p-4"
              style={{ background: "#222", color: "#fff" }}
            >
              <strong className="block mb-2">{label}</strong>

              <div className="mb-1">
                <b>Route:</b>{" "}
                {vehicle.route && vehicle.route.length > 0
                  ? vehicle.route.map((item, i) => (
                      <span key={i}>
                        {item.node}
                        {i < (vehicle.route?.length ?? 0) - 1 ? " → " : ""}
                      </span>
                    ))
                  : "N/A"}
              </div>

              <div className="mb-1">
                <b>Total Distance:</b> {formatDistance(vehicle.distance ?? null)}
              </div>
              <div className="mb-1">
                <b>Total Time:</b> {formatTime(vehicle.time ?? null)}
              </div>
              <div className="mb-1">
                <b>Stores Visited:</b> {vehicle.stores_visited ?? "N/A"}
              </div>
            </div>
          )
        })}
      </div>

      <div className="pt-2">
        <div>
          <b>Overall Total Distance:</b> {formatDistance(solution.total_distance ?? null)}
        </div>
        <div>
          <b>Overall Total Time:</b> {formatTime(solution.total_time ?? null)}
        </div>
      </div>
    </section>
  )
}

export default SolutionSummary
