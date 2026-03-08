import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE_PATH = path.resolve(__dirname, "../../epsilver-cei-site");

/**
 * ASCII-only sanitizer (Option 1).
 * Keeps the site + CLI from emitting weird UTF garbage.
 */
function asciiSafe(s) {
  if (s == null) return s;
  let x = String(s);
  x = x
    .replace(/[\u2014\u2013]/g, "-")   // em/en dash
    .replace(/\u2022/g, "|")          // bullet
    .replace(/\u2026/g, "...")        // ellipsis
    .replace(/[\u201C\u201D]/g, '"')  // curly double quotes
    .replace(/[\u2018\u2019]/g, "'")  // curly single quotes
    .replace(/\u00A0/g, " ");         // nbsp
  return x;
}

function asciiSafeDeep(obj) {
  if (obj == null) return obj;
  if (typeof obj === "string") return asciiSafe(obj);
  if (Array.isArray(obj)) return obj.map(asciiSafeDeep);
  if (typeof obj === "object") {
    const out = {};
    for (const [k, v] of Object.entries(obj)) out[k] = asciiSafeDeep(v);
    return out;
  }
  return obj;
}

function stripBOM(s) {
  if (!s) return s;
  return s.charCodeAt(0) === 0xFEFF ? s.slice(1) : s;
}

export function slugify(name) {
  return String(name || "")
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "") || "subject";
}

function summarizeLead(extract) {
  if (!extract) return "";
  const s = String(extract).replace(/\s+/g, " ").trim();
  const parts = s.split(/(?<=[.!?])\s+/).slice(0, 2);
  return parts.join(" ").slice(0, 320);
}

function makeComputedSummary({ confidence, signalCount, sourceCount, hasImage, occupationsCount }) {
  const ceiBasis = "five-axis signal wheel";
  const src = sourceCount ? (sourceCount + " primary source link(s)") : "public-source link(s)";
  const occ = occupationsCount ? (occupationsCount + " occupation tag(s)") : "occupation tags";
  const img = hasImage ? "portrait present" : "portrait missing";
  const sig = (typeof signalCount === "number") ? (signalCount + " signal cluster(s)") : "signal clusters";
  const conf = (typeof confidence === "number") ? confidence : 0;

  return "Epsilver CEI model ingest: Wikipedia lead + infobox metadata; normalized into a " + ceiBasis +
    ". Inputs observed: " + src + ", " + occ + ", " + img + ", " + sig +
    ". Confidence " + Math.round(conf * 100) + "%.";
}

/**
 * bundle is expected to include:
 * - title, extract, fullurl
 * - bundle.signals (optional)
 * - bundle.evidence (optional)
 * - bundle.signalCount (optional)
 * - bundle.pfFallbackApplied / bundle.salienceApplied (optional)
 */
export function buildProfile({ bundle, imageInfo, scores, confidence, reviewFlags, status, adjustments, occupations = [] }) {
  const slug = slugify(bundle.title);

  const imageCredit = imageInfo ? {
    fileUrl: imageInfo?.url || null,
    author: imageInfo?.extmetadata?.Artist?.value || null,
    license: imageInfo?.extmetadata?.LicenseShortName?.value || null,
    attributionText: imageInfo?.extmetadata?.Attribution?.value || null
  } : null;

  const sourceCount = bundle.fullurl ? 1 : 0;
  const occupationsCount = Array.isArray(bundle.occupations) ? bundle.occupations.length : 0;
  const hasImage = !!(imageInfo?.url);
  const signalCount = (bundle.signalCount ?? bundle.signalsFired ?? null);

  const modelReadout = {
    instrument: "Wikipedia lead + infobox metadata -> heuristic clusters -> five-axis signal wheel",
    observed: {
      sourceCount,
      occupationsCount,
      hasImage,
      signalCount
    },
    confidencePct: Math.round(((typeof confidence === "number" ? confidence : 0) * 100)),
    // Persist evidence + raw signal hits (these are what the site will print)
    evidence: bundle.evidence || null,
    signals: bundle.signals || null,
    pfFallbackApplied: !!bundle.pfFallbackApplied,
    salienceApplied: !!bundle.salienceApplied
  };

  const profile = {
    slug,
    name: bundle.title,
    aliases: [],
    portraitPath: imageInfo?.url || "",
    portraitIsRemote: !!(imageInfo?.url),
    sources: bundle.fullurl ? [bundle.fullurl] : [],
    researchSummary: summarizeLead(bundle.extract),

    computedSummary: makeComputedSummary({
      confidence,
      signalCount,
      sourceCount,
      hasImage,
      occupationsCount
    }),

    // NEW: structured readout (safe to render)
    modelReadout,

    modelInputs: {
      source: "Wikipedia lead + infobox fields + heuristic keyword clusters",
      signalsFired: signalCount,
      confidence: (typeof confidence === "number") ? confidence : 0,
      lastImportedAt: new Date().toISOString()
    },

    occupations: Array.isArray(occupations) ? occupations : [],
    scores,
    adjustments: Array.isArray(adjustments) ? adjustments : [],
    status,
    reviewNote: status === "under_review" ? "Pending vector reassessment." : "",
    confidence,
    reviewFlags,
    imageCredit
  };

  return asciiSafeDeep(profile);
}

export function mergeIntoProfilesJson(profile) {
  const dataPath = path.join(SITE_PATH, "public", "data", "profiles.json");
  if (!fs.existsSync(dataPath)) throw new Error("profiles.json not found at: " + dataPath);

  const raw = stripBOM(fs.readFileSync(dataPath, "utf8"));
  const doc = JSON.parse(raw);

  const arr = Array.isArray(doc?.profiles) ? doc.profiles : [];
  const idx = arr.findIndex(p => p.slug === profile.slug);

  const incoming = asciiSafeDeep(profile);

  if (idx >= 0) {
    const existing = arr[idx];
    arr[idx] = asciiSafeDeep({
      ...existing,
      ...incoming,
      aliases: existing.aliases?.length ? existing.aliases : incoming.aliases,
      portraitPath: existing.portraitPath || incoming.portraitPath,
      // Prefer incoming adjustments if present; else keep existing
      adjustments: (incoming.adjustments && incoming.adjustments.length) ? incoming.adjustments : (existing.adjustments || [])
    });
  } else {
    arr.push(incoming);
  }

  doc.profiles = asciiSafeDeep(arr);
  fs.writeFileSync(dataPath, JSON.stringify(asciiSafeDeep(doc), null, 2), "utf8");
}