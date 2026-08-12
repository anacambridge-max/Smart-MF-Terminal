"use client";

import type { ScoredSector } from "@/lib/types";

interface Props {
  sectors: ScoredSector[];
  onSectorClick: (key: string) => void;
  compact?: boolean;
}

function getHeatColor(change: number): string {
  if (change >= 3) return "bg-green-800/80 border-green-600/50";
  if (change >= 2) return "bg-green-900/70 border-green-700/40";
  if (change >= 1) return "bg-green-950/60 border-green-800/30";
  if (change >= 0.3) return "bg-green-950/40 border-green-900/20";
  if (change >= -0.3) return "bg-terminal-card border-terminal-border";
  if (change >= -1) return "bg-red-950/40 border-red-900/20";
  if (change >= -2) return "bg-red-950/60 border-red-800/30";
  if (change >= -3) return "bg-red-900/70 border-red-700/40";
  return "bg-red-800/80 border-red-600/50";
}

function getBullBearIcon(label: string): string {
  if (label.includes("Strong Bullish")) return "🟢";
  if (label.includes("Bullish")) return "🟢";
  if (label.includes("Neutral")) return "🟡";
  if (label.includes("Strong Bearish")) return "🔴";
  return "🔴";
}

export default function SectorHeatmap({ sectors, onSectorClick, compact = false }: Props) {
  const filtered = sectors.filter(s => s.category !== "defensive");

  return (
    <div className="glass-card rounded-xl p-4">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">🗺️</span>
        <h2 className="text-sm font-semibold text-terminal-text uppercase tracking-wider">Sector Heatmap</h2>
      </div>

      <div className={`grid gap-2 ${compact ? "grid-cols-2 lg:grid-cols-3" : "grid-cols-2 md:grid-cols-3 lg:grid-cols-5"}`}>
        {filtered
          .sort((a, b) => a.todayChange - b.todayChange)
          .map(s => (
            <button
              key={s.sectorKey}
              onClick={() => onSectorClick(s.sectorKey)}
              className={`heatmap-tile rounded-lg p-3 border text-left transition-all ${getHeatColor(s.todayChange)} hover:ring-1 hover:ring-terminal-accent/30`}
            >
              <p className="text-[10px] text-terminal-text-muted uppercase tracking-wide truncate">{s.sectorName}</p>
              <p className={`text-lg font-bold font-mono ${s.todayChange >= 0 ? "text-terminal-green" : "text-terminal-red"}`}>
                {s.todayChange >= 0 ? "+" : ""}{s.todayChange.toFixed(2)}%
              </p>
              {!compact && (
                <div className="mt-2 space-y-0.5 text-[10px]">
                  <div className="flex justify-between">
                    <span className="text-terminal-text-muted">1W</span>
                    <span className={s.weekChange >= 0 ? "text-terminal-green" : "text-terminal-red"}>
                      {s.weekChange >= 0 ? "+" : ""}{s.weekChange.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-terminal-text-muted">1M</span>
                    <span className={s.monthChange >= 0 ? "text-terminal-green" : "text-terminal-red"}>
                      {s.monthChange >= 0 ? "+" : ""}{s.monthChange.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-terminal-text-muted">3M</span>
                    <span className={s.threeMonthChange >= 0 ? "text-terminal-green" : "text-terminal-red"}>
                      {s.threeMonthChange >= 0 ? "+" : ""}{s.threeMonthChange.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between mt-1 pt-1 border-t border-terminal-border/30">
                    <span className="text-terminal-text-muted">Score</span>
                    <span className="text-terminal-accent font-medium">{s.opportunityScore}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-terminal-text-muted">Trend</span>
                    <span>{getBullBearIcon(s.bullBearLabel)} {s.bullBearLabel.split(" ").pop()}</span>
                  </div>
                </div>
              )}
              {compact && (
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] text-terminal-text-muted">{getBullBearIcon(s.bullBearLabel)}</span>
                  <span className="text-[10px] text-terminal-accent font-mono">{s.opportunityScore}/100</span>
                </div>
              )}
            </button>
          ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 mt-4 text-[10px] text-terminal-text-muted">
        <span>Legend:</span>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-red-800/80 border border-red-600/50" />
          <span>{"< -3%"}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-red-950/60 border border-red-800/30" />
          <span>-1% to -3%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-terminal-card border border-terminal-border" />
          <span>~0%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-green-950/60 border border-green-800/30" />
          <span>+1% to +3%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-green-800/80 border border-green-600/50" />
          <span>{"> +3%"}</span>
        </div>
      </div>
    </div>
  );
}
