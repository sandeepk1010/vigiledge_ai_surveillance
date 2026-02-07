import React from "react";

export default function StatCard({ camera = "unknown", total = 0, today = 0 }) {
  const initials = camera
    .split(/[^A-Za-z0-9]/)
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="stat-card">
      <div className="stat-avatar">{initials || "C"}</div>
      <div className="stat-body">
        <div className="stat-title">{camera}</div>
        <div className="stat-values">
          <div className="stat-total">{total}</div>
          <div className="stat-today">today {today}</div>
        </div>
      </div>
    </div>
  );
}
