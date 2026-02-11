import { useEffect, useState } from "react";
import { getDetections, searchDetections, getCameras } from "../services/api";
import "./dashboard.css";

export default function VehicleLog() {
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 0 });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(12);
  const [cameras, setCameras] = useState([]);
  const [filters, setFilters] = useState({
    eventType: "",
    timeFrame: "",
    camera: "", 
    plate: "", 
    device: "",
    startDate: "", 
    endDate: "" 
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Camera to location mapping
  const cameraLocations = {
    camera1: "Sales In - Top View",
    camera2: "Sales Out Front - Closer"
  };

  // Camera to event type mapping
  const cameraEventTypes = {
    camera1: "Entry",
    camera2: "Exit"
  };

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
    const updatedFilters = { ...filters, [name]: value };
    setFilters(updatedFilters);
    // Save to localStorage
    localStorage.setItem('vehicleLogFilters', JSON.stringify(updatedFilters));
  };

  const applyFilters = () => {
    setPage(1);
    load(1);
  };

  const clearFilters = () => {
    const emptyFilters = { 
      eventType: "", 
      timeFrame: "",
      camera: "", 
      plate: "", 
      device: "",
      startDate: "", 
      endDate: "" 
    };
    setFilters(emptyFilters);
    setSearchQuery("");
    setPage(1);
    // Clear from localStorage
    localStorage.setItem('vehicleLogFilters', JSON.stringify(emptyFilters));
    load(1);
  };

  const handleTimeFrameChange = (timeFrame) => {
    const now = new Date();
    let startDate = "";
    let endDate = "";

    if (timeFrame === "today") {
      startDate = new Date(now.setHours(0, 0, 0, 0)).toISOString();
      endDate = new Date().toISOString();
    } else if (timeFrame === "yesterday") {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      startDate = new Date(yesterday.setHours(0, 0, 0, 0)).toISOString();
      endDate = new Date(yesterday.setHours(23, 59, 59, 999)).toISOString();
    } else if (timeFrame === "week") {
      startDate = new Date(now.setDate(now.getDate() - 7)).toISOString();
      endDate = new Date().toISOString();
    }

    const updatedFilters = { ...filters, timeFrame, startDate, endDate };
    setFilters(updatedFilters);
    // Save to localStorage
    localStorage.setItem('vehicleLogFilters', JSON.stringify(updatedFilters));
  };

  useEffect(() => {
    loadCameras();
  }, []);

  // Restore filters from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('vehicleLogFilters');
      if (saved) {
        const restoredFilters = JSON.parse(saved);
        setFilters(restoredFilters);
      }
    } catch (e) {
      console.error("Failed to restore filters from localStorage:", e);
    }
  }, []);

  useEffect(() => {
    load(page);

    // Auto-refresh every 3 seconds
    const interval = setInterval(() => {
      console.log("🔄 Auto-refreshing detections...");
      load(page, true);
    }, 3000);

    return () => clearInterval(interval);
  }, [page, limit, filters]);

  const totalPages = Math.max(1, pagination.totalPages || 1);
  const fromIndex = pagination.total === 0 ? 0 : (page - 1) * limit + 1;
  const toIndex = Math.min(page * limit, pagination.total || 0);

  return (
    <div className="dash log">
      <header className="dash-header">
        <div className="dash-title">
          <h2>In/Out-Reports</h2>
          <p>Vehicle movement logs with entry and exit tracking.</p>
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
          <h3>Filters</h3>
          <button className="btn-text" onClick={clearFilters}>Clear All Filters</button>
        </div>

        <div className="filter-grid-advanced">
          <div className="filter-group">
            <label>Event Type</label>
            <select name="eventType" value={filters.eventType} onChange={handleFilterChange} className="input">
              <option value="">All Entries</option>
              <option value="Entry">Entry</option>
              <option value="Exit">Exit</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Time Frame</label>
            <select 
              value={filters.timeFrame} 
              onChange={(e) => handleTimeFrameChange(e.target.value)} 
              className="input"
            >
              <option value="">All Time</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="week">Last 7 Days</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Plate Number</label>
            <input
              type="text"
              name="plate"
              placeholder="Search plate number..."
              value={filters.plate}
              onChange={handleFilterChange}
              className="input"
            />
          </div>

          <div className="filter-group">
            <label>Camera Name</label>
            <select name="camera" value={filters.camera} onChange={handleFilterChange} className="input">
              <option value="">All Cameras</option>
              {cameras.map(cam => (
                <option key={cam.id} value={cam.name}>{cam.name}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Device</label>
            <select name="device" value={filters.device} onChange={handleFilterChange} className="input">
              <option value="">All Devices</option>
              <option value="camera1">Camera 1</option>
              <option value="camera2">Camera 2</option>
            </select>
          </div>
        </div>

        <div className="filter-actions">
          <button className="btn primary" onClick={applyFilters}>Apply Filters</button>
          <button className="btn-icon" title="Export">
            <span>📥</span> Export
          </button>
        </div>
      </section>

      <section className="table-card">
        <div className="section-header">
          <h3>Vehicle Movement Logs</h3>
          <div className="section-meta">
            Showing {fromIndex}-{toIndex} of {pagination.total} entries
          </div>
        </div>

        <div className="table-responsive">
          <table className="logs-table">
            <thead>
              <tr>
                <th>S.No.</th>
                <th>Event Type</th>
                <th>Time <span className="sort-icon">⇅</span></th>
                <th>Location</th>
                <th>Plate Number (ANPR)</th>
                <th>Screenshot</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" className="empty-state">Loading...</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan="6" className="empty-state">No detections found</td></tr>
              ) : (
                data.map((v, idx) => {
                  const eventType = cameraEventTypes[v.camera] || "Entry";
                  const location = cameraLocations[v.camera] || v.camera;
                  const imageList = v.images ? Object.values(v.images) : [];
                  
                  return (
                    <tr key={v.id}>
                      <td className="sno-cell">{fromIndex + idx}</td>
                      <td>
                        <span className={`event-badge event-${eventType.toLowerCase()}`}>
                          {eventType}
                        </span>
                      </td>
                      <td className="time-cell">
                        {new Date(v.detected_at).toLocaleDateString('en-GB', { 
                          day: '2-digit', 
                          month: 'short', 
                          year: 'numeric' 
                        })}, {new Date(v.detected_at).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                          hour12: true
                        })}
                      </td>
                      <td className="location-cell">{location}</td>
                      <td className="plate-cell">{v.plate || "-"}</td>
                      <td className="screenshot-cell">
                        {imageList.length > 0 ? (
                          <div className="screenshot-group">
                            <img
                              src={`http://localhost:5000${imageList[0]}`}
                              alt="vehicle"
                              className="screenshot-img"
                              onError={(e) => {
                                e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='60'%3E%3Crect fill='%23eee' width='80' height='60'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23999' font-size='10'%3ENo image%3C/text%3E%3C/svg%3E";
                              }}
                            />
                            <button className="btn-download" title="Download">📥</button>
                          </div>
                        ) : (
                          <div className="screenshot-placeholder">No image</div>
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
          <div className="footer-info">
            {fromIndex}-{toIndex} of {pagination.total} entries
          </div>
          <div className="pagination">
            <button
              className="page-btn"
              disabled={page <= 1}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            >
              Previous
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }
              
              return (
                <button
                  key={pageNum}
                  className={`page-btn ${page === pageNum ? 'active' : ''}`}
                  onClick={() => setPage(pageNum)}
                >
                  {pageNum}
                </button>
              );
            })}
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
