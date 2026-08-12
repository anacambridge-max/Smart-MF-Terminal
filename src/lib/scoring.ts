// Deterministic market-opportunity scoring from validated live index data.

export interface MarketData {
  sectorKey: string;
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
  volumeTrend: "increasing" | "decreasing" | "stable";
  lastUpdated: string;
}

export type DecisionAction = "BUY" | "BUY ON DIP" | "SIP" | "WATCH" | "AVOID";

export interface SectorScores {
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
  action: DecisionAction;
  bullBearLabel: string;
  reasonForFall: string;
  reasonCategory: string;
  explanation: string;
  historicalPercentile: number;
}

export interface ScoringWeights {
  correction: number;
  technical: number;
  bullBear: number;
  valuation: number;
  reasonForFall: number;
  historicalCorrection: number;
  marketBreadth: number;
}

export const DEFAULT_WEIGHTS: ScoringWeights = {
  correction: 20,
  technical: 20,
  bullBear: 20,
  valuation: 15,
  reasonForFall: 10,
  historicalCorrection: 10,
  marketBreadth: 5,
};

function clamp(v: number, min: number, max: number): number { return Math.max(min, Math.min(max, v)); }

export function calcCorrectionScore(d: MarketData): number {
  const todayScore = clamp(Math.abs(Math.min(d.todayChange, 0)) * 15, 0, 30);
  const weekScore = clamp(Math.abs(Math.min(d.weekChange, 0)) * 5, 0, 20);
  const monthScore = clamp(Math.abs(Math.min(d.monthChange, 0)) * 3, 0, 20);
  const threeMonthScore = clamp(Math.abs(Math.min(d.threeMonthChange, 0)) * 2, 0, 15);
  const from52wHigh = d.high52w > 0 ? ((d.high52w - d.currentLevel) / d.high52w) * 100 : 0;
  return Math.round(clamp(todayScore + weekScore + monthScore + threeMonthScore + clamp(from52wHigh * 2, 0, 15), 0, 100));
}

export function calcTechnicalScore(d: MarketData): number {
  let score = 50;
  if (d.rsi14 < 30) score += 20; else if (d.rsi14 < 40) score += 12; else if (d.rsi14 < 50) score += 5; else if (d.rsi14 > 70) score -= 15; else if (d.rsi14 > 60) score -= 5;
  score += d.macdHistogram > 0 ? 8 : -5;
  score += d.currentLevel > d.dma200 ? 10 : -10;
  score += d.currentLevel > d.dma50 ? 5 : -5;
  if (d.adx > 25) score += 5;
  return Math.round(clamp(score, 0, 100));
}

export function calcBullBearScore(d: MarketData): number {
  let score = 50;
  score += d.currentLevel > d.dma200 ? 15 : -15;
  score += d.currentLevel > d.dma50 ? 10 : -10;
  score += d.currentLevel > d.dma20 ? 5 : -5;
  score += d.dma50 > d.dma200 ? 10 : -10;
  if (d.rsi14 > 40 && d.rsi14 < 60) score += 5;
  score += d.yearChange > 0 ? 10 : -5;
  score += d.threeMonthChange > 0 ? 5 : -3;
  return Math.round(clamp(score, 0, 100));
}

// Relative valuation proxy from distance to the 52-week range and recent correction.
export function calcValuationScore(d: MarketData): number {
  const from52wHigh = d.high52w > 0 ? ((d.high52w - d.currentLevel) / d.high52w) * 100 : 0;
  const from52wLow = d.low52w > 0 ? ((d.currentLevel - d.low52w) / d.low52w) * 100 : 0;
  let score = 50;
  if (from52wHigh > 20) score += 25; else if (from52wHigh > 15) score += 20; else if (from52wHigh > 10) score += 12; else if (from52wHigh > 5) score += 5;
  if (from52wLow < 10) score += 10; else if (from52wLow > 50) score -= 10;
  if (d.monthChange < -5) score += 8;
  if (d.threeMonthChange < -10) score += 7;
  return Math.round(clamp(score, 0, 100));
}

export function analyzeReasonForFall(d: MarketData, allData: MarketData[]): { reason: string; category: string; score: number } {
  const investable = allData.filter(x => x.todayChange !== 0 || x.sectorKey === d.sectorKey);
  const avgTodayChange = investable.reduce((s, x) => s + x.todayChange, 0) / Math.max(investable.length, 1);
  const fallingCount = investable.filter(x => x.todayChange < -0.5).length;
  const broadBased = fallingCount / Math.max(investable.length, 1) > 0.6;
  if (broadBased && Math.abs(d.todayChange - avgTodayChange) < 1.5) return { reason: "Broad market correction is affecting most tracked indices, suggesting a market-wide risk-off move rather than an isolated sector event.", category: "MARKET-WIDE FALL", score: 80 };
  if (d.todayChange < -3 && d.yearChange > 15) return { reason: "The index has had a strong one-year run and today's decline is consistent with profit booking after an extended advance.", category: "PROFIT BOOKING", score: 75 };
  if (!broadBased && d.todayChange < avgTodayChange - 2) return { reason: "The sector is materially underperforming the tracked market, consistent with sector rotation or a sector-specific catalyst.", category: "SECTOR ROTATION", score: 60 };
  if (d.todayChange < -2 && d.threeMonthChange < -15) return { reason: "Weakness has persisted across multiple months, increasing the probability that the decline is structural rather than a one-day correction.", category: "STRUCTURAL / MACRO", score: 45 };
  if (d.todayChange < -1 && d.currentLevel < d.dma200) return { reason: "The index is below its long-term trend while falling further, so the correction needs confirmation before capital is deployed aggressively.", category: "STRUCTURAL WEAKNESS", score: 30 };
  return { reason: "Live price and trend data do not provide enough evidence to classify the catalyst with confidence.", category: "INSUFFICIENT EVIDENCE", score: 55 };
}

export function calcFallQualityScore(d: MarketData, bullBear: number, valuation: number, reasonScore: number): number {
  let score = d.currentLevel > d.dma200 ? 25 : 5;
  score += valuation * 0.25;
  if (d.rsi14 < 35) score += 15; else if (d.rsi14 < 45) score += 8;
  score += reasonScore * 0.15;
  score += bullBear * 0.1;
  return Math.round(clamp(score, 0, 100));
}

export function calcOpportunityScore(correction: number, technical: number, bullBear: number, valuation: number, reasonScore: number, historicalCorrection: number, marketBreadth: number, weights: ScoringWeights = DEFAULT_WEIGHTS): number {
  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
  return Math.round(clamp((correction * weights.correction + technical * weights.technical + bullBear * weights.bullBear + valuation * weights.valuation + reasonScore * weights.reasonForFall + historicalCorrection * weights.historicalCorrection + marketBreadth * weights.marketBreadth) / totalWeight, 0, 100));
}

export function calcRiskScore(d: MarketData, bullBear: number): number {
  let risk = 30;
  if (d.currentLevel < d.dma200) risk += 20;
  if (d.rsi14 < 25) risk += 10;
  if (d.threeMonthChange < -15) risk += 15;
  if (bullBear < 40) risk += 15;
  if (d.adx > 30 && d.todayChange < -2) risk += 10;
  return Math.round(clamp(risk, 0, 100));
}

export function determineAction(opportunity: number, risk: number, bullBear: number, fallQuality: number, todayChange: number): DecisionAction {
  if (opportunity >= 78 && risk < 50 && bullBear >= 60 && fallQuality >= 70) return "BUY";
  if (opportunity >= 65 && risk < 65 && fallQuality >= 55) return todayChange < -1.5 ? "BUY ON DIP" : "SIP";
  if (opportunity >= 50 && risk < 75) return "SIP";
  return "WATCH";
}

export function getBullBearLabel(score: number): string { if (score >= 80) return "Strong Bullish"; if (score >= 60) return "Bullish"; if (score >= 40) return "Neutral"; if (score >= 20) return "Bearish"; return "Strong Bearish"; }

export function calcHistoricalCorrectionScore(todayChange: number): { score: number; percentile: number } {
  const absChange = Math.abs(todayChange); let percentile = 25;
  if (absChange > 5) percentile = 97; else if (absChange > 4) percentile = 94; else if (absChange > 3) percentile = 88; else if (absChange > 2) percentile = 78; else if (absChange > 1.5) percentile = 68; else if (absChange > 1) percentile = 55; else if (absChange > 0.5) percentile = 40;
  return { score: percentile, percentile };
}

export function generateExplanation(sectorName: string, d: MarketData, scores: Omit<SectorScores, "explanation">): string {
  const parts: string[] = [`${sectorName} moved ${d.todayChange >= 0 ? "up" : "down"} ${Math.abs(d.todayChange).toFixed(2)}% today.`];
  parts.push(scores.bullBearScore >= 60 ? `Trend remains ${scores.bullBearLabel.toLowerCase()}.` : scores.bullBearScore >= 40 ? "Trend is neutral around its moving-average structure." : "The index is below its longer-term trend, so risk remains elevated.");
  if (d.rsi14 < 35) parts.push(`RSI is oversold at ${d.rsi14.toFixed(1)}.`);
  parts.push(scores.reasonForFall);
  parts.push(scores.action === "BUY" ? "Conclusion: the live setup supports a direct allocation." : scores.action === "BUY ON DIP" ? "Conclusion: the setup is attractive on weakness; stagger the allocation." : scores.action === "SIP" ? "Conclusion: use a staggered SIP-style allocation rather than a one-shot entry." : "Conclusion: wait for confirmation before committing capital.");
  return parts.join(" ");
}

export function calculateAllScores(d: MarketData, allData: MarketData[], weights?: ScoringWeights): SectorScores {
  const correctionScore = calcCorrectionScore(d);
  const technicalScore = calcTechnicalScore(d);
  const bullBearScore = calcBullBearScore(d);
  const valuationScore = calcValuationScore(d);
  const { reason: reasonForFall, category: reasonCategory, score: reasonScore } = analyzeReasonForFall(d, allData);
  const { score: historicalCorrectionScore, percentile: historicalPercentile } = calcHistoricalCorrectionScore(d.todayChange);
  const marketBreadthScore = allData.filter(x => x.todayChange > 0).length / Math.max(allData.length, 1) * 100;
  const fallQualityScore = calcFallQualityScore(d, bullBearScore, valuationScore, reasonScore);
  const opportunityScore = calcOpportunityScore(correctionScore, technicalScore, bullBearScore, valuationScore, reasonScore, historicalCorrectionScore, marketBreadthScore, weights);
  const riskScore = calcRiskScore(d, bullBearScore);
  const action = determineAction(opportunityScore, riskScore, bullBearScore, fallQualityScore, d.todayChange);
  const bullBearLabel = getBullBearLabel(bullBearScore);
  const partialScores = { correctionScore, technicalScore, bullBearScore, valuationScore, reasonScore, historicalCorrectionScore, marketBreadthScore: Math.round(marketBreadthScore), fallQualityScore, opportunityScore, riskScore, action, bullBearLabel, reasonForFall, reasonCategory, historicalPercentile };
  return { ...partialScores, explanation: generateExplanation(d.sectorKey, d, partialScores) };
}
