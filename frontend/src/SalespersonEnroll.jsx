import React, { useState } from "react";

function SalespersonEnroll() {
  const [salespersonId, setSalespersonId] = useState("");
  const [startingPoint, setStartingPoint] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    if (!salespersonId || !startingPoint) {
      setMessage("Please fill in all fields.");
      return;
    }
    try {
      const response = await fetch("http://localhost:8000/enroll_salesperson", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ salesperson_id: salespersonId, starting_point: startingPoint })
      });
      const data = await response.json();
      if (response.ok) {
        setMessage("Enrollment successful!");
        setSalespersonId("");
        setStartingPoint("");
      } else {
        setMessage(data.error || "Error enrolling salesperson.");
      }
    } catch (err) {
      setMessage("Network error.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="w-full max-w-sm bg-white rounded-lg shadow-xl p-6">
        <h2 className="text-xl font-bold text-center mb-6 text-gray-800">Salesperson Enrollment</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">Salesperson ID:</label>
            <input
              type="text"
              value={salespersonId}
              onChange={e => setSalespersonId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded text-base focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">Starting Point:</label>
            <input
              type="text"
              value={startingPoint}
              onChange={e => setStartingPoint(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded text-base focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <button type="submit" className="w-full py-2 text-base font-semibold bg-blue-600 text-white rounded hover:bg-blue-700 transition">Enroll</button>
        </form>
        {message && (
          <div className={`mt-4 text-center text-base ${message.includes("success") ? "text-green-600" : "text-red-600"}`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}

export default SalespersonEnroll;
