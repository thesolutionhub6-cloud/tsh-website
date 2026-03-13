// Netlify Scheduled Function — fetches IRCC news + job market updates
// Runs as an API endpoint: /.netlify/functions/fetch-news
// Also runs on schedule (daily) to keep cache warm

const IRCC_FEED = "https://www.canada.ca/en/immigration-refugees-citizenship/news.atom";
const JOB_FEED = "https://www.canada.ca/en/employment-social-development/news.atom";

function parseAtomFeed(xml, source) {
  const entries = [];
  const entryBlocks = xml.split("<entry>").slice(1);

  for (const block of entryBlocks.slice(0, 10)) {
    const title = block.match(/<title[^>]*>([\s\S]*?)<\/title>/)?.[1]?.trim() || "";
    const summary =
      block.match(/<summary[^>]*>([\s\S]*?)<\/summary>/)?.[1]?.trim() ||
      block.match(/<content[^>]*>([\s\S]*?)<\/content>/)?.[1]?.trim() ||
      "";
    const updated =
      block.match(/<updated>([\s\S]*?)<\/updated>/)?.[1]?.trim() ||
      block.match(/<published>([\s\S]*?)<\/published>/)?.[1]?.trim() ||
      "";
    const link = block.match(/<link[^>]*href="([^"]*)"[^>]*\/?\s*>/)?.[1] || "";

    // Clean HTML entities
    const cleanText = (t) =>
      t
        .replace(/<[^>]+>/g, "")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\s+/g, " ")
        .trim();

    if (title) {
      entries.push({
        title: cleanText(title),
        summary: cleanText(summary).substring(0, 200),
        date: updated,
        link,
        source,
        tag: categorize(cleanText(title)),
      });
    }
  }
  return entries;
}

function categorize(title) {
  const t = title.toLowerCase();
  if (t.includes("express entry") || t.includes("draw")) return "Express Entry";
  if (t.includes("pgwp") || t.includes("post-graduation")) return "PGWP";
  if (t.includes("pnp") || t.includes("provincial")) return "PNP";
  if (t.includes("atlantic")) return "Atlantic";
  if (t.includes("work permit") || t.includes("lmia")) return "Work Permit";
  if (t.includes("study permit") || t.includes("student")) return "Study";
  if (t.includes("refugee") || t.includes("asylum")) return "Refugee";
  if (t.includes("citizenship")) return "Citizenship";
  if (t.includes("job") || t.includes("employ") || t.includes("labour")) return "Jobs";
  if (t.includes("temporary resident") || t.includes("tr to pr")) return "TR to PR";
  return "Policy";
}

export default async (req) => {
  try {
    const [irccRes, jobRes] = await Promise.allSettled([
      fetch(IRCC_FEED, { headers: { "User-Agent": "TSH-News-Bot/1.0" } }),
      fetch(JOB_FEED, { headers: { "User-Agent": "TSH-News-Bot/1.0" } }),
    ]);

    let allNews = [];

    if (irccRes.status === "fulfilled" && irccRes.value.ok) {
      const xml = await irccRes.value.text();
      allNews.push(...parseAtomFeed(xml, "IRCC"));
    }

    if (jobRes.status === "fulfilled" && jobRes.value.ok) {
      const xml = await jobRes.value.text();
      allNews.push(...parseAtomFeed(xml, "ESDC"));
    }

    // Sort by date descending
    allNews.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Take top 6
    const news = allNews.slice(0, 6);

    return new Response(JSON.stringify({ news, fetchedAt: new Date().toISOString() }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=14400, s-maxage=14400",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Failed to fetch news", news: [] }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

// Schedule: runs every 4 hours
export const config = {
  schedule: "0 */4 * * *",
};
