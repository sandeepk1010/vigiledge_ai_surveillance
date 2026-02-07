import { useEffect, useState } from "react";

function DetectionsTable() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      try {
        const res = await fetch("http://localhost:5000/api/detections");
        const json = await res.json();

        // Defensive normalization
        const list = Array.isArray(json)
          ? json
          : Array.isArray(json.data)
          ? json.data
          : Array.isArray(json.detections)
          ? json.detections
          : [];

        if (mounted) setRows(list);
      } catch (e) {
        console.error("Fetch failed", e);
        if (mounted) setRows([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="detections-container">
      <div className="detections-header">
        <h3>Vehicle Detections</h3>
        <div className="detections-meta">
          <span>{loading ? "Loading…" : `${rows.length} shown`}</span>
        </div>
      </div>

      <div className="table-responsive">
        <table className="detections-table">
        <thead>
          <tr>
            <th>Time</th>
            <th>Plate</th>
            <th>Camera</th>
            <th>Images</th>
          </tr>
        </thead>

        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan="4" className="muted">
                {loading ? "Loading detections..." : "No detections"}
              </td>
            </tr>
          ) : (
            rows.map((r) => (
              <tr key={r.id}>
                <td className="nowrap">
                  {r.detected_at
                    ? new Date(r.detected_at).toLocaleString()
                    : "-"}
                </td>
                <td className="monospace">{r.plate}</td>
                <td>{r.camera || r.camera_name}</td>
                <td>
                  <div className="thumbs">
                    {r.images?.plate ? (
                      <img
                        src={
                          r.images.plate.startsWith("http")
                            ? r.images.plate
                            : `http://localhost:5000${r.images.plate}`
                        }
                        alt="plate"
                        className="thumb"
                      />
                    ) : null}

                    {r.images?.vehicle ? (
                      <img
                        src={
                          r.images.vehicle.startsWith("http")
                            ? r.images.vehicle
                            : `http://localhost:5000${r.images.vehicle}`
                        }
                        alt="vehicle"
                        className="thumb"
                      />
                    ) : null}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
        </table>
      </div>
    </div>
  );
}

export default DetectionsTable;
