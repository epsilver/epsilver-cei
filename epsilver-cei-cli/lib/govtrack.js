import { cachePath, readCache, writeCache } from "./cache.js";

const GT_API = "https://www.govtrack.us/api/v2";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

async function gtFetch(url, cfg) {
  const res = await fetch(url, { headers: { "User-Agent": cfg.userAgent } });
  if (!res.ok) return null;
  try { return await res.json(); } catch { return null; }
}

export async function govtrackData(name, cfg) {
  const key = "govtrack:" + name.toLowerCase();
  const cpath = cachePath(cfg.cacheDir, key);

  const cached = readCache(cpath);
  if (cached?.timestamp && (Date.now() - cached.timestamp) < CACHE_TTL_MS) {
    return cached.data ?? null;
  }

  try {
    const search = await gtFetch(
      `${GT_API}/person?name=${encodeURIComponent(name)}&limit=5&format=json`,
      cfg
    );
    if (!search?.objects?.length) {
      writeCache(cpath, { timestamp: Date.now(), data: null });
      return null;
    }

    // Prefer person with a current congressional role, then first result
    const persons = search.objects;
    const best = persons.find(p => p.current_role) ?? persons[0];

    // Fetch person detail for ideology/leadership analysis scores
    const detail = await gtFetch(`${GT_API}/person/${best.id}/?format=json`, cfg);
    const analysis = detail?.analysis ?? null;

    const ideologyPct = typeof analysis?.ideology_percentile === "number"
      ? analysis.ideology_percentile : null;
    const leadershipPct = typeof analysis?.leadership_percentile === "number"
      ? analysis.leadership_percentile : null;

    const role = best.current_role;

    const data = {
      found: true,
      personId: best.id,
      name: best.name,
      party: role?.party ?? null,
      roleType: role?.role_type ?? null,
      state: role?.state ?? null,
      // GovTrack ideology percentile: 0 = most liberal, 1 = most conservative
      // Convert to -1..+1 scale
      ideologyScore: ideologyPct !== null ? (ideologyPct * 2) - 1 : null,
      leadershipScore: leadershipPct,
      ideologyPct,
      leadershipPct
    };

    writeCache(cpath, { timestamp: Date.now(), data });
    return data;
  } catch {
    writeCache(cpath, { timestamp: Date.now(), data: null });
    return null;
  }
}

function pctLabel(pct) {
  return pct !== null && pct !== undefined ? `, ${Math.round(pct * 100)}th percentile` : "";
}

export function govtrackSignals(data) {
  if (!data?.found) return null;

  const axes = {
    establishment: [],
    justice: [],
    tradition: [],
    conflict: [],
    rigidity: []
  };

  const { ideologyScore, leadershipScore, ideologyPct, leadershipPct, party } = data;

  if (ideologyScore !== null) {
    const ideo = ideologyScore;
    const ideoStr = ideo.toFixed(2);

    if (ideo <= -0.3) {
      const strong = ideo <= -0.6;
      axes.justice.push({
        term: "GovTrack ideology score",
        sentence: `GovTrack legislative ideology score: ${ideoStr} (${strong ? "strongly liberal" : "liberal"}${pctLabel(ideologyPct)}); derived from roll-call vote analysis.`,
        weight: strong ? 14 : 8
      });
    } else if (ideo >= 0.3) {
      const strong = ideo >= 0.6;
      axes.tradition.push({
        term: "GovTrack ideology score",
        sentence: `GovTrack legislative ideology score: ${ideoStr} (${strong ? "strongly conservative" : "conservative"}${pctLabel(ideologyPct)}); derived from roll-call vote analysis.`,
        weight: strong ? 14 : 8
      });
    }

    if (Math.abs(ideo) >= 0.65) {
      axes.conflict.push({
        term: "GovTrack: strong ideological positioning",
        sentence: `GovTrack ideology score ${ideoStr} reflects strong ideological positioning away from the legislative center.`,
        weight: 8
      });
    }

    if (Math.abs(ideo) >= 0.75) {
      axes.rigidity.push({
        term: "GovTrack: extreme ideological positioning",
        sentence: `GovTrack ideology score ${ideoStr} reflects extreme, consistent outlier positioning in roll-call votes.`,
        weight: 6
      });
    }
  }

  if (leadershipScore !== null && leadershipScore >= 0.7) {
    axes.establishment.push({
      term: "GovTrack leadership score",
      sentence: `GovTrack leadership score: ${leadershipScore.toFixed(2)}${pctLabel(leadershipPct)}; indicates high bill sponsorship and institutional legislative engagement.`,
      weight: 10
    });
  }

  // Party fallback if no roll-call ideology score available
  if (ideologyScore === null && party) {
    if (/democrat/i.test(party)) {
      axes.justice.push({
        term: "GovTrack: party affiliation",
        sentence: `GovTrack party affiliation: ${party}. Used as fallback ideological signal (no roll-call ideology score available).`,
        weight: 5
      });
    } else if (/republican/i.test(party)) {
      axes.tradition.push({
        term: "GovTrack: party affiliation",
        sentence: `GovTrack party affiliation: ${party}. Used as fallback ideological signal (no roll-call ideology score available).`,
        weight: 5
      });
    }
  }

  const hasAny = Object.values(axes).some(a => a.length > 0);
  return hasAny ? axes : null;
}
