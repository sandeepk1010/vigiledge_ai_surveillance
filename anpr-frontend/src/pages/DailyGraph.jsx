import { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import { getDailyStats } from "../services/api";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
);

function DailyGraph() {
  const [stats, setStats] = useState([]);

  useEffect(() => {
    getDailyStats().then(setStats);
  }, []);

  const data = {
    labels: stats.map(s => s.date),
    datasets: [
      {
        label: "Vehicles per day",
        data: stats.map(s => s.count),
        backgroundColor: "rgba(54, 162, 235, 0.6)",
        borderRadius: 5
      }
    ]
  };

  return (
    <div style={{ width: "90%", margin: "20px auto" }}>
      <h3>Daily Vehicle Graph</h3>
      <Bar data={data} />
    </div>
  );
}

export default DailyGraph;
