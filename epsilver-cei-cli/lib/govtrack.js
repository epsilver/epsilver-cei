import { cachePath, readCache, writeCache } from "./cache.js";

const GT_API = "https://www.govtrack.us/api/v2";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

async function gtFetchJson(url, cfg) {
  const res = await fetch(url, { headers: { "User-Agent": cfg.userAgent } });
  if (!res.ok) return null;
  try { return await res.json(); } catch { return null; }
}

async function gtFetchHtml(url, cfg) {
  const res = await fetch(url, { headers: { "User-Agent": cfg.userAgent } });
  if (!res.ok) return null;
  return res.text();
}

function scrapeIdeologyLeadership(html) {
  // The member page embeds ideology-leadership chart data as:
  //   data: [{x: <ideology>, y: <leadership>, name: "..."}]
  const m = html.match(/data:\s*\[\{x:\s*([\d.]+),\s*y:\s*([\d.]+),/);
  if (!m) return { ideology: null, leadership: null };
  return { ideology: parseFloat(m[1]), leadership: parseFloat(m[2]) };
}

export async function govtrackData(name, cfg) {
  const key = "govtrack:" + name.toLowerCase();
  const cpath = cachePath(cfg.cacheDir, key);

  const cached = readCache(cpath);
  if (cached?.timestamp && (Date.now() - cached.timestamp) < CACHE_TTL_MS) {
    return cached.data ?? null;
  }

  try {
    const search = await gtFetchJson(
      `${GT_API}/person?q=${encodeURIComponent(name)}&limit=5&format=json`,
      cfg
    );
    if (!search?.objects?.length) {
      writeCache(cpath, { timestamp: Date.now(), data: null });
      return null;
    }

    const persons = search.objects;
    const best = persons[0];
    // ID may be in .id, .pk, or embedded in the link URL
    const personId = best.id ?? best.pk ?? best.link?.match(/\/(\d+)$/)?.[1];

    // Fetch role (for party) and member page (for ideology/leadership) in parallel
    const [roleRes, memberHtml] = await Promise.all([
      gtFetchJson(`${GT_API}/role?person=${personId}&current=true&format=json`, cfg),
      best.link ? gtFetchHtml(best.link, cfg) : Promise.resolve(null)
    ]);

    const role = roleRes?.objects?.[0] ?? null;

    const { ideology, leadership } = memberHtml
      ? scrapeIdeologyLeadership(memberHtml)
      : { ideology: null, leadership: null };

    // GovTrack ideology: 0.0 = most liberal, 1.0 = most conservative
    // Convert to -1..+1 scale
    const ideologyScore = ideology !== null ? (ideology * 2) - 1 : null;

    const data = {
      found: true,
      personId,
      name: best.name,
      party: role?.party ?? null,
      caucus: role?.caucus ?? null,
      roleType: role?.role_type ?? null,
      state: role?.state ?? null,
      ideologyScore,
      leadershipScore: leadership,
      ideologyRaw: ideology,
      leadershipRaw: leadership
    };

    writeCache(cpath, { timestamp: Date.now(), data });
    return data;
  } catch {
    writeCache(cpath, { timestamp: Date.now(), data: null });
    return null;
  }
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

  const { ideologyScore, leadershipScore, ideologyRaw, leadershipRaw, party, caucus } = data;

  if (ideologyScore !== null) {
    const ideo = ideologyScore;
    const ideoStr = ideo.toFixed(2);

    if (ideo <= -0.3) {
      const strong = ideo <= -0.6;
      axes.justice.push({
        term: "GovTrack ideology score",
        sentence: `GovTrack legislative ideology score: ${ideoStr} (${strong ? "strongly liberal" : "liberal"}, raw ${ideologyRaw?.toFixed(3) ?? "?"}); derived from roll-call vote analysis.`,
        weight: strong ? 14 : 8
      });
    } else if (ideo >= 0.3) {
      const strong = ideo >= 0.6;
      axes.tradition.push({
        term: "GovTrack ideology score",
        sentence: `GovTrack legislative ideology score: ${ideoStr} (${strong ? "strongly conservative" : "conservative"}, raw ${ideologyRaw?.toFixed(3) ?? "?"}); derived from roll-call vote analysis.`,
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
      sentence: `GovTrack leadership score: ${leadershipScore.toFixed(3)}; indicates high bill sponsorship and institutional legislative engagement.`,
      weight: 10
    });
  }

  // Party/caucus fallback if no roll-call ideology score available
  if (ideologyScore === null) {
    const partySignal = party || caucus;
    if (partySignal && /democrat/i.test(partySignal)) {
      axes.justice.push({
        term: "GovTrack: party affiliation",
        sentence: `GovTrack party/caucus: ${partySignal}. Used as fallback ideological signal (no roll-call ideology score available).`,
        weight: 5
      });
    } else if (partySignal && /republican/i.test(partySignal)) {
      axes.tradition.push({
        term: "GovTrack: party affiliation",
        sentence: `GovTrack party/caucus: ${partySignal}. Used as fallback ideological signal (no roll-call ideology score available).`,
        weight: 5
      });
    }
  }

  const hasAny = Object.values(axes).some(a => a.length > 0);
  return hasAny ? axes : null;
}
