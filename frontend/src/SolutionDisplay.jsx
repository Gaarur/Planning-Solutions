import React from "react";

function formatDistance(distance) {
  if (distance == null) return "N/A";
  return (distance / 1000).toFixed(2) + " km";
}

function formatTime(time) {
  if (time == null) return "N/A";
  return time + " min";
}

function SolutionDisplay({ solution }) {
  if (!solution) {
    return <div>No solution data available.</div>;
  }

  if (solution.error) {
    return (
      <div style={{ color: "#c0392b", background: "#1e1212ff", padding: "1em", borderRadius: "8px", margin: "1em 0" }}>
        <b>Error:</b> {solution.error}
      </div>
    );
  }

  if (!solution.routes) {
    return <div>No routes found in solution.</div>;
  }

  return (
    <div>
      <h2>Beat Planning Solution</h2>
      {solution.routes.map((vehicle, idx) => (
        <div key={vehicle.vehicle_id || idx} style={{ background: "#222", color: "#fff", margin: "1em 0", padding: "1em", borderRadius: "8px" }}>
          <strong>Salesperson #{vehicle.vehicle_id != null ? vehicle.vehicle_id + 1 : idx + 1}</strong>
          <div>
            <b>Route:</b>{" "}
            {vehicle.route && vehicle.route.length > 0
              ? vehicle.route.map((item, i) => (
                  <span key={i}>
                    {item.node}
                    {i < vehicle.route.length - 1 ? " → " : ""}
                  </span>
                ))
              : "N/A"}
          </div>
          <div>
            <b>Total Distance:</b> {formatDistance(vehicle.distance)}
          </div>
          <div>
            <b>Total Time:</b> {formatTime(vehicle.time)}
          </div>
          <div>
            <b>Stores Visited:</b> {vehicle.stores_visited ?? "N/A"}
          </div>
        </div>
      ))}
      <div>
        <b>Overall Total Distance:</b> {formatDistance(solution.total_distance)}
      </div>
      <div>
        <b>Overall Total Time:</b> {formatTime(solution.total_time)}
      </div>
    </div>
  );
}

export default SolutionDisplay;