import { pgTable, text, integer, real, timestamp, boolean, jsonb, serial, varchar } from "drizzle-orm/pg-core";

// User settings
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Portfolio holdings
export const portfolioHoldings = pgTable("portfolio_holdings", {
  id: serial("id").primaryKey(),
  sectorKey: varchar("sector_key", { length: 50 }).notNull(),
  fundName: text("fund_name").notNull(),
  investedAmount: real("invested_amount").notNull().default(0),
  currentValue: real("current_value").notNull().default(0),
  units: real("units").notNull().default(0),
  targetWeight: real("target_weight").notNull().default(0),
  category: varchar("category", { length: 20 }).notNull().default("core"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Signal history
export const signalHistory = pgTable("signal_history", {
  id: serial("id").primaryKey(),
  date: varchar("date", { length: 10 }).notNull(),
  sectorKey: varchar("sector_key", { length: 50 }).notNull(),
  todayFall: real("today_fall"),
  opportunityScore: integer("opportunity_score"),
  technicalScore: integer("technical_score"),
  bullBearScore: integer("bull_bear_score"),
  correctionScore: integer("correction_score"),
  fallQualityScore: integer("fall_quality_score"),
  action: varchar("action", { length: 30 }),
  recommendedFund: text("recommended_fund"),
  suggestedAmount: real("suggested_amount"),
  navAtSignal: real("nav_at_signal"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Watchlist
export const watchlist = pgTable("watchlist", {
  id: serial("id").primaryKey(),
  sectorKey: varchar("sector_key", { length: 50 }).notNull().unique(),
  addedAt: timestamp("added_at").defaultNow().notNull(),
});

// Daily investment logs
export const investmentLogs = pgTable("investment_logs", {
  id: serial("id").primaryKey(),
  date: varchar("date", { length: 10 }).notNull(),
  totalAmount: real("total_amount").notNull(),
  allocations: jsonb("allocations").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
