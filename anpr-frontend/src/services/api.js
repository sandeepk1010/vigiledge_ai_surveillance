const API = "http://localhost:5000";

export const getDetections = () =>
  fetch(`${API}/api/detections`).then(res => res.json());

export const getDailyStats = () =>
  fetch(`${API}/api/detections/daily`).then(res => res.json());
