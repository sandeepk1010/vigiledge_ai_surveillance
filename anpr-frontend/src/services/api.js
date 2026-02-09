const API = "http://localhost:5000";

export async function getLive() {
  const res = await fetch(API + "/api/live");
  return res.json();
}

export async function getStats() {
  const res = await fetch(API + "/api/stats");
  return res.json();
}

export const getDetections = async () => {
  const res = await fetch(
    `http://localhost:5000/api/detections?nocache=${Date.now()}`
  );
  return res.json();
};





