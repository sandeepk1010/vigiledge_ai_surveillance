import { useEffect, useState } from "react";
import { getStats, getLive } from "../services/api";

export default function Dashboard() {
  const [stats, setStats] = useState({ total_in: 0, total_out: 0 });
  const [live, setLive] = useState([]);

  useEffect(() => {
    load();
    const t = setInterval(load, 3000);
    return () => clearInterval(t);
  }, []);

  const load = async () => {
    try {
      const s = await getStats();
      const l = await getLive();

      setStats(s || { total_in: 0, total_out: 0 });
      setLive(Array.isArray(l) ? l : []);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>ANPR Dashboard</h1>

      <div style={{ display: "flex", gap: 20 }}>
        <div>IN Today: {stats.total_in}</div>
        <div>OUT Today: {stats.total_out}</div>
        <div>Inside: {stats.total_in - stats.total_out}</div>
      </div>

      <h2>Live Vehicles</h2>

      <table border="1">
        <thead>
          <tr>
            <th>Plate</th>
            <th>Camera</th>
            <th>Type</th>
            <th>Time</th>
          </tr>
        </thead>
        <tbody>
          {live.length === 0 ? (
            <tr>
              <td colSpan="4">No data</td>
            </tr>
          ) : (
            live.map((l, i) => (
              <tr key={i}>
                <td>{l.plate_number}</td>
                <td>{l.name}</td>
                <td>{l.type}</td>
                <td>{new Date(l.detected_at).toLocaleTimeString()}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
