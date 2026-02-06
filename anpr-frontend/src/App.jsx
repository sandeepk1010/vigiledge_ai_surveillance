import { Routes, Route, Link } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import VehicleLog from "./pages/VehicleLog";
import DailyGraph from "./pages/DailyGraph";

function App() {
  return (
    <div>
      <h2>ANPR Surveillance Dashboard</h2>

      <nav>
        <Link to="/">Dashboard</Link> |{" "}
        <Link to="/vehicle-log">Vehicle Log</Link> |{" "}
        <Link to="/daily-graph">Daily Graph</Link>
      </nav>

      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/vehicle-log" element={<VehicleLog />} />
        <Route path="/daily-graph" element={<DailyGraph />} />
      </Routes>
    </div>
  );
}

export default App;
