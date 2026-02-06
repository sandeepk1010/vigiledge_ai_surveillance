const API_URL = "http://localhost:5000";

export async function fetchDetections() {
  const res = await fetch(`${API_URL}/api/detections`);
  return res.json();
}
