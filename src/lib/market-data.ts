import { type MarketData } from "./scoring";
import { SECTORS } from "./sectors";

type NseRow = Record<string, unknown>;
type YahooChart = { chart?: { result?: Array<{ meta?: { regularMarketPrice?: number; previousClose?: number }; indicators?: { quote?: Array<{ close?: Array<number | null>; high?: Array<number | null>; low?: Array<number | null> }> } }> } };

type History = { closes: number[]; highs: number[]; lows: number[] };

const NSE_ALIASES: Record<string, string[]> = {
  nifty50: ["NIFTY 50"],
  niftynext50: ["NIFTY NEXT 50"],
  niftymidcap150: ["NIFTY MIDCAP 150"],
  niftysmallcap250: ["NIFTY SMALLCAP 250"],
  nifty500: ["NIFTY 500"],
  niftybank: ["NIFTY BANK"],
  niftyfin: ["NIFTY FINANCIAL SERVICES"],
  niftyit: ["NIFTY IT"],
  niftypharma: ["NIFTY PHARMA"],
  niftyauto: ["NIFTY AUTO"],
  niftyfmcg: ["NIFTY FMCG"],
  niftymetal: ["NIFTY METAL"],
  niftyhealthcare: ["NIFTY HEALTHCARE"],
  niftyinfra: ["NIFTY INFRASTRUCTURE"],
  niftyrealty: ["NIFTY REALTY"],
};

const YAHOO_SYMBOLS: Record<string, string> = {
  nifty50: "%5ENSEI",
  niftynext50: "NIFTYNXT50.NS",
  niftymidcap150: "NIFTYMIDCAP150.NS",
  niftysmallcap250: "NIFTYSMLCAP250.NS",
  nifty500: "^CRSLDX",
  niftybank: "%5ENSEBANK",
  niftyfin: "NIFTYFINSERVICE.NS",
  niftyit: "%5ECNXIT",
  niftypharma: "%5ECNXPHARMA",
  niftyauto: "%5ECNXAUTO",
  niftyfmcg: "%5ECNXFMCG",
  niftymetal: "%5ECNXMETAL",
  niftyhealthcare: "NIFTY_HEALTHCARE.NS",
  niftyinfra: "NIFTY_INFRA.NS",
  niftyrealty: "%5ECNXREALTY",
};

const num = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return null;
  const n = Number(value.replace(/,/g, "").trim());
  return Number.isFinite(n) ? n : null;
};

const round = (value: number, digits = 2) => Number(value.toFixed(digits));
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

function sma(values: number[], period: number): number {
  if (values.length < period) return values[values.length - 1] ?? 0;
  const slice = values.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

function rsi(values: number[], period = 14): number {
  if (values.length <= period) return 50;
  let gains = 0;
  let losses = 0;
  for (let i = values.length - period; i < values.length; i++) {
    const delta = values[i] - values[i - 1];
    if (delta >= 0) gains += delta;
    else losses -= delta;
  }
  if (losses === 0) return 100;
  const rs = (gains / period) / (losses / period);
  return 100 - 100 / (1 + rs);
}

function ema(values: number[], period: number): number[] {
  if (!values.length) return [];
  const k = 2 / (period + 1);
  const out = [values[0]];
  for (let i = 1; i < values.length; i++) out.push(values[i] * k + out[i - 1] * (1 - k));
  return out;
}

function macd(values: number[]) {
  const fast = ema(values, 12);
  const slow = ema(values, 26);
  const line = values.map((_, i) => fast[i] - slow[i]);
  const signal = ema(line, 9);
  const last = line.at(-1) ?? 0;
  const sig = signal.at(-1) ?? 0;
  return { line: last, signal: sig, histogram: last - sig };
}

function adxApprox(history: History, period = 14): number {
  if (history.closes.length < period + 1) return 20;
  const start = Math.max(1, history.closes.length - period);
  let trSum = 0;
  let directional = 0;
  for (let i = start; i < history.closes.length; i++) {
    const high = history.highs[i] ?? history.closes[i];
    const low = history.lows[i] ?? history.closes[i];
    const prev = history.closes[i - 1];
    trSum += Math.max(high - low, Math.abs(high - prev), Math.abs(low - prev));
    directional += Math.abs(history.closes[i] - prev);
  }
  return clamp((directional / Math.max(trSum, 1)) * 100, 0, 60);
}

function historyMetrics(history: History) {
  const closes = history.closes;
  const current = closes.at(-1) ?? 0;
  const previous = closes.at(-2) ?? current;
  const m = macd(closes);
  const high52w = Math.max(...closes.slice(-252));
  const low52w = Math.min(...closes.slice(-252));
  const change = (lookback: number) => closes.length > lookback ? ((current / closes.at(-lookback - 1)!)-1)*100 : 0;
  return {
    rsi14: rsi(closes),
    macd: m.line,
    macdSignal: m.signal,
    macdHistogram: m.histogram,
    dma20: sma(closes, 20),
    dma50: sma(closes, 50),
    dma100: sma(closes, 100),
    dma200: sma(closes, 200),
    adx: adxApprox(history),
    high52w,
    low52w,
    weekChange: change(5),
    monthChange: change(21),
    threeMonthChange: change(63),
    sixMonthChange: change(126),
    yearChange: change(252),
    dayHigh: history.highs.at(-1) ?? current,
    dayLow: history.lows.at(-1) ?? current,
    previous,
  };
}

async function fetchNseIndices(): Promise<{ rows: NseRow[]; fetchedAt: string }> {
  const headers = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/126 Safari/537.36",
    Accept: "application/json,text/plain,*/*",
    Referer: "https://www.nseindia.com/",
    "Accept-Language": "en-US,en;q=0.9",
  };
  const warm = await fetch("https://www.nseindia.com/", { cache: "no-store", headers });
  if (!warm.ok) throw new Error(`NSE warm-up failed: ${warm.status}`);
  const response = await fetch("https://www.nseindia.com/api/allIndices", { cache: "no-store", headers });
  if (!response.ok) throw new Error(`NSE allIndices failed: ${response.status}`);
  const json = await response.json() as { data?: NseRow[] };
  if (!Array.isArray(json.data) || !json.data.length) throw new Error("NSE returned no index data");
  return { rows: json.data, fetchedAt: new Date().toISOString() };
}

async function fetchYahooHistory(key: string): Promise<History | null> {
  const symbol = YAHOO_SYMBOLS[key];
  if (!symbol) return null;
  const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=1y&interval=1d&events=history`, { cache: "no-store", headers: { Accept: "application/json" } });
  if (!response.ok) return null;
  const json = await response.json() as YahooChart;
  const result = json.chart?.result?.[0];
  const closes = result?.indicators?.quote?.[0]?.close ?? [];
  const highs = result?.indicators?.quote?.[0]?.high ?? [];
  const lows = result?.indicators?.quote?.[0]?.low ?? [];
  if (closes.length < 30) return null;
  const clean = (values: Array<number | null>) => values.filter((v): v is number => typeof v === "number" && Number.isFinite(v));
  return { closes: clean(closes), highs: clean(highs), lows: clean(lows) };
}

function nseValue(row: NseRow, field: string): number | null { return num(row[field]); }

export async function generateMarketData(): Promise<MarketData[]> {
  const now = new Date();
  let nseRows: NseRow[] = [];
  let nseAvailable = false;
  try {
    nseRows = (await fetchNseIndices()).rows;
    nseAvailable = true;
  } catch (error) {
    console.warn("NSE live feed unavailable; using Yahoo fallback:", error instanceof Error ? error.message : error);
  }

  const rowsByKey = new Map<string, NseRow>();
  for (const sector of SECTORS) {
    const aliases = NSE_ALIASES[sector.key] ?? [];
    const row = nseRows.find(r => aliases.includes(String(r.index ?? "").toUpperCase().trim()));
    if (row) rowsByKey.set(sector.key, row);
  }

  const histories = await Promise.all(SECTORS.map(async sector => [sector.key, await fetchYahooHistory(sector.key)] as const));
  const historyMap = new Map(histories);

  return Promise.all(SECTORS.map(async sector => {
    const row = rowsByKey.get(sector.key);
    const history = historyMap.get(sector.key);
    const metrics = history ? historyMetrics(history) : null;
    const current = nseValue(row ?? {}, "last") ?? metrics?.previous ?? 0;
    const previous = nseValue(row ?? {}, "previousClose") ?? metrics?.previous ?? current;
    const todayChange = nseValue(row ?? {}, "percentChange") ?? nseValue(row ?? {}, "variation") ?? (previous ? ((current - previous) / previous) * 100 : 0);
    const fallbackChange = (key: string, value: number) => {
      if (nseAvailable && row && Number.isFinite(value)) return value;
      return value;
    };
    const weekChange = metrics?.weekChange ?? 0;
    const monthChange = nseValue(row ?? {}, "perChange30d") ?? metrics?.monthChange ?? 0;
    const threeMonthChange = nseValue(row ?? {}, "perChange90d") ?? metrics?.threeMonthChange ?? 0;
    const sixMonthChange = metrics?.sixMonthChange ?? threeMonthChange;
    const yearChange = nseValue(row ?? {}, "perChange365d") ?? metrics?.yearChange ?? 0;
    const high52w = metrics?.high52w ?? current;
    const low52w = metrics?.low52w ?? current;
    const technical = metrics ?? {
      rsi14: 50, macd: 0, macdSignal: 0, macdHistogram: 0, dma20: current, dma50: current, dma100: current, dma200: current,
      adx: 20, high52w: current, low52w: current, weekChange, monthChange, threeMonthChange, sixMonthChange, yearChange, dayHigh: current, dayLow: current, previous,
    };
    const volumeTrend: "increasing" | "decreasing" | "stable" = "stable";
    return {
      sectorKey: sector.key,
      currentLevel: round(current),
      todayChange: round(fallbackChange(sector.key, todayChange)),
      weekChange: round(weekChange),
      monthChange: round(monthChange),
      threeMonthChange: round(threeMonthChange),
      sixMonthChange: round(sixMonthChange),
      yearChange: round(yearChange),
      high52w: round(high52w),
      low52w: round(low52w),
      dayHigh: round(technical.dayHigh),
      dayLow: round(technical.dayLow),
      rsi14: round(technical.rsi14, 1),
      macd: round(technical.macd),
      macdSignal: round(technical.macdSignal),
      macdHistogram: round(technical.macdHistogram),
      dma20: round(technical.dma20),
      dma50: round(technical.dma50),
      dma100: round(technical.dma100),
      dma200: round(technical.dma200),
      adx: round(technical.adx, 1),
      volumeTrend,
      lastUpdated: now.toISOString(),
    };
  }));
}

export function getTopLosers(data: MarketData[], count = 10): MarketData[] {
  return [...data].filter(d => d.sectorKey !== "debtliquid" && d.sectorKey !== "goldetf").sort((a, b) => a.todayChange - b.todayChange).slice(0, count);
}

export function getMarketStatus(): { status: string; nseStatus: string; bseStatus: string } {
  const parts = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", weekday: "short", hourCycle: "h23" }).formatToParts(new Date());
  const get = (type: string) => parts.find(p => p.type === type)?.value ?? "0";
  const day = get("weekday");
  const minutes = Number(get("hour")) * 60 + Number(get("minute"));
  if (day === "Sat" || day === "Sun") return { status: "CLOSED", nseStatus: "Closed", bseStatus: "Closed" };
  if (minutes < 555) return { status: "PRE-OPEN", nseStatus: "Pre-Open", bseStatus: "Pre-Open" };
  if (minutes <= 930) return { status: "OPEN", nseStatus: "Trading", bseStatus: "Trading" };
  return { status: "CLOSED", nseStatus: "Closed", bseStatus: "Closed" };
}

export function is230PMWindow(): boolean {
  const parts = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date());
  const get = (type: string) => parts.find(p => p.type === type)?.value ?? "0";
  const minutes = Number(get("hour")) * 60 + Number(get("minute"));
  return minutes >= 870 && minutes <= 930;
}
