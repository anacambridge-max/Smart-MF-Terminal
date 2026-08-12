import { type MarketData } from "./scoring";
import { SECTORS } from "./sectors";

// Seeded PRNG for deterministic but realistic market data
// Changes daily based on date
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

function dateSeed(): number {
  const now = new Date();
  return now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
}

// Base levels for each sector index (approximate realistic levels)
const BASE_LEVELS: Record<string, number> = {
  nifty50: 24500,
  niftynext50: 62000,
  niftymidcap150: 19500,
  niftysmallcap250: 16800,
  nifty500: 22400,
  niftybank: 51200,
  niftyfin: 23100,
  niftyit: 38500,
  niftypharma: 20200,
  niftyauto: 25300,
  niftyfmcg: 56800,
  niftymetal: 8900,
  niftyhealthcare: 13800,
  niftyinfra: 7600,
  niftyrealty: 1020,
  debtliquid: 4850,
  goldetf: 72,
};

export function generateMarketData(): MarketData[] {
  const seed = dateSeed();
  const rand = seededRandom(seed);
  const now = new Date();
  const hours = now.getHours();
  const isMarketHours = hours >= 9 && hours < 16;

  return SECTORS.map((sector, idx) => {
    const r = seededRandom(seed + idx * 137);
    const base = BASE_LEVELS[sector.key] || 10000;
    
    // Generate realistic daily changes - most sectors slightly negative to positive
    // A few sectors have larger declines to create opportunities
    const volatility = sector.category === "defensive" ? 0.3 : (sector.category === "sector" ? 2.8 : 1.8);
    const todayChange = (r() - 0.55) * volatility * 2; // slight negative bias
    
    const weekChange = todayChange + (r() - 0.48) * volatility * 3;
    const monthChange = weekChange + (r() - 0.45) * volatility * 5;
    const threeMonthChange = monthChange + (r() - 0.42) * volatility * 4;
    const sixMonthChange = threeMonthChange + (r() - 0.4) * 8;
    const yearChange = sixMonthChange + (r() - 0.35) * 12;

    const currentLevel = Math.round(base * (1 + todayChange / 100) * 100) / 100;
    const prevClose = Math.round(base * 100) / 100;
    
    const high52w = Math.round(base * (1 + Math.abs(yearChange) / 100 + r() * 0.08) * 100) / 100;
    const low52w = Math.round(base * (1 - r() * 0.25 - 0.05) * 100) / 100;
    
    const dayHigh = Math.round(currentLevel * (1 + r() * 0.008) * 100) / 100;
    const dayLow = Math.round(currentLevel * (1 - r() * 0.012) * 100) / 100;

    // Technical indicators
    const rsi14 = clampNum(45 + todayChange * 3 + (r() - 0.5) * 20, 15, 85);
    const dma20 = Math.round(base * (1 + (r() - 0.5) * 0.02) * 100) / 100;
    const dma50 = Math.round(base * (1 + (r() - 0.48) * 0.04) * 100) / 100;
    const dma100 = Math.round(base * (1 + (r() - 0.45) * 0.06) * 100) / 100;
    const dma200 = Math.round(base * (1 + (r() - 0.42) * 0.08) * 100) / 100;
    
    const macd = (r() - 0.5) * 80;
    const macdSignal = macd + (r() - 0.5) * 30;
    const macdHistogram = macd - macdSignal;
    const adx = 15 + r() * 35;

    const volOptions: Array<"increasing" | "decreasing" | "stable"> = ["increasing", "decreasing", "stable"];
    const volumeTrend = volOptions[Math.floor(r() * 3)];

    return {
      sectorKey: sector.key,
      currentLevel: Math.round(currentLevel * 100) / 100,
      todayChange: Math.round(todayChange * 100) / 100,
      weekChange: Math.round(weekChange * 100) / 100,
      monthChange: Math.round(monthChange * 100) / 100,
      threeMonthChange: Math.round(threeMonthChange * 100) / 100,
      sixMonthChange: Math.round(sixMonthChange * 100) / 100,
      yearChange: Math.round(yearChange * 100) / 100,
      high52w,
      low52w,
      dayHigh,
      dayLow,
      rsi14: Math.round(rsi14 * 10) / 10,
      macd: Math.round(macd * 100) / 100,
      macdSignal: Math.round(macdSignal * 100) / 100,
      macdHistogram: Math.round(macdHistogram * 100) / 100,
      dma20,
      dma50,
      dma100,
      dma200,
      adx: Math.round(adx * 10) / 10,
      volumeTrend,
      lastUpdated: isMarketHours
        ? now.toISOString()
        : new Date(now.getFullYear(), now.getMonth(), now.getDate(), 15, 30, 0).toISOString(),
    };
  });
}

function clampNum(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

export function getTopLosers(data: MarketData[], count: number = 10): MarketData[] {
  return [...data]
    .filter(d => d.sectorKey !== "debtliquid" && d.sectorKey !== "goldetf")
    .sort((a, b) => a.todayChange - b.todayChange)
    .slice(0, count);
}

export function getMarketStatus(): { status: string; nseStatus: string; bseStatus: string } {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const day = now.getDay();
  
  if (day === 0 || day === 6) {
    return { status: "CLOSED", nseStatus: "Closed", bseStatus: "Closed" };
  }
  if (hours < 9 || (hours === 9 && minutes < 15)) {
    return { status: "PRE-OPEN", nseStatus: "Pre-Open", bseStatus: "Pre-Open" };
  }
  if (hours < 15 || (hours === 15 && minutes <= 30)) {
    return { status: "OPEN", nseStatus: "Trading", bseStatus: "Trading" };
  }
  return { status: "CLOSED", nseStatus: "Closed", bseStatus: "Closed" };
}

export function is230PMWindow(): boolean {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  return hours === 14 && minutes >= 15 || hours === 14 && minutes <= 45 || hours >= 14;
}
