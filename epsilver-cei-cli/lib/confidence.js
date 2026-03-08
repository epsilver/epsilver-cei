export function computeConfidence({ signalCount, hasImage, hasOccupations=false, summaryWordCount=0, contradictions=false }) {
  let c = 0.4;
  if (hasOccupations) c += 0.25;
  if (signalCount >= 6) c += 0.15;
  if (hasImage) c += 0.10;
  if (summaryWordCount < 40) c -= 0.20;
  if (contradictions) c -= 0.15;
  return Math.max(0, Math.min(1, c));
}
