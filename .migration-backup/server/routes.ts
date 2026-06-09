import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

import { registerChatRoutes } from "./replit_integrations/chat";
import { registerImageRoutes } from "./replit_integrations/image";
import { fetchAndProcessNews } from "./scraper";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Register AI Integrations
  registerChatRoutes(app);
  registerImageRoutes(app);

  // Seed and initial scrape
  await storage.seedNews();
  // Trigger news fetch in background
  fetchAndProcessNews().catch(console.error);

  // Endpoint to manually trigger refresh
  app.post("/api/news/refresh", async (_req, res) => {
    try {
      fetchAndProcessNews().catch(console.error);
      res.json({ message: "News refresh started in background" });
    } catch (error) {
      res.status(500).json({ message: "Failed to start news refresh" });
    }
  });

  app.get(api.news.list.path, async (req, res) => {
    try {
      const rawTopics = req.query.topics as string | undefined;
      const topics = rawTopics
        ? rawTopics.split(",").map(t => t.trim()).filter(t => t && t !== "All")
        : undefined;

      const filters = {
        topics: topics && topics.length > 0 ? topics : undefined,
        region: req.query.region as string | undefined
      };

      console.log("[DEBUG] parsed topics:", filters.topics);
      console.log("[DEBUG] region:", filters.region);

      if (filters.region === "All") filters.region = undefined;

      const news = await storage.getNews(filters);
      res.json(news);
    } catch (error) {
      console.error("[ERROR] GET /api/news failed:", error);
      res.status(500).json({ message: "Failed to fetch news" });
    }
  });

  app.get(api.news.get.path, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }
      
      const item = await storage.getNewsItem(id);
      if (!item) {
        return res.status(404).json({ message: "News item not found" });
      }
      
      res.json(item);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch news item" });
    }
  });

  app.post(api.news.create.path, async (req, res) => {
    try {
      const input = api.news.create.input.parse(req.body);
      const item = await storage.createNews(input);
      res.status(201).json(item);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  return httpServer;
}
