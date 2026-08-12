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
  source: string;
  fetchedAt: string;
}

export interface ScoredSector {
  sectorKey: string;
  sectorName: string;
  fullName: string;
  role: string;
  targetWeight: number;
  category: string;
  recommendedFund: string;
  fundAMC: string;
  expenseRatio: number;
  aumCr: number;
  fundLive?: FundLiveData;
  currentLevel: number;
  todayChange: number;
  weekChange: number;
  monthChange: number;
  threeMonthChange: number;
  sixMonthChange: number;
  yearChange: number;
  high52w: number;
  low52w: number;
  dayHigh: number;
  dayLow: number;
  rsi14: number;
  macd: number;
  macdSignal: number;
  macdHistogram: number;
  dma20: number;
  dma50: number;
  dma100: number;
  dma200: number;
  adx: number;
  volumeTrend: string;
  lastUpdated: string;
  correctionScore: number;
  technicalScore: number;
  bullBearScore: number;
  valuationScore: number;
  reasonScore: number;
  historicalCorrectionScore: number;
  marketBreadthScore: number;
  fallQualityScore: number;
  opportunityScore: number;
  riskScore: number;
  action: string;
  bullBearLabel: string;
  reasonForFall: string;
  reasonCategory: string;
  explanation: string;
  historicalPercentile: number;
}

export interface MarketApiResponse {
  marketStatus: { status: string; nseStatus: string; bseStatus: string };
  is230PM: boolean;
  nifty50Change: number;
  nifty50Level: number;
  avgMarketChange: number;
  sectors: ScoredSector[];
  topLosers: ScoredSector[];
  topOpportunities: ScoredSector[];
  avoidList?: ScoredSector[];
  lastUpdated: string;
  dataSource?: string;
  dataMode?: string;
  navCutoff?: string;
  weights: Record<string, number>;
}
