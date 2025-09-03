import React, { useState } from 'react';
import SolutionDisplay from './SolutionDisplay';

function App() {
  const [locationsFile, setLocationsFile] = useState(null);
  const [assignmentsFile, setAssignmentsFile] = useState(null);
  const [numSalespeople, setNumSalespeople] = useState(2);
  const [dailyWorkingHours, setDailyWorkingHours] = useState(4);
  const [maxDailyDistanceKm, setMaxDailyDistanceKm] = useState(30);
  const [targetStoresPerDay, setTargetStoresPerDay] = useState(0);
  const [solution, setSolution] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSolution(null);
    setLoading(true);
    const formData = new FormData();
    formData.append('locations_file', locationsFile);
    formData.append('assignments_file', assignmentsFile);
    formData.append('num_salespeople', numSalespeople);
    formData.append('daily_working_hours', dailyWorkingHours);
    formData.append('max_daily_distance_km', maxDailyDistanceKm);
    formData.append('target_stores_per_day', targetStoresPerDay);
    try {
      const response = await fetch('http://localhost:8000/solve_beat_planning', {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.detail || 'API error');
      } else {
        setSolution(data);
      }
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#222', color: '#fff', fontFamily: 'Arial, sans-serif', padding: '2em' }}>
      <h1 style={{ textAlign: 'left', fontSize: '2.5em', fontWeight: 700, marginBottom: '1em' }}>Beat Planning Solution UI</h1>
      <form onSubmit={handleSubmit} style={{ background: '#fff', color: '#222', padding: 32, borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', maxWidth: 400, margin: '0 auto' }}>
        <div style={{ marginBottom: 18 }}>
          <label style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>Locations CSV</label>
          <input type="file" accept=".csv" required onChange={e => setLocationsFile(e.target.files[0])} style={{ width: '100%' }} />
        </div>
        <div style={{ marginBottom: 18 }}>
          <label style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>Assignments CSV</label>
          <input type="file" accept=".csv" required onChange={e => setAssignmentsFile(e.target.files[0])} style={{ width: '100%' }} />
        </div>
        <div style={{ marginBottom: 18 }}>
          <label style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>Number of Salespeople</label>
          <input type="number" min="1" value={numSalespeople} onChange={e => setNumSalespeople(e.target.value)} required style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc' }} placeholder="e.g. 2" />
        </div>
        <div style={{ marginBottom: 18 }}>
          <label style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>Daily Working Hours</label>
          <input type="number" min="1" value={dailyWorkingHours} onChange={e => setDailyWorkingHours(e.target.value)} required style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc' }} placeholder="e.g. 8" />
        </div>
        <div style={{ marginBottom: 18 }}>
          <label style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>Max Daily Distance (km)</label>
          <input type="number" min="1" value={maxDailyDistanceKm} onChange={e => setMaxDailyDistanceKm(e.target.value)} required style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc' }} placeholder="e.g. 200" />
        </div>
        <div style={{ marginBottom: 18 }}>
          <label style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>Target Stores Per Day</label>
          <input type="number" min="0" value={targetStoresPerDay} onChange={e => setTargetStoresPerDay(e.target.value)} required style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc' }} placeholder="e.g. 0" />
        </div>
        <button type="submit" disabled={loading} style={{ marginTop: 8, padding: '10px 28px', background: '#3498db', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, fontSize: '1em', cursor: 'pointer' }}>
          {loading ? 'Loading...' : 'Get Solution'}
        </button>
      </form>
      <SolutionDisplay solution={solution} />
      {error && <div style={{ color: '#c0392b', marginTop: 24, textAlign: 'center', fontWeight: 600 }}>{error}</div>}
      {solution && (
        <div style={{ marginTop: 48, maxWidth: 700, marginLeft: 'auto', marginRight: 'auto', background: '#fff', color: '#222', borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', padding: 32 }}>
          <h3 style={{ marginTop: 32, fontWeight: 600 }}>Raw API Response</h3>
          <pre style={{ background: '#f4f4f4', padding: 16, borderRadius: 6, fontSize: '0.95em', overflowX: 'auto' }}>{JSON.stringify(solution, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

export default App;
