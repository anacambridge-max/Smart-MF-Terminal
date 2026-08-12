import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { portfolioHoldings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { SECTORS } from "@/lib/sectors";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const holdings = await db.select().from(portfolioHoldings);
    
    // If no holdings, return default portfolio structure
    if (holdings.length === 0) {
      const defaultPortfolio = SECTORS.map(s => ({
        sectorKey: s.key,
        sectorName: s.name,
        role: s.role,
        category: s.category,
        targetWeight: s.targetWeight,
        investedAmount: 0,
        currentValue: 0,
        actualWeight: 0,
        deviation: 0,
        status: "UNDERWEIGHT" as string,
        fundName: s.recommendedFund,
      }));
      
      return NextResponse.json({
        holdings: defaultPortfolio,
        totalInvested: 0,
        totalCurrentValue: 0,
        absoluteReturn: 0,
        returnPct: 0,
        todayPnL: 0,
      });
    }

    const totalValue = holdings.reduce((s, h) => s + (h.currentValue || 0), 0);
    const totalInvested = holdings.reduce((s, h) => s + (h.investedAmount || 0), 0);

    const enrichedHoldings = holdings.map(h => {
      const sector = SECTORS.find(s => s.key === h.sectorKey);
      const actualWeight = totalValue > 0 ? (h.currentValue / totalValue) * 100 : 0;
      const target = sector?.targetWeight || h.targetWeight;
      const deviation = actualWeight - target;
      let status = "ON TARGET";
      if (deviation > 3) status = "OVERWEIGHT";
      else if (deviation < -3) status = "UNDERWEIGHT";
      
      return {
        ...h,
        sectorName: sector?.name || h.sectorKey,
        role: sector?.role || "",
        category: h.category,
        actualWeight: Math.round(actualWeight * 100) / 100,
        deviation: Math.round(deviation * 100) / 100,
        status,
      };
    });

    return NextResponse.json({
      holdings: enrichedHoldings,
      totalInvested,
      totalCurrentValue: totalValue,
      absoluteReturn: totalValue - totalInvested,
      returnPct: totalInvested > 0 ? ((totalValue - totalInvested) / totalInvested) * 100 : 0,
      todayPnL: 0,
    });
  } catch (error) {
    console.error("Portfolio API error:", error);
    return NextResponse.json({ error: "Failed to fetch portfolio" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sectorKey, investedAmount, currentValue, fundName } = body;
    
    const sector = SECTORS.find(s => s.key === sectorKey);
    if (!sector) {
      return NextResponse.json({ error: "Invalid sector" }, { status: 400 });
    }

    const existing = await db.select().from(portfolioHoldings).where(eq(portfolioHoldings.sectorKey, sectorKey));
    
    if (existing.length > 0) {
      await db.update(portfolioHoldings)
        .set({
          investedAmount: (existing[0].investedAmount || 0) + (investedAmount || 0),
          currentValue: (existing[0].currentValue || 0) + (currentValue || investedAmount || 0),
          fundName: fundName || existing[0].fundName,
          updatedAt: new Date(),
        })
        .where(eq(portfolioHoldings.sectorKey, sectorKey));
    } else {
      await db.insert(portfolioHoldings).values({
        sectorKey,
        fundName: fundName || sector.recommendedFund,
        investedAmount: investedAmount || 0,
        currentValue: currentValue || investedAmount || 0,
        targetWeight: sector.targetWeight,
        category: sector.category,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Portfolio POST error:", error);
    return NextResponse.json({ error: "Failed to update portfolio" }, { status: 500 });
  }
}
