import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import "./App.css";
import Dashboard from "./pages/Dashboard";
import VehicleLog from "./pages/VehicleLog";
import DailyGraph from "./pages/DailyGraph";
import ANPRRaw from "./pages/ANPRRaw";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";

function App() {
  const [open, setOpen] = useState(true);

  return (
    <div>
      <Sidebar open={open} setOpen={setOpen} />

      {/* PAGE CONTENT */}
      <div
        style={{
          marginLeft: open ? 220 : 60,
          padding: 20,
          transition: "0.3s"
        }}
      >
        <Navbar open={open} setOpen={setOpen} />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/vehicle-log" element={<VehicleLog />} />
            <Route path="/anpr-raw" element={<ANPRRaw />} />
          <Route path="/daily-graph" element={<DailyGraph />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
