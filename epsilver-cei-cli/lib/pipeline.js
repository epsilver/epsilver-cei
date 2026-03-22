import { wikiPageBundle, wikiImageInfo, wikiViewsSection } from "./wiki.js";
import { wikidataOccupationsAndImage } from "./wikidata.js";
import { gdeltNewsText } from "./gdelt.js";
import { scoreFromTextAndOcc } from "./heuristic.js";
import { computeCEI, computeLean } from "./scoring.js";
import { computeConfidence } from "./confidence.js";
import { govtrackData, govtrackSignals } from "./govtrack.js";

export function deriveStatus(scores, confidence, signalCount, summaryWordCount, hasImage, hasOccupations) {
  const reviewFlags = [];
  const contradictions = (scores.justice >= 75 && scores.tradition >= 75);

  const neutralButConfident =
    signalCount < 3 &&
    confidence >= 0.70 &&
    hasImage &&
    hasOccupations;

  if (confidence < 0.55) reviewFlags.push("low_confidence");
  if (signalCount < 3 && !neutralButConfident) reviewFlags.push("low_signal_density");
  if (summaryWordCount < 40) reviewFlags.push("short_summary");
  if (!hasImage) reviewFlags.push("image_missing");
  if (contradictions) reviewFlags.push("contradictory_vectors");

  const status =
    (confidence < 0.55 || contradictions || (signalCount < 3 && !neutralButConfident))
      ? "under_review"
      : "active";

  return { status, reviewFlags, contradictions };
}

export function makeAutoAdjustments(bundle) {
  const adjustments = [];
  if (bundle?.pfFallbackApplied || bundle?.salienceApplied) {
    const reasons = [];
    if (bundle.pfFallbackApplied) reasons.push("public-figure fallback bump (low signal density)");
    if (bundle.salienceApplied) reasons.push("salience-term bump");
    adjustments.push({
      at: new Date().toISOString(),
      type: "auto",
      note: "Automatic normalization applied due to low signal density: " + reasons.join(" + ")
    });
  }
  return adjustments;
}

async function resolveImageInfo(bundle, wdImageName, cfg) {
  const fileName = bundle.pageimage || wdImageName;
  if (!fileName) return null;
  return await wikiImageInfo(fileName, cfg);
}

export async function runPipeline(title, cfg) {
  const bundle = await wikiPageBundle(title, cfg);

  const wd = await wikidataOccupationsAndImage(bundle.qid, cfg);
  const occupations = wd.occupations || [];

  const viewsText = await wikiViewsSection(bundle.title, cfg);
  const newsText  = await gdeltNewsText(bundle.title, cfg);

  const scored = scoreFromTextAndOcc(bundle.extract, occupations, cfg, viewsText, newsText);
  const { scores, signals, evidence, signalCount, totalWeight, totalWeightSq } = scored;
  bundle.signals = signals;
  bundle.evidence = evidence;
  bundle.signalCount = signalCount;
  bundle.pfFallbackApplied = Boolean(scored.pfFallbackApplied);
  bundle.salienceApplied = Boolean(scored.salienceApplied);

  const POLITICAL_OCC = new Set([
    "politician","diplomat","senator","member of parliament","president","prime minister",
    "minister","legislator","governor","mayor","councillor","member of congress",
    "representative","secretary of state","government official","civil servant",
    "judge","justice","activist"
  ]);
  const isPolitical = (occupations || []).some(o => POLITICAL_OCC.has(String(o).toLowerCase()));

  const [imageInfo, gtData] = await Promise.all([
    resolveImageInfo(bundle, wd.imageName, cfg),
    isPolitical ? govtrackData(bundle.title, cfg) : Promise.resolve(null)
  ]);

  const gtSignals = govtrackSignals(gtData);
  if (gtSignals) {
    for (const axis of ["establishment","justice","tradition","conflict","rigidity"]) {
      const hits = gtSignals[axis] || [];
      if (hits.length) {
        evidence[axis] = [...(evidence[axis] || []), ...hits];
        const delta = hits.reduce((s, h) => s + (h.weight || 0), 0);
        scores[axis] = Math.max(0, Math.min(100, (scores[axis] ?? 50) + delta));
      }
    }
    bundle.govtrackApplied = true;
  }

  const hasImage = Boolean(imageInfo?.url);

  const summaryWordCount = (bundle.extract || "").trim().split(/\s+/).filter(Boolean).length;
  const { contradictions } = deriveStatus(scores, 1, signalCount, summaryWordCount, hasImage, occupations.length > 0);

  const confidence = computeConfidence({
    signalCount,
    hasImage,
    hasOccupations: occupations.length > 0,
    summaryWordCount,
    contradictions
  });

  const textLength = (bundle.extract || "").length + (viewsText || "").length + (newsText || "").length;
  const ceiOut = computeCEI(scores, cfg, { totalWeight, totalWeightSq, textLength, signalCount });
  const leanOut = computeLean(scores, cfg, { signalCount, confidence, occupations });

  const { status, reviewFlags } = deriveStatus(scores, confidence, signalCount, summaryWordCount, hasImage, occupations.length > 0);

  return { bundle, occupations, scores, ceiOut, leanOut, imageInfo, confidence, summaryWordCount, signalCount, status, reviewFlags };
}
