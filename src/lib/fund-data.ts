export interface FundLiveData {
  schemeCode: number;
  schemeName: string;
  nav: number;
  navDate: string;
  navChange1d: number;
  return1w: number;
  return1m: number;
  return3m: number;
  return6m: number;
  return1y: number;
  source: "MFAPI";
  fetchedAt: string;
}

type SearchItem = { schemeCode: number; schemeName: string };
type NavPoint = { date: string; nav: string };
type HistoryResponse = { meta?: { scheme_code?: number; scheme_name?: string }; data?: NavPoint[]; status?: string };

const cache = new Map<string, { expires: number; data: FundLiveData }>();
const CACHE_MS = 60 * 1000;

function norm(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\b(plan|option|growth|direct|regular)\b/g, " ").replace(/\s+/g, " ").trim();
}

function parseDate(value: string): Date | null {
  const m = value.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (!m) return null;
  return new Date(`${m[3]}-${m[2]}-${m[1]}T00:00:00+05:30`);
}

function navAtOrBefore(data: NavPoint[], daysAgo: number, latest: Date): number | null {
  const target = new Date(latest);
  target.setDate(target.getDate() - daysAgo);
  let best: { date: Date; nav: number } | null = null;
  for (const point of data) {
    const date = parseDate(point.date);
    const nav = Number(point.nav);
    if (!date || !Number.isFinite(nav) || date > target) continue;
    if (!best || date > best.date) best = { date, nav };
  }
  return best?.nav ?? null;
}

async function searchScheme(fundName: string): Promise<SearchItem> {
  const response = await fetch(`https://api.mfapi.in/mf/search?q=${encodeURIComponent(fundName)}`, { cache: "no-store", headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`MFAPI search failed: ${response.status}`);
  const items = await response.json() as SearchItem[];
  if (!Array.isArray(items) || !items.length) throw new Error(`MFAPI scheme not found: ${fundName}`);
  const target = norm(fundName);
  const exact = items.find(x => norm(x.schemeName) === target);
  const directGrowth = items.find(x => /direct/i.test(x.schemeName) && /growth/i.test(x.schemeName));
  return exact ?? directGrowth ?? items[0];
}

export async function fetchFundLiveData(fundName: string): Promise<FundLiveData> {
  const cached = cache.get(fundName);
  if (cached && cached.expires > Date.now()) return cached.data;

  const scheme = await searchScheme(fundName);
  const response = await fetch(`https://api.mfapi.in/mf/${scheme.schemeCode}`, { cache: "no-store", headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`MFAPI history failed for ${scheme.schemeCode}: ${response.status}`);
  const json = await response.json() as HistoryResponse;
  const history = Array.isArray(json.data) ? json.data : [];
  if (!history.length) throw new Error(`MFAPI returned no NAV history for ${scheme.schemeCode}`);

  const ordered = history.map(p => ({ ...p, parsed: parseDate(p.date), numeric: Number(p.nav) })).filter(p => p.parsed && Number.isFinite(p.numeric)).sort((a, b) => a.parsed!.getTime() - b.parsed!.getTime());
  const latest = ordered.at(-1);
  if (!latest) throw new Error(`MFAPI returned invalid NAV history for ${scheme.schemeCode}`);
  const latestDate = latest.parsed!;
  const ret = (days: number) => {
    const prior = navAtOrBefore(history, days, latestDate);
    return prior ? ((latest.numeric / prior) - 1) * 100 : 0;
  };
  const result: FundLiveData = {
    schemeCode: scheme.schemeCode,
    schemeName: scheme.schemeName,
    nav: Number(latest.numeric.toFixed(4)),
    navDate: latest.date,
    navChange1d: Number(ret(1).toFixed(4)),
    return1w: Number(ret(7).toFixed(4)),
    return1m: Number(ret(30).toFixed(4)),
    return3m: Number(ret(90).toFixed(4)),
    return6m: Number(ret(180).toFixed(4)),
    return1y: Number(ret(365).toFixed(4)),
    source: "MFAPI",
    fetchedAt: new Date().toISOString(),
  };
  cache.set(fundName, { expires: Date.now() + CACHE_MS, data: result });
  return result;
}

export async function fetchFundsLive(fundNames: string[]): Promise<Map<string, FundLiveData>> {
  const unique = [...new Set(fundNames.filter(Boolean))];
  const settled = await Promise.allSettled(unique.map(async name => [name, await fetchFundLiveData(name)] as const));
  const entries = settled.flatMap(result => result.status === "fulfilled" ? [result.value] : []);
  return new Map(entries);
}
