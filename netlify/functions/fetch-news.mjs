// Netlify Scheduled Function — fetches IRCC news + CIC News immigration updates
// Runs as an API endpoint: /.netlify/functions/fetch-news
// Also runs on schedule (every 4 hours) to keep cache warm

const IRCC_FEED =
  "https://api.io.canada.ca/io-server/gc/news/en/v2?dept=departmentofcitizenshipandimmigration&sort=publishedDate&orderBy=desc&pick=12&format=atom&atomtitle=IRCC";
const CIC_FEED = "https://www.cicnews.com/feed";

/* ---------- Atom parser (IRCC) ---------- */
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

    if (title) {
      entries.push({
        title: clean(title),
        summary: clean(summary).substring(0, 200),
        date: updated,
        link,
        source,
        tag: categorize(clean(title)),
      });
    }
  }
  return entries;
}

/* ---------- RSS 2.0 parser (CIC News) ---------- */
function parseRssFeed(xml, source) {
  const entries = [];
  const itemBlocks = xml.split("<item>").slice(1);

  for (const block of itemBlocks.slice(0, 10)) {
    const title = block.match(/<title>([\s\S]*?)<\/title>/)?.[1]?.trim() || "";
    const desc =
      block.match(/<description>([\s\S]*?)<\/description>/)?.[1]?.trim() || "";
    const pubDate = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1]?.trim() || "";
    const link = block.match(/<link>([\s\S]*?)<\/link>/)?.[1]?.trim() || "";
    const category =
      block.match(/<category><!\[CDATA\[([\s\S]*?)\]\]><\/category>/)?.[1]?.trim() || "";

    // strip CDATA wrappers if present
    const cleanTitle = clean(title.replace(/<!\[CDATA\[|\]\]>/g, ""));

    if (cleanTitle) {
      entries.push({
        title: cleanTitle,
        summary: clean(desc.replace(/<!\[CDATA\[|\]\]>/g, "")).substring(0, 200),
        date: pubDate ? new Date(pubDate).toISOString() : "",
        link: link.replace(/<!\[CDATA\[|\]\]>/g, "").trim(),
        source,
        tag: category || categorize(cleanTitle),
      });
    }
  }
  return entries;
}

/* ---------- Helpers ---------- */
function clean(t) {
  return t
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
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
  if (t.includes("caregiver")) return "Caregiver";
  if (t.includes("francophone") || t.includes("french")) return "Francophone";
  return "Policy";
}

/* ---------- Main handler ---------- */
export default async (req) => {
  try {
    const [irccRes, cicRes] = await Promise.allSettled([
      fetch(IRCC_FEED, { headers: { "User-Agent": "TSH-News-Bot/1.0" } }),
      fetch(CIC_FEED, { headers: { "User-Agent": "TSH-News-Bot/1.0" } }),
    ]);

    let allNews = [];

    if (irccRes.status === "fulfilled" && irccRes.value.ok) {
      const xml = await irccRes.value.text();
      allNews.push(...parseAtomFeed(xml, "IRCC"));
    }

    if (cicRes.status === "fulfilled" && cicRes.value.ok) {
      const xml = await cicRes.value.text();
      allNews.push(...parseRssFeed(xml, "CIC News"));
    }

    // Sort by date descending
    allNews.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Take top 6
    const news = allNews.slice(0, 6);

    return new Response(
      JSON.stringify({ news, fetchedAt: new Date().toISOString() }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=14400, s-maxage=14400",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Failed to fetch news", news: [] }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
};

// Schedule: runs every 4 hours
export const config = {
  schedule: "0 */4 * * *",
};
