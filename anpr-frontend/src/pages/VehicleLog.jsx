import { useEffect, useState } from "react";
import { getDetections, searchDetections, getCameras } from "../services/api";
import "./dashboard.css";

export default function VehicleLog() {
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [cameras, setCameras] = useState([]);
  const [filters, setFilters] = useState({ camera: "", plate: "", startDate: "", endDate: "" });
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const sameIds = (a, b) => {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i += 1) {
      if (a[i]?.id !== b[i]?.id) return false;
    }
    return true;
  };

  const load = async (nextPage = page, silent = false) => {
    if (silent) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }
    setError("");
    try {
      const res = await getDetections({
        page: nextPage,
        limit,
        camera: filters.camera || null,
        plate: filters.plate || null,
        startDate: filters.startDate || null,
        endDate: filters.endDate || null
      });
      
      const nextData = res.data || [];
      const nextPagination = res.pagination || { page: nextPage, limit, total: 0, totalPages: 1 };
      const dataChanged = !sameIds(nextData, data);
      const paginationChanged =
        nextPagination.total !== pagination.total ||
        nextPagination.totalPages !== pagination.totalPages;

      if (dataChanged) setData(nextData);
      if (paginationChanged) setPagination(nextPagination);
      if (dataChanged || paginationChanged) setLastUpdate(new Date());
      console.log(`✅ Updated at ${new Date().toLocaleTimeString()} - ${res.data?.length || 0} items`);
    } catch (err) {
      console.error("FETCH ERROR:", err);
      setError(`❌ Failed to fetch data: ${err.message}`);
    }
    if (silent) {
      setIsRefreshing(false);
    } else {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setPage(1);
      load(1);
      return;
    }

    setLoading(true);
    try {
      const results = await searchDetections(searchQuery);
      setData(results);
      setPagination({ page: 1, limit: results.length, total: results.length, totalPages: 1 });
      setPage(1);
    } catch (err) {
      console.error("SEARCH ERROR:", err);
    }
    setLoading(false);
  };

  const loadCameras = async () => {
    try {
      const cams = await getCameras();
      setCameras(cams);
    } catch (err) {
      console.error("FETCH CAMERAS ERROR:", err);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const applyFilters = () => {
    setPage(1);
    load(1);
  };

  const clearFilters = () => {
    setFilters({ camera: "", plate: "", startDate: "", endDate: "" });
    setSearchQuery("");
    setPage(1);
    load(1);
  };

  useEffect(() => {
    loadCameras();
  }, []);

  useEffect(() => {
    load(page);

    // Auto-refresh every 3 seconds
    const interval = setInterval(() => {
      console.log("🔄 Auto-refreshing detections...");
      load(page, true);
    }, 3000);

    return () => clearInterval(interval);
  }, [page, limit]);

  const totalPages = Math.max(1, pagination.totalPages || 1);
  const fromIndex = pagination.total === 0 ? 0 : (page - 1) * limit + 1;
  const toIndex = Math.min(page * limit, pagination.total || 0);

  return (
    <div className="dash log">
      <header className="dash-header">
        <div className="dash-title">
          <h2>Vehicle Logs</h2>
          <p>Search, filter, and review detection history in real time.</p>
        </div>
        <div className="dash-status">
          <div className="status-pill">
            Total <strong>{pagination.total}</strong>
          </div>
          <div className="status-pill">
            Updated {lastUpdate.toLocaleTimeString()}
          </div>
          {isRefreshing && <div className="status-pill status-live">Refreshing</div>}
        </div>
      </header>

      {error && <div className="alert error">{error}</div>}

      <section className="filter-card">
        <div className="section-header">
          <h3>Search & Filters</h3>
          <span className="section-meta">Find a plate or narrow by time range</span>
        </div>

        <div className="search-row">
          <input
            type="text"
            className="input"
            placeholder="Search plate or camera..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button className="btn primary" onClick={handleSearch}>Search</button>
          <button className="btn ghost" onClick={clearFilters}>Clear</button>
        </div>

        <div className="filter-grid">
          <select name="camera" value={filters.camera} onChange={handleFilterChange} className="input">
            <option value="">All Cameras</option>
            {cameras.map(cam => (
              <option key={cam.id} value={cam.name}>{cam.name}</option>
            ))}
          </select>

          <input
            type="text"
            name="plate"
            placeholder="License Plate"
            value={filters.plate}
            onChange={handleFilterChange}
            className="input"
          />

          <input
            type="datetime-local"
            name="startDate"
            value={filters.startDate}
            onChange={handleFilterChange}
            className="input"
          />

          <input
            type="datetime-local"
            name="endDate"
            value={filters.endDate}
            onChange={handleFilterChange}
            className="input"
          />
        </div>

        <div className="filter-actions">
          <button className="btn primary" onClick={applyFilters}>Apply Filters</button>
        </div>
      </section>

      <section className="table-card">
        <div className="section-header">
          <h3>Detection History</h3>
          <div className="section-meta">
            <span>{fromIndex}-{toIndex} of {pagination.total}</span>
            <span className="meta-sep">|</span>
            <span>Page {page} of {totalPages}</span>
          </div>
        </div>

        <div className="table-responsive">
          <table className="detections-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Plate</th>
                <th>Camera</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="4" className="empty-state">Loading...</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan="4" className="empty-state">No detections found</td></tr>
              ) : (
                data.map((v) => (
                  <tr key={v.id}>
                    <td className="id-cell">{v.id}</td>
                    <td className="plate-cell">{v.plate}</td>
                    <td>
                      <span className={`camera-tag ${v.camera === "camera2" ? "camera-tag--alt" : ""}`}>
                        {v.camera}
                      </span>
                    </td>
                    <td className="time-cell">{new Date(v.detected_at).toLocaleString()}</td>
                  </tr>
                ))
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
                setPage(1);
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
              disabled={page <= 1}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            >
              Prev
            </button>
            <span className="page-info">Page {page} of {totalPages}</span>
            <button
              className="page-btn"
              disabled={page >= totalPages}
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            >
              Next
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
