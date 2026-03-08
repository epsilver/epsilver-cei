import { cachePath, readCache, writeCache } from "./cache.js";

const WD_API = "https://www.wikidata.org/w/api.php";

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
  if (!res.ok) throw new Error(`Wikidata HTTP ${res.status} ${res.statusText}`);
  const data = await res.json();

  writeCache(cpath, data);
  await sleep(cfg.sleepMs);
  return data;
}

function claimIds(entity, pid) {
  const claims = entity?.claims?.[pid] || [];
  const ids = [];
  for (const c of claims) {
    const v = c?.mainsnak?.datavalue?.value;
    const id = v?.id;
    if (id) ids.push(id);
  }
  return [...new Set(ids)];
}

function claimString(entity, pid) {
  const claims = entity?.claims?.[pid] || [];
  for (const c of claims) {
    const v = c?.mainsnak?.datavalue?.value;
    if (typeof v === "string" && v) return v;
  }
  return null;
}

export async function wikidataEntity(qid, cfg) {
  const data = await getJson(WD_API, {
    action: "wbgetentities",
    ids: qid,
    props: "claims|labels",
    languages: "en",
    format: "json",
    origin: "*"
  }, cfg);
  return data?.entities?.[qid] || null;
}

export async function wikidataOccupationsAndImage(qid, cfg) {
  if (!qid) return { occupations: [], imageName: null };

  const ent = await wikidataEntity(qid, cfg);
  if (!ent) return { occupations: [], imageName: null };

  const occIds = claimIds(ent, "P106"); // occupation
  const imageName = claimString(ent, "P18"); // image filename on Commons

  // Fetch occupation labels (one call)
  let occupations = [];
  if (occIds.length) {
    const data2 = await getJson(WD_API, {
      action: "wbgetentities",
      ids: occIds.join("|"),
      props: "labels",
      languages: "en",
      format: "json",
      origin: "*"
    }, cfg);

    occupations = occIds.map(id => data2?.entities?.[id]?.labels?.en?.value).filter(Boolean);
  }

  return { occupations, imageName };
}
