"use client";

import type { MarketApiResponse, ScoredSector } from "@/lib/types";
import ChangeIndicator from "./ChangeIndicator";
import ScoreGauge from "./ScoreGauge";
import ActionBadge from "./ActionBadge";

interface Props {
  data: MarketApiResponse;
  onSectorClick: (key: string) => void;
}

export default function HeroOpportunity({ data, onSectorClick }: Props) {
  const top = data.topOpportunities[0];
  if (!top) return null;

  const from52wHigh = ((top.high52w - top.currentLevel) / top.high52w * 100).toFixed(1);

  return (
    <div className="glass-card rounded-xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-terminal-yellow text-lg">💎</span>
        <h2 className="text-sm font-semibold text-terminal-text uppercase tracking-wider">Today&apos;s Mutual Fund Opportunity</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main opportunity */}
        <div className="lg:col-span-5">
          <button onClick={() => onSectorClick(top.sectorKey)} className="text-left w-full group">
            <p className="text-terminal-text-muted text-xs mb-1">{top.fullName}</p>
            <h3 className="text-2xl font-bold text-terminal-text group-hover:text-terminal-accent transition-colors">{top.sectorName}</h3>
            <div className="flex items-baseline gap-3 mt-2">
              <span className="text-3xl font-bold font-mono">
                <ChangeIndicator value={top.todayChange} className="text-3xl" showArrow={false} />
              </span>
              <span className="text-terminal-text-dim text-sm font-mono">{top.currentLevel.toLocaleString("en-IN")}</span>
            </div>
          </button>

          <div className="mt-4">
            <ActionBadge action={top.action} large />
          </div>

          <div className="grid grid-cols-3 gap-3 mt-5">
            <div>
              <p className="text-[10px] text-terminal-text-muted uppercase">Day Low</p>
              <p className="text-xs font-mono text-terminal-text">{top.dayLow.toLocaleString("en-IN")}</p>
            </div>
            <div>
              <p className="text-[10px] text-terminal-text-muted uppercase">1 Week</p>
              <ChangeIndicator value={top.weekChange} className="text-xs" />
            </div>
            <div>
              <p className="text-[10px] text-terminal-text-muted uppercase">1 Month</p>
              <ChangeIndicator value={top.monthChange} className="text-xs" />
            </div>
            <div>
              <p className="text-[10px] text-terminal-text-muted uppercase">3 Month</p>
              <ChangeIndicator value={top.threeMonthChange} className="text-xs" />
            </div>
            <div>
              <p className="text-[10px] text-terminal-text-muted uppercase">52W High</p>
              <p className="text-xs font-mono text-terminal-text">{top.high52w.toLocaleString("en-IN")}</p>
            </div>
            <div>
              <p className="text-[10px] text-terminal-text-muted uppercase">From 52W High</p>
              <p className="text-xs font-mono text-terminal-red">-{from52wHigh}%</p>
            </div>
          </div>

          <div className="mt-4 p-3 bg-terminal-bg/50 rounded-lg border border-terminal-border">
            <p className="text-[10px] text-terminal-text-muted uppercase mb-1">Historical Correction Percentile</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-terminal-border rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-terminal-green to-terminal-cyan rounded-full"
                  style={{ width: `${top.historicalPercentile}%` }}
                />
              </div>
              <span className="text-sm font-bold font-mono text-terminal-cyan">{top.historicalPercentile}th</span>
            </div>
          </div>
        </div>

        {/* Score gauges */}
        <div className="lg:col-span-4">
          <div className="grid grid-cols-3 gap-4">
            <ScoreGauge score={top.opportunityScore} label="Opportunity" size={72} />
            <ScoreGauge score={top.correctionScore} label="Correction" size={72} />
            <ScoreGauge score={top.technicalScore} label="Technical" size={72} />
            <ScoreGauge score={top.bullBearScore} label="Bull/Bear" size={72} />
            <ScoreGauge score={top.valuationScore} label="Valuation" size={72} />
            <ScoreGauge score={top.fallQualityScore} label="Fall Quality" size={72} />
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className="text-xs text-terminal-text-muted">Risk:</span>
            <div className="flex-1 h-1.5 bg-terminal-border rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${top.riskScore > 60 ? "bg-terminal-red" : top.riskScore > 30 ? "bg-terminal-yellow" : "bg-terminal-green"}`}
                style={{ width: `${top.riskScore}%` }}
              />
            </div>
            <span className="text-xs font-mono text-terminal-text-dim">{top.riskScore}/100</span>
          </div>
        </div>

        {/* Recommended Fund */}
        <div className="lg:col-span-3">
          <div className="bg-terminal-bg/50 rounded-lg border border-terminal-border p-4 h-full">
            <p className="text-[10px] text-terminal-text-muted uppercase tracking-wider mb-2">Recommended Fund</p>
            <p className="text-sm font-medium text-terminal-accent leading-snug">{top.recommendedFund}</p>
            <div className="mt-3 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-terminal-text-muted">AMC</span>
                <span className="text-terminal-text">{top.fundAMC}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-terminal-text-muted">Expense Ratio</span>
                <span className="text-terminal-text">{top.expenseRatio}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-terminal-text-muted">AUM</span>
                <span className="text-terminal-text">₹{top.aumCr.toLocaleString("en-IN")} Cr</span>
              </div>
              <div className="flex justify-between">
                <span className="text-terminal-text-muted">Type</span>
                <span className="text-terminal-green text-[10px]">Direct Growth</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-terminal-border">
              <p className="text-[10px] text-terminal-text-muted uppercase mb-1">Reason: {top.reasonCategory}</p>
              <p className="text-xs text-terminal-text-dim leading-relaxed">{top.reasonForFall.slice(0, 120)}...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
