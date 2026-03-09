// ── Helpers ───────────────────────────────────────────────────────────────────

function hr(ctx, x1, x2, y, color = "#d9d9d9") {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x1, y);
  ctx.lineTo(x2, y);
  ctx.stroke();
  ctx.restore();
}

function setSpacing(ctx, px) {
  try { ctx.letterSpacing = px + "px"; } catch(e) {}
}

// ── Dual Radar ────────────────────────────────────────────────────────────────

const RADAR_AXES = [
  { key: "establishment", label: "Estab." },
  { key: "justice",       label: "Justice" },
  { key: "tradition",     label: "Trad." },
  { key: "conflict",      label: "Conflict" },
  { key: "rigidity",      label: "Rigid" }
];

function radarPoint(cx, cy, r, ang) {
  return { x: cx + r * Math.cos(ang), y: cy + r * Math.sin(ang) };
}

function drawDualRadar(ctx, scoresA, scoresB, cx, cy, r) {
  const n = RADAR_AXES.length;
  const rings = [0.2, 0.4, 0.6, 0.8, 1.0];

  // Rings
  for (const rr of rings) {
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const ang = (Math.PI * 2 * i) / n - Math.PI / 2;
      const p = radarPoint(cx, cy, r * rr, ang);
      i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
    }
    ctx.closePath();
    ctx.strokeStyle = "#d9d9d0";
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Axis lines
  for (let i = 0; i < n; i++) {
    const ang = (Math.PI * 2 * i) / n - Math.PI / 2;
    const p = radarPoint(cx, cy, r, ang);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(p.x, p.y);
    ctx.strokeStyle = "#d9d9d0";
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Polygon A — black
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const ang = (Math.PI * 2 * i) / n - Math.PI / 2;
    const val = Math.max(0, Math.min(1, ((scoresA?.[RADAR_AXES[i].key] ?? 50) / 100)));
    const p = radarPoint(cx, cy, r * val, ang);
    i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
  }
  ctx.closePath();
  ctx.fillStyle = "rgba(0,0,0,0.06)";
  ctx.fill();
  ctx.strokeStyle = "#111";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Polygon B — blue
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const ang = (Math.PI * 2 * i) / n - Math.PI / 2;
    const val = Math.max(0, Math.min(1, ((scoresB?.[RADAR_AXES[i].key] ?? 50) / 100)));
    const p = radarPoint(cx, cy, r * val, ang);
    i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
  }
  ctx.closePath();
  ctx.fillStyle = "rgba(44,107,255,0.08)";
  ctx.fill();
  ctx.strokeStyle = "#2c6bff";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Labels
  ctx.fillStyle = "#666";
  ctx.textAlign = "center";
  ctx.font = "800 18px 'Inter', system-ui, sans-serif";
  for (let i = 0; i < n; i++) {
    const ang = (Math.PI * 2 * i) / n - Math.PI / 2;
    const p = radarPoint(cx, cy, r + 26, ang);
    ctx.fillText(RADAR_AXES[i].label, p.x, p.y + 6);
  }
}

// ── Compare card ──────────────────────────────────────────────────────────────

export function generateCompareCard(pa, pb) {
  const W    = 1080;
  const H    = 1350;
  const PAD  = 64;
  const INK  = "#0a0a0a";
  const MUTED = "#444";
  const RULE  = "#d9d9d9";
  const BLUE  = "#2c6bff";

  const canvas = document.createElement("canvas");
  canvas.width  = W * 2;
  canvas.height = H * 2;
  const ctx = canvas.getContext("2d");
  ctx.scale(2, 2);

  // Background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);

  // Rainbow stripe
  const grad = ctx.createLinearGradient(0, 0, W, 0);
  grad.addColorStop(0,   "#ff2a2a");
  grad.addColorStop(0.2, "#ff7a00");
  grad.addColorStop(0.4, "#ffd400");
  grad.addColorStop(0.6, "#10c070");
  grad.addColorStop(0.8, "#2c6bff");
  grad.addColorStop(1.0, "#8a2be2");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, 6);

  // Kicker
  ctx.fillStyle = MUTED;
  ctx.textAlign = "center";
  ctx.font = "400 24px 'Inter', system-ui, sans-serif";
  setSpacing(ctx, 2.5);
  ctx.fillText("CULTURAL EXTREMITY INDEX", W / 2, 6 + 36);
  setSpacing(ctx, 0);

  let y = 6 + 60;

  // Two names side by side
  const half = W / 2;
  const isSelf = pb.slug === "you";

  const fitFont = (name, maxW) => {
    ctx.font = "bold 52px 'Inter', system-ui, sans-serif";
    return ctx.measureText(name).width > maxW
      ? "bold 36px 'Inter', system-ui, sans-serif"
      : "bold 52px 'Inter', system-ui, sans-serif";
  };

  ctx.fillStyle = INK;
  ctx.textAlign = "center";
  ctx.font = fitFont(pa.name, half - PAD);
  ctx.fillText(pa.name, half / 2, y + 52);

  ctx.fillStyle = BLUE;
  ctx.font = fitFont(pb.name, half - PAD);
  ctx.fillText(pb.name, half + half / 2, y + 52);

  if (isSelf) {
    ctx.fillStyle = MUTED;
    ctx.font = "300 20px 'Inter', system-ui, sans-serif";
    setSpacing(ctx, 1.5);
    ctx.fillText("SELF-ASSESSMENT", half + half / 2, y + 80);
    setSpacing(ctx, 0);
    y += 100;
  } else {
    y += 74;
  }

  // Vertical divider
  ctx.save();
  ctx.strokeStyle = RULE;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(half, 6 + 60);
  ctx.lineTo(half, y);
  ctx.stroke();
  ctx.restore();

  // HR
  hr(ctx, PAD, W - PAD, y);
  y += 36;

  // Dual radar
  const RADAR_SIZE = 480;
  const RADAR_R    = RADAR_SIZE / 2 - 36;
  drawDualRadar(ctx, pa.scores || {}, pb.scores || {}, W / 2, y + RADAR_SIZE / 2, RADAR_R);
  y += RADAR_SIZE + 20;

  // Legend
  const swatchW = 28;
  const legendSpacing = 240;
  const legendCX = W / 2;

  ctx.fillStyle = INK;
  ctx.fillRect(legendCX - legendSpacing / 2 - swatchW - 8, y + 4, swatchW, 4);
  ctx.textAlign = "left";
  ctx.font = "600 20px 'Inter', system-ui, sans-serif";
  ctx.fillText(pa.name, legendCX - legendSpacing / 2, y + 10);

  ctx.fillStyle = BLUE;
  ctx.fillRect(legendCX + legendSpacing / 2, y + 4, swatchW, 4);
  ctx.fillText(pb.name, legendCX + legendSpacing / 2 + swatchW + 8, y + 10);

  y += 40;

  // HR
  hr(ctx, PAD, W - PAD, y);
  y += 28;

  // Two CEI boxes side by side
  const ceiA  = pa.cei || { value: "—", tier: "" };
  const ceiB  = pb.cei || { value: "—", tier: "" };
  const BOX_W = (W - PAD * 2 - 16) / 2;
  const BOX_H = 118;
  const BP    = 20;

  // Box A
  ctx.save();
  ctx.strokeStyle = RULE;
  ctx.lineWidth = 1;
  ctx.strokeRect(PAD, y, BOX_W, BOX_H);
  ctx.restore();
  ctx.fillStyle = INK;
  ctx.textAlign = "left";
  ctx.font = "900 68px 'Inter', system-ui, sans-serif";
  ctx.fillText("CEI " + String(ceiA.value ?? ""), PAD + BP, y + BOX_H / 2 + 22);
  ctx.fillStyle = MUTED;
  ctx.textAlign = "right";
  ctx.font = "bold 20px 'Inter', system-ui, sans-serif";
  setSpacing(ctx, 1.5);
  ctx.fillText((ceiA.tier || "").toUpperCase(), PAD + BOX_W - BP, y + BOX_H / 2 - 4);
  ctx.font = "bold 16px 'Inter', system-ui, sans-serif";
  setSpacing(ctx, 1.8);
  ctx.fillText((pa.primaryLean || "").toUpperCase(), PAD + BOX_W - BP, y + BOX_H / 2 + 20);
  setSpacing(ctx, 0);

  // Box B
  const bx = PAD + BOX_W + 16;
  ctx.save();
  ctx.strokeStyle = BLUE;
  ctx.lineWidth = 1;
  ctx.strokeRect(bx, y, BOX_W, BOX_H);
  ctx.restore();
  ctx.fillStyle = BLUE;
  ctx.textAlign = "left";
  ctx.font = "900 68px 'Inter', system-ui, sans-serif";
  ctx.fillText("CEI " + String(ceiB.value ?? ""), bx + BP, y + BOX_H / 2 + 22);
  ctx.fillStyle = MUTED;
  ctx.textAlign = "right";
  ctx.font = "bold 20px 'Inter', system-ui, sans-serif";
  setSpacing(ctx, 1.5);
  ctx.fillText((ceiB.tier || "").toUpperCase(), bx + BOX_W - BP, y + BOX_H / 2 - 4);
  ctx.font = "bold 16px 'Inter', system-ui, sans-serif";
  setSpacing(ctx, 1.8);
  ctx.fillText((pb.primaryLean || "").toUpperCase(), bx + BOX_W - BP, y + BOX_H / 2 + 20);
  setSpacing(ctx, 0);

  y += BOX_H + 28;

  // HR
  hr(ctx, PAD, W - PAD, y);
  y += 28;

  // Axis bars — two stacked lines per axis
  const axisKeys   = ["establishment", "justice", "tradition", "conflict", "rigidity"];
  const axisLabels = ["Establishment", "Justice", "Tradition", "Conflict", "Rigidity"];
  const LABEL_W = 220;
  const VAL_W   = 72;
  const barX    = PAD + LABEL_W;
  const barW    = W - PAD * 2 - LABEL_W - VAL_W;

  for (let i = 0; i < axisKeys.length; i++) {
    const valA = pa.scores?.[axisKeys[i]] ?? 50;
    const valB = pb.scores?.[axisKeys[i]] ?? 50;

    ctx.fillStyle = INK;
    ctx.textAlign = "left";
    ctx.font = "bold 22px 'Inter', system-ui, sans-serif";
    setSpacing(ctx, 0.8);
    ctx.fillText(axisLabels[i].toUpperCase(), PAD, y + 18);
    setSpacing(ctx, 0);

    // Track
    ctx.fillStyle = RULE;
    ctx.fillRect(barX, y + 10, barW, 6);

    // Bar A (black, top)
    ctx.fillStyle = INK;
    ctx.fillRect(barX, y + 10, (valA / 100) * barW, 3);

    // Bar B (blue, bottom)
    ctx.fillStyle = BLUE;
    ctx.fillRect(barX, y + 13, (valB / 100) * barW, 3);

    // Values
    ctx.fillStyle = INK;
    ctx.textAlign = "right";
    ctx.font = "400 18px 'Inter', system-ui, sans-serif";
    ctx.fillText(String(valA), W - PAD, y + 13);
    ctx.fillStyle = BLUE;
    ctx.fillText(String(valB), W - PAD, y + 28);

    y += 46;
  }

  y += 14;

  // HR + URL
  hr(ctx, PAD, W - PAD, y);
  ctx.fillStyle = MUTED;
  ctx.textAlign = "center";
  ctx.font = "400 22px 'Inter', system-ui, sans-serif";
  setSpacing(ctx, 2.5);
  ctx.fillText("CULTURALEXTREMITYINDEX.COM", W / 2, y + (H - y) / 2 + 8);
  setSpacing(ctx, 0);

  return canvas;
}

export function downloadCompareCard(pa, pb) {
  const canvas = generateCompareCard(pa, pb);
  const a = document.createElement("a");
  a.href     = canvas.toDataURL("image/png");
  a.download = "cei-compare.png";
  a.click();
}
