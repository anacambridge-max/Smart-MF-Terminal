import { NextResponse } from "next/server";
import { generateMarketData, getMarketStatus } from "@/lib/market-data";
import { calculateAllScores, DEFAULT_WEIGHTS } from "@/lib/scoring";
import { getSectorByKey } from "@/lib/sectors";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function is230PMDecisionWindow(): boolean {
  const parts = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date());
  const get = (type: string) => parts.find(p => p.type === type)?.value ?? "0";
  const minutes = Number(get("hour")) * 60 + Number(get("minute"));
  return minutes >= 870 && minutes < 900;
}

export async function GET() {
  const requestedAt = new Date().toISOString();
  try {
    const allMarketData = await generateMarketData();
    const marketStatus = getMarketStatus();
    const is230PM = is230PMDecisionWindow();

    const scoredSectors = allMarketData.map(d => {
      const sector = getSectorByKey(d.sectorKey);
      const scores = calculateAllScores(d, allMarketData);
      return {
        ...d,
        ...scores,
        sectorName: sector?.name || d.sectorKey,
        fullName: sector?.fullName || d.sectorKey,
        role: sector?.role || "",
        targetWeight: sector?.targetWeight || 0,
        category: sector?.category || "core",
        recommendedFund: sector?.recommendedFund || "",
        fundAMC: sector?.fundAMC || "",
        expenseRatio: sector?.expenseRatio || 0,
        aumCr: sector?.aumCr || 0,
      };
    });

    const topLosers = [...scoredSectors].filter(s => s.category !== "defensive").sort((a, b) => a.todayChange - b.todayChange).slice(0, 10);
    const topOpportunities = [...scoredSectors].filter(s => s.todayChange < 0 && s.category !== "defensive").sort((a, b) => b.opportunityScore - a.opportunityScore).slice(0, 5);
    const nifty50 = scoredSectors.find(s => s.sectorKey === "nifty50");
    const investable = scoredSectors.filter(s => s.category !== "defensive");
    const avgChange = investable.length ? investable.reduce((sum, s) => sum + s.todayChange, 0) / investable.length : 0;

    return NextResponse.json({
      ok: true,
      marketStatus,
      is230PM,
      nifty50Change: nifty50?.todayChange || 0,
      nifty50Level: nifty50?.currentLevel || 0,
      avgMarketChange: Math.round(avgChange * 100) / 100,
      sectors: scoredSectors,
      topLosers,
      topOpportunities,
      lastUpdated: new Date().toISOString(),
      requestedAt,
      dataSource: "NSE live index feed + Yahoo Finance 1Y history for technical indicators",
      dataMode: "LIVE_LATEST",
      weights: DEFAULT_WEIGHTS,
    });
  } catch (error) {
    console.error("Market API error:", error);
    return NextResponse.json({ ok: false, error: "Live market data could not be validated. No simulated values are returned.", requestedAt }, { status: 503 });
  }
}
