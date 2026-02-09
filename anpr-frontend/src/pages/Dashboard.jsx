import { useEffect, useState } from "react";

function Dashboard() {
  const [data, setData] = useState([]);

  const fetchData = async () => {
    try {
      const res = await fetch("http://192.168.1.120:5000/api/detections");
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("FETCH ERROR:", err);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h2>🚗 Live ANPR</h2>

      <table border="1" cellPadding="10">
        <thead>
          <tr>
            <th>ID</th>
            <th>Plate</th>
            <th>Camera</th>
            <th>Time</th>
            <th>Image</th>
          </tr>
        </thead>

        <tbody>
          {data.map((d) => (
            <tr key={d.id}>
              <td>{d.id}</td>
              <td>{d.plate}</td>
              <td>{d.camera_name}</td>
              <td>{new Date(d.created_at).toLocaleString()}</td>

              <td>
                {d.image_path ? (
                  <img
                    src={`http://192.168.1.120:5000/${d.image_path}`}
                    width="120"
                    alt="car"
                  />
                ) : (
                  "No image"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Dashboard;
