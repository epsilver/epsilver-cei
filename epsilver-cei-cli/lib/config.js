export const DEFAULTS = {
  userAgent: "Epsilver-CEI-Crawler/0.3 (contact: you@example.com)",
  cacheDir: ".cache_wiki",
  sleepMs: 900,
  baseline: 50,

  // CEI soft-normalization (rescaled logistic):
  // - raw=0 maps to 0
  // - raw~5 maps ~20-30
  // - raw~10 maps ~60-70 (High for clear ideological shapes)
  // - raw~20 maps ~95+
  cei: {
    logisticMidpoint: 3.0,
    logisticK: 1.2,
    conflictAmp: 0.10,
    rigidityAmp: 0.30,
    establishmentDampenThreshold: 80,
    establishmentDampenStrength: 0.20,
    axisWeights: { establishment: 1.0, justice: 0.6, tradition: 0.6, conflict: 1.4, rigidity: 1.3 }
  },

  lean: {
    establishmentWeight: 0.25,
    conflictWeight: 0.15,
    rigidityWeight: 0.5,
    normieThreshold: 15,
    normieMinSignal: 8
  },

  caps: {
    establishmentText: 20,
    justiceText: 25,
    traditionText: 30,
    conflictText: 35,
    rigidityText: 30
  },

  // Public-figure fallback (broad): light touch to avoid all-50 wheels
  publicFigure: {
    establishmentBump: 2,
    conflictBump: 1,
    salienceEstablishmentBump: 1,
    salienceTerms: [
      "best-selling", "bestselling", "highest-grossing", "record-breaking",
      "most-streamed", "most followed", "most-followed", "cultural phenomenon"
    ]
  }
};
