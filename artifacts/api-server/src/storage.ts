import { db } from "./db";
import { news, type InsertNews, type NewsItem, getDbRegions } from "@workspace/db";
import { eq, desc, and, gte, lt, inArray } from "drizzle-orm";

export interface IStorage {
  getNews(filters?: { topics?: string[]; region?: string }): Promise<NewsItem[]>;
  getNewsItem(id: number): Promise<NewsItem | undefined>;
  getNewsByExternalId(externalId: string): Promise<NewsItem | undefined>;
  createNews(item: InsertNews): Promise<NewsItem>;
  seedNews(): Promise<void>;
  cleanupOldNews(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getNews(filters?: { topics?: string[]; region?: string }): Promise<NewsItem[]> {
    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
    let conditions = [gte(news.createdAt, twelveHoursAgo)];

    const selectedTopics = (filters?.topics ?? []).filter(t => t !== "All");
    const realTopics = selectedTopics.filter(t => t !== "Trending");

    // Always apply real topic filters — "Trending" only controls sort order, not WHERE
    if (realTopics.length === 1) {
      conditions.push(eq(news.topic, realTopics[0]));
    } else if (realTopics.length > 1) {
      conditions.push(inArray(news.topic, realTopics));
    }

    // Map UI region selection to one or more DB region values
    const dbRegions = filters?.region && filters.region !== "All"
      ? getDbRegions(filters.region)
      : undefined;

    if (dbRegions && dbRegions.length === 1) {
      conditions.push(eq(news.region, dbRegions[0]));
    } else if (dbRegions && dbRegions.length > 1) {
      conditions.push(inArray(news.region, dbRegions));
    }

    const priorityMap: Record<string, number> = {
      "Euronews": 1,
      "Belga": 2,
      "Le Soir": 3,
      "De Standaard": 4,
      "VRT NWS": 5,
      "RTBF": 6,
      "Brussels Times": 7,
      "BRUZZ": 8
    };

    const results = await db.select()
      .from(news)
      .where(and(...conditions))
      .orderBy(desc(news.createdAt));

    // Custom sorting based on source priority if it's the Belgium region and no specific topic is selected
    if (filters?.region === "Belgium" && realTopics.length === 0) {
      return results.sort((a, b) => {
        const priorityA = priorityMap[a.source] ?? 99;
        const priorityB = priorityMap[b.source] ?? 99;
        
        if (priorityA !== priorityB) {
          return priorityA - priorityB;
        }
        return new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime();
      });
    }

    return results;
  }

  async cleanupOldNews(): Promise<void> {
    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
    try {
      const result = await db.delete(news).where(lt(news.createdAt, twelveHoursAgo)).returning({ id: news.id });
      console.log(`Cleanup: Removed ${result.length} articles older than 12 hours`);
    } catch (e) {
      console.error("Cleanup error", e);
    }
  }

  async getNewsItem(id: number): Promise<NewsItem | undefined> {
    const [item] = await db.select().from(news).where(eq(news.id, id));
    return item;
  }

  async getNewsByExternalId(externalId: string): Promise<NewsItem | undefined> {
    const [item] = await db.select().from(news).where(eq(news.externalId, externalId));
    return item;
  }

  async createNews(item: InsertNews): Promise<NewsItem> {
    const [newItem] = await db.insert(news).values(item).returning();
    return newItem;
  }

  async seedNews(): Promise<void> {
    const count = await db.select().from(news);
    if (count.length > 0) return;

    const sampleNews: InsertNews[] = [
      {
        title: "Brussels Announces New Green Initiative",
        summary: "The capital outlines ambitious plans for urban parks and reduced traffic.",
        content: "Brussels has unveiled a comprehensive plan to increase green spaces across the city. The initiative includes the creation of three new major parks and the pedestrianization of several key districts. City officials aim to reduce carbon emissions by 20% within the next five years through these measures. Local businesses have expressed mixed reactions, with some concerned about delivery access, while others welcome the potential for increased foot traffic.",
        imageUrl: "https://images.unsplash.com/photo-1559410545-0219601d8487?auto=format&fit=crop&q=80",
        source: "Brussels Times",
        topic: "Politics",
        region: "Belgium"
      },
      {
        title: "Belgian National Team Prepares for Euro Cup",
        summary: "The Red Devils are training hard ahead of the upcoming European championship.",
        content: "The Belgian national football team, known as the Red Devils, has begun their intensive training camp for the upcoming Euro Cup. Coach Tedesco is focusing on integrating young talent with experienced veterans. Key players like De Bruyne are reported to be in top form. The team faces a challenging group stage but remains optimistic about their chances of bringing the trophy home.",
        imageUrl: "https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&q=80",
        source: "Sporza",
        topic: "Sports",
        region: "Belgium"
      },
      {
        title: "EU Tech Regulation Summit Held in Strasbourg",
        summary: "Leaders discuss the future of AI and digital privacy in the European Union.",
        content: "European Union leaders gathered in Strasbourg today to discuss the implementation of the new AI Act. The summit focused on balancing innovation with citizen privacy and safety. Tech giants were also present to voice their concerns regarding compliance costs. The EU commissioner emphasized that these regulations are a global benchmark for ethical AI development.",
        imageUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80",
        source: "Euractiv",
        topic: "Tech",
        region: "Europe"
      },
      {
        title: "Global Markets Rally on Tech Earnings",
        summary: "Stock markets worldwide see gains as major tech companies report strong profits.",
        content: "Global stock markets experienced a significant rally today, driven by better-than-expected earnings reports from major technology corporations. The S&P 500 and Nasdaq hit new highs, with European and Asian markets following suit. Analysts attribute the surge to the continued boom in artificial intelligence and cloud computing services, which has boosted investor confidence.",
        imageUrl: "https://images.unsplash.com/photo-1611974765270-ca1258634369?auto=format&fit=crop&q=80",
        source: "Bloomberg",
        topic: "Business",
        region: "World"
      },
      {
        title: "Antwerp Fashion Week Highlights Sustainable Design",
        summary: "Designers showcase eco-friendly collections in Belgium's fashion capital.",
        content: "Antwerp Fashion Week kicked off with a strong focus on sustainability. Emerging designers presented collections made entirely from recycled materials and organic fabrics. The event highlights Belgium's growing role in the sustainable fashion movement. Industry experts praised the innovative techniques used to create high-fashion garments with minimal environmental impact.",
        imageUrl: "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&q=80",
        source: "Vogue",
        topic: "Entertainment",
        region: "Belgium"
      },
       {
        title: "Breakthrough in Renewable Energy Storage",
        summary: "Scientists develop a new battery technology that could revolutionize solar power.",
        content: "Researchers at a leading European university have announced a breakthrough in battery technology. The new solid-state battery promises to double the storage capacity of current lithium-ion batteries while being safer and faster to charge. This development could significantly accelerate the adoption of renewable energy sources like solar and wind by solving the intermittency problem.",
        imageUrl: "https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&q=80",
        source: "Science Daily",
        topic: "Science",
        region: "World"
      }
    ];

    for (const item of sampleNews) {
      await this.createNews(item);
    }
  }
}

export const storage = new DatabaseStorage();
