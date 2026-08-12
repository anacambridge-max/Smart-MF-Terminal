import { type MarketData } from "./scoring";
import { SECTORS } from "./sectors";

type NseRow = Record<string, unknown>;
type YahooResult = { meta?: { regularMarketPrice?: number; previousClose?: number }; indicators?: { quote?: Array<{ close?: Array<number | null>; high?: Array<number | null>; low?: Array<number | null> }> } };
type YahooChart = { chart?: { result?: YahooResult[] } };
type History = { closes: number[]; highs: number[]; lows: number[] };

const NSE_ALIASES: Record<string, string[]> = {
  nifty50: ["NIFTY 50"], niftynext50: ["NIFTY NEXT 50"], niftymidcap150: ["NIFTY MIDCAP 150"], niftysmallcap250: ["NIFTY SMALLCAP 250"], nifty500: ["NIFTY 500"], niftybank: ["NIFTY BANK"], niftyfin: ["NIFTY FINANCIAL SERVICES", "NIFTY FINANCIAL SERVICES 25/50"], niftyit: ["NIFTY IT"], niftypharma: ["NIFTY PHARMA"], niftyauto: ["NIFTY AUTO"], niftyfmcg: ["NIFTY FMCG"], niftymetal: ["NIFTY METAL"], niftyhealthcare: ["NIFTY HEALTHCARE INDEX", "NIFTY HEALTHCARE"], niftyinfra: ["NIFTY INFRASTRUCTURE"], niftyrealty: ["NIFTY REALTY"],
};

const YAHOO_SYMBOLS: Record<string, string[]> = {
  nifty50: ["^NSEI"], niftynext50: ["NIFTYNXT50.NS"], niftymidcap150: ["NIFTY_MIDCAP_150.NS", "^NSEMDCP50"], niftysmallcap250: ["NIFTYSMLCAP250.NS"], nifty500: ["^CRSLDX"], niftybank: ["^NSEBANK"], niftyfin: ["NIFTY_FIN_SERVICE.NS", "^CNXFIN"], niftyit: ["^CNXIT"], niftypharma: ["^CNXPHARMA"], niftyauto: ["^CNXAUTO"], niftyfmcg: ["^CNXFMCG"], niftymetal: ["^CNXMETAL"], niftyhealthcare: ["NIFTY_HEALTHCARE.NS", "^CNXHEALTH"], niftyinfra: ["^CNXINFRA"], niftyrealty: ["^CNXREALTY"],
};

const num = (v: unknown): number | null => { if (typeof v === "number" && Number.isFinite(v)) return v; if (typeof v !== "string") return null; const n = Number(v.replace(/,/g, "").trim()); return Number.isFinite(n) ? n : null; };
const round = (v: number, d = 2) => Number(v.toFixed(d));
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

function sma(values: number[], period: number) { if (values.length < period) return values.at(-1) ?? 0; const s = values.slice(-period); return s.reduce((a,b)=>a+b,0)/s.length; }
function rsi(values: number[], period=14) { if (values.length <= period) return 50; let gains=0, losses=0; for(let i=values.length-period;i<values.length;i++){const d=values[i]-values[i-1];if(d>=0)gains+=d;else losses-=d;} if(!losses)return 100; const rs=(gains/period)/(losses/period); return 100-100/(1+rs); }
function ema(values:number[],period:number){if(!values.length)return[];const k=2/(period+1),out=[values[0]];for(let i=1;i<values.length;i++)out.push(values[i]*k+out[i-1]*(1-k));return out;}
function macd(values:number[]){const fast=ema(values,12),slow=ema(values,26),line=values.map((_,i)=>fast[i]-slow[i]),signal=ema(line,9),l=line.at(-1)??0,s=signal.at(-1)??0;return{line:l,signal:s,histogram:l-s};}
function adxApprox(h:History,period=14){if(h.closes.length<period+1)return 20;let tr=0,dir=0;for(let i=Math.max(1,h.closes.length-period);i<h.closes.length;i++){const hi=h.highs[i]??h.closes[i],lo=h.lows[i]??h.closes[i],p=h.closes[i-1];tr+=Math.max(hi-lo,Math.abs(hi-p),Math.abs(lo-p));dir+=Math.abs(h.closes[i]-p);}return clamp((dir/Math.max(tr,1))*100,0,60);}
function metrics(h:History){const c=h.closes,cur=c.at(-1)??0,m=macd(c),change=(n:number)=>c.length>n?((cur/c.at(-n-1)!)-1)*100:0;return{rsi14:rsi(c),macd:m.line,macdSignal:m.signal,macdHistogram:m.histogram,dma20:sma(c,20),dma50:sma(c,50),dma100:sma(c,100),dma200:sma(c,200),adx:adxApprox(h),high52w:Math.max(...c.slice(-252)),low52w:Math.min(...c.slice(-252)),weekChange:change(5),monthChange:change(21),threeMonthChange:change(63),sixMonthChange:change(126),yearChange:change(252),dayHigh:h.highs.at(-1)??cur,dayLow:h.lows.at(-1)??cur};}

function cookieHeader(headers: Headers): string { return headers.get("set-cookie")?.split(/,(?=[^;]+?=)/).map(x=>x.split(";")[0]).join("; ") ?? ""; }

async function fetchNseIndices(): Promise<NseRow[]> {
  const headers={"User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36",Accept:"application/json,text/plain,*/*",Referer:"https://www.nseindia.com/",Origin:"https://www.nseindia.com","Accept-Language":"en-US,en;q=0.9"};
  const warm=await fetch("https://www.nseindia.com/",{cache:"no-store",headers});
  if(!warm.ok)throw new Error(`NSE warm-up failed: ${warm.status}`);
  const cookie=cookieHeader(warm.headers);
  const response=await fetch("https://www.nseindia.com/api/allIndices",{cache:"no-store",headers:{...headers,Cookie:cookie}});
  if(!response.ok)throw new Error(`NSE allIndices failed: ${response.status}`);
  const json=await response.json() as {data?:NseRow[]};
  if(!Array.isArray(json.data)||!json.data.length)throw new Error("NSE returned no index data");
  return json.data;
}

async function fetchYahoo(symbol:string):Promise<{history:History;current:number;previous:number}> {
  const url=`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1y&interval=1d&events=history`;
  const r=await fetch(url,{cache:"no-store",headers:{Accept:"application/json"}}); if(!r.ok)throw new Error(`Yahoo ${symbol}: ${r.status}`);
  const json=await r.json() as YahooChart; const result=json.chart?.result?.[0]; const q=result?.indicators?.quote?.[0];
  if(!result||!q?.close)throw new Error(`Yahoo ${symbol}: no data`);
  const closes=q.close.filter((v):v is number=>typeof v==="number"&&Number.isFinite(v)); const highs=(q.high??[]).filter((v):v is number=>typeof v==="number"&&Number.isFinite(v)); const lows=(q.low??[]).filter((v):v is number=>typeof v==="number"&&Number.isFinite(v));
  if(closes.length<200)throw new Error(`Yahoo ${symbol}: only ${closes.length} history rows`);
  const current=num(result.meta?.regularMarketPrice)??closes.at(-1)??null; const previous=num(result.meta?.previousClose)??closes.at(-2)??null;
  if(current===null||previous===null)throw new Error(`Yahoo ${symbol}: missing current price`);
  return{history:{closes,highs,lows},current,previous};
}

export async function generateMarketData():Promise<MarketData[]> {
  const now=new Date().toISOString();
  let nseRows:NseRow[]=[]; try{nseRows=await fetchNseIndices();}catch(error){console.warn("NSE live feed unavailable; using validated Yahoo current/index history where available",error);}
  const out:MarketData[]=[];
  const candidates=SECTORS.filter(s=>s.category!=="defensive");
  for(const sector of candidates){
    try{
      const aliases=NSE_ALIASES[sector.key]??[]; const nse=nseRows.find(r=>aliases.includes(String(r.index??"").toUpperCase().trim()));
      let liveCurrent=num(nse?.last), livePrevious=num(nse?.previousClose), liveChange=num(nse?.percentChange), history:History|null=null;
      const symbols=YAHOO_SYMBOLS[sector.key]??[];
      for(const symbol of symbols){if(history)break;try{const y=await fetchYahoo(symbol);history=y.history;if(liveCurrent===null)liveCurrent=y.current;if(livePrevious===null)livePrevious=y.previous;if(liveChange===null&&livePrevious)liveChange=((liveCurrent!/livePrevious)-1)*100;}catch(error){console.warn(`Yahoo fallback failed for ${sector.key}/${symbol}`,error);}}
      if(!history||liveCurrent===null||livePrevious===null||liveChange===null)throw new Error(`No validated live feed for ${sector.key}`);
      const m=metrics(history);
      out.push({sectorKey:sector.key,currentLevel:round(liveCurrent),todayChange:round(liveChange),weekChange:round(m.weekChange),monthChange:round(num(nse?.perChange30d)??m.monthChange),threeMonthChange:round(num(nse?.perChange90d)??m.threeMonthChange),sixMonthChange:round(m.sixMonthChange),yearChange:round(num(nse?.perChange365d)??m.yearChange),high52w:round(m.high52w),low52w:round(m.low52w),dayHigh:round(m.dayHigh),dayLow:round(m.dayLow),rsi14:round(m.rsi14,1),macd:round(m.macd),macdSignal:round(m.macdSignal),macdHistogram:round(m.macdHistogram),dma20:round(m.dma20),dma50:round(m.dma50),dma100:round(m.dma100),dma200:round(m.dma200),adx:round(m.adx,1),volumeTrend:"stable",lastUpdated:now});
    }catch(error){console.warn(`Skipping ${sector.key}:`,error);}
  }
  if(out.length<5)throw new Error(`Validated live market feeds available for only ${out.length} sectors; refusing to return an unreliable dashboard.`);
  return out;
}

export function getTopLosers(data:MarketData[],count=10){return[...data].sort((a,b)=>a.todayChange-b.todayChange).slice(0,count);}
export function getMarketStatus(){const p=new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",hour:"2-digit",minute:"2-digit",weekday:"short",hourCycle:"h23"}).formatToParts(new Date()),get=(t:string)=>p.find(x=>x.type===t)?.value??"0",day=get("weekday"),min=Number(get("hour"))*60+Number(get("minute"));if(day==="Sat"||day==="Sun")return{status:"CLOSED",nseStatus:"Closed",bseStatus:"Closed"};if(min<555)return{status:"PRE-OPEN",nseStatus:"Pre-Open",bseStatus:"Pre-Open"};if(min<=930)return{status:"OPEN",nseStatus:"Trading",bseStatus:"Trading"};return{status:"CLOSED",nseStatus:"Closed",bseStatus:"Closed"};}
export function is230PMWindow(){const p=new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(new Date()),get=(t:string)=>p.find(x=>x.type===t)?.value??"0",m=Number(get("hour"))*60+Number(get("minute"));return m>=870&&m<=930;}
