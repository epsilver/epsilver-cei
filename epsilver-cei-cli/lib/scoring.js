function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }

function rmsDeviation(scores, baseline, weights) {
  const axes = ["establishment", "justice", "tradition", "conflict", "rigidity"];
  const weighted = axes.map(a => Math.abs(scores[a] - baseline) * (weights[a] ?? 1));
  const meanSq = weighted.reduce((a, d) => a + d*d, 0) / weighted.length;
  return Math.sqrt(meanSq);
}

function logistic01(x, k, m) { return 1 / (1 + Math.exp(-k * (x - m))); }

export function ceiTier(cei) {
  if (cei <= 20) return "Minimal";
  if (cei <= 40) return "Moderate";
  if (cei <= 60) return "Elevated";
  if (cei <= 80) return "High";
  return "Extreme";
}

export function computeCEI(scores, cfg, meta = {}) {
  const b = cfg.baseline;
  const weights = cfg.cei.axisWeights;

  // Signal density: total weight per 1000 chars of source text
  // Consequence ratio: what fraction of signal weight comes from actual backlash
  // (banned, racist, deplatformed) vs just holding positions (conservative, anti-DEI)
  // High consequence ratio = genuinely extreme; low = just opinionated
  const { totalWeight = 0, consequenceWeight = 0, textLength = 0 } = meta;
  const conseqRatio = totalWeight > 0 ? consequenceWeight / totalWeight : 0;
  // Scale: 0% consequence = 0.35x, 50% = 1.0x, 100% = 1.65x
  const conseqMul = 0.35 + (conseqRatio * 1.3);
  const density = textLength > 0 ? (totalWeight * conseqMul / textLength) * 1000 : 0;

  // Count axes with strong deviation from baseline (>= 20 points)
  const axes = ["establishment", "justice", "tradition", "conflict", "rigidity"];
  const hotAxes = axes.filter(a => Math.abs((scores[a] ?? b) - b) >= 20).length;

  // Axis spread multiplier: more hot axes = more extreme
  // 0 hot axes = 0.18x, 5 hot axes = 1.83x
  const spreadMul = 0.18 + (hotAxes * 0.33);

  // Blend: density scaled by axis spread + minimal RMS for shape
  const rmsRaw = rmsDeviation(scores, b, weights);
  let raw = density > 0 ? (density * spreadMul) + (rmsRaw * 0.05) : rmsRaw * 0.5;

  const confOver = Math.max(0, (scores.conflict - b) / 50);
  const rigOver  = Math.max(0, (scores.rigidity - b) / 50);

  raw = raw * (1 + cfg.cei.conflictAmp * confOver + cfg.cei.rigidityAmp * rigOver);

  if (scores.establishment >= cfg.cei.establishmentDampenThreshold) {
    const over = (scores.establishment - cfg.cei.establishmentDampenThreshold) / (100 - cfg.cei.establishmentDampenThreshold);
    raw = raw * (1 - cfg.cei.establishmentDampenStrength * clamp(over, 0, 1));
  }

  // Rescaled logistic with sqrt compression: force raw=0 => 0, compress upper range
  const sqrtRaw = Math.sqrt(raw);
  const s0 = logistic01(0, cfg.cei.logisticK, cfg.cei.logisticMidpoint);
  const sr = logistic01(sqrtRaw, cfg.cei.logisticK, cfg.cei.logisticMidpoint);
  const x01 = (sr - s0) / (1 - s0);

  const cei = Math.round(clamp(x01 * 100, 0, 100));
  return { raw, cei, tier: ceiTier(cei) };
}

const POLITICAL_OCCUPATIONS = new Set([
  "politician","diplomat","activist","government official","civil servant",
  "senator","member of parliament","president","prime minister","minister",
  "judge","justice","legislator","governor","mayor","councillor",
  "member of congress","representative","secretary of state"
]);

const ENTERTAINMENT_OCCUPATIONS = new Set([
  "youtuber","streamer","online streamer","podcaster","content creator",
  "internet personality","social media personality","twitch streamer",
  "kick streamer","video blogger"
]);

function classifyOccupation(occupations) {
  const lower = (occupations || []).map(o => o.toLowerCase());
  if (lower.some(o => POLITICAL_OCCUPATIONS.has(o))) return "political";
  if (lower.some(o => ENTERTAINMENT_OCCUPATIONS.has(o))) return "entertainment";
  return "other";
}

export function computeLean(scores, cfg, meta = {}) {
  const { signalCount = null, confidence = null, occupations = [] } = meta;
  const b = cfg.baseline;
  const ew = cfg.lean.establishmentWeight;
  const cw = cfg.lean.conflictWeight;
  const rw = cfg.lean.rigidityWeight ?? 0.5;

  // Rigidity is a Chud-direction axis: elevated R pushes toward reactionary
  const rigidityBias = rw * (scores.rigidity - b);

  const progressive = (scores.justice - scores.tradition)
    + ew * (b - scores.establishment)
    + cw * (scores.conflict - b)
    - rigidityBias;

  const reactionary = (scores.tradition - scores.justice)
    + ew * (scores.establishment - b)
    + cw * (scores.conflict - b)
    + rigidityBias;

  // Zero-signal special cases
  if (signalCount === 0) {
    const occType = classifyOccupation(occupations);
    if (occType === "political") {
      // Political figures with no signals get forced lean — fall through
    } else if (occType === "entertainment") {
      return { code: "N", progressive, reactionary };
    } else if (confidence !== null && confidence < 0.70) {
      return { code: "N", progressive, reactionary };
    }
  }

  const diff = Math.abs(progressive - reactionary);
  const maxSig = Math.max(Math.abs(progressive), Math.abs(reactionary));
  const threshold = cfg?.lean?.normieThreshold ?? 20;
  const minSignal = cfg?.lean?.normieMinSignal ?? 8;

  let code;
  if (diff < threshold && maxSig >= minSignal) {
    code = "N";
  } else {
    code = (progressive >= reactionary) ? "P" : "R";
  }

  return { code, progressive, reactionary };
}

export function leanLabel(code, labels = { P:"Woke", R:"Chud", N:"Normie" }) {
  return labels[code] || code;
}
