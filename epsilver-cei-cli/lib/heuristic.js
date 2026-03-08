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

export function scoreFromTextAndOcc(extract, occupations, cfg, viewsText = "") {
  const b = cfg.baseline;

  const evidenceOpts = {
    maxExcerptsPerAxis: cfg?.evidence?.maxExcerptsPerAxis ?? 8,
    maxSentenceChars: cfg?.evidence?.maxSentenceChars ?? 260
  };

  // Behavioral axes: intro only — views sections discuss history/opponents, not subject's actions
  const e = matchClusters(extract, ESTABLISHMENT, evidenceOpts);
  const c = matchClusters(extract, CONFLICT, evidenceOpts);

  // Ideological axes: two-pass to prevent views-section dampeners from canceling intro signals
  // Pass 1: intro with all clusters (positives + negatives/dampeners)
  // Pass 2: views text with positive-weight clusters only, skipping IDs already fired in pass 1
  function twoPass(axis) {
    const pass1 = matchClusters(extract, axis, evidenceOpts);
    if (!viewsText) return pass1;
    const firedIds = new Set(pass1.hits.map(h => h.clusterId));
    const pass2 = matchClusters(viewsText, axis, {
      ...evidenceOpts,
      positivesOnly: true,
      skipIds: firedIds
    });
    return {
      hits: [...pass1.hits, ...pass2.hits],
      excerpts: [...pass1.excerpts, ...pass2.excerpts]
    };
  }

  const j = twoPass(JUSTICE);
  const t = twoPass(TRADITION);
  const r = twoPass(RIGIDITY);

  let establishment = clamp(b + cap(sumWeights(e.hits), cfg.caps.establishmentText), 0, 100);
  let justice       = clamp(b + cap(sumWeights(j.hits), cfg.caps.justiceText), 0, 100);
  let tradition     = clamp(b + cap(sumWeights(t.hits), cfg.caps.traditionText), 0, 100);
  let conflict      = clamp(b + cap(sumWeights(c.hits), cfg.caps.conflictText), 0, 100);
  let rigidity      = clamp(b + cap(sumWeights(r.hits), cfg.caps.rigidityText), 0, 100);

  const fired = e.hits.length + j.hits.length + t.hits.length + c.hits.length + r.hits.length;
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
    establishment: e.hits,
    justice: j.hits,
    tradition: t.hits,
    conflict: c.hits,
    rigidity: r.hits
  };

  const evidence = {
    establishment: e.excerpts,
    justice: j.excerpts,
    tradition: t.excerpts,
    conflict: c.excerpts,
    rigidity: r.excerpts
  };

  return {
    scores,
    signals,
    evidence,
    signalCount: fired,
    publicFigure: pf,
    salienceHit,
    pfFallbackApplied,
    salienceApplied
  };
}