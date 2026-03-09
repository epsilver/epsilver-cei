// ── Helpers (shared pattern from profileCard.js) ──────────────────────────────

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

// ── Radar (same as profileCard.js) ────────────────────────────────────────────

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

function drawRadar(ctx, scores, cx, cy, r) {
  const n = RADAR_AXES.length;
  const rings = [0.2, 0.4, 0.6, 0.8, 1.0];

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

  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const ang = (Math.PI * 2 * i) / n - Math.PI / 2;
    const val = Math.max(0, Math.min(1, ((scores?.[RADAR_AXES[i].key] ?? 50) / 100)));
    const p = radarPoint(cx, cy, r * val, ang);
    i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
  }
  ctx.closePath();
  ctx.fillStyle = "rgba(0,0,0,0.06)";
  ctx.fill();
  ctx.strokeStyle = "#111";
  ctx.lineWidth = 1.4;
  ctx.stroke();

  ctx.fillStyle = "#666";
  ctx.textAlign = "center";
  ctx.font = "800 18px 'Inter', system-ui, sans-serif";
  for (let i = 0; i < n; i++) {
    const ang = (Math.PI * 2 * i) / n - Math.PI / 2;
    const p = radarPoint(cx, cy, r + 26, ang);
    ctx.fillText(RADAR_AXES[i].label, p.x, p.y + 6);
  }
}

// ── Explainer card ────────────────────────────────────────────────────────────

export function generateExplainerCard() {
  const W     = 1080;
  const H     = 1350;
  const PAD   = 64;
  const INK   = "#0a0a0a";
  const MUTED = "#444";
  const RULE  = "#d9d9d9";

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

  // Title
  ctx.fillStyle = INK;
  ctx.textAlign = "center";
  ctx.font = "bold 100px 'Inter', system-ui, sans-serif";
  ctx.fillText("How it works.", W / 2, y + 78);
  y += 106;

  // Tagline (occupations-style)
  ctx.fillStyle = MUTED;
  ctx.textAlign = "center";
  ctx.font = "300 30px 'Inter', system-ui, sans-serif";
  ctx.fillText("LLM-free heuristic scoring  ·  Five axes  ·  Publicly sourced", W / 2, y);
  y += 52;

  // Radar wheel
  const RADAR_SIZE = 520;
  const RADAR_R    = RADAR_SIZE / 2 - 36;
  const illustrative = {
    establishment: 72,
    justice: 38,
    tradition: 64,
    conflict: 80,
    rigidity: 55
  };
  drawRadar(ctx, illustrative, W / 2, y + RADAR_SIZE / 2, RADAR_R);
  y += RADAR_SIZE + 28;

  // HR
  hr(ctx, PAD, W - PAD, y);
  y += 32;

  // CEI box — identical to profileCard.js drawBottom
  const BOX_PAD = 28;
  const BOX_H   = 135;
  const BOX_W2  = W - PAD * 2;

  ctx.save();
  ctx.strokeStyle = RULE;
  ctx.lineWidth = 1;
  ctx.strokeRect(PAD, y, BOX_W2, BOX_H);
  ctx.restore();

  ctx.fillStyle = INK;
  ctx.textAlign = "left";
  ctx.font = "900 100px 'Inter', system-ui, sans-serif";
  ctx.fillText("CEI 61", PAD + BOX_PAD, y + BOX_H / 2 + 30);

  ctx.fillStyle = MUTED;
  ctx.textAlign = "right";
  ctx.font = "bold 34px 'Inter', system-ui, sans-serif";
  setSpacing(ctx, 1.5);
  ctx.fillText("HIGH", PAD + BOX_W2 - BOX_PAD, y + BOX_H / 2 - 8);
  ctx.font = "bold 26px 'Inter', system-ui, sans-serif";
  setSpacing(ctx, 1.8);
  ctx.fillText("CHUD", PAD + BOX_W2 - BOX_PAD, y + BOX_H / 2 + 30);
  setSpacing(ctx, 0);

  y += BOX_H + 28;

  // HR
  hr(ctx, PAD, W - PAD, y);
  y += 28;

  // Axis bars — identical to profileCard.js drawBottom
  const axisKeys   = ["establishment", "justice", "tradition", "conflict", "rigidity"];
  const axisLabels = ["Establishment", "Justice", "Tradition", "Conflict", "Rigidity"];
  const LABEL_W = 230;
  const VAL_W   = 56;
  const barX    = PAD + LABEL_W;
  const barW    = W - PAD * 2 - LABEL_W - VAL_W - 10;

  for (let i = 0; i < axisKeys.length; i++) {
    const val = illustrative[axisKeys[i]] ?? 50;

    ctx.fillStyle = INK;
    ctx.textAlign = "left";
    ctx.font = "bold 24px 'Inter', system-ui, sans-serif";
    setSpacing(ctx, 0.8);
    ctx.fillText(axisLabels[i].toUpperCase(), PAD, y + 22);
    setSpacing(ctx, 0);

    ctx.fillStyle = RULE;
    ctx.fillRect(barX, y + 16, barW, 3);
    ctx.fillStyle = INK;
    ctx.fillRect(barX, y + 16, (val / 100) * barW, 3);

    ctx.fillStyle = MUTED;
    ctx.textAlign = "right";
    ctx.font = "400 24px 'Inter', system-ui, sans-serif";
    ctx.fillText(String(val), W - PAD, y + 22);

    y += 48;
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

export function downloadExplainerCard() {
  const canvas = generateExplainerCard();
  const a = document.createElement("a");
  a.href     = canvas.toDataURL("image/png");
  a.download = "cei-explainer.png";
  a.click();
}
