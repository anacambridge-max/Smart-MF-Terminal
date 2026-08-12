export interface SectorDef {
  key: string;
  name: string;
  fullName: string;
  role: string;
  targetWeight: number;
  category: "core" | "sector" | "defensive";
  recommendedFund: string;
  fundAMC: string;
  expenseRatio: number;
  aumCr: number;
}

export const SECTORS: SectorDef[] = [
  // CORE
  { key: "nifty50", name: "Nifty 50", fullName: "Nifty 50 Index", role: "Core Large Cap", targetWeight: 20, category: "core", recommendedFund: "UTI Nifty 50 Index Fund Direct Growth", fundAMC: "UTI", expenseRatio: 0.18, aumCr: 18500 },
  { key: "niftynext50", name: "Nifty Next 50", fullName: "Nifty Next 50 Index", role: "Large Cap Growth", targetWeight: 8, category: "core", recommendedFund: "UTI Nifty Next 50 Index Fund Direct Growth", fundAMC: "UTI", expenseRatio: 0.27, aumCr: 4200 },
  { key: "niftymidcap150", name: "Nifty Midcap 150", fullName: "Nifty Midcap 150 Index", role: "Mid Cap Growth", targetWeight: 12, category: "core", recommendedFund: "Motilal Oswal Nifty Midcap 150 Index Fund Direct Growth", fundAMC: "Motilal Oswal", expenseRatio: 0.30, aumCr: 3800 },
  { key: "niftysmallcap250", name: "Nifty Smallcap 250", fullName: "Nifty Smallcap 250 Index", role: "Small Cap Growth", targetWeight: 8, category: "core", recommendedFund: "Motilal Oswal Nifty Smallcap 250 Index Fund Direct Growth", fundAMC: "Motilal Oswal", expenseRatio: 0.36, aumCr: 2100 },
  { key: "nifty500", name: "Nifty 500", fullName: "Nifty 500 Multicap Index", role: "Broad Diversification", targetWeight: 7, category: "core", recommendedFund: "Motilal Oswal Nifty 500 Index Fund Direct Growth", fundAMC: "Motilal Oswal", expenseRatio: 0.28, aumCr: 1500 },
  // SECTOR / TACTICAL
  { key: "niftybank", name: "Nifty Bank", fullName: "Nifty Bank Index", role: "Banking", targetWeight: 5, category: "sector", recommendedFund: "Nippon India Nifty Bank Index Fund Direct Growth", fundAMC: "Nippon India", expenseRatio: 0.20, aumCr: 1200 },
  { key: "niftyfin", name: "Nifty Financial", fullName: "Nifty Financial Services Index", role: "Financial Ecosystem", targetWeight: 4, category: "sector", recommendedFund: "Nippon India Nifty Financial Services Index Fund Direct Growth", fundAMC: "Nippon India", expenseRatio: 0.28, aumCr: 680 },
  { key: "niftyit", name: "Nifty IT", fullName: "Nifty IT Index", role: "Technology", targetWeight: 4, category: "sector", recommendedFund: "ICICI Prudential Nifty IT Index Fund Direct Growth", fundAMC: "ICICI Prudential", expenseRatio: 0.29, aumCr: 920 },
  { key: "niftypharma", name: "Nifty Pharma", fullName: "Nifty Pharma Index", role: "Pharma", targetWeight: 4, category: "sector", recommendedFund: "ICICI Prudential Nifty Pharma Index Fund Direct Growth", fundAMC: "ICICI Prudential", expenseRatio: 0.31, aumCr: 440 },
  { key: "niftyauto", name: "Nifty Auto", fullName: "Nifty Auto Index", role: "Auto/EV/Ancillary", targetWeight: 3, category: "sector", recommendedFund: "ICICI Prudential Nifty Auto Index Fund Direct Growth", fundAMC: "ICICI Prudential", expenseRatio: 0.32, aumCr: 310 },
  { key: "niftyfmcg", name: "Nifty FMCG", fullName: "Nifty FMCG Index", role: "Defensive Consumption", targetWeight: 3, category: "sector", recommendedFund: "ICICI Prudential Nifty FMCG Index Fund Direct Growth", fundAMC: "ICICI Prudential", expenseRatio: 0.30, aumCr: 280 },
  { key: "niftymetal", name: "Nifty Metal", fullName: "Nifty Metal Index", role: "Cyclical/Commodity", targetWeight: 3, category: "sector", recommendedFund: "ICICI Prudential Nifty Metal Index Fund Direct Growth", fundAMC: "ICICI Prudential", expenseRatio: 0.33, aumCr: 210 },
  { key: "niftyhealthcare", name: "Nifty Healthcare", fullName: "Nifty Healthcare Index", role: "Healthcare", targetWeight: 3, category: "sector", recommendedFund: "ICICI Prudential Nifty Healthcare Index Fund Direct Growth", fundAMC: "ICICI Prudential", expenseRatio: 0.32, aumCr: 190 },
  { key: "niftyinfra", name: "Nifty Infra", fullName: "Nifty Infrastructure Index", role: "Infrastructure/Capex", targetWeight: 3, category: "sector", recommendedFund: "ICICI Prudential Nifty Infrastructure Index Fund Direct Growth", fundAMC: "ICICI Prudential", expenseRatio: 0.35, aumCr: 160 },
  { key: "niftyrealty", name: "Nifty Realty", fullName: "Nifty Realty Index", role: "Real Estate", targetWeight: 3, category: "sector", recommendedFund: "Nippon India Nifty Realty Index Fund Direct Growth", fundAMC: "Nippon India", expenseRatio: 0.38, aumCr: 120 },
  // DEFENSIVE
  { key: "debtliquid", name: "Debt/Liquid", fullName: "Debt/Liquid Fund", role: "Stability/Correction Reserve", targetWeight: 5, category: "defensive", recommendedFund: "Parag Parikh Liquid Fund Direct Growth", fundAMC: "PPFAS", expenseRatio: 0.22, aumCr: 8400 },
  { key: "goldetf", name: "Gold ETF", fullName: "Gold ETF/Fund", role: "Diversifier", targetWeight: 3, category: "defensive", recommendedFund: "Nippon India Gold Savings Fund Direct Growth", fundAMC: "Nippon India", expenseRatio: 0.15, aumCr: 3200 },
];

export function getSectorByKey(key: string): SectorDef | undefined {
  return SECTORS.find(s => s.key === key);
}

export const CORE_SECTORS = SECTORS.filter(s => s.category === "core");
export const TACTICAL_SECTORS = SECTORS.filter(s => s.category === "sector");
export const DEFENSIVE_SECTORS = SECTORS.filter(s => s.category === "defensive");
