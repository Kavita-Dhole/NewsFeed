export interface NewsItem {
  id: number;
  title: string;
  summary: string;
  content: string;
  imageUrl: string;
  source: string;
  topic: string;
  region: string;
  externalId: string | null;
  createdAt: string | null;
}

export interface NewsFilters {
  topics?: string[];
  region?: string;
  limit?: number;
  offset?: number;
}

export const TOPICS = [
  "Trending",
  "Politics",
  "Business",
  "Tech",
  "Science",
  "Health",
  "Sports",
  "Entertainment",
] as const;

export type Topic = (typeof TOPICS)[number];

export const REGION_GROUPS = [
  {
    label: "Europe",
    flag: "🇪🇺",
    regions: ["Belgium", "Netherlands", "France", "Germany", "South Europe", "North Europe", "Europe"],
  },
  {
    label: "Middle East",
    flag: "🌍",
    regions: ["UAE", "Middle East"],
  },
  {
    label: "Asia",
    flag: "🌏",
    regions: ["India", "China", "Asia"],
  },
  {
    label: "Americas",
    flag: "🌎",
    regions: ["USA", "Canada", "Brazil", "Mexico", "North America", "South America"],
  },
  {
    label: "Rest of World",
    flag: "🌐",
    regions: ["Africa", "Oceania", "World"],
  },
];
