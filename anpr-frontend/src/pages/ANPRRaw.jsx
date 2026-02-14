import { useEffect, useState } from "react";
import { API } from "../services/api";
import "./dashboard.css";

export default function ANPRRaw() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API}/api/raw-webhooks?limit=50`);
        const j = await res.json();
        if (j.ok) setItems(j.data || []);
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div className="dash log">
      <header className="dash-header">
        <div className="dash-title">
          <h2>ANPR Raw Payloads</h2>
          <p>Raw JSON payloads received from ANPR cameras (recent).</p>
        </div>
      </header>

      <section className="table-card">
        <div className="section-header">
          <h3>Recent Payloads</h3>
        </div>

        <div style={{ padding: 12 }}>
          {loading ? (
            <div>Loading...</div>
          ) : items.length === 0 ? (
            <div>No payloads found</div>
          ) : (
            items.map((it, idx) => {
              const pic = it.payload?.Picture || {};
              const cutoutName = pic?.CutoutPic?.PicName || pic?.CutoutPic?.Pic || null;
              const vehicleName = pic?.VehiclePic?.PicName || pic?.VehiclePic?.Pic || null;
              const camera = it.camera || "camera1";
              const date = it.date || "";
              const plate = it.plate || (it.payload?.Picture?.Plate?.PlateNumber || "UNKNOWN");

              const cutoutUrl = cutoutName ? `${API}/uploads/${camera}/${date}/${plate}/${cutoutName}` : null;
              const vehicleUrl = vehicleName ? `${API}/uploads/${camera}/${date}/${plate}/${vehicleName}` : null;

              return (
                <div key={idx} style={{ borderBottom: "1px solid #eee", padding: 12 }}>
                  <div style={{ display: "flex", gap: 16 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600 }}>{plate} • {camera} • {it.date}</div>
                      <pre style={{ maxHeight: 300, overflow: "auto", background: "#f8f8f8", padding: 12 }}>{JSON.stringify(it.payload, null, 2)}</pre>
                    </div>
                    <div style={{ width: 260 }}>
                      {cutoutUrl ? (
                        <div style={{ marginBottom: 8 }}>
                          <div style={{ fontSize: 12, color: "#666" }}>Plate crop</div>
                          <img src={cutoutUrl} alt="cutout" style={{ width: "100%", border: "1px solid #ddd" }} />
                        </div>
                      ) : null}

                      {vehicleUrl ? (
                        <div>
                          <div style={{ fontSize: 12, color: "#666" }}>Vehicle</div>
                          <img src={vehicleUrl} alt="vehicle" style={{ width: "100%", border: "1px solid #ddd" }} />
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
