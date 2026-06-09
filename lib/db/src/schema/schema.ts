import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export * from "./models/chat";

export const news = pgTable("news", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  content: text("content").notNull(),
  imageUrl: text("image_url").notNull(),
  source: text("source").notNull(),
  topic: text("topic").notNull(), // e.g., "Politics", "Sports", "Tech"
  region: text("region").notNull(), // stored as DB region e.g. "Belgium", "Europe", "World", "Middle East"
  externalId: text("external_id").unique(), // For tracking scraped articles
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertNewsSchema = createInsertSchema(news).omit({ 
  id: true, 
  createdAt: true 
});

export type NewsItem = typeof news.$inferSelect;
export type InsertNews = z.infer<typeof insertNewsSchema>;

export const topics = [
  "Trending",
  "Politics",
  "Business", 
  "Tech",
  "Science",
  "Health",
  "Sports",
  "Entertainment"
] as const;

export const regions = [
  // Europe — country level
  "Belgium",
  "Netherlands",
  "France",
  "Germany",
  "South Europe",
  "North Europe",
  "Europe",
  // Middle East
  "UAE",
  "Middle East",
  // Asia
  "India",
  "China",
  "Asia",
  // Americas
  "USA",
  "Canada",
  "Brazil",
  "Mexico",
  "North America",
  "South America",
  // Rest
  "Africa",
  "Oceania",
  "World"
] as const;

// Maps a UI region selection to one or more DB region values.
// Country-level selections → exact match only.
// Continent-level selections → expand to all sub-regions stored in DB.
export function getDbRegions(region: string): string[] {
  const expansions: Record<string, string[]> = {
    // Continent-level: expand to all sub-regions stored in DB
    "Europe":        ["Europe", "Belgium", "Netherlands", "France", "Germany", "South Europe", "North Europe"],
    "Middle East":   ["Middle East", "UAE"],
    "Asia":          ["Asia", "India", "China"],
    "North America": ["North America", "USA", "Canada"],
    "South America": ["South America", "Brazil", "Mexico"],
    "World":         ["World"],
    // Country-level European regions: also include pan-European content (Euronews etc.)
    "Belgium":       ["Belgium", "Europe"],
    "Netherlands":   ["Netherlands", "Europe"],
    "France":        ["France", "Europe"],
    "Germany":       ["Germany", "Europe"],
    "South Europe":  ["South Europe", "Europe"],
    "North Europe":  ["North Europe", "Europe"],
    // UAE: also include broader Middle East content
    "UAE":           ["UAE", "Middle East"],
    // Mexico: also include Latin American content
    "Mexico":        ["Mexico", "South America"],
  };
  return expansions[region] ?? [region];
}

/** @deprecated use getDbRegions */
export function getDbRegion(region: string): string {
  return getDbRegions(region)[0];
}
