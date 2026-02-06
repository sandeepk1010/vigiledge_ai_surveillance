import React, { useEffect, useState } from "react";
import { fetchDetections } from "../api";

export default function DetectionsTable() {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetchDetections().then(setData);
  }, []);

  return (
    <table border="1" cellPadding="8">
      <thead>
        <tr>
          <th>ID</th>
          <th>Camera</th>
          <th>Plate</th>
          <th>Time</th>
          <th>Plate Image</th>
          <th>Vehicle Image</th>
        </tr>
      </thead>
      <tbody>
        {data.map((d) => (
          <tr key={d.id}>
            <td>{d.id}</td>
            <td>{d.camera}</td>
            <td>{d.plate}</td>
            <td>{new Date(d.detected_at).toLocaleString()}</td>
            <td>
              {d.images?.plate && (
                <img src={d.images.plate} width="120" />
              )}
            </td>
            <td>
              {d.images?.vehicle && (
                <img src={d.images.vehicle} width="120" />
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
