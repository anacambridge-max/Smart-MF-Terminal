"use client";

import type { MarketApiResponse, ScoredSector } from "@/lib/types";
import ChangeIndicator from "./ChangeIndicator";
import ScoreGauge from "./ScoreGauge";
import ActionBadge from "./ActionBadge";

interface Props { data: MarketApiResponse; onSectorClick: (key: string) => void; }
function riskLabel(score: number) { return score > 60 ? "High" : score > 30 ? "Moderate" : "Low"; }

function OpportunityCard({ item, rank, onClick }: { item: ScoredSector; rank: number; onClick: () => void }) {
  const fund = item.fundLive;
  return (
    <button onClick={onClick} className="glass-card rounded-xl p-4 text-left w-full group hover:border-blue-500/40 transition-all hover:-translate-y-0.5">
      <div className="flex items-start justify-between gap-3">
        <div><p className="text-[9px] font-mono text-terminal-text-muted mb-1">#{rank}</p><h3 className="text-[16px] font-bold text-terminal-text group-hover:text-blue-400 transition-colors">{item.sectorName}</h3></div>
        <ActionBadge action={item.action} />
      </div>
      <div className="flex items-baseline gap-2 mt-2"><ChangeIndicator value={item.todayChange} className="text-lg font-bold" showArrow={false} /><span className="text-[10px] text-terminal-text-muted font-mono">{item.currentLevel.toLocaleString("en-IN")}</span></div>

      <div className="grid grid-cols-3 gap-2 mt-4">
        <div className="rounded-lg bg-[#080e17] border border-terminal-border p-2 text-center"><ScoreGauge score={item.technicalScore} size={42} showLabel={false} /><p className="text-[8px] uppercase tracking-wider text-terminal-text-muted mt-1">Tech</p></div>
        <div className="rounded-lg bg-[#080e17] border border-terminal-border p-2 text-center"><ScoreGauge score={item.bullBearScore} size={42} showLabel={false} /><p className="text-[8px] uppercase tracking-wider text-terminal-text-muted mt-1">B/B</p></div>
        <div className="rounded-lg bg-[#080e17] border border-terminal-border p-2 text-center"><ScoreGauge score={item.valuationScore} size={42} showLabel={false} /><p className="text-[8px] uppercase tracking-wider text-terminal-text-muted mt-1">Val</p></div>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-4 text-[10px]">
        <div className="flex justify-between"><span className="text-terminal-text-muted">Correction</span><span className="font-mono text-terminal-text">{item.correctionScore}/100</span></div>
        <div className="flex justify-between"><span className="text-terminal-text-muted">Fall Quality</span><span className="font-mono text-terminal-text">{item.fallQualityScore}/100</span></div>
        <div className="flex justify-between"><span className="text-terminal-text-muted">Reason</span><span className="font-mono text-terminal-text">{item.reasonScore}/100</span></div>
        <div className="flex justify-between"><span className="text-terminal-text-muted">Risk</span><span className={`${item.riskScore > 60 ? "text-terminal-red" : item.riskScore > 30 ? "text-terminal-yellow" : "text-terminal-green"} font-semibold`}>{riskLabel(item.riskScore)}</span></div>
      </div>

      <div className="mt-4 pt-3 border-t border-terminal-border flex items-end justify-between gap-3"><div className="min-w-0"><p className="text-[8px] uppercase tracking-wider text-terminal-text-muted">Opportunity Score</p><p className="text-xl font-bold font-mono text-blue-400">{item.opportunityScore}<span className="text-[10px] text-terminal-text-muted">/100</span></p></div><div className="text-right min-w-0"><p className="text-[8px] uppercase tracking-wider text-terminal-text-muted">Live MF NAV</p><p className="text-[10px] text-terminal-text font-mono">{fund ? `₹${fund.nav.toFixed(4)}` : "—"}</p><p className="text-[8px] text-terminal-text-muted">{fund ? `${fund.navDate} · 1Y ${fund.return1y.toFixed(1)}%` : "NAV unavailable"}</p></div></div>
      <p className="mt-2 text-[9px] text-blue-400 truncate">{item.recommendedFund}</p>
    </button>
  );
}

export default function HeroOpportunity({ data, onSectorClick }: Props) {
  const opportunities = data.topOpportunities.slice(0, 5);
  if (!opportunities.length) return null;
  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-3 px-1">
        <div><div className="flex items-center gap-2"><span className="text-terminal-yellow">◉</span><h2 className="text-sm font-bold uppercase tracking-[.12em] text-terminal-text">Today&apos;s Mutual Fund Opportunity Report</h2></div><p className="text-[10px] text-terminal-text-muted mt-1">Ranked by correction + fall quality + technicals + valuation + reason for fall</p></div>
        <div className="text-[9px] text-terminal-text-muted uppercase tracking-wider">Top 5 opportunities · {data.dataMode || "live snapshot"}</div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{opportunities.map((item, index) => <OpportunityCard key={item.sectorKey} item={item} rank={index + 1} onClick={() => onSectorClick(item.sectorKey)} />)}</div>
    </section>
  );
}
