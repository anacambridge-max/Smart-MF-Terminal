"use client";

import type { ScoredSector } from "@/lib/types";
import ChangeIndicator from "./ChangeIndicator";
import ScoreGauge from "./ScoreGauge";
import ActionBadge from "./ActionBadge";

interface Props {
  sector: ScoredSector;
  allSectors: ScoredSector[];
}

export default function SectorDetail({ sector: s }: Props) {
  const from52wHigh = ((s.high52w - s.currentLevel) / s.high52w * 100);
  const priceVs50dma = ((s.currentLevel - s.dma50) / s.dma50 * 100);
  const priceVs200dma = ((s.currentLevel - s.dma200) / s.dma200 * 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card rounded-xl p-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <p className="text-terminal-text-muted text-xs">{s.fullName}</p>
            <h1 className="text-2xl font-bold text-terminal-text">{s.sectorName}</h1>
            <p className="text-terminal-text-muted text-xs mt-1">{s.role} • {s.category.toUpperCase()}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-2xl font-bold font-mono text-terminal-text">{s.currentLevel.toLocaleString("en-IN")}</p>
              <ChangeIndicator value={s.todayChange} className="text-lg font-bold" />
            </div>
            <ActionBadge action={s.action} large />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Overview */}
        <div className="glass-card rounded-xl p-4">
          <h3 className="text-xs font-semibold text-terminal-text-muted uppercase tracking-wider mb-3">Overview</h3>
          <div className="space-y-2">
            {[
              { label: "Today", value: s.todayChange },
              { label: "1 Week", value: s.weekChange },
              { label: "1 Month", value: s.monthChange },
              { label: "3 Month", value: s.threeMonthChange },
              { label: "6 Month", value: s.sixMonthChange },
              { label: "1 Year", value: s.yearChange },
            ].map(item => (
              <div key={item.label} className="flex justify-between items-center">
                <span className="text-xs text-terminal-text-muted">{item.label}</span>
                <ChangeIndicator value={item.value} className="text-xs" />
              </div>
            ))}
            <div className="pt-2 border-t border-terminal-border">
              <div className="flex justify-between items-center">
                <span className="text-xs text-terminal-text-muted">52W High</span>
                <span className="text-xs font-mono text-terminal-text">{s.high52w.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-terminal-text-muted">52W Low</span>
                <span className="text-xs font-mono text-terminal-text">{s.low52w.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-terminal-text-muted">From 52W High</span>
                <span className="text-xs font-mono text-terminal-red">-{from52wHigh.toFixed(2)}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-terminal-text-muted">Day Range</span>
                <span className="text-xs font-mono text-terminal-text">{s.dayLow.toLocaleString("en-IN")} – {s.dayHigh.toLocaleString("en-IN")}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Technical Analysis */}
        <div className="glass-card rounded-xl p-4">
          <h3 className="text-xs font-semibold text-terminal-text-muted uppercase tracking-wider mb-3">Technical Indicators</h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-terminal-text-muted">RSI (14)</span>
              <span className={`font-mono ${s.rsi14 < 30 ? "text-terminal-green" : s.rsi14 > 70 ? "text-terminal-red" : "text-terminal-text"}`}>
                {s.rsi14.toFixed(1)} {s.rsi14 < 30 ? "Oversold" : s.rsi14 > 70 ? "Overbought" : ""}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-terminal-text-muted">MACD</span>
              <span className={`font-mono ${s.macd > 0 ? "text-terminal-green" : "text-terminal-red"}`}>{s.macd.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-terminal-text-muted">MACD Signal</span>
              <span className="font-mono text-terminal-text">{s.macdSignal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-terminal-text-muted">MACD Histogram</span>
              <span className={`font-mono ${s.macdHistogram > 0 ? "text-terminal-green" : "text-terminal-red"}`}>{s.macdHistogram.toFixed(2)}</span>
            </div>
            <div className="pt-2 border-t border-terminal-border">
              <div className="flex justify-between">
                <span className="text-terminal-text-muted">20 DMA</span>
                <span className="font-mono text-terminal-text">{s.dma20.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-terminal-text-muted">50 DMA</span>
                <span className="font-mono text-terminal-text">{s.dma50.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-terminal-text-muted">100 DMA</span>
                <span className="font-mono text-terminal-text">{s.dma100.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-terminal-text-muted">200 DMA</span>
                <span className="font-mono text-terminal-text">{s.dma200.toLocaleString("en-IN")}</span>
              </div>
            </div>
            <div className="pt-2 border-t border-terminal-border">
              <div className="flex justify-between">
                <span className="text-terminal-text-muted">Price vs 50 DMA</span>
                <span className={`font-mono ${priceVs50dma >= 0 ? "text-terminal-green" : "text-terminal-red"}`}>
                  {priceVs50dma >= 0 ? "+" : ""}{priceVs50dma.toFixed(2)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-terminal-text-muted">Price vs 200 DMA</span>
                <span className={`font-mono ${priceVs200dma >= 0 ? "text-terminal-green" : "text-terminal-red"}`}>
                  {priceVs200dma >= 0 ? "+" : ""}{priceVs200dma.toFixed(2)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-terminal-text-muted">ADX</span>
                <span className="font-mono text-terminal-text">{s.adx.toFixed(1)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-terminal-text-muted">Volume Trend</span>
                <span className="font-mono text-terminal-text capitalize">{s.volumeTrend}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Scores */}
        <div className="glass-card rounded-xl p-4">
          <h3 className="text-xs font-semibold text-terminal-text-muted uppercase tracking-wider mb-3">Opportunity Analysis</h3>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <ScoreGauge score={s.opportunityScore} label="Opportunity" size={64} />
            <ScoreGauge score={s.correctionScore} label="Correction" size={64} />
            <ScoreGauge score={s.technicalScore} label="Technical" size={64} />
            <ScoreGauge score={s.bullBearScore} label="Bull/Bear" size={64} />
            <ScoreGauge score={s.valuationScore} label="Valuation" size={64} />
            <ScoreGauge score={s.fallQualityScore} label="Fall Quality" size={64} />
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-terminal-text-muted">Bull/Bear Status</span>
              <span className="font-medium">{getBullBearEmoji(s.bullBearLabel)} {s.bullBearLabel}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-terminal-text-muted">Historical Percentile</span>
              <span className="font-mono text-terminal-cyan">{s.historicalPercentile}th</span>
            </div>
            <div className="flex justify-between">
              <span className="text-terminal-text-muted">Reason Score</span>
              <span className="font-mono text-terminal-text">{s.reasonScore}/100</span>
            </div>
            <div className="flex justify-between">
              <span className="text-terminal-text-muted">Market Breadth</span>
              <span className="font-mono text-terminal-text">{s.marketBreadthScore}/100</span>
            </div>
            <div className="flex justify-between">
              <span className="text-terminal-text-muted">Risk Score</span>
              <span className={`font-mono ${s.riskScore > 60 ? "text-terminal-red" : s.riskScore > 30 ? "text-terminal-yellow" : "text-terminal-green"}`}>
                {s.riskScore}/100 ({s.riskScore > 60 ? "High" : s.riskScore > 30 ? "Moderate" : "Low"})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Reason for Fall */}
      <div className="glass-card rounded-xl p-4">
        <h3 className="text-xs font-semibold text-terminal-text-muted uppercase tracking-wider mb-3">
          Why Did It Fall? — {s.reasonCategory}
        </h3>
        <p className="text-sm text-terminal-text-dim leading-relaxed">{s.reasonForFall}</p>

        <div className="mt-4 p-4 bg-terminal-bg/50 rounded-lg border border-terminal-border">
          <h4 className="text-xs font-semibold text-terminal-accent mb-2">AI Analysis</h4>
          <p className="text-sm text-terminal-text-dim leading-relaxed">{s.explanation}</p>
        </div>
      </div>

      {/* Recommended Fund */}
      <div className="glass-card rounded-xl p-4">
        <h3 className="text-xs font-semibold text-terminal-text-muted uppercase tracking-wider mb-3">Recommended Fund</h3>
        <div className="bg-terminal-bg/50 rounded-lg border border-terminal-border p-4">
          <p className="text-base font-medium text-terminal-accent">{s.recommendedFund}</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-xs">
            <div>
              <p className="text-terminal-text-muted">AMC</p>
              <p className="text-terminal-text">{s.fundAMC}</p>
            </div>
            <div>
              <p className="text-terminal-text-muted">Expense Ratio</p>
              <p className="text-terminal-text">{s.expenseRatio}%</p>
            </div>
            <div>
              <p className="text-terminal-text-muted">AUM</p>
              <p className="text-terminal-text">₹{s.aumCr.toLocaleString("en-IN")} Cr</p>
            </div>
            <div>
              <p className="text-terminal-text-muted">Type</p>
              <p className="text-terminal-green">Direct Growth</p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-terminal-border">
            <p className="text-[10px] text-terminal-text-muted">Target Portfolio Weight: {s.targetWeight}%</p>
          </div>
        </div>
      </div>

      {/* Historical Analysis */}
      <div className="glass-card rounded-xl p-4">
        <h3 className="text-xs font-semibold text-terminal-text-muted uppercase tracking-wider mb-3">Historical Correction Analysis</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-terminal-bg/50 rounded-lg border border-terminal-border p-3">
            <p className="text-[10px] text-terminal-text-muted uppercase">Today&apos;s Fall</p>
            <ChangeIndicator value={s.todayChange} className="text-lg font-bold" />
          </div>
          <div className="bg-terminal-bg/50 rounded-lg border border-terminal-border p-3">
            <p className="text-[10px] text-terminal-text-muted uppercase">Historical Percentile</p>
            <p className="text-lg font-bold font-mono text-terminal-cyan">{s.historicalPercentile}th</p>
          </div>
          <div className="bg-terminal-bg/50 rounded-lg border border-terminal-border p-3">
            <p className="text-[10px] text-terminal-text-muted uppercase">From 52W High</p>
            <p className="text-lg font-bold font-mono text-terminal-red">-{from52wHigh.toFixed(1)}%</p>
          </div>
          <div className="bg-terminal-bg/50 rounded-lg border border-terminal-border p-3">
            <p className="text-[10px] text-terminal-text-muted uppercase">Correction Score</p>
            <p className="text-lg font-bold font-mono text-terminal-accent">{s.correctionScore}/100</p>
          </div>
        </div>
        <p className="text-xs text-terminal-text-dim mt-3">
          Today&apos;s decline of {Math.abs(s.todayChange).toFixed(2)}% is larger than approximately {s.historicalPercentile}% of historical daily declines for this sector.
        </p>
      </div>
    </div>
  );
}

function getBullBearEmoji(label: string): string {
  if (label.includes("Strong Bullish")) return "🟢";
  if (label.includes("Bullish")) return "🟢";
  if (label.includes("Neutral")) return "🟡";
  return "🔴";
}
