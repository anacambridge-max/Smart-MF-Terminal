import { NextResponse } from "next/server";
import { generateMarketData, getTopLosers, getMarketStatus, is230PMWindow } from "@/lib/market-data";
import { calculateAllScores, type ScoringWeights, DEFAULT_WEIGHTS } from "@/lib/scoring";
import { SECTORS, getSectorByKey } from "@/lib/sectors";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const allMarketData = generateMarketData();
    const marketStatus = getMarketStatus();
    const is230PM = is230PMWindow();
    
    // Calculate scores for all sectors
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

    // Sort by today's change (biggest losers first) for opportunity scanner
    const topLosers = [...scoredSectors]
      .filter(s => s.category !== "defensive")
      .sort((a, b) => a.todayChange - b.todayChange)
      .slice(0, 10);

    // Top 5 opportunities sorted by opportunity score among losers
    const topOpportunities = [...scoredSectors]
      .filter(s => s.todayChange < 0 && s.category !== "defensive")
      .sort((a, b) => b.opportunityScore - a.opportunityScore)
      .slice(0, 5);

    // Overall market movement
    const nifty50 = scoredSectors.find(s => s.sectorKey === "nifty50");
    const avgChange = scoredSectors
      .filter(s => s.category !== "defensive")
      .reduce((sum, s) => sum + s.todayChange, 0) / scoredSectors.filter(s => s.category !== "defensive").length;

    return NextResponse.json({
      marketStatus,
      is230PM,
      nifty50Change: nifty50?.todayChange || 0,
      nifty50Level: nifty50?.currentLevel || 0,
      avgMarketChange: Math.round(avgChange * 100) / 100,
      sectors: scoredSectors,
      topLosers,
      topOpportunities,
      lastUpdated: new Date().toISOString(),
      weights: DEFAULT_WEIGHTS,
    });
  } catch (error) {
    console.error("Market API error:", error);
    return NextResponse.json({ error: "Failed to fetch market data" }, { status: 500 });
  }
}
