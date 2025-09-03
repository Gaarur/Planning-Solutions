import React, { useState } from "react";

function SalespersonEnroll() {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [startingPoint, setStartingPoint] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    if (!name || !address || !phone || !startingPoint) {
      setMessage("Please fill in all fields.");
      return;
    }
    try {
      const response = await fetch("http://localhost:8000/enroll_salesperson", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, address, phone, starting_point: startingPoint })
      });
      const data = await response.json();
      if (response.ok) {
        setMessage(`Enrollment successful! Your Salesperson ID is ${data.salesperson_id}`);
        setName("");
        setAddress("");
        setPhone("");
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
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-center mb-8 text-gray-800">Salesperson Enrollment</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-gray-700 font-medium mb-2">Name:</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-2">Address:</label>
            <input
              type="text"
              value={address}
              onChange={e => setAddress(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-2">Phone:</label>
            <input
              type="text"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-2">Starting Point:</label>
            <input
              type="text"
              value={startingPoint}
              onChange={e => setStartingPoint(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <button type="submit" className="w-full py-3 text-lg font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">Enroll</button>
        </form>
        {message && <div className={`mt-6 text-center text-lg ${message.includes("success") ? "text-green-600" : "text-red-600"}`}>{message}</div>}
      </div>
    </div>
  );
}

export default SalespersonEnroll;
