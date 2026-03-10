import { wikiPageBundle, wikiImageInfo, wikiViewsSection } from "./wiki.js";
import { wikidataOccupationsAndImage } from "./wikidata.js";
import { scoreFromTextAndOcc } from "./heuristic.js";
import { computeCEI, computeLean } from "./scoring.js";
import { computeConfidence } from "./confidence.js";

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

  const scored = scoreFromTextAndOcc(bundle.extract, occupations, cfg, viewsText);
  const { scores, signals, evidence, signalCount } = scored;
  bundle.signals = signals;
  bundle.evidence = evidence;
  bundle.signalCount = signalCount;
  bundle.pfFallbackApplied = Boolean(scored.pfFallbackApplied);
  bundle.salienceApplied = Boolean(scored.salienceApplied);

  const imageInfo = await resolveImageInfo(bundle, wd.imageName, cfg);
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

  const ceiOut = computeCEI(scores, cfg);
  const leanOut = computeLean(scores, cfg, { signalCount, confidence, occupations });

  const { status, reviewFlags } = deriveStatus(scores, confidence, signalCount, summaryWordCount, hasImage, occupations.length > 0);

  return { bundle, occupations, scores, ceiOut, leanOut, imageInfo, confidence, summaryWordCount, signalCount, status, reviewFlags };
}
