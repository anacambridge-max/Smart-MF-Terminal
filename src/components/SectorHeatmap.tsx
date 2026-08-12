"use client";

import type { ScoredSector } from "@/lib/types";
interface Props { sectors: ScoredSector[]; onSectorClick: (key: string) => void; compact?: boolean; }

function tile(change: number) {
  if (change >= 3) return "bg-emerald-950/80 border-emerald-700/60";
  if (change >= 1) return "bg-emerald-950/55 border-emerald-800/50";
  if (change >= 0) return "bg-[#0c1717] border-emerald-950";
  if (change > -1) return "bg-[#171413] border-terminal-border";
  if (change > -3) return "bg-red-950/50 border-red-900/50";
  return "bg-red-950/80 border-red-800/60";
}
function trend(label: string) { return label.includes("Bullish") ? "● Bullish" : label.includes("Neutral") ? "● Neutral" : "● Bearish"; }

export default function SectorHeatmap({ sectors, onSectorClick, compact = false }: Props) {
  const filtered = sectors.filter(s => s.category !== "defensive").sort((a,b) => a.todayChange - b.todayChange);
  return (
    <section className="glass-card rounded-xl p-4">
      <div className="flex items-center justify-between mb-4"><div><div className="flex items-center gap-2"><span className="text-cyan-400">◈</span><h2 className="text-sm font-bold uppercase tracking-[.12em] text-terminal-text">Sector Heatmap</h2></div><p className="text-[9px] text-terminal-text-muted mt-1">Daily move · momentum · opportunity score</p></div><span className="text-[9px] text-terminal-text-muted uppercase">Live snapshot</span></div>
      <div className={`grid gap-2 ${compact ? "grid-cols-2" : "grid-cols-2 md:grid-cols-3 lg:grid-cols-5"}`}>
        {filtered.map(s => <button key={s.sectorKey} onClick={() => onSectorClick(s.sectorKey)} className={`heatmap-tile rounded-lg p-3 border text-left ${tile(s.todayChange)}`}>
          <div className="flex items-center justify-between gap-2"><p className="text-[9px] uppercase tracking-wider text-terminal-text-dim truncate">{s.sectorName}</p><span className="text-[8px] text-terminal-text-muted">{s.opportunityScore}</span></div>
          <p className={`text-xl font-bold font-mono mt-1 ${s.todayChange >= 0 ? "text-terminal-green" : "text-terminal-red"}`}>{s.todayChange >= 0 ? "+" : ""}{s.todayChange.toFixed(2)}%</p>
          {!compact && <div className="mt-3 space-y-1 text-[9px]"><div className="flex justify-between"><span className="text-terminal-text-muted">1W</span><span className={s.weekChange >= 0 ? "text-terminal-green" : "text-terminal-red"}>{s.weekChange >= 0 ? "+" : ""}{s.weekChange.toFixed(1)}%</span></div><div className="flex justify-between"><span className="text-terminal-text-muted">1M</span><span className={s.monthChange >= 0 ? "text-terminal-green" : "text-terminal-red"}>{s.monthChange >= 0 ? "+" : ""}{s.monthChange.toFixed(1)}%</span></div><div className="flex justify-between"><span className="text-terminal-text-muted">3M</span><span className={s.threeMonthChange >= 0 ? "text-terminal-green" : "text-terminal-red"}>{s.threeMonthChange >= 0 ? "+" : ""}{s.threeMonthChange.toFixed(1)}%</span></div><div className="flex justify-between pt-1 mt-1 border-t border-white/5"><span className="text-terminal-text-muted">Trend</span><span className={s.bullBearLabel.includes("Bullish") ? "text-terminal-green" : s.bullBearLabel.includes("Neutral") ? "text-terminal-yellow" : "text-terminal-red"}>{trend(s.bullBearLabel)}</span></div></div>}
          {compact && <div className="flex items-center justify-between mt-2 text-[9px]"><span className={s.bullBearLabel.includes("Bullish") ? "text-terminal-green" : s.bullBearLabel.includes("Neutral") ? "text-terminal-yellow" : "text-terminal-red"}>{trend(s.bullBearLabel)}</span><span className="text-blue-400 font-mono">{s.opportunityScore}/100</span></div>}
        </button>)}
      </div>
      <div className="flex flex-wrap items-center gap-3 mt-4 pt-3 border-t border-terminal-border text-[8px] uppercase tracking-wider text-terminal-text-muted"><span>Legend</span><span className="inline-flex items-center gap-1"><i className="w-2.5 h-2.5 rounded bg-red-800/70" /> &lt;-3%</span><span className="inline-flex items-center gap-1"><i className="w-2.5 h-2.5 rounded bg-red-950/70" /> -1 to -3%</span><span className="inline-flex items-center gap-1"><i className="w-2.5 h-2.5 rounded bg-[#171413]" /> ~0%</span><span className="inline-flex items-center gap-1"><i className="w-2.5 h-2.5 rounded bg-emerald-950/70" /> +1 to +3%</span><span className="inline-flex items-center gap-1"><i className="w-2.5 h-2.5 rounded bg-emerald-800/70" /> &gt;+3%</span></div>
    </section>
  );
}
