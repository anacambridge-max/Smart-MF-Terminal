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
import type { ScoredSector, MarketApiResponse } from "@/lib/types";

const TABS = [
  { key: "dashboard", label: "Dashboard", icon: "📊" },
  { key: "scanner", label: "Opportunity Scanner", icon: "🔍" },
  { key: "heatmap", label: "Sector Heatmap", icon: "🗺️" },
  { key: "portfolio", label: "Portfolio", icon: "💼" },
  { key: "report", label: "2:30 PM Report", icon: "⏰" },
  { key: "settings", label: "Settings", icon: "⚙️" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

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
      const res = await fetch(`/api/market?ts=${Date.now()}`, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });
      const json = await res.json();
      if (!res.ok || json?.ok === false) {
        throw new Error(json?.error || "Live market data unavailable");
      }
      setData(json);
    } catch (e) {
      console.error("Failed to fetch live market data", e);
      setError(e instanceof Error ? e.message : "Live market data unavailable");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(), 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleSectorClick = (key: string) => setSelectedSector(key);

  if (loading && !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-terminal-bg">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-terminal-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-terminal-text-dim text-sm">Loading latest NSE market data...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-terminal-bg">
        <div className="text-center px-5">
          <p className="text-terminal-red mb-3">LIVE DATA UNAVAILABLE</p>
          <p className="text-terminal-text-muted text-sm mb-5">{error || "The dashboard refused to use simulated or stale market values."}</p>
          <button onClick={() => fetchData(true)} disabled={refreshing} className="px-4 py-2 rounded-lg bg-terminal-accent text-white text-sm font-semibold disabled:opacity-50">
            {refreshing ? "Refreshing…" : "↻ Refresh Live Data"}
          </button>
        </div>
      </div>
    );
  }

  if (selectedSector) {
    const sector = data.sectors.find((s: ScoredSector) => s.sectorKey === selectedSector);
    if (sector) {
      return (
        <div className="min-h-screen bg-terminal-bg">
          <HeaderBar data={data} onRefresh={() => fetchData(true)} refreshing={refreshing} />
          <div className="max-w-7xl mx-auto px-4 py-4">
            <button onClick={() => setSelectedSector(null)} className="text-terminal-accent hover:text-terminal-accent/80 text-sm mb-4 flex items-center gap-1">← Back to Dashboard</button>
            <SectorDetail sector={sector} allSectors={data.sectors} />
          </div>
        </div>
      );
    }
  }

  return (
    <div className="min-h-screen bg-terminal-bg">
      <HeaderBar data={data} onRefresh={() => fetchData(true)} refreshing={refreshing} />

      <nav className="border-b border-terminal-border bg-terminal-card/50 sticky top-0 z-40 backdrop-blur-sm">
        <div className="max-w-[1600px] mx-auto px-4">
          <button className="md:hidden w-full py-3 text-sm text-terminal-text-dim flex items-center justify-between" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            <span>{TABS.find(t => t.key === activeTab)?.icon} {TABS.find(t => t.key === activeTab)?.label}</span><span>{mobileMenuOpen ? "▲" : "▼"}</span>
          </button>
          <div className={`${mobileMenuOpen ? "flex" : "hidden"} md:flex flex-col md:flex-row gap-0 md:gap-0 pb-2 md:pb-0`}>
            {TABS.map(tab => (
              <button key={tab.key} onClick={() => { setActiveTab(tab.key); setMobileMenuOpen(false); }} className={`px-4 py-3 text-xs font-medium tracking-wide transition-colors border-b-2 whitespace-nowrap ${activeTab === tab.key ? "border-terminal-accent text-terminal-accent" : "border-transparent text-terminal-text-muted hover:text-terminal-text-dim"}`}>
                <span className="mr-1.5">{tab.icon}</span>{tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <div className="bg-terminal-card border-b border-terminal-border">
        <div className="max-w-[1600px] mx-auto px-4 py-2 flex flex-wrap items-center justify-center gap-2 text-[11px] text-terminal-yellow">
          <span>⚠️</span><span className="font-medium">Largest Fall ≠ Automatic Buy</span><span className="text-terminal-text-muted mx-1">|</span><span className="text-terminal-text-muted">Largest Fall → Investigate → Score → Decide</span>
        </div>
      </div>

      {error && (
        <div className="max-w-[1600px] mx-auto px-4 pt-3">
          <div className="border border-terminal-yellow/30 bg-terminal-yellow/5 rounded-lg px-3 py-2 text-[11px] text-terminal-yellow flex items-center justify-between gap-3">
            <span>⚠️ Latest refresh failed. Showing the last successfully validated snapshot.</span>
            <button onClick={() => fetchData(true)} className="underline font-semibold">Retry</button>
          </div>
        </div>
      )}

      <main className="max-w-[1600px] mx-auto px-4 py-4">
        {activeTab === "dashboard" && <div className="space-y-6 fade-in"><HeroOpportunity data={data} onSectorClick={handleSectorClick} /><div className="grid grid-cols-1 xl:grid-cols-3 gap-6"><div className="xl:col-span-2"><TopLosersTable losers={data.topLosers} onSectorClick={handleSectorClick} compact /></div><div><SectorHeatmap sectors={data.sectors} onSectorClick={handleSectorClick} compact /></div></div><DecisionEngine data={data} onSectorClick={handleSectorClick} compact /></div>}
        {activeTab === "scanner" && <div className="fade-in"><TopLosersTable losers={data.topLosers} onSectorClick={handleSectorClick} /></div>}
        {activeTab === "heatmap" && <div className="fade-in"><SectorHeatmap sectors={data.sectors} onSectorClick={handleSectorClick} /></div>}
        {activeTab === "portfolio" && <div className="fade-in"><PortfolioView sectors={data.sectors} /></div>}
        {activeTab === "report" && <div className="fade-in"><DecisionEngine data={data} onSectorClick={handleSectorClick} /></div>}
        {activeTab === "settings" && <div className="fade-in"><SettingsPanel /></div>}
      </main>

      <footer className="border-t border-terminal-border mt-8 py-4">
        <div className="max-w-[1600px] mx-auto px-4 text-center text-[11px] text-terminal-text-muted">
          Smart MF Terminal • Live latest index data from NSE with Yahoo Finance historical technical data • No simulated market values • Not financial advice
        </div>
      </footer>
    </div>
  );
}
