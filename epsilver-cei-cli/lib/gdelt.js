import { cachePath, readCache, writeCache } from "./cache.js";

const GDELT_API = "https://api.gdeltproject.org/api/v2/doc/doc";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function gdeltNewsText(name, cfg) {
  const key = "gdelt:" + name.toLowerCase();
  const cpath = cachePath(cfg.cacheDir, key);

  const cached = readCache(cpath);
  if (cached?.timestamp && (Date.now() - cached.timestamp) < CACHE_TTL_MS) {
    return cached.text || "";
  }

  try {
    const params = new URLSearchParams({
      query: `"${name}"`,
      mode: "artlist",
      maxrecords: "20",
      format: "json",
      timespan: "1month"
    });

    const res = await fetch(`${GDELT_API}?${params}`, {
      headers: { "User-Agent": cfg.userAgent }
    });
    if (!res.ok) return "";

    const raw = await res.text();
    if (!raw || !raw.trim().startsWith("{")) return "";
    const data = JSON.parse(raw);
    const articles = data?.articles || [];
    const text = articles
      .map(a => [a.title, a.seendescription].filter(Boolean).join(". "))
      .join("\n");

    writeCache(cpath, { timestamp: Date.now(), text });
    return text;
  } catch {
    return "";
  }
}
