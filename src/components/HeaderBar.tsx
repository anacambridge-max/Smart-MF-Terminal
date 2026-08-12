"use client";

import type { MarketApiResponse } from "@/lib/types";
import ChangeIndicator from "./ChangeIndicator";

interface HeaderBarProps { data: MarketApiResponse; onRefresh: () => void; refreshing: boolean; }

export default function HeaderBar({ data, onRefresh, refreshing }: HeaderBarProps) {
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short", year: "numeric" });
  const timeStr = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const updatedStr = new Date(data.lastUpdated).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const open = data.marketStatus.status === "OPEN";
  const preopen = data.marketStatus.status === "PRE-OPEN";

  return (
    <header className="border-b border-terminal-border bg-[#080d15]/95 backdrop-blur-xl">
      <div className="max-w-[1600px] mx-auto px-4 lg:px-6 py-3">
        <div className="flex flex-col 2xl:flex-row 2xl:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-950/30">
              <span className="font-black text-white text-sm tracking-tight">SM</span>
              <span className="absolute -right-1 -top-1 w-2.5 h-2.5 rounded-full bg-terminal-green border-2 border-[#080d15]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2"><h1 className="text-[15px] font-bold tracking-tight text-terminal-text">Smart MF Terminal</h1><span className="hidden sm:inline-flex px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-[8px] uppercase tracking-widest text-blue-400">Live Engine</span></div>
              <p className="text-[9px] uppercase tracking-[.18em] text-terminal-text-muted mt-0.5">Mutual Fund Opportunity &amp; Decision System</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[11px]">
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-terminal-border bg-terminal-card/70"><span className={`w-2 h-2 rounded-full ${open ? "bg-terminal-green" : preopen ? "bg-terminal-yellow" : "bg-terminal-red"} status-dot`} /><span className="text-terminal-text-muted">NSE</span><span className="font-semibold text-terminal-text">{data.marketStatus.nseStatus}</span></div>
            <div className="hidden lg:block h-7 w-px bg-terminal-border" />
            <div className="px-2.5 py-1.5 rounded-lg border border-terminal-border bg-terminal-card/50"><span className="text-terminal-text-muted mr-1.5">NIFTY 50</span><span className="font-mono font-semibold text-terminal-text">{data.nifty50Level.toLocaleString("en-IN")}</span><ChangeIndicator value={data.nifty50Change} className="ml-1.5" /></div>
            <div className="px-2.5 py-1.5 rounded-lg border border-terminal-border bg-terminal-card/50"><span className="text-terminal-text-muted mr-1.5">AVG MKT</span><ChangeIndicator value={data.avgMarketChange} /></div>
            <div className="hidden xl:block text-terminal-text-muted font-mono">{dateStr} · {timeStr}</div>
            <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[10px] font-bold tracking-wide ${data.is230PM ? "border-terminal-green/30 bg-terminal-green/10 text-terminal-green pulse-glow" : "border-terminal-border bg-terminal-card/60 text-terminal-text-muted"}`}><span>⏰</span> 2:30 PM {data.is230PM ? "ACTIVE" : "STANDBY"}</div>
            <button type="button" onClick={onRefresh} disabled={refreshing} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-500/35 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 disabled:opacity-50 transition-colors font-semibold"><span className={refreshing ? "animate-spin" : ""}>↻</span>{refreshing ? "Refreshing" : "Refresh"}</button>
          </div>
        </div>
        <div className="mt-2.5 flex items-center justify-between gap-3 text-[9px] text-terminal-text-muted"><span>Market data: NSE live · Historical technicals: Yahoo Finance · No simulated market values</span><span className="hidden md:inline">Last validated update: {updatedStr}</span></div>
      </div>
    </header>
  );
}
