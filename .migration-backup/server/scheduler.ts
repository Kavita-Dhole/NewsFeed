import { storage } from "./storage";
import { fetchAndProcessNews } from "./scraper";

function msUntilNext4amUTC(): number {
  const now = new Date();
  const next4am = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    4, 0, 0, 0
  ));
  if (next4am.getTime() <= now.getTime()) {
    next4am.setUTCDate(next4am.getUTCDate() + 1);
  }
  return next4am.getTime() - now.getTime();
}

async function runDailyRefresh() {
  const now = new Date().toISOString();
  console.log(`[Scheduler] Daily 4 AM refresh started at ${now}`);
  try {
    await storage.cleanupOldNews();
    await fetchAndProcessNews();
    console.log("[Scheduler] Daily refresh complete");
  } catch (err) {
    console.error("[Scheduler] Daily refresh failed:", err);
  }
  scheduleDailyRefresh();
}

function scheduleDailyRefresh() {
  const ms = msUntilNext4amUTC();
  const nextRun = new Date(Date.now() + ms).toISOString();
  console.log(`[Scheduler] Next daily refresh scheduled for ${nextRun} (in ${Math.round(ms / 60000)} min)`);
  setTimeout(runDailyRefresh, ms);
}

export function startScheduler() {
  scheduleDailyRefresh();
}
