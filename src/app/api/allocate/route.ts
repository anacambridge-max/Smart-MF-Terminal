import { NextRequest, NextResponse } from "next/server";
import { generateMarketData } from "@/lib/market-data";
import { calculateAllScores } from "@/lib/scoring";
import { SECTORS, getSectorByKey } from "@/lib/sectors";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { amount, minScore = 50 } = await req.json();
    
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const allData = generateMarketData();
    const scored = allData
      .map(d => {
        const scores = calculateAllScores(d, allData);
        const sector = getSectorByKey(d.sectorKey);
        return { ...d, ...scores, sector };
      })
      .filter(s => s.sector?.category !== "defensive" && s.todayChange < 0 && s.opportunityScore >= minScore)
      .sort((a, b) => b.opportunityScore - a.opportunityScore)
      .slice(0, 5);

    if (scored.length === 0) {
      return NextResponse.json({
        allocations: [],
        holdCash: true,
        message: "No sector meets the minimum opportunity score threshold. Hold cash.",
        totalAmount: amount,
        allocatedAmount: 0,
        reserveAmount: amount,
      });
    }

    // Weighted allocation based on opportunity scores
    const totalScore = scored.reduce((s, x) => s + x.opportunityScore, 0);
    const reservePct = 0.1;
    const investableAmount = amount * (1 - reservePct);
    
    const allocations = scored.map(s => {
      const weight = s.opportunityScore / totalScore;
      const allocated = Math.round(investableAmount * weight / 100) * 100; // round to nearest 100
      return {
        sectorKey: s.sectorKey,
        sectorName: s.sector?.name || s.sectorKey,
        opportunityScore: s.opportunityScore,
        todayChange: s.todayChange,
        action: s.action,
        recommendedFund: s.sector?.recommendedFund || "",
        allocatedAmount: allocated,
      };
    });

    const totalAllocated = allocations.reduce((s, a) => s + a.allocatedAmount, 0);

    return NextResponse.json({
      allocations,
      holdCash: false,
      totalAmount: amount,
      allocatedAmount: totalAllocated,
      reserveAmount: amount - totalAllocated,
    });
  } catch (error) {
    console.error("Allocate API error:", error);
    return NextResponse.json({ error: "Failed to calculate allocation" }, { status: 500 });
  }
}
