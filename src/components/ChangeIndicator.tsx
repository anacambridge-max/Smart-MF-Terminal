"use client";

interface ChangeIndicatorProps {
  value: number;
  suffix?: string;
  className?: string;
  showArrow?: boolean;
}

export default function ChangeIndicator({ value, suffix = "%", className = "", showArrow = true }: ChangeIndicatorProps) {
  const isPositive = value > 0;
  const isZero = value === 0;
  const color = isZero ? "text-terminal-text-muted" : isPositive ? "text-terminal-green" : "text-terminal-red";
  const arrow = isPositive ? "▲" : isZero ? "–" : "▼";

  return (
    <span className={`font-mono ${color} ${className}`}>
      {showArrow && <span className="mr-0.5 text-[10px]">{arrow}</span>}
      {isPositive ? "+" : ""}{value.toFixed(2)}{suffix}
    </span>
  );
}
