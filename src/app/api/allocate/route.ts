import { NextRequest, NextResponse } from "next/server";
import { generateMarketData } from "@/lib/market-data";
import { calculateAllScores } from "@/lib/scoring";
import { getSectorByKey } from "@/lib/sectors";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { amount, minScore = 50 } = await req.json();
    if (!Number.isFinite(amount) || amount <= 0) return NextResponse.json({ error: "Invalid amount" }, { status: 400 });

    const allData = await generateMarketData();
    const scored = allData.map(d => ({ ...d, ...calculateAllScores(d, allData), sector: getSectorByKey(d.sectorKey) }))
      .filter(s => s.sector?.category !== "defensive" && s.todayChange < 0 && s.opportunityScore >= minScore && s.action !== "AVOID")
      .sort((a, b) => b.opportunityScore - a.opportunityScore).slice(0, 5);

    if (!scored.length) return NextResponse.json({ allocations: [], holdCash: true, message: "No sector meets the live opportunity threshold. Hold cash and wait for confirmation.", totalAmount: amount, allocatedAmount: 0, reserveAmount: amount });

    const totalScore = scored.reduce((s, x) => s + x.opportunityScore, 0);
    const reservePct = 0.10;
    const investableAmount = amount * (1 - reservePct);
    const allocations = scored.map(s => {
      const weight = s.opportunityScore / totalScore;
      const allocatedAmount = Math.round((investableAmount * weight) / 100) * 100;
      return { sectorKey: s.sectorKey, sectorName: s.sector?.name || s.sectorKey, opportunityScore: s.opportunityScore, todayChange: s.todayChange, action: s.action, recommendedFund: s.sector?.recommendedFund || "", allocatedAmount };
    });
    const allocatedAmount = allocations.reduce((s, a) => s + a.allocatedAmount, 0);
    return NextResponse.json({ allocations, holdCash: false, totalAmount: amount, allocatedAmount, reserveAmount: amount - allocatedAmount });
  } catch (error) {
    console.error("Allocate API error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to calculate live allocation" }, { status: 503 });
  }
}
