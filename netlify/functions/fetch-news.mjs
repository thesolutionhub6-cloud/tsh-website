// Netlify Function — fetches IRCC news + CIC News immigration updates
// Endpoint: /.netlify/functions/fetch-news

const IRCC_FEED =
  "https://api.io.canada.ca/io-server/gc/news/en/v2?dept=departmentofcitizenshipandimmigration&sort=publishedDate&orderBy=desc&pick=12&format=atom&atomtitle=IRCC";
const CIC_FEED = "https://www.cicnews.com/feed";

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

function parseAtomFeed(xml, source) {
  const entries = [];
  const entryBlocks = xml.split("<entry>").slice(1);
  for (const block of entryBlocks.slice(0, 10)) {
    const title = block.match(/<title[^>]*>([\s\S]*?)<\/title>/)?.[1]?.trim() || "";
    const summary =
      block.match(/<summary[^>]*>([\s\S]*?)<\/summary>/)?.[1]?.trim() ||
      block.match(/<content[^>]*>([\s\S]*?)<\/content>/)?.[1]?.trim() || "";
    const updated =
      block.match(/<updated>([\s\S]*?)<\/updated>/)?.[1]?.trim() ||
      block.match(/<published>([\s\S]*?)<\/published>/)?.[1]?.trim() || "";
    const link = block.match(/<link[^>]*href="([^"]*)"[^>]*\/?>/)?.[1] || "";
    if (title) {
      entries.push({
        title: clean(title),
        summary: clean(summary).substring(0, 200),
        date: updated,
        link: link,
        source: source,
        tag: categorize(clean(title)),
      });
    }
  }
  return entries;
}

function parseRssFeed(xml, source) {
  const entries = [];
  const itemBlocks = xml.split("<item>").slice(1);
  for (const block of itemBlocks.slice(0, 10)) {
    const titleRaw = block.match(/<title>([\s\S]*?)<\/title>/)?.[1]?.trim() || "";
    const desc = block.match(/<description>([\s\S]*?)<\/description>/)?.[1]?.trim() || "";
    const pubDate = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1]?.trim() || "";
    const linkRaw = block.match(/<link>([\s\S]*?)<\/link>/)?.[1]?.trim() || "";
    const category = block.match(/<category><!\[CDATA\[([\s\S]*?)\]\]><\/category>/)?.[1]?.trim() || "";
    const t = clean(titleRaw.replace(/<!\[CDATA\[|\]\]>/g, ""));
    if (t) {
      let dateISO = "";
      try { dateISO = new Date(pubDate).toISOString(); } catch(e) { dateISO = pubDate; }
      entries.push({
        title: t,
        summary: clean(desc.replace(/<!\[CDATA\[|\]\]>/g, "")).substring(0, 200),
        date: dateISO,
        link: linkRaw.replace(/<!\[CDATA\[|\]\]>/g, "").trim(),
        source: source,
        tag: category || categorize(t),
      });
    }
  }
  return entries;
}

export default async function handler(req) {
  const headers = {
    "Content-Type": "application/json",
    "Cache-Control": "public, max-age=14400, s-maxage=14400",
    "Access-Control-Allow-Origin": "*",
  };

  try {
    const results = await Promise.allSettled([
      fetch(IRCC_FEED, { headers: { "User-Agent": "TSH-News-Bot/1.0" } }),
      fetch(CIC_FEED, { headers: { "User-Agent": "TSH-News-Bot/1.0" } }),
    ]);

    let allNews = [];

    if (results[0].status === "fulfilled" && results[0].value.ok) {
      const xml = await results[0].value.text();
      allNews.push(...parseAtomFeed(xml, "IRCC"));
    }

    if (results[1].status === "fulfilled" && results[1].value.ok) {
      const xml = await results[1].value.text();
      allNews.push(...parseRssFeed(xml, "CIC News"));
    }

    allNews.sort((a, b) => new Date(b.date) - new Date(a.date));
    const news = allNews.slice(0, 6);

    return new Response(JSON.stringify({ news: news, fetchedAt: new Date().toISOString() }), {
      status: 200,
      headers: headers,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message, news: [] }), {
      status: 500,
      headers: headers,
    });
  }
}
