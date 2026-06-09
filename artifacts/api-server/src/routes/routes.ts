import { Router, type IRouter } from "express";
import { storage } from "../storage";
import { insertNewsSchema } from "@workspace/db";
import { z } from "zod";
import { fetchAndProcessNews } from "../scraper";

const router: IRouter = Router();

router.post("/news/refresh", async (_req, res) => {
  try {
    fetchAndProcessNews().catch(console.error);
    res.json({ message: "News refresh started in background" });
  } catch (error) {
    res.status(500).json({ message: "Failed to start news refresh" });
  }
});

router.get("/news", async (req, res) => {
  try {
    const rawTopics = req.query.topics as string | undefined;
    const topics = rawTopics
      ? rawTopics.split(",").map(t => t.trim()).filter(t => t && t !== "All")
      : undefined;

    const filters = {
      topics: topics && topics.length > 0 ? topics : undefined,
      region: req.query.region as string | undefined
    };

    if (filters.region === "All") filters.region = undefined;

    const news = await storage.getNews(filters);
    res.json(news);
  } catch (error) {
    console.error("[ERROR] GET /api/news failed:", error);
    res.status(500).json({ message: "Failed to fetch news" });
  }
});

router.get("/news/:id", async (req, res) => {
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

router.post("/news", async (req, res) => {
  try {
    const input = insertNewsSchema.parse(req.body);
    const item = await storage.createNews(input);
    res.status(201).json(item);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({
        message: err.issues[0].message,
        field: err.issues[0].path.join('.'),
      });
    }
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
