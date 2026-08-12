"use client";

import { useState, useEffect } from "react";
import type { ScoredSector } from "@/lib/types";
import { SECTORS } from "@/lib/sectors";

interface PortfolioData {
  holdings: Array<{
    sectorKey: string;
    sectorName: string;
    role: string;
    category: string;
    targetWeight: number;
    investedAmount: number;
    currentValue: number;
    actualWeight: number;
    deviation: number;
    status: string;
    fundName: string;
  }>;
  totalInvested: number;
  totalCurrentValue: number;
  absoluteReturn: number;
  returnPct: number;
  todayPnL: number;
}

interface Props {
  sectors: ScoredSector[];
}

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  core: { label: "CORE", color: "text-terminal-accent" },
  sector: { label: "SECTOR / TACTICAL", color: "text-terminal-purple" },
  defensive: { label: "DEFENSIVE", color: "text-terminal-yellow" },
};

export default function PortfolioView({ sectors }: Props) {
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [addingFund, setAddingFund] = useState<string | null>(null);
  const [investAmount, setInvestAmount] = useState("");

  useEffect(() => {
    fetch("/api/portfolio").then(r => r.json()).then(setPortfolio).catch(console.error);
  }, []);

  const handleAddInvestment = async (sectorKey: string) => {
    const amt = parseFloat(investAmount);
    if (!amt || amt <= 0) return;
    const sector = SECTORS.find(s => s.key === sectorKey);
    await fetch("/api/portfolio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sectorKey, investedAmount: amt, fundName: sector?.recommendedFund }),
    });
    setAddingFund(null);
    setInvestAmount("");
    const res = await fetch("/api/portfolio");
    setPortfolio(await res.json());
  };

  // Build display data from SECTORS defaults if portfolio is empty
  const displayData = portfolio?.holdings && portfolio.holdings.length > 0
    ? portfolio.holdings
    : SECTORS.map(s => ({
        sectorKey: s.key,
        sectorName: s.name,
        role: s.role,
        category: s.category,
        targetWeight: s.targetWeight,
        investedAmount: 0,
        currentValue: 0,
        actualWeight: 0,
        deviation: -s.targetWeight,
        status: "UNDERWEIGHT",
        fundName: s.recommendedFund,
      }));

  const totalInvested = portfolio?.totalInvested || 0;
  const totalValue = portfolio?.totalCurrentValue || 0;
  const absoluteReturn = portfolio?.absoluteReturn || 0;

  const categories = ["core", "sector", "defensive"] as const;

  return (
    <div className="space-y-6">
      {/* Portfolio Summary */}
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">💼</span>
          <h2 className="text-sm font-semibold text-terminal-text uppercase tracking-wider">My Long-Term Portfolio</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-terminal-bg/50 rounded-lg border border-terminal-border p-3">
            <p className="text-[10px] text-terminal-text-muted uppercase">Invested</p>
            <p className="text-lg font-bold font-mono text-terminal-text">₹{totalInvested.toLocaleString("en-IN")}</p>
          </div>
          <div className="bg-terminal-bg/50 rounded-lg border border-terminal-border p-3">
            <p className="text-[10px] text-terminal-text-muted uppercase">Current Value</p>
            <p className="text-lg font-bold font-mono text-terminal-text">₹{totalValue.toLocaleString("en-IN")}</p>
          </div>
          <div className="bg-terminal-bg/50 rounded-lg border border-terminal-border p-3">
            <p className="text-[10px] text-terminal-text-muted uppercase">Returns</p>
            <p className={`text-lg font-bold font-mono ${absoluteReturn >= 0 ? "text-terminal-green" : "text-terminal-red"}`}>
              {absoluteReturn >= 0 ? "+" : ""}₹{Math.abs(absoluteReturn).toLocaleString("en-IN")}
            </p>
          </div>
          <div className="bg-terminal-bg/50 rounded-lg border border-terminal-border p-3">
            <p className="text-[10px] text-terminal-text-muted uppercase">Return %</p>
            <p className={`text-lg font-bold font-mono ${(portfolio?.returnPct || 0) >= 0 ? "text-terminal-green" : "text-terminal-red"}`}>
              {(portfolio?.returnPct || 0).toFixed(2)}%
            </p>
          </div>
          <div className="bg-terminal-bg/50 rounded-lg border border-terminal-border p-3">
            <p className="text-[10px] text-terminal-text-muted uppercase">Today&apos;s P&L</p>
            <p className="text-lg font-bold font-mono text-terminal-text-dim">₹0</p>
          </div>
        </div>

        {/* Donut Chart Visualization */}
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="lg:w-1/3">
            <p className="text-xs text-terminal-text-muted uppercase mb-3">Target Allocation</p>
            <div className="flex items-center justify-center">
              <svg viewBox="0 0 200 200" width="200" height="200">
                {(() => {
                  let cumulative = 0;
                  const colors = ["#3b82f6", "#6366f1", "#8b5cf6", "#a855f7", "#06b6d4", "#22c55e", "#84cc16", "#eab308", "#f59e0b", "#f97316", "#ef4444", "#ec4899", "#14b8a6", "#10b981", "#64748b", "#94a3b8", "#475569"];
                  return SECTORS.map((s, i) => {
                    const pct = s.targetWeight / 100;
                    const startAngle = cumulative * 360;
                    const endAngle = (cumulative + pct) * 360;
                    cumulative += pct;
                    const start = polarToCartesian(100, 100, 80, startAngle);
                    const end = polarToCartesian(100, 100, 80, endAngle);
                    const largeArc = pct > 0.5 ? 1 : 0;
                    const d = `M 100 100 L ${start.x} ${start.y} A 80 80 0 ${largeArc} 1 ${end.x} ${end.y} Z`;
                    return <path key={s.key} d={d} fill={colors[i % colors.length]} opacity="0.8" stroke="#0a0e17" strokeWidth="1" />;
                  });
                })()}
                <circle cx="100" cy="100" r="50" fill="#0a0e17" />
                <text x="100" y="95" textAnchor="middle" fill="#e2e8f0" fontSize="12" fontWeight="bold">TARGET</text>
                <text x="100" y="112" textAnchor="middle" fill="#94a3b8" fontSize="9">100%</text>
              </svg>
            </div>
          </div>

          {/* Allocation Table */}
          <div className="lg:w-2/3 overflow-x-auto">
            {categories.map(cat => {
              const catItems = displayData.filter(h => h.category === cat);
              const { label, color } = CATEGORY_LABELS[cat];
              return (
                <div key={cat} className="mb-4">
                  <h3 className={`text-xs font-semibold ${color} uppercase tracking-wider mb-2`}>{label}</h3>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-terminal-border text-terminal-text-muted">
                        <th className="text-left py-1.5 px-2 font-medium">Sector</th>
                        <th className="text-right py-1.5 px-2 font-medium">Target</th>
                        <th className="text-right py-1.5 px-2 font-medium">Actual</th>
                        <th className="text-right py-1.5 px-2 font-medium">Invested</th>
                        <th className="text-right py-1.5 px-2 font-medium">Value</th>
                        <th className="text-center py-1.5 px-2 font-medium">Status</th>
                        <th className="text-center py-1.5 px-2 font-medium">Add</th>
                      </tr>
                    </thead>
                    <tbody>
                      {catItems.map(h => (
                        <tr key={h.sectorKey} className="border-b border-terminal-border/30 hover:bg-terminal-card-hover">
                          <td className="py-2 px-2">
                            <p className="text-terminal-text">{h.sectorName}</p>
                            <p className="text-[10px] text-terminal-text-muted truncate max-w-[200px]">{h.fundName}</p>
                          </td>
                          <td className="py-2 px-2 text-right font-mono text-terminal-text">{h.targetWeight}%</td>
                          <td className="py-2 px-2 text-right font-mono text-terminal-text">{h.actualWeight.toFixed(1)}%</td>
                          <td className="py-2 px-2 text-right font-mono text-terminal-text">₹{h.investedAmount.toLocaleString("en-IN")}</td>
                          <td className="py-2 px-2 text-right font-mono text-terminal-text">₹{h.currentValue.toLocaleString("en-IN")}</td>
                          <td className="py-2 px-2 text-center">
                            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                              h.status === "OVERWEIGHT" ? "bg-red-900/30 text-terminal-red" :
                              h.status === "UNDERWEIGHT" ? "bg-yellow-900/30 text-terminal-yellow" :
                              "bg-green-900/30 text-terminal-green"
                            }`}>
                              {h.status}
                            </span>
                          </td>
                          <td className="py-2 px-2 text-center">
                            {addingFund === h.sectorKey ? (
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  value={investAmount}
                                  onChange={e => setInvestAmount(e.target.value)}
                                  placeholder="₹"
                                  className="w-20 bg-terminal-bg border border-terminal-border rounded px-1.5 py-0.5 text-[10px] font-mono text-terminal-text focus:outline-none focus:border-terminal-accent"
                                />
                                <button
                                  onClick={() => handleAddInvestment(h.sectorKey)}
                                  className="text-[10px] px-1.5 py-0.5 bg-terminal-accent text-white rounded hover:bg-terminal-accent-dim"
                                >
                                  ✓
                                </button>
                                <button
                                  onClick={() => setAddingFund(null)}
                                  className="text-[10px] px-1.5 py-0.5 text-terminal-text-muted"
                                >
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setAddingFund(h.sectorKey)}
                                className="text-[10px] text-terminal-accent hover:text-terminal-accent/80"
                              >
                                + Add
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
        </div>

        {/* Rebalancing */}
        <div className="mt-6 pt-4 border-t border-terminal-border">
          <h3 className="text-xs font-semibold text-terminal-text-muted uppercase tracking-wider mb-2">Rebalancing Alerts</h3>
          <div className="space-y-1">
            {displayData
              .filter(h => Math.abs(h.deviation) > 5)
              .map(h => (
                <div key={h.sectorKey} className="flex items-center gap-2 text-xs">
                  <span className={h.deviation > 0 ? "text-terminal-red" : "text-terminal-yellow"}>
                    {h.deviation > 0 ? "⬆️" : "⬇️"}
                  </span>
                  <span className="text-terminal-text">{h.sectorName}</span>
                  <span className="text-terminal-text-muted">Target: {h.targetWeight}%</span>
                  <span className="text-terminal-text-muted">Actual: {h.actualWeight.toFixed(1)}%</span>
                  <span className={`font-medium ${h.deviation > 0 ? "text-terminal-red" : "text-terminal-yellow"}`}>
                    {h.status}
                  </span>
                </div>
              ))}
            {displayData.filter(h => Math.abs(h.deviation) > 5).length === 0 && (
              <p className="text-xs text-terminal-text-muted">No significant deviations detected.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(angleRad), y: cy + r * Math.sin(angleRad) };
}
