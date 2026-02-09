import { useEffect, useState } from "react";
import { getCameras, getDetections, getDailyCounts } from "../services/api";
import "./dashboard.css";

function Dashboard() {
  const [dataCam1, setDataCam1] = useState([]);
  const [dataCam2, setDataCam2] = useState([]);
  const [cameras, setCameras] = useState([]);
  const [error, setError] = useState("");
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dailyCounts, setDailyCounts] = useState([]);
  const [pageCam1, setPageCam1] = useState(1);
  const [pageCam2, setPageCam2] = useState(1);
  const [limit, setLimit] = useState(10);
  const [paginationCam1, setPaginationCam1] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1
  });
  const [paginationCam2, setPaginationCam2] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1
  });

  const sameIds = (a, b) => {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i += 1) {
      if (a[i]?.id !== b[i]?.id) return false;
    }
    return true;
  };

  const fetchData = async (silent = false) => {
    if (silent) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }
    setError("");
    try {
      console.log("📡 Fetching detections from API...");

      const [resCam1, resCam2] = await Promise.all([
        getDetections({ page: pageCam1, limit, camera: "camera1" }),
        getDetections({ page: pageCam2, limit, camera: "camera2" })
      ]);

      const detectionsCam1 = (resCam1 && resCam1.data)
        ? resCam1.data
        : (Array.isArray(resCam1) ? resCam1 : []);
      const detectionsCam2 = (resCam2 && resCam2.data)
        ? resCam2.data
        : (Array.isArray(resCam2) ? resCam2 : []);

      const pageMetaCam1 = resCam1 && resCam1.pagination ? resCam1.pagination : {
        page: pageCam1,
        limit,
        total: detectionsCam1.length,
        totalPages: 1
      };

      const pageMetaCam2 = resCam2 && resCam2.pagination ? resCam2.pagination : {
        page: pageCam2,
        limit,
        total: detectionsCam2.length,
        totalPages: 1
      };

      const cam1Changed = !sameIds(detectionsCam1, dataCam1);
      const cam2Changed = !sameIds(detectionsCam2, dataCam2);
      const paginationChanged =
        pageMetaCam1.total !== paginationCam1.total ||
        pageMetaCam2.total !== paginationCam2.total ||
        pageMetaCam1.totalPages !== paginationCam1.totalPages ||
        pageMetaCam2.totalPages !== paginationCam2.totalPages;

      if (cam1Changed) setDataCam1(detectionsCam1);
      if (cam2Changed) setDataCam2(detectionsCam2);
      if (paginationChanged) {
        setPaginationCam1(pageMetaCam1);
        setPaginationCam2(pageMetaCam2);
      }

      if (cam1Changed || cam2Changed || paginationChanged) {
        setLastUpdate(new Date());
      }
      console.log(`✅ Fetched detections at ${new Date().toLocaleTimeString()}`);
    } catch (err) {
      const errorMsg = `❌ API Error: ${err.message}`;
      console.error(errorMsg, err);
      setError(errorMsg);
    }
    if (silent) {
      setIsRefreshing(false);
    } else {
      setLoading(false);
    }
  };

  const fetchCameras = async () => {
    try {
      console.log("📡 Fetching cameras...");
      const cameraData = await getCameras();
      setCameras(cameraData);
      console.log("✅ Cameras loaded:", cameraData);
    } catch (err) {
      console.error("FETCH CAMERAS ERROR:", err);
      setError(`Failed to fetch cameras: ${err.message}`);
    }
  };

  const fetchDailyCounts = async () => {
    try {
      const res = await getDailyCounts(7);
      setDailyCounts(res.data || []);
    } catch (err) {
      console.error("FETCH DAILY COUNTS ERROR:", err);
    }
  };

  useEffect(() => {
    fetchCameras();
    fetchDailyCounts();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchDailyCounts();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchData();

    // Auto-refresh every 2 seconds for live updates
    const interval = setInterval(() => {
      console.log("🔄 Auto-refreshing...");
      fetchData(true);
    }, 2000);

    return () => clearInterval(interval);
  }, [pageCam1, pageCam2, limit]);

  const totalCam1Pages = Math.max(1, paginationCam1.totalPages || 1);
  const totalCam2Pages = Math.max(1, paginationCam2.totalPages || 1);
  const fromCam1 = paginationCam1.total === 0 ? 0 : (pageCam1 - 1) * limit + 1;
  const toCam1 = Math.min(pageCam1 * limit, paginationCam1.total || 0);
  const fromCam2 = paginationCam2.total === 0 ? 0 : (pageCam2 - 1) * limit + 1;
  const toCam2 = Math.min(pageCam2 * limit, paginationCam2.total || 0);

  const dailyMap = dailyCounts.reduce((acc, row) => {
    const dayKey = new Date(row.day).toISOString().slice(0, 10);
    if (!acc[dayKey]) {
      acc[dayKey] = { day: dayKey, camera1: 0, camera2: 0, total: 0 };
    }
    if (row.camera === "camera1") {
      acc[dayKey].camera1 += row.total;
    } else if (row.camera === "camera2") {
      acc[dayKey].camera2 += row.total;
    }
    acc[dayKey].total += row.total;
    return acc;
  }, {});

  const dailyRows = Object.values(dailyMap)
    .sort((a, b) => (a.day < b.day ? 1 : -1))
    .slice(0, 7);

  return (
    <div className="dash">
      <header className="dash-header">
        <div className="dash-title">
          <h2>Live ANPR</h2>
          <p>Real-time vehicle detections with camera status and images.</p>
        </div>
        <div className="dash-status">
          <div className="status-pill">
            Total <strong>{paginationCam1.total + paginationCam2.total}</strong>
          </div>
          <div className="status-pill">
            Updated {lastUpdate.toLocaleTimeString()}
          </div>
          {isRefreshing && <div className="status-pill status-live">Refreshing</div>}
        </div>
      </header>

      {error && <div className="alert error">{error}</div>}

      {cameras.length > 0 && (
        <section className="camera-section">
          <div className="section-header">
            <h3>Cameras</h3>
            <span className="section-meta">{cameras.length} online</span>
          </div>
          <div className="camera-grid">
            {cameras.map((cam) => (
              <div key={cam.id} className="camera-card">
                <div className="camera-name">{cam.name}</div>
                <div className="camera-ip">IP {cam.ip || "Not configured"}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="daily-card">
        <div className="section-header">
          <h3>Daily Counts</h3>
          <span className="section-meta">Last 7 days</span>
        </div>
        <div className="table-responsive">
          <table className="daily-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Camera 1</th>
                <th>Camera 2</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {dailyRows.length === 0 ? (
                <tr>
                  <td colSpan="4" className="empty-state">No daily data</td>
                </tr>
              ) : (
                dailyRows.map((row) => (
                  <tr key={row.day}>
                    <td className="time-cell">{new Date(row.day).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' })}</td>
                    <td className="id-cell">{row.camera1}</td>
                    <td className="id-cell">{row.camera2}</td>
                    <td className="plate-cell">{row.total}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="camera-split">
        <div className="table-card">
          <div className="section-header">
            <h3>Camera 1 Detections</h3>
            <div className="section-meta">
              <span>{fromCam1}-{toCam1} of {paginationCam1.total}</span>
              <span className="meta-sep">|</span>
              <span>Auto-refresh every 2s</span>
            </div>
          </div>
          <div className="table-responsive">
            <table className="detections-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Plate</th>
                  <th>Time</th>
                  <th>Image</th>
                </tr>
              </thead>
              <tbody>
                {dataCam1.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="empty-state">
                      {loading ? "Loading detections..." : "No detections yet"}
                    </td>
                  </tr>
                ) : (
                  dataCam1.map((d) => {
                    const imageList = d.images ? Object.values(d.images) : [];
                    const imageSrc = imageList.length > 0 ? imageList[0] : "";

                    return (
                      <tr key={d.id}>
                        <td className="id-cell">{d.id}</td>
                        <td className="plate-cell">{d.plate}</td>
                        <td className="time-cell">
                          {new Date(d.detected_at).toLocaleString()}
                        </td>
                        <td>
                          {imageSrc ? (
                            <img
                              src={`http://localhost:5000${imageSrc}`}
                              alt="vehicle"
                              className="image-thumb"
                              onError={(e) => {
                                e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='100'%3E%3Crect fill='%23eee' width='140' height='100'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23999'%3ENo image%3C/text%3E%3C/svg%3E";
                              }}
                            />
                          ) : (
                            <div className="img-placeholder">No image</div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <div className="table-footer">
            <div className="page-size">
              <span>Rows</span>
              <select
                value={limit}
                onChange={(e) => {
                  setPageCam1(1);
                  setPageCam2(1);
                  setLimit(Number(e.target.value));
                }}
              >
                {[5, 10, 20, 50].map((size) => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>
            <div className="pagination">
              <button
                className="page-btn"
                disabled={pageCam1 <= 1}
                onClick={() => setPageCam1((prev) => Math.max(1, prev - 1))}
              >
                Prev
              </button>
              <span className="page-info">Page {pageCam1} of {totalCam1Pages}</span>
              <button
                className="page-btn"
                disabled={pageCam1 >= totalCam1Pages}
                onClick={() => setPageCam1((prev) => Math.min(totalCam1Pages, prev + 1))}
              >
                Next
              </button>
            </div>
          </div>
        </div>

        <div className="table-card">
          <div className="section-header">
            <h3>Camera 2 Detections</h3>
            <div className="section-meta">
              <span>{fromCam2}-{toCam2} of {paginationCam2.total}</span>
              <span className="meta-sep">|</span>
              <span>Auto-refresh every 2s</span>
            </div>
          </div>
          <div className="table-responsive">
            <table className="detections-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Plate</th>
                  <th>Time</th>
                  <th>Image</th>
                </tr>
              </thead>
              <tbody>
                {dataCam2.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="empty-state">
                      {loading ? "Loading detections..." : "No detections yet"}
                    </td>
                  </tr>
                ) : (
                  dataCam2.map((d) => {
                    const imageList = d.images ? Object.values(d.images) : [];
                    const imageSrc = imageList.length > 0 ? imageList[0] : "";

                    return (
                      <tr key={d.id}>
                        <td className="id-cell">{d.id}</td>
                        <td className="plate-cell">{d.plate}</td>
                        <td className="time-cell">
                          {new Date(d.detected_at).toLocaleString()}
                        </td>
                        <td>
                          {imageSrc ? (
                            <img
                              src={`http://localhost:5000${imageSrc}`}
                              alt="vehicle"
                              className="image-thumb"
                              onError={(e) => {
                                e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='100'%3E%3Crect fill='%23eee' width='140' height='100'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23999'%3ENo image%3C/text%3E%3C/svg%3E";
                              }}
                            />
                          ) : (
                            <div className="img-placeholder">No image</div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <div className="table-footer">
            <div className="page-size">
              <span>Rows</span>
              <select
                value={limit}
                onChange={(e) => {
                  setPageCam1(1);
                  setPageCam2(1);
                  setLimit(Number(e.target.value));
                }}
              >
                {[5, 10, 20, 50].map((size) => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>
            <div className="pagination">
              <button
                className="page-btn"
                disabled={pageCam2 <= 1}
                onClick={() => setPageCam2((prev) => Math.max(1, prev - 1))}
              >
                Prev
              </button>
              <span className="page-info">Page {pageCam2} of {totalCam2Pages}</span>
              <button
                className="page-btn"
                disabled={pageCam2 >= totalCam2Pages}
                onClick={() => setPageCam2((prev) => Math.min(totalCam2Pages, prev + 1))}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Dashboard;
