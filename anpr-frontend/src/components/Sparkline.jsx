import React from "react";

export default function Sparkline({ data = [1, 3, 2, 4, 3, 5], width = 240, height = 80, color = '#88c' } ) {
  const max = Math.max(...data, 1);
  const min = Math.min(...data);
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / (max - min || 1)) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg className="sparkline" width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <polyline fill="none" stroke={color} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" points={points} />
    </svg>
  );
}
