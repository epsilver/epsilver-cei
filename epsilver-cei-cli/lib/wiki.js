import { cachePath, readCache, writeCache } from "./cache.js";

const WIKI_API = "https://en.wikipedia.org/w/api.php";

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function getJson(url, params, cfg) {
  const qs = new URLSearchParams(params);
  const key = url + "?" + qs.toString();
  const cpath = cachePath(cfg.cacheDir, key);
  const cached = readCache(cpath);
  if (cached) return cached;

  const res = await fetch(url + "?" + qs.toString(), {
    headers: { "User-Agent": cfg.userAgent }
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
  const data = await res.json();

  writeCache(cpath, data);
  await sleep(cfg.sleepMs);
  return data;
}

export async function wikiSearch(query, cfg) {
  const data = await getJson(WIKI_API, {
    action: "query",
    list: "search",
    srsearch: query,
    srlimit: "3",
    format: "json"
  }, cfg);

  return (data?.query?.search || []).map(x => ({
    title: x.title,
    snippet: (x.snippet || "").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim()
  }));
}

export async function wikiPageBundle(title, cfg) {
  const data = await getJson(WIKI_API, {
    action: "query",
    prop: "extracts|pageprops|info|pageimages",

    // Lead section only — describes the subject directly, avoids opponent/context noise
    explaintext: "1",
    exsectionformat: "plain",
    exintro: "1",

    inprop: "url",
    piprop: "original",
    titles: title,
    format: "json"
  }, cfg);

  const pages = data?.query?.pages || {};
  const page = pages[Object.keys(pages)[0]];
  return {
    title: page?.title || title,
    extract: page?.extract || "",
    fullurl: page?.fullurl || "",
    qid: page?.pageprops?.wikibase_item || null,
    pageimage: page?.pageimage || null,
    original: page?.original?.source || null
  };
}

const TARGET_KEYWORDS = [
  "views", "positions", "ideology", "beliefs", "stances",
  "political philosophy", "philosophy", "political thought",
  "controversies", "controversy", "criticism", "reception",
  "public image", "political and social commentary", "commentary",
  "legal issues", "public statements"
];

function isTargetSection(title) {
  const t = title.toLowerCase().trim();
  return TARGET_KEYWORDS.some(k => t.includes(k));
}

export async function wikiViewsSection(title, cfg) {
  // Step 1: fetch section list
  const sections = await getJson(WIKI_API, {
    action: "parse",
    page: title,
    prop: "sections",
    format: "json"
  }, cfg);

  const list = sections?.parse?.sections || [];
  const matches = list.filter(s => isTargetSection(s.line || ""));
  if (!matches.length) return "";

  // Step 2: fetch all matching sections' wikitext
  const parts = [];
  for (const match of matches) {
    const data = await getJson(WIKI_API, {
      action: "parse",
      page: title,
      prop: "wikitext",
      section: match.index,
      format: "json"
    }, cfg);

    const raw = data?.parse?.wikitext?.["*"] || "";
    if (raw.trim()) parts.push(raw);
  }

  // Strip wikitext markup to plain text
  return parts.join("\n\n")
    .replace(/\{\{[^}]*\}\}/g, "")           // remove {{templates}}
    .replace(/\[\[(?:[^|\]]*\|)?([^\]]+)\]\]/g, "$1") // [[link|text]] -> text
    .replace(/\[https?:\/\/\S+\s([^\]]+)\]/g, "$1")   // [url text] -> text
    .replace(/<ref[^>]*>[\s\S]*?<\/ref>/gi, "")        // remove <ref>...</ref>
    .replace(/<[^>]+>/g, "")                 // remove remaining HTML tags
    .replace(/'''?/g, "")                    // remove bold/italic markers
    .replace(/^={1,6}.+=$/gm, "")           // remove === headings ===
    .replace(/\n{3,}/g, "\n\n")             // collapse excess blank lines
    .slice(0, 20000)
    .trim();
}

export async function wikiImageInfo(pageimage, cfg) {
  const t = pageimage.startsWith("File:") ? pageimage : `File:${pageimage}`;
  const data = await getJson(WIKI_API, {
    action: "query",
    prop: "imageinfo",
    titles: t,
    iiprop: "url|extmetadata",
    format: "json"
  }, cfg);

  const pages = data?.query?.pages || {};
  const page = pages[Object.keys(pages)[0]];
  return (page?.imageinfo || [])[0] || null;
}