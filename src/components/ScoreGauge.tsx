"use client";

interface ScoreGaugeProps {
  score: number;
  size?: number;
  label?: string;
  showLabel?: boolean;
  className?: string;
}

export default function ScoreGauge({ score, size = 64, label, showLabel = true, className = "" }: ScoreGaugeProps) {
  const pct = Math.max(0, Math.min(100, score));
  const color = pct >= 80 ? "#22c55e" : pct >= 60 ? "#3b82f6" : pct >= 40 ? "#f59e0b" : pct >= 20 ? "#f97316" : "#ef4444";
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (pct / 100) * circumference;

  return (
    <div className={`flex flex-col items-center gap-1 ${className}`}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#1e293b" strokeWidth="4" />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={color} strokeWidth="4" strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{ transition: "stroke-dashoffset 0.5s ease" }}
        />
        <text
          x={size / 2} y={size / 2}
          textAnchor="middle" dominantBaseline="central"
          fill={color} fontSize={size * 0.28} fontWeight="bold"
          transform={`rotate(90, ${size / 2}, ${size / 2})`}
        >
          {Math.round(pct)}
        </text>
      </svg>
      {showLabel && label && (
        <span className="text-[10px] text-terminal-text-muted uppercase tracking-wider">{label}</span>
      )}
    </div>
  );
}
