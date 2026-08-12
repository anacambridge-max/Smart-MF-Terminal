"use client";

import type { MarketApiResponse } from "@/lib/types";
import ChangeIndicator from "./ChangeIndicator";

interface HeaderBarProps {
  data: MarketApiResponse;
  onRefresh: () => void;
  refreshing: boolean;
}

export default function HeaderBar({ data, onRefresh, refreshing }: HeaderBarProps) {
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  const timeStr = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const updatedStr = new Date(data.lastUpdated).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  const statusColor = data.marketStatus.status === "OPEN" ? "bg-terminal-green" : data.marketStatus.status === "PRE-OPEN" ? "bg-terminal-yellow" : "bg-terminal-red";

  return (
    <header className="bg-terminal-card border-b border-terminal-border">
      <div className="max-w-[1600px] mx-auto px-4 py-3">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-terminal-accent to-terminal-cyan flex items-center justify-center text-white font-bold text-sm">SM</div>
            <div>
              <h1 className="text-base font-bold text-terminal-text tracking-tight">Smart MF Terminal</h1>
              <p className="text-[10px] text-terminal-text-muted tracking-wider uppercase">Mutual Fund Opportunity Dashboard</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 md:gap-5 text-xs">
            <div className="flex items-center gap-1.5"><div className={`w-2 h-2 rounded-full ${statusColor} ${data.marketStatus.status === "OPEN" ? "animate-pulse" : ""}`} /><span className="text-terminal-text-muted">NSE</span><span className="text-terminal-text">{data.marketStatus.nseStatus}</span></div>
            <div className="hidden md:block h-4 w-px bg-terminal-border" />
            <div><span className="text-terminal-text-muted mr-1">Nifty 50</span><span className="font-mono font-medium text-terminal-text">{data.nifty50Level.toLocaleString("en-IN")}</span><span className="ml-1"><ChangeIndicator value={data.nifty50Change} className="text-xs" /></span></div>
            <div className="hidden md:block h-4 w-px bg-terminal-border" />
            <div><span className="text-terminal-text-muted mr-1">Avg Mkt</span><ChangeIndicator value={data.avgMarketChange} className="text-xs" /></div>
            <div className="hidden md:block h-4 w-px bg-terminal-border" />
            <div><span className="text-terminal-text-muted">{dateStr}</span><span className="text-terminal-text-dim font-mono ml-1">{timeStr}</span></div>
            <div className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium ${data.is230PM ? "bg-terminal-green/20 text-terminal-green pulse-glow" : "bg-terminal-card text-terminal-text-muted border border-terminal-border"}`}>⏰ 2:30 PM {data.is230PM ? "ACTIVE" : "STANDBY"}</div>
            <button
              type="button"
              onClick={onRefresh}
              disabled={refreshing}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-terminal-accent/40 bg-terminal-accent/10 text-terminal-accent hover:bg-terminal-accent/20 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-colors"
              title="Fetch the latest validated market data now"
            >
              <span className={refreshing ? "animate-spin" : ""}>↻</span>{refreshing ? "Refreshing…" : "Refresh Live Data"}
            </button>
            <div className="text-[9px] text-terminal-text-muted">Data: NSE live · Tech: Yahoo history · Updated {updatedStr}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
