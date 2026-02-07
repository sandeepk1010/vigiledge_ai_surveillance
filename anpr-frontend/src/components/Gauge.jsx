import React from "react";

export default function Gauge({ value = 60, label = "Score" }) {
  // value: 0-100
  const angle = (value / 100) * 180; // half-circle

  return (
    <div className="gauge">
      <div className="gauge-face">
        <div
          className="gauge-needle"
          style={{ transform: `rotate(${angle}deg)` }}
        />
        <div className="gauge-center" />
      </div>
      <div className="gauge-meta">
        <div className="gauge-label">{label}</div>
        <div className="gauge-value">{value}/100</div>
      </div>
    </div>
  );
}
