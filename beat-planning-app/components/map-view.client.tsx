"use client"
import "leaflet/dist/leaflet.css"
import { MapContainer, TileLayer, Polyline, Marker, Popup } from "react-leaflet"
import type { VehicleRoute } from "@/store/use-app-store"

export default function MapClient({
  center,
  routes,
}: {
  center: [number, number]
  routes: VehicleRoute[]
}) {
  const colors = ["#2563eb", "#16a34a", "#dc2626", "#0ea5e9"] // blue, green, red, sky
  return (
    <div className="w-full h-[420px] rounded-md overflow-hidden border">
      <MapContainer center={center} zoom={11} style={{ width: "100%", height: "100%" }}>
        <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {routes.map((r, idx) => {
          const color = colors[idx % colors.length]
          const coords = r.route.map((p) => [p.lat, p.long] as [number, number])
          return (
            <div key={r.vehicle_id}>
              <Polyline positions={coords} pathOptions={{ color, weight: 4 }} />
              {r.route.map((p, i) => (
                <Marker position={[p.lat, p.long]} key={`${r.vehicle_id}-${i}`}>
                  <Popup>
                    <div className="text-sm">
                      <div className="font-medium">{p.node}</div>
                      <div className="text-gray-600">{p.type}</div>
                      <div>
                        ({p.lat.toFixed(4)}, {p.long.toFixed(4)})
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </div>
          )
        })}
      </MapContainer>
    </div>
  )
}
