import { useEffect, useState } from "react";
import { getDetections } from "../services/api";

function VehicleLog() {
  const [data, setData] = useState([]);
  const [camera, setCamera] = useState("all");
  const [date, setDate] = useState("");

  useEffect(() => {
    getDetections().then(setData);
  }, []);

  const filtered = data.filter(d => {
    return (
      (camera === "all" || d.camera === camera) &&
      (!date || d.detected_at.startsWith(date))
    );
  });

  return (
    <div>
      <h3>Vehicle Log (IN / OUT)</h3>

      <select onChange={e => setCamera(e.target.value)}>
        <option value="all">All Cameras</option>
        <option value="camera1">Camera 1</option>
        <option value="camera2">Camera 2</option>
      </select>

      <input type="date" onChange={e => setDate(e.target.value)} />

      <table border="1" cellPadding="6">
        <thead>
          <tr>
            <th>Time</th>
            <th>Camera</th>
            <th>Plate</th>
            <th>Plate Image</th>
            <th>Vehicle Image</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(v => (
            <tr key={v.id}>
              <td>{new Date(v.detected_at).toLocaleString()}</td>
              <td>{v.camera}</td>
              <td>{v.plate}</td>
              <td>
                {v.images?.plate && (
                  <img src={v.images.plate} width="80" />
                )}
              </td>
              <td>
                {v.images?.vehicle && (
                  <img src={v.images.vehicle} width="120" />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default VehicleLog;
