"use client";

import { useState } from "react";
import type { MarketApiResponse, ScoredSector } from "@/lib/types";
import ScoreGauge from "./ScoreGauge";
import ActionBadge from "./ActionBadge";
import ChangeIndicator from "./ChangeIndicator";

interface Props {
  data: MarketApiResponse;
  onSectorClick: (key: string) => void;
  compact?: boolean;
}

interface Allocation {
  sectorKey: string;
  sectorName: string;
  opportunityScore: number;
  todayChange: number;
  action: string;
  recommendedFund: string;
  allocatedAmount: number;
}

interface AllocResult {
  allocations: Allocation[];
  holdCash: boolean;
  message?: string;
  totalAmount: number;
  allocatedAmount: number;
  reserveAmount: number;
}

export default function DecisionEngine({ data, onSectorClick, compact = false }: Props) {
  const [investmentAmount, setInvestmentAmount] = useState(10000);
  const [allocation, setAllocation] = useState<AllocResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAllocate = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/allocate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: investmentAmount }),
      });
      const json = await res.json();
      setAllocation(json);
    } catch {
      console.error("Allocation failed");
    } finally {
      setLoading(false);
    }
  };

  const opportunities = data.topOpportunities;
  const now = new Date();
  const timeStr = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="glass-card rounded-xl p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">⏰</span>
          <h2 className="text-sm font-semibold text-terminal-text uppercase tracking-wider">
            2:30 PM Mutual Fund Opportunity Report
          </h2>
        </div>
        <span className="text-[10px] text-terminal-text-muted font-mono">Generated at {timeStr}</span>
      </div>

      {/* Alerts */}
      <div className="flex flex-wrap gap-2 mb-6">
        {opportunities.filter(s => Math.abs(s.todayChange) > 3).map(s => (
          <div key={s.sectorKey + "-alert-correction"} className="px-3 py-1.5 bg-red-900/20 border border-red-800/30 rounded-lg text-xs">
            <span className="mr-1">🔥</span>
            <span className="text-terminal-red font-medium">BIG CORRECTION</span>
            <span className="text-terminal-text-muted ml-1">— {s.sectorName} {s.todayChange.toFixed(2)}%</span>
          </div>
        ))}
        {opportunities.filter(s => s.opportunityScore >= 75 && s.action !== "AVOID").map(s => (
          <div key={s.sectorKey + "-alert-buy"} className="px-3 py-1.5 bg-green-900/20 border border-green-800/30 rounded-lg text-xs">
            <span className="mr-1">🟢</span>
            <span className="text-terminal-green font-medium">BUY OPPORTUNITY</span>
            <span className="text-terminal-text-muted ml-1">— {s.sectorName} (Score: {s.opportunityScore})</span>
          </div>
        ))}
        {opportunities.filter(s => s.todayChange < -2 && s.bullBearScore < 40).map(s => (
          <div key={s.sectorKey + "-alert-trap"} className="px-3 py-1.5 bg-yellow-900/20 border border-yellow-800/30 rounded-lg text-xs">
            <span className="mr-1">⚠️</span>
            <span className="text-terminal-yellow font-medium">VALUE TRAP RISK</span>
            <span className="text-terminal-text-muted ml-1">— {s.sectorName}</span>
          </div>
        ))}
      </div>

      {/* Top 5 Opportunities */}
      <h3 className="text-xs font-semibold text-terminal-text-muted uppercase tracking-wider mb-3">
        Top {Math.min(5, opportunities.length)} Opportunities Today
      </h3>
      
      <div className={`grid gap-4 ${compact ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1 md:grid-cols-2 xl:grid-cols-3"}`}>
        {opportunities.slice(0, compact ? 3 : 5).map((s, i) => (
          <div
            key={s.sectorKey}
            className="bg-terminal-bg/50 rounded-lg border border-terminal-border p-4 hover:border-terminal-accent/30 transition-colors cursor-pointer"
            onClick={() => onSectorClick(s.sectorKey)}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <span className="text-terminal-text-muted text-[10px]">#{i + 1}</span>
                <h4 className="text-sm font-bold text-terminal-text">{s.sectorName}</h4>
              </div>
              <ActionBadge action={s.action} />
            </div>

            <div className="flex items-center gap-2 mb-3">
              <span className="text-terminal-text-muted text-xs">Today:</span>
              <ChangeIndicator value={s.todayChange} className="text-sm font-bold" />
            </div>

            <div className="grid grid-cols-3 gap-2 mb-3">
              <ScoreGauge score={s.technicalScore} label="Tech" size={48} />
              <ScoreGauge score={s.bullBearScore} label="B/B" size={48} />
              <ScoreGauge score={s.valuationScore} label="Val" size={48} />
            </div>

            <div className="grid grid-cols-2 gap-y-1 text-[10px] mb-3">
              <div className="flex justify-between pr-2">
                <span className="text-terminal-text-muted">Correction</span>
                <span className="text-terminal-text font-mono">{s.correctionScore}/100</span>
              </div>
              <div className="flex justify-between pl-2">
                <span className="text-terminal-text-muted">Fall Quality</span>
                <span className="text-terminal-text font-mono">{s.fallQualityScore}/100</span>
              </div>
              <div className="flex justify-between pr-2">
                <span className="text-terminal-text-muted">Reason</span>
                <span className="text-terminal-text font-mono">{s.reasonScore}/100</span>
              </div>
              <div className="flex justify-between pl-2">
                <span className="text-terminal-text-muted">Risk</span>
                <span className={`font-mono ${s.riskScore > 60 ? "text-terminal-red" : s.riskScore > 30 ? "text-terminal-yellow" : "text-terminal-green"}`}>
                  {s.riskScore > 60 ? "High" : s.riskScore > 30 ? "Moderate" : "Low"}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-terminal-border/50">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-terminal-text-muted uppercase">Opportunity Score</span>
                <span className="text-lg font-bold text-terminal-accent font-mono">{s.opportunityScore}<span className="text-xs text-terminal-text-muted">/100</span></span>
              </div>
              <p className="text-[10px] text-terminal-accent truncate">{s.recommendedFund}</p>
            </div>

            {!compact && (
              <div className="mt-3 pt-2 border-t border-terminal-border/50">
                <p className="text-[10px] text-terminal-text-muted uppercase mb-1">Reason: {s.reasonCategory}</p>
                <p className="text-[10px] text-terminal-text-dim leading-relaxed">{s.explanation.slice(0, 150)}...</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Investment Allocation */}
      <div className="mt-6 pt-6 border-t border-terminal-border">
        <h3 className="text-xs font-semibold text-terminal-text-muted uppercase tracking-wider mb-3">
          Daily Investment Allocation
        </h3>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-terminal-text">₹</span>
            <input
              type="number"
              value={investmentAmount}
              onChange={e => setInvestmentAmount(Number(e.target.value))}
              className="w-32 bg-terminal-bg border border-terminal-border rounded-lg px-3 py-2 text-sm font-mono text-terminal-text focus:outline-none focus:border-terminal-accent"
            />
          </div>
          <button
            onClick={handleAllocate}
            disabled={loading}
            className="px-4 py-2 bg-terminal-accent hover:bg-terminal-accent-dim text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? "Calculating..." : "Calculate Allocation"}
          </button>
        </div>

        {allocation && (
          <div className="bg-terminal-bg/50 rounded-lg border border-terminal-border p-4">
            {allocation.holdCash ? (
              <div className="text-center py-4">
                <p className="text-terminal-yellow font-medium">💰 Hold Cash</p>
                <p className="text-xs text-terminal-text-muted mt-1">{allocation.message}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {allocation.allocations.map(a => (
                  <div key={a.sectorKey} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <ActionBadge action={a.action} />
                      <div>
                        <p className="text-sm text-terminal-text">{a.sectorName}</p>
                        <p className="text-[10px] text-terminal-accent truncate max-w-[250px]">{a.recommendedFund}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-terminal-text font-mono">₹{a.allocatedAmount.toLocaleString("en-IN")}</p>
                      <p className="text-[10px] text-terminal-text-muted">Score: {a.opportunityScore}</p>
                    </div>
                  </div>
                ))}
                <div className="pt-3 border-t border-terminal-border flex justify-between text-xs">
                  <span className="text-terminal-text-muted">Reserve (Cash)</span>
                  <span className="text-terminal-yellow font-mono">₹{allocation.reserveAmount.toLocaleString("en-IN")}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
