import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

const DEFAULT_SETTINGS: Record<string, string> = {
  dailyInvestmentAmount: "10000",
  riskTolerance: "moderate",
  minOpportunityScore: "50",
  minCorrectionPct: "1",
  maxSectorAllocation: "25",
  directGrowthOnly: "true",
  rebalancingThreshold: "5",
  scoringWeights: JSON.stringify({ correction: 20, technical: 20, bullBear: 20, valuation: 15, reasonForFall: 10, historicalCorrection: 10, marketBreadth: 5 }),
};

export async function GET() {
  try {
    const rows = await db.select().from(settings);
    const result: Record<string, string> = { ...DEFAULT_SETTINGS };
    for (const row of rows) {
      result[row.key] = row.value;
    }
    return NextResponse.json(result);
  } catch (error) {
    console.error("Settings GET error:", error);
    return NextResponse.json(DEFAULT_SETTINGS);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    for (const [key, value] of Object.entries(body)) {
      const existing = await db.select().from(settings).where(eq(settings.key, key));
      if (existing.length > 0) {
        await db.update(settings).set({ value: String(value), updatedAt: new Date() }).where(eq(settings.key, key));
      } else {
        await db.insert(settings).values({ key, value: String(value) });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Settings POST error:", error);
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
}
