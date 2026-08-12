export const LIVE_DATA_CONTRACT = {
  primary: "NSE official allIndices feed for latest index levels and daily percentage changes",
  technicalHistory: "Yahoo Finance 1-year daily history for calculated RSI, MACD, moving averages, ADX approximation and drawdown",
  refresh: "Client requests /api/market with cache-busting and no-store; dashboard also refreshes every 60 seconds",
  safety: "If live data cannot be validated, the API returns 503 and the UI never fabricates market values",
} as const;
