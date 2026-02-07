import { Routes, Route, Link } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import VehicleLog from "./pages/VehicleLog";
import DailyGraph from "./pages/DailyGraph";

function App() {
  return (
    <div>
      <header className="app-top">
        <div className="main-wrap">
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div className="brand">ANPR Surveillance Dashboard</div>
            <div style={{fontSize:12,color:'rgba(255,255,255,0.7)'}}>Live</div>
          </div>
          <div className="nav" style={{marginTop:8}}>
            <Link to="/">Dashboard</Link>
            <Link to="/vehicle-log">Vehicle Log</Link>
            <Link to="/daily-graph">Daily Graph</Link>
          </div>
        </div>
      </header>

      <main className="main-wrap">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/vehicle-log" element={<VehicleLog />} />
          <Route path="/daily-graph" element={<DailyGraph />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
