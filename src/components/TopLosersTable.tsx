"use client";

import type { ScoredSector } from "@/lib/types";
import ChangeIndicator from "./ChangeIndicator";
import ScoreGauge from "./ScoreGauge";
import ActionBadge from "./ActionBadge";

interface Props {
  losers: ScoredSector[];
  onSectorClick: (key: string) => void;
  compact?: boolean;
}

export default function TopLosersTable({ losers, onSectorClick, compact = false }: Props) {
  return (
    <div className="glass-card rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">📉</span>
          <h2 className="text-sm font-semibold text-terminal-text uppercase tracking-wider">
            Top {losers.length} Nifty Losers Today
          </h2>
        </div>
        <span className="text-[10px] text-terminal-text-muted">Sorted by largest fall</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-terminal-border text-terminal-text-muted">
              <th className="text-left py-2 px-2 font-medium">#</th>
              <th className="text-left py-2 px-2 font-medium">Index / Sector</th>
              <th className="text-right py-2 px-2 font-medium">Level</th>
              <th className="text-right py-2 px-2 font-medium">Today</th>
              {!compact && (
                <>
                  <th className="text-right py-2 px-2 font-medium">1W</th>
                  <th className="text-right py-2 px-2 font-medium">1M</th>
                  <th className="text-right py-2 px-2 font-medium">3M</th>
                  <th className="text-right py-2 px-2 font-medium">52W High</th>
                </>
              )}
              <th className="text-center py-2 px-2 font-medium">Tech</th>
              <th className="text-center py-2 px-2 font-medium">B/B</th>
              {!compact && <th className="text-center py-2 px-2 font-medium">Reason</th>}
              <th className="text-center py-2 px-2 font-medium">Opp</th>
              {!compact && <th className="text-left py-2 px-2 font-medium">Recommended MF</th>}
              <th className="text-center py-2 px-2 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {losers.map((s, i) => {
              const from52wHigh = ((s.high52w - s.currentLevel) / s.high52w * 100);
              return (
                <tr
                  key={s.sectorKey}
                  onClick={() => onSectorClick(s.sectorKey)}
                  className="border-b border-terminal-border/50 hover:bg-terminal-card-hover cursor-pointer transition-colors"
                >
                  <td className="py-3 px-2 text-terminal-text-muted font-mono">{i + 1}</td>
                  <td className="py-3 px-2">
                    <p className="font-medium text-terminal-text">{s.sectorName}</p>
                    <p className="text-[10px] text-terminal-text-muted">{s.role}</p>
                  </td>
                  <td className="py-3 px-2 text-right font-mono text-terminal-text">{s.currentLevel.toLocaleString("en-IN")}</td>
                  <td className="py-3 px-2 text-right">
                    <ChangeIndicator value={s.todayChange} className="font-medium" />
                  </td>
                  {!compact && (
                    <>
                      <td className="py-3 px-2 text-right"><ChangeIndicator value={s.weekChange} /></td>
                      <td className="py-3 px-2 text-right"><ChangeIndicator value={s.monthChange} /></td>
                      <td className="py-3 px-2 text-right"><ChangeIndicator value={s.threeMonthChange} /></td>
                      <td className="py-3 px-2 text-right text-terminal-red font-mono">-{from52wHigh.toFixed(1)}%</td>
                    </>
                  )}
                  <td className="py-3 px-2 text-center">
                    <ScoreGauge score={s.technicalScore} size={36} showLabel={false} />
                  </td>
                  <td className="py-3 px-2 text-center">
                    <ScoreGauge score={s.bullBearScore} size={36} showLabel={false} />
                  </td>
                  {!compact && (
                    <td className="py-3 px-2 text-center">
                      <span className="text-[10px] text-terminal-text-muted">{s.reasonScore}</span>
                    </td>
                  )}
                  <td className="py-3 px-2 text-center">
                    <ScoreGauge score={s.opportunityScore} size={36} showLabel={false} />
                  </td>
                  {!compact && (
                    <td className="py-3 px-2 text-left max-w-[200px]">
                      <p className="text-[10px] text-terminal-accent truncate">{s.recommendedFund}</p>
                    </td>
                  )}
                  <td className="py-3 px-2 text-center">
                    <ActionBadge action={s.action} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
