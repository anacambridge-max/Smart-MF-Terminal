import { NextResponse } from "next/server";
import { generateMarketData, getMarketStatus } from "@/lib/market-data";
import { calculateAllScores, DEFAULT_WEIGHTS } from "@/lib/scoring";
import { getSectorByKey } from "@/lib/sectors";
import { fetchFundsLive } from "@/lib/fund-data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function is230PMDecisionWindow(): boolean { const parts=new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(new Date()); const get=(type:string)=>parts.find(p=>p.type===type)?.value??"0"; const minutes=Number(get("hour"))*60+Number(get("minute")); return minutes>=870&&minutes<900; }

export async function GET() {
  const requestedAt = new Date().toISOString();
  try {
    const allMarketData = await generateMarketData();
    const fundNames = allMarketData.map(d => getSectorByKey(d.sectorKey)?.recommendedFund).filter((x): x is string => Boolean(x));
    const fundLive = await fetchFundsLive(fundNames);
    const marketStatus = getMarketStatus();
    const is230PM = is230PMDecisionWindow();
    const scoredSectors = allMarketData.map(d => { const sector=getSectorByKey(d.sectorKey); const scores=calculateAllScores(d,allMarketData); return {...d,...scores,sectorName:sector?.name||d.sectorKey,fullName:sector?.fullName||d.sectorKey,role:sector?.role||"",targetWeight:sector?.targetWeight||0,category:sector?.category||"core",recommendedFund:sector?.recommendedFund||"",fundAMC:sector?.fundAMC||"",expenseRatio:sector?.expenseRatio||0,aumCr:sector?.aumCr||0,fundLive:sector?.recommendedFund?fundLive.get(sector.recommendedFund):undefined}; });
    const investable=scoredSectors.filter(s=>s.category!=="defensive");
    const topLosers=[...investable].sort((a,b)=>a.todayChange-b.todayChange).slice(0,10);
    const topOpportunities=[...investable].filter(s=>s.todayChange<0).sort((a,b)=>b.opportunityScore-a.opportunityScore).slice(0,5);
    const avoidList=[...investable].filter(s=>s.riskScore>=70||(s.opportunityScore<40&&s.bullBearScore<45)).sort((a,b)=>b.riskScore-a.riskScore).slice(0,5);
    const nifty50=scoredSectors.find(s=>s.sectorKey==="nifty50");
    const avgChange=investable.length?investable.reduce((sum,s)=>sum+s.todayChange,0)/investable.length:0;
    const response=NextResponse.json({ok:true,marketStatus,is230PM,nifty50Change:nifty50?.todayChange||0,nifty50Level:nifty50?.currentLevel||0,avgMarketChange:Math.round(avgChange*100)/100,sectors:scoredSectors,topLosers,topOpportunities,avoidList,lastUpdated:new Date().toISOString(),requestedAt,dataSource:"NSE live index feed + Yahoo Finance 1Y technical history + MFAPI latest published NAV/history",dataMode:"LIVE_VALIDATED",weights:DEFAULT_WEIGHTS,navCutoff:"15:00 IST for equity mutual funds; liquid/overnight funds follow applicable cut-off rules"});
    response.headers.set("Cache-Control","no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
    response.headers.set("Pragma","no-cache");
    response.headers.set("Expires","0");
    return response;
  } catch(error) {
    console.error("Market API error:",error);
    const response=NextResponse.json({ok:false,error:error instanceof Error?error.message:"Live market data could not be validated. No simulated values are returned.",requestedAt},{status:503});
    response.headers.set("Cache-Control","no-store, no-cache, max-age=0");
    return response;
  }
}
