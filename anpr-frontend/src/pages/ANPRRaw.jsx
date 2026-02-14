import { useEffect, useState } from "react";
import { API } from "../services/api";
import "./dashboard.css";

export default function ANPRRaw() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(null);

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
          <h2>ANPR Payloads (Table)</h2>
          <p>Recent payloads received from ANPR cameras — images only.</p>
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
            <div style={{ overflowX: 'auto' }}>
              <table className="simple-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: 8 }}>Time</th>
                    <th style={{ textAlign: 'left', padding: 8 }}>Camera</th>
                    <th style={{ textAlign: 'left', padding: 8 }}>Plate</th>
                    <th style={{ textAlign: 'left', padding: 8 }}>Plate Image</th>
                    <th style={{ textAlign: 'left', padding: 8 }}>Vehicle Image</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, idx) => {
                    const pic = it.payload?.Picture || {};
                    const camera = it.camera || 'camera1';
                    const date = it.date || '';
                    const plate = it.plate || (it.payload?.Picture?.Plate?.PlateNumber || 'UNKNOWN');

                    // helper to get image src from payload or stored path
                    const getImageSrc = (imgField) => {
                      if (!imgField) return null;

                      // if field is an object with Content or Base64
                      if (typeof imgField === 'object') {
                        const content = imgField.Content || imgField.Base64 || imgField.Pic || imgField.PicBase64 || null;
                        if (content) {
                          if (typeof content === 'string') {
                            if (content.startsWith('data:')) return content;
                            // assume jpeg if unknown
                            return 'data:image/jpeg;base64,' + content.replace(/^data:\w+\/\w+;base64,/, '');
                          }
                        }
                        // if object contains a PicName
                        const name = imgField.PicName || imgField.picName || imgField.Pic || null;
                        if (name && typeof name === 'string') return `${API}/uploads/${camera}/${date}/${plate}/${name}`;
                        return null;
                      }

                      // string case: could be base64 or filename
                      if (typeof imgField === 'string') {
                        if (imgField.startsWith('data:')) return imgField;
                        if (/^[A-Za-z0-9+\/=\-]+$/.test(imgField) && imgField.length > 100) {
                          return 'data:image/jpeg;base64,' + imgField.replace(/^data:\w+\/\w+;base64,/, '');
                        }
                        // otherwise treat as filename
                        return `${API}/uploads/${camera}/${date}/${plate}/${imgField}`;
                      }

                      return null;
                    };

                    const cutout = pic?.CutoutPic || pic?.Plate || pic?.PlateImage || null;
                    const vehicle = pic?.VehiclePic || pic?.NormalPic || pic?.FullImage || null;

                    const cutoutSrc = getImageSrc(cutout);
                    const vehicleSrc = getImageSrc(vehicle);

                    // extract readable detail fields from payload (exclude large base64 blobs)
                    const extractDetails = (payload) => {
                      if (!payload || typeof payload !== 'object') return {};
                      const out = {};

                      const skipKeys = new Set(['Content','Base64','Pic','PicBase64','PicName','picName','CutoutPic','VehiclePic']);

                      function walk(obj, prefix = '') {
                        for (const k of Object.keys(obj || {})) {
                          if (skipKeys.has(k)) continue;
                          const v = obj[k];
                          const key = prefix ? `${prefix}.${k}` : k;
                          if (v == null) continue;
                          if (typeof v === 'string') {
                            // skip long base64 strings
                            if (v.length > 200 && /^[A-Za-z0-9+/=\-]+$/.test(v.replace(/\s+/g, ''))) continue;
                            out[key] = v;
                          } else if (typeof v === 'number' || typeof v === 'boolean') {
                            out[key] = String(v);
                          } else if (Array.isArray(v)) {
                            out[key] = v.map(x => (typeof x === 'object' ? JSON.stringify(x) : String(x))).join(', ');
                          } else if (typeof v === 'object') {
                            // if object contains primitive props, flatten one level
                            const prims = Object.entries(v).filter(([kk, vv]) => vv == null || typeof vv === 'string' || typeof vv === 'number' || typeof vv === 'boolean');
                            if (prims.length > 0) {
                              for (const [kk, vv] of prims) {
                                const subk = `${key}.${kk}`;
                                if (vv == null) continue;
                                if (typeof vv === 'string' && vv.length > 200) continue;
                                out[subk] = String(vv);
                              }
                            } else {
                              // recurse
                              walk(v, key);
                            }
                          }
                        }
                      }

                      walk(payload);
                      return out;
                    };

                    const details = extractDetails(it.payload || {});

                    const toggle = () => setExpanded(expanded === idx ? null : idx);

                    const sanitizePayload = (p) => {
                      const skip = new Set(['Content','Base64','Pic','PicBase64','PicName','picName']);
                      function repl(obj) {
                        if (obj == null) return obj;
                        if (typeof obj === 'string') {
                          if (obj.length > 200 && /^[A-Za-z0-9+/=\-\s]+$/.test(obj)) return '[base64]';
                          return obj;
                        }
                        if (Array.isArray(obj)) return obj.map(repl);
                        if (typeof obj === 'object') {
                          const out = {};
                          for (const k of Object.keys(obj)) {
                            if (skip.has(k)) continue;
                            out[k] = repl(obj[k]);
                          }
                          return out;
                        }
                        return obj;
                      }
                      return repl(p);
                    };

                    return (
                      <>
                        <tr key={idx} className="collapse-toggle" onClick={toggle} style={{ borderTop: '1px solid #eee', cursor: 'pointer' }}>
                          <td style={{ padding: 8, verticalAlign: 'middle' }}>{new Date(it.timestamp || it.date || Date.now()).toLocaleString()}</td>
                          <td style={{ padding: 8, verticalAlign: 'middle' }}>{camera}</td>
                          <td style={{ padding: 8, verticalAlign: 'middle', fontWeight: 600 }}>{plate}</td>
                          <td style={{ padding: 8, verticalAlign: 'middle' }}>
                            {cutoutSrc ? (
                              <img src={cutoutSrc} alt="plate" className="image-thumb" />
                            ) : (
                              <div className="img-placeholder">No image</div>
                            )}
                          </td>
                          <td style={{ padding: 8, verticalAlign: 'middle' }}>
                            {vehicleSrc ? (
                              <img src={vehicleSrc} alt="vehicle" className="image-thumb" style={{ width: 180 }} />
                            ) : (
                              <div className="img-placeholder">No image</div>
                            )}
                          </td>
                          <td style={{ padding: 8, verticalAlign: 'middle' }}>
                            {Object.keys(details).length === 0 ? (
                              <span style={{ color: '#888' }}>—</span>
                            ) : (
                              <div style={{ fontSize: 13 }}>
                                {Object.entries(details).slice(0, 4).map(([k, v]) => (
                                  <div key={k} style={{ marginBottom: 4 }}>
                                    <strong style={{ color: '#333' }}>{k}:</strong> <span style={{ color: '#111' }}>{v}</span>
                                  </div>
                                ))}
                                {Object.keys(details).length > 4 ? (
                                  <div style={{ color: '#666', fontSize: 12 }}>+{Object.keys(details).length - 4} more (click to expand)</div>
                                ) : null}
                              </div>
                            )}
                          </td>
                        </tr>
                        {expanded === idx ? (
                          <tr className="details-panel-row">
                            <td colSpan={6} style={{ padding: 12, background: '#fffdf9' }}>
                              <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                                <div style={{ minWidth: 260 }}>
                                  {cutoutSrc ? <img src={cutoutSrc} alt="plate-large" style={{ width: 240, borderRadius: 8, border: '1px solid #eee' }} /> : null}
                                  <div style={{ height: 12 }} />
                                  {vehicleSrc ? <img src={vehicleSrc} alt="vehicle-large" style={{ width: 420, borderRadius: 8, border: '1px solid #eee' }} /> : null}
                                </div>
                                <div style={{ flex: 1 }}>
                                  <h4 style={{ marginTop: 0 }}>Details</h4>
                                  <div style={{ maxHeight: 260, overflow: 'auto', paddingRight: 8 }}>
                                    {Object.entries(details).length === 0 ? <div style={{ color: '#666' }}>No readable details</div> : (
                                      Object.entries(details).map(([k, v]) => (
                                        <div key={k} style={{ marginBottom: 6 }}><strong>{k}:</strong> {v}</div>
                                      ))
                                    )}
                                  </div>
                                  <div style={{ height: 12 }} />
                                  <div>
                                    <button className="btn ghost" onClick={(e) => { e.stopPropagation(); const data = sanitizePayload(it.payload || {}); const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `${plate || 'payload' }.json`; a.click(); URL.revokeObjectURL(url); }}>Download JSON</button>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        ) : null}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
