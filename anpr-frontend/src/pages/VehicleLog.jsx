import { useEffect, useState } from "react";
import { getDetections } from "../services/api";

export default function VehicleLog() {
  const [data, setData] = useState([]);

  const load = async () => {
    const res = await getDetections();
    console.log("DATA FROM API:", res);
    setData(res);
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <h2>Vehicle Logs</h2>

      <table border="1">
        <thead>
          <tr>
            <th>ID</th>
            <th>Plate</th>
            <th>Camera</th>
            <th>Time</th>
          </tr>
        </thead>

        <tbody>
          {data.map((v) => (
            <tr key={v.id}>
              <td>{v.id}</td>
              <td>{v.plate}</td>
              <td>{v.camera_name}</td>
              <td>{new Date(v.created_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
