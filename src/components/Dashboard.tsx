"use client";

import { useState, useEffect, useCallback } from "react";
import HeaderBar from "./HeaderBar";
import HeroOpportunity from "./HeroOpportunity";
import SectorHeatmap from "./SectorHeatmap";
import TopLosersTable from "./TopLosersTable";
import DecisionEngine from "./DecisionEngine";
import PortfolioView from "./PortfolioView";
import SectorDetail from "./SectorDetail";
import SettingsPanel from "./SettingsPanel";
import ActionBadge from "./ActionBadge";
import type { ScoredSector, MarketApiResponse } from "@/lib/types";

const TABS = [
  { key: "dashboard", label: "Dashboard", icon: "▦", hint: "Overview" },
  { key: "scanner", label: "Opportunity Scanner", icon: "⌕", hint: "Biggest falls" },
  { key: "heatmap", label: "Sector Heatmap", icon: "◈", hint: "Market breadth" },
  { key: "portfolio", label: "Portfolio", icon: "▣", hint: "Allocation" },
  { key: "report", label: "2:30 PM Report", icon: "◷", hint: "Decision engine" },
  { key: "settings", label: "Settings", icon: "⚙", hint: "Controls" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

function AvoidPanel({ items, onSectorClick }: { items: ScoredSector[]; onSectorClick: (key: string) => void }) {
  return <section className="glass-card rounded-xl p-4"><div className="flex items-center justify-between mb-3"><div><h2 className="text-xs font-bold uppercase tracking-[.12em] text-terminal-red">Avoid / High-Risk List</h2><p className="text-[9px] text-terminal-text-muted mt-1">Live risk and trend filter — not a valuation call.</p></div><span className="text-[9px] text-terminal-text-muted">{items.length} flagged</span></div><div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">{items.map(s => <button key={s.sectorKey} onClick={() => onSectorClick(s.sectorKey)} className="flex items-center justify-between gap-3 rounded-lg border border-terminal-border bg-terminal-bg/50 px-3 py-2 text-left hover:border-red-500/30"><div className="min-w-0"><p className="text-xs font-semibold text-terminal-text truncate">{s.sectorName}</p><p className="text-[9px] text-terminal-text-muted">Risk {s.riskScore} · B/B {s.bullBearScore} · {s.todayChange.toFixed(2)}%</p></div><ActionBadge action="AVOID" /></button>)}</div></section>;
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabKey>("dashboard");
  const [data, setData] = useState<MarketApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSector, setSelectedSector] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const fetchData = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    try {
      setError(null);
      const res = await fetch(`/api/market?ts=${Date.now()}`, { cache: "no-store", headers: { "Cache-Control": "no-cache" } });
      const json = await res.json();
      if (!res.ok || json?.ok === false) throw new Error(json?.error || "Live market data unavailable");
      setData(json);
    } catch (e) { console.error("Failed to fetch live market data", e); setError(e instanceof Error ? e.message : "Live market data unavailable"); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchData(); const interval = setInterval(() => fetchData(), 60000); return () => clearInterval(interval); }, [fetchData]);
  const handleSectorClick = (key: string) => setSelectedSector(key);

  if (loading && !data) return <div className="min-h-screen flex items-center justify-center bg-terminal-bg terminal-grid"><div className="text-center"><div className="w-11 h-11 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" /><p className="text-terminal-text-dim text-sm">Loading validated live market + NAV engine…</p></div></div>;
  if (!data) return <div className="min-h-screen flex items-center justify-center bg-terminal-bg"><div className="text-center px-5"><p className="text-terminal-red font-bold tracking-widest mb-3">LIVE DATA UNAVAILABLE</p><p className="text-terminal-text-muted text-sm mb-5">{error || "The terminal could not validate current market and fund data."}</p><button onClick={() => fetchData(true)} disabled={refreshing} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold disabled:opacity-50">{refreshing ? "Refreshing…" : "↻ Refresh Live Data"}</button></div></div>;

  if (selectedSector) { const sector = data.sectors.find((s: ScoredSector) => s.sectorKey === selectedSector); if (sector) return <div className="min-h-screen bg-terminal-bg"><HeaderBar data={data} onRefresh={() => fetchData(true)} refreshing={refreshing} /><div className="max-w-7xl mx-auto px-4 lg:px-6 py-5"><button onClick={() => setSelectedSector(null)} className="text-blue-400 hover:text-blue-300 text-xs font-semibold mb-4">← BACK TO TERMINAL</button><SectorDetail sector={sector} allSectors={data.sectors} /></div></div>; }

  return <div className="min-h-screen bg-terminal-bg terminal-grid">
    <HeaderBar data={data} onRefresh={() => fetchData(true)} refreshing={refreshing} />
    <nav className="sticky top-0 z-40 border-b border-terminal-border bg-[#0a1019]/95 backdrop-blur-xl"><div className="max-w-[1600px] mx-auto px-4 lg:px-6"><button className="md:hidden w-full py-3 text-xs font-semibold text-terminal-text flex items-center justify-between" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}><span>{TABS.find(t => t.key === activeTab)?.icon} {TABS.find(t => t.key === activeTab)?.label}</span><span className="text-terminal-text-muted">{mobileMenuOpen ? "▲" : "▼"}</span></button><div className={`${mobileMenuOpen ? "flex" : "hidden"} md:flex overflow-x-auto`}>{TABS.map(tab => <button key={tab.key} onClick={() => { setActiveTab(tab.key); setMobileMenuOpen(false); }} className={`group relative flex items-center gap-2 px-4 lg:px-5 py-3.5 text-[11px] font-semibold whitespace-nowrap transition-colors border-b-2 ${activeTab === tab.key ? "border-blue-500 text-blue-400 bg-blue-500/[.035]" : "border-transparent text-terminal-text-muted hover:text-terminal-text-dim"}`}><span className="text-sm">{tab.icon}</span><span>{tab.label}</span><span className="hidden xl:inline text-[8px] uppercase tracking-wider opacity-40">{tab.hint}</span></button>)}</div></div></nav>
    <div className="border-b border-terminal-border bg-[#0d141f]/90"><div className="max-w-[1600px] mx-auto px-4 lg:px-6 py-2 flex items-center justify-center gap-2 text-[10px] sm:text-[11px]"><span className="text-terminal-yellow">⚠</span><span className="font-bold text-terminal-yellow">Largest Fall ≠ Automatic Buy</span><span className="text-terminal-text-muted">•</span><span className="text-terminal-text-muted">Largest Fall → Investigate → Score → Decide</span></div></div>
    {error && <div className="max-w-[1600px] mx-auto px-4 lg:px-6 pt-3"><div className="border border-terminal-yellow/30 bg-terminal-yellow/[.04] rounded-lg px-3 py-2 text-[10px] text-terminal-yellow flex items-center justify-between gap-3"><span>⚠ Latest refresh failed. Showing the last validated snapshot.</span><button onClick={() => fetchData(true)} className="underline font-semibold">Retry</button></div></div>}
    <main className="max-w-[1600px] mx-auto px-4 lg:px-6 py-5">
      {activeTab === "dashboard" && <div className="space-y-5 fade-in"><HeroOpportunity data={data} onSectorClick={handleSectorClick} /><div className="grid grid-cols-1 xl:grid-cols-3 gap-5"><div className="xl:col-span-2"><TopLosersTable losers={data.topLosers} onSectorClick={handleSectorClick} compact /></div><SectorHeatmap sectors={data.sectors} onSectorClick={handleSectorClick} compact /></div><DecisionEngine data={data} onSectorClick={handleSectorClick} compact /><AvoidPanel items={data.avoidList || []} onSectorClick={handleSectorClick} /></div>}
      {activeTab === "scanner" && <div className="fade-in"><TopLosersTable losers={data.topLosers} onSectorClick={handleSectorClick} /></div>}
      {activeTab === "heatmap" && <div className="fade-in"><SectorHeatmap sectors={data.sectors} onSectorClick={handleSectorClick} /></div>}
      {activeTab === "portfolio" && <div className="fade-in"><PortfolioView sectors={data.sectors} /></div>}
      {activeTab === "report" && <div className="fade-in"><DecisionEngine data={data} onSectorClick={handleSectorClick} /></div>}
      {activeTab === "settings" && <div className="fade-in"><SettingsPanel /></div>}
    </main>
    <footer className="border-t border-terminal-border mt-8 py-4"><div className="max-w-[1600px] mx-auto px-4 text-center text-[9px] uppercase tracking-wider text-terminal-text-muted">Smart MF Terminal · NSE live index data · Yahoo technical history · MFAPI live NAV/history · Equity MF NAV cutoff: 3:00 PM IST · Liquid/overnight follow applicable cut-off rules · Decision support only · Not financial advice</div></footer>
  </div>;
}
