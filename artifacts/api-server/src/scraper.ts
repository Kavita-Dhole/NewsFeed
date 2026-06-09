import Parser from "rss-parser";
import { JSDOM, VirtualConsole } from "jsdom";
import OpenAI from "openai";
import { storage } from "./storage";
import { type InsertNews } from "@workspace/db";

const parser = new Parser();
const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const SOURCES = [
  { name: "BRUZZ", url: "https://www.bruzz.be/rss.xml", region: "Belgium", language: "nl" },
  { name: "VRT NWS", url: "https://www.vrt.be/vrtnws/nl.rss.articles.xml", region: "Belgium", language: "nl" },
  { name: "DW", url: "https://rss.dw.com/rdf/rss-en-all", region: "Europe", language: "en" },
  { name: "BBC", url: "http://feeds.bbci.co.uk/news/world/rss.xml", region: "World", language: "en" },
  { name: "Reuters", url: "https://www.reutersagency.com/feed/?best-topics=top-news&post_type=best", region: "World", language: "en" },
  { name: "The Bulletin", url: "https://www.thebulletin.be/rss.xml", region: "Belgium", language: "en" },
  { name: "Euronews", url: "https://www.euronews.com/rss?level=theme&name=news", region: "Europe", language: "en" },
  { name: "Le Soir", url: "https://www.lesoir.be/rss/81851/extract.xml", region: "Belgium", language: "fr" },
  { name: "HLN", url: "https://www.hln.be/rss.xml", region: "Belgium", language: "nl" },
  { name: "RTBF", url: "https://www.rtbf.be/rss/info.xml", region: "Belgium", language: "fr" },
  { name: "De Tijd", url: "https://www.tijd.be/rss/algemeen.xml", region: "Belgium", language: "nl" },
  { name: "L'Echo", url: "https://www.lecho.be/rss/actualite.xml", region: "Belgium", language: "fr" },
  { name: "Belga", url: "https://www.belga.be/rss", region: "Belgium", language: "en" },
  { name: "De Standaard", url: "https://www.standaard.be/rss/section/1f282490-bd2f-4614-aa45-406cb0c0cfad", region: "Belgium", language: "nl" },
  { name: "Brussels Times", url: "https://www.brusselstimes.com/feed", region: "Belgium", language: "en" },
  // Markets & Trading floors
  { name: "Bloomberg", url: "https://www.bloomberg.com/politics/feeds/site.xml", region: "World", language: "en" },
  { name: "CNBC", url: "https://search.cnbc.com/rs/search/combined/rss/rss.html?query=top%20news", region: "World", language: "en" },
  // AI, Startups & VC
  { name: "TechCrunch", url: "https://techcrunch.com/feed/", region: "World", language: "en" },
  { name: "VentureBeat", url: "https://venturebeat.com/feed/", region: "World", language: "en" },
  { name: "Wired", url: "https://www.wired.com/feed/rss", region: "World", language: "en" },
  // Policy & Regulation
  { name: "The Economist", url: "https://www.economist.com/the-world-this-week/rss.xml", region: "World", language: "en" },
  { name: "NYT", url: "https://rss.nytimes.com/services/xml/rss/nyt/World.xml", region: "World", language: "en" },
  { name: "The Guardian", url: "https://www.theguardian.com/world/rss", region: "World", language: "en" },
  // State Narratives
  { name: "Xinhua", url: "http://www.xinhuanet.com/english/rss/worldrss.xml", region: "World", language: "en" },
  { name: "Anadolu", url: "https://www.aa.com.tr/en/rss/default?cat=world", region: "World", language: "en" },
  // Enterprise IT
  { name: "ZDNet", url: "https://www.zdnet.com/news/rss.xml", region: "World", language: "en" },
  { name: "Ars Technica", url: "https://feeds.arstechnica.com/arstechnica/index", region: "World", language: "en" },
  // Global broad tech (additional)
  { name: "The Verge", url: "https://www.theverge.com/rss/index.xml", region: "World", language: "en" },
  { name: "MIT Technology Review", url: "https://www.technologyreview.com/feed/", region: "World", language: "en" },
  { name: "Hacker News", url: "https://hnrss.org/frontpage", region: "World", language: "en" },
  // Enterprise, cloud & developer
  { name: "InfoQ", url: "https://feed.infoq.com/", region: "World", language: "en" },
  { name: "The New Stack", url: "https://thenewstack.io/feed/", region: "World", language: "en" },
  { name: "InfoWorld", url: "https://www.infoworld.com/index.rss", region: "World", language: "en" },
  { name: "SD Times", url: "https://sdtimes.com/feed/", region: "World", language: "en" },
  // Europe-specific tech
  { name: "Sifted", url: "https://sifted.eu/feed", region: "Europe", language: "en" },
  { name: "EU-Startups", url: "https://www.eu-startups.com/feed/", region: "Europe", language: "en" },
  { name: "Tech.eu", url: "https://tech.eu/feed/", region: "Europe", language: "en" },
  { name: "Politico EU Tech", url: "https://www.politico.eu/section/technology/feed/", region: "Europe", language: "en" },
  { name: "Euractiv Digital", url: "https://www.euractiv.com/sections/digital/feed/", region: "Europe", language: "en" },
  // Middle East — Startups & ecosystem
  { name: "MENAbytes", url: "https://www.menabytes.com/feed/", region: "Middle East", language: "en" },
  { name: "Wamda", url: "https://www.wamda.com/feed", region: "Middle East", language: "en" },
  { name: "Fast Company ME", url: "https://fastcompanyme.com/feed/", region: "Middle East", language: "en" },
  // Middle East — Government policy & digital strategy
  { name: "Arabian Business Tech", url: "https://www.arabianbusiness.com/technology/feed", region: "Middle East", language: "en" },
  { name: "Arab News Tech", url: "https://www.arabnews.com/taxonomy/term/10252/feed", region: "Middle East", language: "en" },
  { name: "Zawya Tech", url: "https://www.zawya.com/en/rss/technology", region: "Middle East", language: "en" },
  { name: "Gulf Business Tech", url: "https://gulfbusiness.com/category/technology/feed/", region: "Middle East", language: "en" },
  // Middle East — Enterprise tech & deep coverage
  { name: "Wired Middle East", url: "https://wired.me/feed/", region: "Middle East", language: "en" },
  { name: "ITP.net", url: "https://www.itp.net/feed", region: "Middle East", language: "en" },
  // Middle East — Fintech & digital finance
  { name: "Fintech News ME", url: "https://fintechnews.ae/feed/", region: "Middle East", language: "en" },
  { name: "Economy Middle East", url: "https://www.economy.ae/feed/", region: "Middle East", language: "en" },

  // ── EUROPE — General News ──────────────────────────────────────────────────
  { name: "Euronews EN", url: "https://feeds.feedburner.com/euronews/en/home/", region: "Europe", language: "en" },
  { name: "Euronews My Europe", url: "https://www.euronews.com/my-europe/rss", region: "Europe", language: "en" },
  { name: "EUobserver", url: "https://euobserver.com/rss.xml", region: "Europe", language: "en" },
  { name: "France 24 Europe", url: "https://www.france24.com/en/europe/rss", region: "Europe", language: "en" },
  { name: "Reuters Europe", url: "https://feeds.reuters.com/reuters/EuropeanNewsHeadlines", region: "Europe", language: "en" },
  { name: "VRT NWS English", url: "https://www.vrt.be/vrtnws/en/rss/articles.xml", region: "Belgium", language: "en" },
  { name: "NRC", url: "https://www.nrc.nl/rss/", region: "Netherlands", language: "nl" },
  { name: "DutchNews.nl", url: "https://www.dutchnews.nl/feed/", region: "Netherlands", language: "en" },
  { name: "France 24 EN", url: "https://www.france24.com/en/rss", region: "France", language: "en" },
  { name: "Le Monde EN", url: "https://www.lemonde.fr/en/rss/une.xml", region: "France", language: "en" },
  { name: "The Local Germany", url: "https://www.thelocal.de/feed/", region: "Germany", language: "en" },
  { name: "Spiegel International", url: "https://www.spiegel.de/international/index.rss", region: "Germany", language: "en" },
  { name: "DW Germany", url: "https://rss.dw.com/rdf/rss-en-ger", region: "Germany", language: "en" },
  { name: "Deutsche Welle Europe", url: "https://rss.dw.com/rdf/rss-en-europe", region: "Germany", language: "en" },
  { name: "Handelsblatt Global", url: "https://www.handelsblatt.com/contentexport/feed/schlagzeilen", region: "Germany", language: "de" },

  // ── SOUTH EUROPE — General News ────────────────────────────────────────────
  { name: "The Local Italy", url: "https://www.thelocal.it/feed/", region: "South Europe", language: "en" },
  { name: "The Local Spain", url: "https://www.thelocal.es/feed/", region: "South Europe", language: "en" },
  { name: "ANSA English", url: "https://www.ansa.it/english/news/rss.xml", region: "South Europe", language: "en" },
  { name: "Portugal Resident", url: "https://www.theportugalnews.com/feed", region: "South Europe", language: "en" },
  { name: "El País English", url: "https://feeds.elpais.com/mrss-s/pages/ep/site/english.elpais.com/portada", region: "South Europe", language: "en" },
  { name: "Euronews Spain", url: "https://es.euronews.com/rss", region: "South Europe", language: "es" },
  { name: "Greek Reporter", url: "https://greekreporter.com/feed/", region: "South Europe", language: "en" },

  // ── NORTH EUROPE — General News ────────────────────────────────────────────
  { name: "The Local Sweden", url: "https://www.thelocal.se/feed/", region: "North Europe", language: "en" },
  { name: "The Local Norway", url: "https://www.thelocal.no/feed/", region: "North Europe", language: "en" },
  { name: "The Local Denmark", url: "https://www.thelocal.dk/feed/", region: "North Europe", language: "en" },
  { name: "Yle News Finland", url: "https://feeds.yle.fi/uutiset/v1/majorHeadlines/YLE_UUTISET.rss", region: "North Europe", language: "en" },
  { name: "Iceland Monitor", url: "https://icelandmonitor.mbl.is/rss/", region: "North Europe", language: "en" },
  { name: "CPH Post", url: "https://cphpost.dk/feed/", region: "North Europe", language: "en" },

  // ── MIDDLE EAST — General News ─────────────────────────────────────────────
  { name: "Al Jazeera", url: "https://www.aljazeera.com/xml/rss/all.xml", region: "Middle East", language: "en" },
  { name: "Arab News", url: "https://www.arabnews.com/rss.xml", region: "Middle East", language: "en" },
  { name: "Gulf News", url: "https://gulfnews.com/rss", region: "Middle East", language: "en" },
  { name: "The National UAE", url: "https://www.thenationalnews.com/rss", region: "UAE", language: "en" },
  { name: "Khaleej Times", url: "https://www.khaleejtimes.com/rss", region: "UAE", language: "en" },

  // ── ASIA — General News ────────────────────────────────────────────────────
  // India
  { name: "NDTV", url: "https://feeds.feedburner.com/ndtvnews-top-stories", region: "India", language: "en" },
  { name: "The Hindu", url: "https://www.thehindu.com/feeder/default.rss", region: "India", language: "en" },
  { name: "Hindustan Times", url: "https://www.hindustantimes.com/feeds/rss/topnews/rssfeed.xml", region: "India", language: "en" },
  { name: "Times of India", url: "https://timesofindia.indiatimes.com/rssfeedstopstories.cms", region: "India", language: "en" },
  // China / East Asia
  { name: "CGTN World", url: "https://www.cgtn.com/subscribe/feeds/rss2.0/cgtn.xml", region: "China", language: "en" },
  { name: "South China Morning Post", url: "https://www.scmp.com/rss/91/feed", region: "China", language: "en" },
  { name: "Japan Times", url: "https://www.japantimes.co.jp/feed/", region: "Asia", language: "en" },
  { name: "Korea Herald", url: "https://www.koreaherald.com/common/rss_xml.php?ct=102", region: "Asia", language: "en" },
  // SE Asia / Pan-Asia
  { name: "Channel NewsAsia", url: "https://www.channelnewsasia.com/api/v1/rss-outbound-feed?_format=xml", region: "Asia", language: "en" },
  { name: "Straits Times", url: "https://www.straitstimes.com/news/asia/rss.xml", region: "Asia", language: "en" },
  { name: "Bangkok Post", url: "https://www.bangkokpost.com/rss/data/topstories.xml", region: "Asia", language: "en" },

  // ── ASIA — Tech ────────────────────────────────────────────────────────────
  // India
  { name: "Inc42", url: "https://inc42.com/feed/", region: "India", language: "en" },
  { name: "YourStory", url: "https://yourstory.com/feed", region: "India", language: "en" },
  { name: "ET Tech", url: "https://economictimes.indiatimes.com/tech/rssfeeds/13357270.cms", region: "India", language: "en" },
  { name: "MediaNama", url: "https://www.medianama.com/feed/", region: "India", language: "en" },
  // SE Asia
  { name: "e27", url: "https://e27.co/feed/", region: "Asia", language: "en" },
  { name: "Tech in Asia", url: "https://www.techinasia.com/feed", region: "Asia", language: "en" },
  { name: "Vulcan Post", url: "https://vulcanpost.com/feed", region: "Asia", language: "en" },
  // China / East Asia
  { name: "TechNode", url: "https://technode.com/feed/", region: "China", language: "en" },
  { name: "KrASIA", url: "https://kr-asia.com/feed/", region: "Asia", language: "en" },
  { name: "Pandaily", url: "https://pandaily.com/feed/", region: "China", language: "en" },

  // ── AMERICAS — General News ────────────────────────────────────────────────
  // USA
  { name: "NPR News", url: "https://feeds.npr.org/1001/rss.xml", region: "USA", language: "en" },
  { name: "Associated Press", url: "https://apnews.com/rss", region: "USA", language: "en" },
  { name: "Reuters US", url: "https://feeds.reuters.com/reuters/USNewsHeadlines", region: "USA", language: "en" },
  { name: "Washington Post World", url: "https://feeds.washingtonpost.com/rss/world", region: "USA", language: "en" },
  { name: "NBC News", url: "https://feeds.nbcnews.com/nbcnews/public/news", region: "USA", language: "en" },
  // Canada
  { name: "CBC News", url: "https://www.cbc.ca/cmlink/rss-topstories", region: "Canada", language: "en" },
  { name: "Globe and Mail", url: "https://www.theglobeandmail.com/rss/article/", region: "Canada", language: "en" },
  // Latin America
  { name: "Reuters LatAm", url: "https://feeds.reuters.com/reuters/MexicoHeadlines", region: "South America", language: "en" },
  { name: "Mercopress", url: "https://en.mercopress.com/rss", region: "South America", language: "en" },
  { name: "Rio Times", url: "https://www.riotimesonline.com/feed/", region: "Brazil", language: "en" },
  { name: "Mexico News Daily", url: "https://mexiconewsdaily.com/feed/", region: "Mexico", language: "en" },
  { name: "The Yucatan Times", url: "https://www.theyucatantimes.com/feed/", region: "Mexico", language: "en" },
  { name: "Mexico Business News", url: "https://www.mexicobusiness.news/feed", region: "Mexico", language: "en" },

  // ── AMERICAS — Tech ────────────────────────────────────────────────────────
  { name: "Crunchbase News", url: "https://news.crunchbase.com/feed/", region: "USA", language: "en" },
  { name: "Axios Tech", url: "https://api.axios.com/feed/technology", region: "USA", language: "en" },
  { name: "Politico Tech", url: "https://www.politico.com/rss/technology.xml", region: "USA", language: "en" },
  { name: "TechRepublic", url: "https://www.techrepublic.com/rssfeeds/articles/", region: "USA", language: "en" },
  { name: "Betakit", url: "https://betakit.com/feed/", region: "Canada", language: "en" },
  { name: "LatamList", url: "https://latamlist.com/feed/", region: "South America", language: "en" },
  { name: "Latam Republic", url: "https://www.latamrepublic.com/feed/", region: "South America", language: "en" },
  { name: "Contxto", url: "https://contxto.com/en/feed/", region: "South America", language: "en" },

  // ── AFRICA — General News ──────────────────────────────────────────────────
  { name: "BBC Africa", url: "https://feeds.bbci.co.uk/news/world/africa/rss.xml", region: "Africa", language: "en" },
  { name: "Africanews", url: "https://www.africanews.com/feed/rss", region: "Africa", language: "en" },
  { name: "AllAfrica", url: "https://allafrica.com/tools/headlines/rdf/latest/headlines.rdf", region: "Africa", language: "en" },
  { name: "Daily Nation Kenya", url: "https://nation.africa/kenya/rss", region: "Africa", language: "en" },

  // ── AFRICA — Tech ──────────────────────────────────────────────────────────
  { name: "Techpoint Africa", url: "https://techpoint.africa/feed/", region: "Africa", language: "en" },
  { name: "Disrupt Africa", url: "https://disruptafrica.com/feed/", region: "Africa", language: "en" },
  { name: "IT News Africa", url: "https://www.itnewsafrica.com/feed/", region: "Africa", language: "en" },
  { name: "Technext", url: "https://technext24.com/feed/", region: "Africa", language: "en" },

  // ── OCEANIA / AUSTRALIA — General News ────────────────────────────────────
  { name: "ABC Australia", url: "https://www.abc.net.au/news/feed/51120/rss.xml", region: "Oceania", language: "en" },
  { name: "NZ Herald", url: "https://www.nzherald.co.nz/arc/outboundfeeds/rss/", region: "Oceania", language: "en" },

  // ── OCEANIA / AUSTRALIA — Tech ─────────────────────────────────────────────
  { name: "ITnews Australia", url: "https://www.itnews.com.au/rss/rss.ashx", region: "Oceania", language: "en" },
  { name: "SmartCompany", url: "https://www.smartcompany.com.au/feed/", region: "Oceania", language: "en" },
  { name: "Startup Daily", url: "https://www.startupdaily.net/feed/", region: "Oceania", language: "en" },
  { name: "InnovationAus", url: "https://www.innovationaus.com/feed/", region: "Oceania", language: "en" },

  // ── WORLD — General News ───────────────────────────────────────────────────
  { name: "Reuters World", url: "https://feeds.reuters.com/reuters/topNews", region: "World", language: "en" },

  // Google Trends — real-time trending by country/region (no auth required)
  // Europe
  { name: "Google Trends Belgium",      url: "https://trends.google.com/trends/trendingsearches/daily/rss?geo=BE", region: "Belgium",      language: "en" },
  { name: "Google Trends Netherlands",  url: "https://trends.google.com/trends/trendingsearches/daily/rss?geo=NL", region: "Netherlands",  language: "nl" },
  { name: "Google Trends France",       url: "https://trends.google.com/trends/trendingsearches/daily/rss?geo=FR", region: "France",       language: "fr" },
  { name: "Google Trends Germany",      url: "https://trends.google.com/trends/trendingsearches/daily/rss?geo=DE", region: "Germany",      language: "de" },
  { name: "Google Trends South Europe", url: "https://trends.google.com/trends/trendingsearches/daily/rss?geo=IT", region: "South Europe", language: "en" },
  { name: "Google Trends North Europe", url: "https://trends.google.com/trends/trendingsearches/daily/rss?geo=SE", region: "North Europe", language: "en" },
  { name: "Google Trends Europe",       url: "https://trends.google.com/trends/trendingsearches/daily/rss?geo=GB", region: "Europe",       language: "en" },
  // Middle East
  { name: "Google Trends UAE",          url: "https://trends.google.com/trends/trendingsearches/daily/rss?geo=AE", region: "UAE",          language: "en" },
  { name: "Google Trends Middle East",  url: "https://trends.google.com/trends/trendingsearches/daily/rss?geo=SA", region: "Middle East",  language: "en" },
  // Asia
  { name: "Google Trends India",        url: "https://trends.google.com/trends/trendingsearches/daily/rss?geo=IN", region: "India",        language: "en" },
  { name: "Google Trends China",        url: "https://trends.google.com/trends/trendingsearches/daily/rss?geo=CN", region: "China",        language: "en" },
  { name: "Google Trends Asia",         url: "https://trends.google.com/trends/trendingsearches/daily/rss?geo=JP", region: "Asia",         language: "en" },
  // Americas
  { name: "Google Trends USA",          url: "https://trends.google.com/trends/trendingsearches/daily/rss?geo=US", region: "USA",          language: "en" },
  { name: "Google Trends Canada",       url: "https://trends.google.com/trends/trendingsearches/daily/rss?geo=CA", region: "Canada",       language: "en" },
  { name: "Google Trends Brazil",       url: "https://trends.google.com/trends/trendingsearches/daily/rss?geo=BR", region: "Brazil",       language: "en" },
  { name: "Google Trends Mexico",       url: "https://trends.google.com/trends/trendingsearches/daily/rss?geo=MX", region: "Mexico",       language: "en" },
  { name: "Google Trends World",        url: "https://trends.google.com/trends/trendingsearches/daily/rss?geo=AU", region: "World",        language: "en" },
];

async function translateAndSummarize(title: string, content: string, sourceLang: string) {
  // Use gpt-4o-mini for better speed and lower cost for bulk processing
  const prompt = `
    You are a professional news translator and editor.
    Source Language: ${sourceLang === 'nl' ? 'Dutch' : sourceLang === 'fr' ? 'French' : 'English'}
    Target Language: English

    Tasks:
    1. Translate the Title and Content to natural, high-quality English. This is MANDATORY for ALL articles regardless of source language. Ensure the FULL CONTENT is translated to English so it can be read within the app.
    2. If the content is a trending search topic (short keyword with traffic info like "1M+ searches"), write a 2-3 sentence informative paragraph explaining what this topic is about and why it might be trending right now. Make it read like a brief news snippet.
    3. Provide a 1-sentence catchy summary.
    4. Categorize into one of: Politics, Business, Tech, Science, Health, Sports, Entertainment.

    Original Title: ${title}
    Original Content: ${content}

    Return ONLY a JSON object with this structure:
    {
      "translatedTitle": "...",
      "translatedContent": "...",
      "summary": "...",
      "topic": "..."
    }
  `;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
  });

  return JSON.parse(response.choices[0].message.content || "{}");
}

export async function fetchAndProcessNews() {
  console.log("Starting news fetch and process job...");
  
  // Cleanup old news first to keep the feed fresh (last 24h only)
  await storage.cleanupOldNews();
  
  for (const source of SOURCES) {
    try {
      const feed = await parser.parseURL(source.url);
      
      // Process top 10 items per source (increased from 3)
      for (const item of feed.items.slice(0, 10)) {
        if (!item.link || !item.title) continue;

        // Check if we already have this article
        const existing = await storage.getNewsByExternalId(item.link);
        if (existing) continue;

        console.log(`Processing article: ${item.title}`);

        // Basic content extraction (RSS often only has snippets)
        const rawContent = item.contentSnippet || item.content || "";
        
        const processed = await translateAndSummarize(item.title, rawContent, source.language);

        // Advanced image extraction
        let imageUrl = item.enclosure?.url || 
                       item.media?.content?.[0]?.url || 
                       item.image?.url;

        // If no image in RSS, try to fetch the page and look for OG tags
        if (!imageUrl && item.link) {
          try {
            const response = await fetch(item.link);
            const html = await response.text();
            const silentConsole = new VirtualConsole();
            const dom = new JSDOM(html, { virtualConsole: silentConsole });
            imageUrl = dom.window.document.querySelector('meta[property="og:image"]')?.getAttribute('content') ||
                       dom.window.document.querySelector('meta[name="twitter:image"]')?.getAttribute('content') ||
                       dom.window.document.querySelector('link[rel="image_src"]')?.getAttribute('href');
          } catch (e) {
            console.warn(`Failed to fetch OG image for ${item.link}`);
          }
        }

        imageUrl = imageUrl || "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&q=80";

        const newsItem: InsertNews = {
          title: processed.translatedTitle || item.title,
          summary: processed.summary || item.title,
          content: processed.translatedContent || rawContent,
          imageUrl: imageUrl,
          source: source.name,
          topic: processed.topic || "Politics",
          region: source.region,
          externalId: item.link
        };

        await storage.createNews(newsItem);
        console.log(`Saved article: ${newsItem.title}`);
      }
    } catch (error) {
      console.error(`Error processing source ${source.name}:`, error);
    }
  }
}
