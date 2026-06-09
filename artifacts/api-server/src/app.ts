import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { storage } from "./storage";
import { fetchAndProcessNews } from "./scraper";
import { startScheduler } from "./scheduler";
import { registerChatRoutes } from "./replit_integrations/chat";
import { registerImageRoutes } from "./replit_integrations/image";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

registerChatRoutes(app);
registerImageRoutes(app);

app.use("/api", router);

storage.seedNews().catch((err) => logger.error({ err }, "Failed to seed news"));
fetchAndProcessNews().catch((err) => logger.error({ err }, "Initial news fetch failed"));
startScheduler();

export default app;
