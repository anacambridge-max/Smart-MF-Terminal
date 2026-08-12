"use client";

import { useState, useEffect } from "react";

interface SettingsData {
  dailyInvestmentAmount: string;
  riskTolerance: string;
  minOpportunityScore: string;
  minCorrectionPct: string;
  maxSectorAllocation: string;
  directGrowthOnly: string;
  rebalancingThreshold: string;
  scoringWeights: string;
}

const DEFAULT_SETTINGS: SettingsData = {
  dailyInvestmentAmount: "10000",
  riskTolerance: "moderate",
  minOpportunityScore: "50",
  minCorrectionPct: "1",
  maxSectorAllocation: "25",
  directGrowthOnly: "true",
  rebalancingThreshold: "5",
  scoringWeights: JSON.stringify({ correction: 20, technical: 20, bullBear: 20, valuation: 15, reasonForFall: 10, historicalCorrection: 10, marketBreadth: 5 }),
};

export default function SettingsPanel() {
  const [settings, setSettings] = useState<SettingsData>(DEFAULT_SETTINGS);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [weights, setWeights] = useState({ correction: 20, technical: 20, bullBear: 20, valuation: 15, reasonForFall: 10, historicalCorrection: 10, marketBreadth: 5 });

  useEffect(() => {
    fetch("/api/settings")
      .then(r => r.json())
      .then(data => {
        setSettings(data);
        try {
          setWeights(JSON.parse(data.scoringWeights));
        } catch { /* ignore */ }
      })
      .catch(console.error);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...settings,
          scoringWeights: JSON.stringify(weights),
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      console.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const totalWeight = Object.values(weights).reduce((s, w) => s + w, 0);

  return (
    <div className="glass-card rounded-xl p-6 max-w-3xl">
      <div className="flex items-center gap-2 mb-6">
        <span className="text-lg">⚙️</span>
        <h2 className="text-sm font-semibold text-terminal-text uppercase tracking-wider">Settings</h2>
      </div>

      <div className="space-y-6">
        {/* Investment Settings */}
        <div>
          <h3 className="text-xs font-semibold text-terminal-text-muted uppercase tracking-wider mb-3">Investment Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-terminal-text-muted block mb-1">Daily Investment Amount (₹)</label>
              <input
                type="number"
                value={settings.dailyInvestmentAmount}
                onChange={e => setSettings(s => ({ ...s, dailyInvestmentAmount: e.target.value }))}
                className="w-full bg-terminal-bg border border-terminal-border rounded-lg px-3 py-2 text-sm font-mono text-terminal-text focus:outline-none focus:border-terminal-accent"
              />
            </div>
            <div>
              <label className="text-xs text-terminal-text-muted block mb-1">Risk Tolerance</label>
              <select
                value={settings.riskTolerance}
                onChange={e => setSettings(s => ({ ...s, riskTolerance: e.target.value }))}
                className="w-full bg-terminal-bg border border-terminal-border rounded-lg px-3 py-2 text-sm text-terminal-text focus:outline-none focus:border-terminal-accent"
              >
                <option value="conservative">Conservative</option>
                <option value="moderate">Moderate</option>
                <option value="aggressive">Aggressive</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-terminal-text-muted block mb-1">Min Opportunity Score</label>
              <input
                type="number"
                value={settings.minOpportunityScore}
                onChange={e => setSettings(s => ({ ...s, minOpportunityScore: e.target.value }))}
                className="w-full bg-terminal-bg border border-terminal-border rounded-lg px-3 py-2 text-sm font-mono text-terminal-text focus:outline-none focus:border-terminal-accent"
              />
            </div>
            <div>
              <label className="text-xs text-terminal-text-muted block mb-1">Min Correction % Threshold</label>
              <input
                type="number"
                step="0.1"
                value={settings.minCorrectionPct}
                onChange={e => setSettings(s => ({ ...s, minCorrectionPct: e.target.value }))}
                className="w-full bg-terminal-bg border border-terminal-border rounded-lg px-3 py-2 text-sm font-mono text-terminal-text focus:outline-none focus:border-terminal-accent"
              />
            </div>
            <div>
              <label className="text-xs text-terminal-text-muted block mb-1">Max Sector Allocation (%)</label>
              <input
                type="number"
                value={settings.maxSectorAllocation}
                onChange={e => setSettings(s => ({ ...s, maxSectorAllocation: e.target.value }))}
                className="w-full bg-terminal-bg border border-terminal-border rounded-lg px-3 py-2 text-sm font-mono text-terminal-text focus:outline-none focus:border-terminal-accent"
              />
            </div>
            <div>
              <label className="text-xs text-terminal-text-muted block mb-1">Rebalancing Threshold (%)</label>
              <input
                type="number"
                value={settings.rebalancingThreshold}
                onChange={e => setSettings(s => ({ ...s, rebalancingThreshold: e.target.value }))}
                className="w-full bg-terminal-bg border border-terminal-border rounded-lg px-3 py-2 text-sm font-mono text-terminal-text focus:outline-none focus:border-terminal-accent"
              />
            </div>
          </div>

          <div className="mt-3 flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs text-terminal-text cursor-pointer">
              <input
                type="checkbox"
                checked={settings.directGrowthOnly === "true"}
                onChange={e => setSettings(s => ({ ...s, directGrowthOnly: e.target.checked ? "true" : "false" }))}
                className="rounded border-terminal-border bg-terminal-bg"
              />
              Direct Growth Only
            </label>
          </div>
        </div>

        {/* Scoring Weights */}
        <div>
          <h3 className="text-xs font-semibold text-terminal-text-muted uppercase tracking-wider mb-3">
            Opportunity Score Weights
            <span className={`ml-2 font-mono ${totalWeight === 100 ? "text-terminal-green" : "text-terminal-red"}`}>
              (Total: {totalWeight}%)
            </span>
          </h3>
          <div className="space-y-3">
            {([
              { key: "correction" as const, label: "Daily/Recent Correction" },
              { key: "technical" as const, label: "Technical Analysis" },
              { key: "bullBear" as const, label: "Bull/Bear Trend" },
              { key: "valuation" as const, label: "Valuation/Discount" },
              { key: "reasonForFall" as const, label: "Reason for Fall" },
              { key: "historicalCorrection" as const, label: "Historical Correction" },
              { key: "marketBreadth" as const, label: "Market Breadth" },
            ]).map(item => (
              <div key={item.key} className="flex items-center gap-3">
                <span className="text-xs text-terminal-text w-48">{item.label}</span>
                <input
                  type="range"
                  min="0"
                  max="40"
                  value={weights[item.key]}
                  onChange={e => setWeights(w => ({ ...w, [item.key]: parseInt(e.target.value) }))}
                  className="flex-1 h-1.5 bg-terminal-border rounded-lg appearance-none cursor-pointer accent-terminal-accent"
                />
                <span className="text-xs font-mono text-terminal-text w-10 text-right">{weights[item.key]}%</span>
              </div>
            ))}
          </div>

          <div className="mt-3 p-3 bg-terminal-bg/50 rounded-lg border border-terminal-border text-[10px] text-terminal-text-muted">
            <strong>Note:</strong> Correction weight has the highest visual priority but does NOT dominate the final score.
            A sector falling 8% should not automatically receive a Buy rating.
          </div>
        </div>

        {/* Save */}
        <div className="flex items-center gap-3 pt-4 border-t border-terminal-border">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-terminal-accent hover:bg-terminal-accent-dim text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Settings"}
          </button>
          {saved && <span className="text-xs text-terminal-green">✓ Settings saved</span>}
        </div>
      </div>
    </div>
  );
}
