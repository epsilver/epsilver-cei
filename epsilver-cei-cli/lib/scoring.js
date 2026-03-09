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

export function computeCEI(scores, cfg) {
  const b = cfg.baseline;
  const weights = cfg.cei.axisWeights;
  const rawDist = rmsDeviation(scores, b, weights);

  const confOver = Math.max(0, (scores.conflict - b) / 50);
  const rigOver  = Math.max(0, (scores.rigidity - b) / 50);

  let raw = rawDist * (1 + cfg.cei.conflictAmp * confOver + cfg.cei.rigidityAmp * rigOver);

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

export function computeLean(scores, cfg) {
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

  const diff = Math.abs(progressive - reactionary);
  const maxSig = Math.max(Math.abs(progressive), Math.abs(reactionary));
  const threshold = cfg?.lean?.normieThreshold ?? 15;
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
