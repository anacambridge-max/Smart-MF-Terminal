// Scoring engine — produces deterministic but realistic scores based on market data

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
  action: "STRONG BUY" | "ACCUMULATE" | "WATCH" | "WAIT" | "AVOID";
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

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export function calcCorrectionScore(d: MarketData): number {
  const todayScore = clamp(Math.abs(d.todayChange) * 15, 0, 30);
  const weekScore = clamp(Math.abs(Math.min(d.weekChange, 0)) * 5, 0, 20);
  const monthScore = clamp(Math.abs(Math.min(d.monthChange, 0)) * 3, 0, 20);
  const threeMonthScore = clamp(Math.abs(Math.min(d.threeMonthChange, 0)) * 2, 0, 15);
  const from52wHigh = ((d.high52w - d.currentLevel) / d.high52w) * 100;
  const highScore = clamp(from52wHigh * 2, 0, 15);
  return Math.round(clamp(todayScore + weekScore + monthScore + threeMonthScore + highScore, 0, 100));
}

export function calcTechnicalScore(d: MarketData): number {
  let score = 50;
  // RSI
  if (d.rsi14 < 30) score += 20;
  else if (d.rsi14 < 40) score += 12;
  else if (d.rsi14 < 50) score += 5;
  else if (d.rsi14 > 70) score -= 15;
  else if (d.rsi14 > 60) score -= 5;
  // MACD
  if (d.macdHistogram > 0) score += 8;
  else score -= 5;
  // Price vs DMAs
  if (d.currentLevel > d.dma200) score += 10;
  else score -= 10;
  if (d.currentLevel > d.dma50) score += 5;
  else score -= 5;
  // ADX
  if (d.adx > 25) score += 5;
  return Math.round(clamp(score, 0, 100));
}

export function calcBullBearScore(d: MarketData): number {
  let score = 50;
  if (d.currentLevel > d.dma200) score += 15; else score -= 15;
  if (d.currentLevel > d.dma50) score += 10; else score -= 10;
  if (d.currentLevel > d.dma20) score += 5; else score -= 5;
  if (d.dma50 > d.dma200) score += 10; else score -= 10;
  if (d.rsi14 > 40 && d.rsi14 < 60) score += 5;
  if (d.yearChange > 0) score += 10; else score -= 5;
  if (d.threeMonthChange > 0) score += 5; else score -= 3;
  return Math.round(clamp(score, 0, 100));
}

export function calcValuationScore(d: MarketData): number {
  const from52wHigh = ((d.high52w - d.currentLevel) / d.high52w) * 100;
  const from52wLow = ((d.currentLevel - d.low52w) / d.low52w) * 100;
  let score = 50;
  if (from52wHigh > 20) score += 25;
  else if (from52wHigh > 15) score += 20;
  else if (from52wHigh > 10) score += 12;
  else if (from52wHigh > 5) score += 5;
  if (from52wLow < 10) score += 10;
  else if (from52wLow > 50) score -= 10;
  if (d.monthChange < -5) score += 8;
  if (d.threeMonthChange < -10) score += 7;
  return Math.round(clamp(score, 0, 100));
}

export function analyzeReasonForFall(d: MarketData, allData: MarketData[]): { reason: string; category: string; score: number } {
  const avgTodayChange = allData.reduce((s, x) => s + x.todayChange, 0) / allData.length;
  const fallingCount = allData.filter(x => x.todayChange < -0.5).length;
  const totalCount = allData.length;
  const broadBased = fallingCount / totalCount > 0.6;

  if (broadBased && Math.abs(d.todayChange - avgTodayChange) < 1.5) {
    return {
      reason: "Broad market correction affecting most sectors. The decline is part of a wider risk-off move rather than sector-specific issues.",
      category: "MARKET-WIDE FALL",
      score: 80,
    };
  }
  if (d.todayChange < -3 && d.yearChange > 15) {
    return {
      reason: "Sector had a strong rally over the past year. Today's decline appears to be profit booking after an extended up-move.",
      category: "PROFIT BOOKING",
      score: 75,
    };
  }
  if (!broadBased && d.todayChange < avgTodayChange - 2) {
    return {
      reason: "The sector is underperforming broader markets significantly, suggesting sector rotation or sector-specific negative catalysts.",
      category: "SECTOR ROTATION",
      score: 60,
    };
  }
  if (d.todayChange < -2 && d.threeMonthChange < -15) {
    return {
      reason: "Continued weakness in the sector over multiple months may indicate structural concerns or sustained adverse macro conditions.",
      category: "MACRO EVENT",
      score: 45,
    };
  }
  if (d.todayChange < -1 && d.currentLevel < d.dma200) {
    return {
      reason: "Sector trading below long-term trend with further weakness. May indicate fundamental deterioration.",
      category: "STRUCTURAL PROBLEM",
      score: 30,
    };
  }
  return {
    reason: "Insufficient evidence to classify the reason definitively. Monitor for further developments.",
    category: "UNKNOWN / INSUFFICIENT DATA",
    score: 55,
  };
}

export function calcFallQualityScore(d: MarketData, bullBear: number, valuation: number, reasonScore: number): number {
  let score = 0;
  // Long-term trend bullish?
  if (d.currentLevel > d.dma200) score += 25; else score += 5;
  // Valuation attractive?
  score += valuation * 0.25;
  // RSI oversold?
  if (d.rsi14 < 35) score += 15;
  else if (d.rsi14 < 45) score += 8;
  // Reason temporary?
  score += reasonScore * 0.15;
  // Bull/Bear positive?
  score += bullBear * 0.1;
  return Math.round(clamp(score, 0, 100));
}

export function calcOpportunityScore(
  correction: number,
  technical: number,
  bullBear: number,
  valuation: number,
  reasonScore: number,
  historicalCorrection: number,
  marketBreadth: number,
  weights: ScoringWeights = DEFAULT_WEIGHTS,
): number {
  const totalWeight = weights.correction + weights.technical + weights.bullBear + weights.valuation + weights.reasonForFall + weights.historicalCorrection + weights.marketBreadth;
  const score = (
    correction * weights.correction +
    technical * weights.technical +
    bullBear * weights.bullBear +
    valuation * weights.valuation +
    reasonScore * weights.reasonForFall +
    historicalCorrection * weights.historicalCorrection +
    marketBreadth * weights.marketBreadth
  ) / totalWeight;
  return Math.round(clamp(score, 0, 100));
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

export function determineAction(opportunity: number, risk: number, bullBear: number, fallQuality: number): "STRONG BUY" | "ACCUMULATE" | "WATCH" | "WAIT" | "AVOID" {
  if (opportunity >= 80 && risk < 50 && bullBear >= 60 && fallQuality >= 70) return "STRONG BUY";
  if (opportunity >= 65 && risk < 65 && fallQuality >= 55) return "ACCUMULATE";
  if (opportunity >= 50 && risk < 75) return "WATCH";
  if (opportunity >= 35) return "WAIT";
  return "AVOID";
}

export function getBullBearLabel(score: number): string {
  if (score >= 80) return "Strong Bullish";
  if (score >= 60) return "Bullish";
  if (score >= 40) return "Neutral";
  if (score >= 20) return "Bearish";
  return "Strong Bearish";
}

export function calcHistoricalCorrectionScore(todayChange: number): { score: number; percentile: number } {
  // Based on typical Nifty sector daily volatility
  const absChange = Math.abs(todayChange);
  let percentile = 50;
  if (absChange > 5) percentile = 97;
  else if (absChange > 4) percentile = 94;
  else if (absChange > 3) percentile = 88;
  else if (absChange > 2) percentile = 78;
  else if (absChange > 1.5) percentile = 68;
  else if (absChange > 1) percentile = 55;
  else if (absChange > 0.5) percentile = 40;
  else percentile = 25;
  return { score: percentile, percentile };
}

export function generateExplanation(
  sectorName: string,
  d: MarketData,
  scores: Omit<SectorScores, "explanation">,
): string {
  const parts: string[] = [];
  parts.push(`${sectorName} declined ${Math.abs(d.todayChange).toFixed(2)}% today, placing this correction in the ${scores.historicalPercentile}th percentile of historical daily declines.`);
  
  if (scores.bullBearScore >= 60) {
    parts.push(`The sector remains above its long-term trend with a ${scores.bullBearLabel.toLowerCase()} outlook.`);
  } else if (scores.bullBearScore >= 40) {
    parts.push(`The sector shows a neutral trend, trading near its long-term moving averages.`);
  } else {
    parts.push(`The sector is below its long-term trend, which warrants caution despite the correction.`);
  }

  if (d.rsi14 < 35) {
    parts.push(`RSI has entered oversold territory at ${d.rsi14.toFixed(1)}, which historically tends to precede mean reversion.`);
  }

  parts.push(scores.reasonForFall);

  if (scores.action === "STRONG BUY" || scores.action === "ACCUMULATE") {
    parts.push(`Conclusion: ${scores.action === "STRONG BUY" ? "Deploy allocation as the risk/reward setup is favorable." : "Accumulate gradually rather than deploying the entire amount at once."}`);
  } else if (scores.action === "WATCH") {
    parts.push(`Conclusion: Monitor for further confirmation before committing capital.`);
  } else {
    parts.push(`Conclusion: Wait for clearer signals before investing.`);
  }

  return parts.join(" ");
}

export function calculateAllScores(d: MarketData, allData: MarketData[], weights?: ScoringWeights): SectorScores {
  const w = weights || DEFAULT_WEIGHTS;
  const correctionScore = calcCorrectionScore(d);
  const technicalScore = calcTechnicalScore(d);
  const bullBearScore = calcBullBearScore(d);
  const valuationScore = calcValuationScore(d);
  const { reason: reasonForFall, category: reasonCategory, score: reasonScore } = analyzeReasonForFall(d, allData);
  const { score: historicalCorrectionScore, percentile: historicalPercentile } = calcHistoricalCorrectionScore(d.todayChange);
  const marketBreadthScore = allData.filter(x => x.todayChange > 0).length / allData.length * 100;
  const fallQualityScore = calcFallQualityScore(d, bullBearScore, valuationScore, reasonScore);
  const opportunityScore = calcOpportunityScore(correctionScore, technicalScore, bullBearScore, valuationScore, reasonScore, historicalCorrectionScore, marketBreadthScore, w);
  const riskScore = calcRiskScore(d, bullBearScore);
  const action = determineAction(opportunityScore, riskScore, bullBearScore, fallQualityScore);
  const bullBearLabel = getBullBearLabel(bullBearScore);

  const partialScores = {
    correctionScore, technicalScore, bullBearScore, valuationScore, reasonScore, historicalCorrectionScore,
    marketBreadthScore: Math.round(marketBreadthScore), fallQualityScore, opportunityScore, riskScore,
    action, bullBearLabel, reasonForFall, reasonCategory, historicalPercentile,
  };

  const explanation = generateExplanation(d.sectorKey, d, partialScores);

  return { ...partialScores, explanation };
}
