import { IGNORE_TOKENS } from "./keywords.js";

const OPPOSITION_PATTERNS = [
  "opposes ", "opposed to ", "opposing ",
  "fights against", "fight against",
  "rejects ", "rejection of",
  "critic of", "criticizes", "criticism of",
  "opponent of",
  "condemns ", "condemnation of",
  "resists ", "resistance to",
  "does not support", "doesn't support",
  "never supported", "never been",
  "anti-woke", "against woke", "anti-dei",
  "spreading", "conspiracism"
];

function isOppositionContext(sentence) {
  const s = sentence.toLowerCase();
  return OPPOSITION_PATTERNS.some(p => s.includes(p));
}

export function normalizeText(s) {
  let t = (s || "").toLowerCase();
  for (const tok of IGNORE_TOKENS) t = t.replaceAll(tok.toLowerCase(), " ");
  return t;
}

// Lightweight sentence splitter (good enough for wiki lead+body)
function splitSentences(text) {
  const s = String(text || "").replace(/\s+/g, " ").trim();
  if (!s) return [];
  return s
    .split(/(?<=[.!?])\s+/g)
    .map(x => x.trim())
    .filter(Boolean);
}

function pickBestSentence(sentences, termLower) {
  for (const sent of sentences) {
    if (sent.toLowerCase().includes(termLower)) return sent;
  }
  return null;
}

export function matchClusters(text, clusters, opts = {}) {
  const tnorm = normalizeText(text);
  const sentences = splitSentences(text);

  const maxExcerptsPerAxis = opts.maxExcerptsPerAxis ?? 8;
  const maxSentenceChars   = opts.maxSentenceChars ?? 260;
  const skipIds            = opts.skipIds ?? null;   // Set of cluster IDs to skip
  const positivesOnly      = opts.positivesOnly ?? false;

  const hits = [];
  const excerpts = [];

  for (const c of clusters) {
    if (positivesOnly && c.weight < 0) continue;
    if (skipIds && skipIds.has(c.id)) continue;
    let found = null;

    for (const term of c.terms) {
      const needle = term.toLowerCase();
      if (needle.length < 3) continue;

      const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const useWordBoundary = needle.length <= 8 && /^[\w\s]+$/.test(needle);
      const matched = useWordBoundary
        ? new RegExp("\\b" + escaped + "\\b").test(tnorm)
        : tnorm.includes(needle);

      if (matched) {
        const sent = pickBestSentence(sentences, needle);

        // Skip positive-weight signals that appear in opposition/negation context
        if (c.weight > 0 && sent && isOppositionContext(sent)) break;

        found = term;

        if (sent) {
          const clipped = sent.length > maxSentenceChars
            ? sent.slice(0, maxSentenceChars).trim() + "…"
            : sent;

          excerpts.push({
            clusterId: c.id,
            term: found,
            sentence: clipped,
            weight: c.weight
          });
        }
        break;
      }
    }

    if (found) hits.push({ clusterId: c.id, term: found, weight: c.weight });
    if (excerpts.length >= maxExcerptsPerAxis) break;
  }

  return { hits, excerpts };
}