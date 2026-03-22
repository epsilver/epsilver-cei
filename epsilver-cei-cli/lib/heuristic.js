import { matchClusters, normalizeText } from "./textSignals.js";
import { ESTABLISHMENT, JUSTICE, TRADITION, CONFLICT, RIGIDITY } from "./keywords.js";

function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }
function sumWeights(hits) { return hits.reduce((a, h) => a + (h.weight || 0), 0); }
function cap(v, capAbs) { return clamp(v, -capAbs, capAbs); }

const PUBLIC_FIGURE_OCC = new Set([
  "singer","songwriter","musician","rapper","record producer","composer","dj",
  "actor","actress","comedian","television presenter","television personality","radio host",
  "writer","author","journalist","columnist","political commentator","pundit",
  "athlete","football player","basketball player","baseball player","tennis player","boxer",
  "media personality","social media influencer","internet personality","youtuber"
]);

function isPublicFigure(occupations) {
  const occ = (occupations || []).map(o => String(o).toLowerCase());
  return occ.some(o => PUBLIC_FIGURE_OCC.has(o));
}

export function scoreFromTextAndOcc(extract, occupations, cfg, viewsText = "", newsText = "") {
  const b = cfg.baseline;

  const evidenceOpts = {
    maxExcerptsPerAxis: cfg?.evidence?.maxExcerptsPerAxis ?? 8,
    maxSentenceChars: cfg?.evidence?.maxSentenceChars ?? 260
  };

  // Behavioral axes: intro + news (positives only for news)
  const e = matchClusters(extract, ESTABLISHMENT, evidenceOpts);
  const eNews = newsText ? matchClusters(newsText, ESTABLISHMENT, {
    ...evidenceOpts, positivesOnly: true,
    skipIds: new Set(e.hits.map(h => h.clusterId))
  }) : { hits: [], excerpts: [] };

  const c = matchClusters(extract, CONFLICT, evidenceOpts);
  const cNews = newsText ? matchClusters(newsText, CONFLICT, {
    ...evidenceOpts, positivesOnly: true,
    skipIds: new Set(c.hits.map(h => h.clusterId))
  }) : { hits: [], excerpts: [] };

  const eMerged = { hits: [...e.hits, ...eNews.hits], excerpts: [...e.excerpts, ...eNews.excerpts] };
  const cMerged = { hits: [...c.hits, ...cNews.hits], excerpts: [...c.excerpts, ...cNews.excerpts] };

  // Ideological axes: three-pass
  // Pass 1: intro with all clusters (positives + dampeners)
  // Pass 2: views text with positives only, skipping already-fired IDs
  // Pass 3: news text with positives only, skipping all already-fired IDs
  function twoPass(axis) {
    const pass1 = matchClusters(extract, axis, evidenceOpts);
    const firedIds = new Set(pass1.hits.map(h => h.clusterId));
    const allHits = [...pass1.hits];
    const allExcerpts = [...pass1.excerpts];

    if (viewsText) {
      const pass2 = matchClusters(viewsText, axis, {
        ...evidenceOpts, positivesOnly: true, skipIds: firedIds
      });
      pass2.hits.forEach(h => firedIds.add(h.clusterId));
      allHits.push(...pass2.hits);
      allExcerpts.push(...pass2.excerpts);
    }

    if (newsText) {
      const pass3 = matchClusters(newsText, axis, {
        ...evidenceOpts, positivesOnly: true, skipIds: firedIds
      });
      allHits.push(...pass3.hits);
      allExcerpts.push(...pass3.excerpts);
    }

    return { hits: allHits, excerpts: allExcerpts };
  }

  const j = twoPass(JUSTICE);
  const t = twoPass(TRADITION);
  const r = twoPass(RIGIDITY);

  let establishment = clamp(b + cap(sumWeights(eMerged.hits), cfg.caps.establishmentText), 0, 100);
  let justice       = clamp(b + cap(sumWeights(j.hits), cfg.caps.justiceText), 0, 100);
  let tradition     = clamp(b + cap(sumWeights(t.hits), cfg.caps.traditionText), 0, 100);
  let conflict      = clamp(b + cap(sumWeights(cMerged.hits), cfg.caps.conflictText), 0, 100);
  let rigidity      = clamp(b + cap(sumWeights(r.hits), cfg.caps.rigidityText), 0, 100);

  const fired = eMerged.hits.length + j.hits.length + t.hits.length + cMerged.hits.length + r.hits.length;
  const pf = isPublicFigure(occupations);

  let pfFallbackApplied = false;
  let salienceApplied = false;

  if (pf && fired < 4) {
    establishment = clamp(establishment + cfg.publicFigure.establishmentBump, 0, 100);
    conflict      = clamp(conflict + cfg.publicFigure.conflictBump, 0, 100);
    pfFallbackApplied = true;
  }

  const txt = normalizeText(extract);
  const salienceHit = (cfg.publicFigure.salienceTerms || []).some(term =>
    txt.includes(String(term).toLowerCase())
  );

  if (pf && salienceHit) {
    establishment = clamp(establishment + cfg.publicFigure.salienceEstablishmentBump, 0, 100);
    salienceApplied = true;
  }

  const scores = { establishment, justice, tradition, conflict, rigidity };

  const signals = {
    establishment: eMerged.hits,
    justice: j.hits,
    tradition: t.hits,
    conflict: cMerged.hits,
    rigidity: r.hits
  };

  const evidence = {
    establishment: eMerged.excerpts,
    justice: j.excerpts,
    tradition: t.excerpts,
    conflict: cMerged.excerpts,
    rigidity: r.excerpts
  };

  const allHits = [...eMerged.hits, ...j.hits, ...t.hits, ...cMerged.hits, ...r.hits];
  const totalWeight = allHits.reduce((a, h) => a + Math.abs(h.weight || 0), 0);
  const totalWeightSq = allHits.reduce((a, h) => a + (h.weight || 0) ** 2, 0);

  return {
    scores,
    signals,
    evidence,
    signalCount: fired,
    totalWeight,
    totalWeightSq,
    publicFigure: pf,
    salienceHit,
    pfFallbackApplied,
    salienceApplied
  };
}