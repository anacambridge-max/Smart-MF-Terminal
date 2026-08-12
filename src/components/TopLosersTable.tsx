"use client";

import type { ScoredSector } from "@/lib/types";
import ChangeIndicator from "./ChangeIndicator";
import ScoreGauge from "./ScoreGauge";
import ActionBadge from "./ActionBadge";

interface Props { losers: ScoredSector[]; onSectorClick: (key: string) => void; compact?: boolean; }

export default function TopLosersTable({ losers, onSectorClick, compact = false }: Props) {
  return (
    <section className="glass-card rounded-xl p-4 overflow-hidden">
      <div className="flex items-end justify-between gap-3 mb-4"><div><div className="flex items-center gap-2"><span className="text-terminal-red">↘</span><h2 className="text-sm font-bold uppercase tracking-[.12em] text-terminal-text">Top {losers.length} Nifty Losers Today</h2></div><p className="text-[9px] text-terminal-text-muted mt-1">Sorted by largest fall · investigate before buying</p></div><span className="text-[9px] uppercase tracking-wider text-terminal-text-muted">Scanner</span></div>
      <div className="overflow-x-auto -mx-4"><table className="w-full min-w-[920px] text-[10px]">
        <thead><tr className="border-y border-terminal-border bg-[#090f18] text-terminal-text-muted uppercase tracking-wider"><th className="text-left py-2.5 px-3">#</th><th className="text-left py-2.5 px-3">Index / Sector</th><th className="text-right py-2.5 px-3">Level</th><th className="text-right py-2.5 px-3">Today</th>{!compact && <><th className="text-right py-2.5 px-3">1W</th><th className="text-right py-2.5 px-3">1M</th><th className="text-right py-2.5 px-3">3M</th><th className="text-right py-2.5 px-3">52W DD</th></>}<th className="text-center py-2.5 px-3">Tech</th><th className="text-center py-2.5 px-3">B/B</th>{!compact && <th className="text-center py-2.5 px-3">Reason</th>}<th className="text-center py-2.5 px-3">Opp</th>{!compact && <th className="text-left py-2.5 px-3">MF Match</th>}<th className="text-center py-2.5 px-3">Action</th></tr></thead>
        <tbody>{losers.map((s,i) => { const dd = ((s.high52w - s.currentLevel) / Math.max(s.high52w,1))*100; return <tr key={s.sectorKey} onClick={() => onSectorClick(s.sectorKey)} className="border-b border-terminal-border/70 hover:bg-blue-500/[.035] cursor-pointer transition-colors">
          <td className="py-3 px-3 text-terminal-text-muted font-mono">{i+1}</td><td className="py-3 px-3"><p className="font-semibold text-terminal-text">{s.sectorName}</p><p className="text-[8px] text-terminal-text-muted">{s.role}</p></td><td className="py-3 px-3 text-right font-mono text-terminal-text">{s.currentLevel.toLocaleString("en-IN")}</td><td className="py-3 px-3 text-right"><ChangeIndicator value={s.todayChange} className="font-semibold" /></td>
          {!compact && <><td className="py-3 px-3 text-right"><ChangeIndicator value={s.weekChange} /></td><td className="py-3 px-3 text-right"><ChangeIndicator value={s.monthChange} /></td><td className="py-3 px-3 text-right"><ChangeIndicator value={s.threeMonthChange} /></td><td className="py-3 px-3 text-right text-terminal-red font-mono">-{dd.toFixed(1)}%</td></>}
          <td className="py-3 px-3"><div className="flex justify-center"><ScoreGauge score={s.technicalScore} size={34} showLabel={false} /></div></td><td className="py-3 px-3"><div className="flex justify-center"><ScoreGauge score={s.bullBearScore} size={34} showLabel={false} /></div></td>{!compact && <td className="py-3 px-3 text-center font-mono text-terminal-text-dim">{s.reasonScore}</td>}<td className="py-3 px-3"><div className="flex justify-center"><ScoreGauge score={s.opportunityScore} size={34} showLabel={false} /></div></td>{!compact && <td className="py-3 px-3 max-w-[210px]"><p className="text-[9px] text-blue-400 truncate">{s.recommendedFund}</p></td>}<td className="py-3 px-3 text-center"><ActionBadge action={s.action} /></td>
        </tr>;})}</tbody>
      </table></div>
    </section>
  );
}
