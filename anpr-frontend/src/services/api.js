const API = "http://localhost:5000/api";

export const getLive = async () => {
  const r = await fetch(`${API}/live`);
  return r.json();
};

export const getStats = async () => {
  const r = await fetch(`${API}/dashboard`);
  return r.json();
};

export const getDetections = async () => {
  const r = await fetch(`${API}/detections`);
  return r.json();
};

export const getDailyStats = async () => {
  const r = await fetch(`${API}/daily`);
  return r.json();
};
