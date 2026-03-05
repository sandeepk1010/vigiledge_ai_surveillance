const host = (typeof window !== 'undefined' && window.location && window.location.hostname) ? window.location.hostname : 'localhost';
export const API = process.env.REACT_APP_API_HOST || `http://${host}:5000`;

export async function getLive() {
  const res = await fetch(API + "/api/live");
  return res.json();
}

export async function getStats() {
  const res = await fetch(API + "/api/stats");
  return res.json();
}

export async function getDailyCounts(days = 7) {
  const res = await fetch(`${API}/api/detections/daily?days=${days}`);
  return res.json();
}

export async function getCameras() {
  const res = await fetch(API + "/api/cameras");
  return res.json();
}

export async function getDetections(options = {}) {
  const {
    page = 1,
    limit = 50,
    camera = null,
    plate = null,
    startDate = null,
    endDate = null
  } = options;

  let url = `${API}/api/detections?page=${page}&limit=${limit}`;
  
  if (camera) url += `&camera=${encodeURIComponent(camera)}`;
  if (plate) url += `&plate=${encodeURIComponent(plate)}`;
  if (startDate) url += `&startDate=${encodeURIComponent(startDate)}`;
  if (endDate) url += `&endDate=${encodeURIComponent(endDate)}`;

  const res = await fetch(url);
  return res.json();
}

export async function searchDetections(query) {
  if (!query || query.trim().length < 2) {
    throw new Error("Search query must be at least 2 characters");
  }

  const res = await fetch(`${API}/api/detections/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) {
    throw new Error("Search failed");
  }
  return res.json();
}

export async function fetchImage(detectionId, filename, imageType) {
  const res = await fetch(`${API}/api/fetch-image`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ detectionId, filename, imageType })
  });
  return res.json();
}





