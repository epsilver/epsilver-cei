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
  ctx.font = "400 22px 'Inter', system-ui, sans-serif";
  setSpacing(ctx, 2.5);
  ctx.fillText("CULTURAL EXTREMITY INDEX", W / 2, 6 + 34);
  setSpacing(ctx, 0);

  let y = 6 + 34 + 20;

  // HR
  hr(ctx, PAD, W - PAD, y);
  y += 48;

  // Title
  ctx.fillStyle = INK;
  ctx.textAlign = "left";
  ctx.font = "900 88px 'Inter', system-ui, sans-serif";
  ctx.fillText("Assessing", PAD, y + 72);
  y += 86;
  ctx.fillText("extremism.", PAD, y + 72);
  y += 96;

  // Tagline
  ctx.fillStyle = MUTED;
  ctx.font = "300 28px 'Inter', system-ui, sans-serif";
  ctx.fillText("LLM-free. Publicly sourced. Fully deterministic.", PAD, y + 36);
  y += 62;

  // HR
  hr(ctx, PAD, W - PAD, y);
  y += 32;

  // Radar wheel
  const RADAR_SIZE = 480;
  const RADAR_R    = RADAR_SIZE / 2 - 36;
  const illustrative = {
    establishment: 72,
    justice: 38,
    tradition: 64,
    conflict: 80,
    rigidity: 55
  };
  drawRadar(ctx, illustrative, W / 2, y + RADAR_SIZE / 2, RADAR_R);
  y += RADAR_SIZE + 10;

  // Sample label
  ctx.fillStyle = MUTED;
  ctx.textAlign = "center";
  ctx.font = "400 20px 'Inter', system-ui, sans-serif";
  setSpacing(ctx, 1.5);
  ctx.fillText("ILLUSTRATIVE PROFILE  ·  CEI 61  ·  HIGH", W / 2, y + 4);
  setSpacing(ctx, 0);
  y += 36;

  // HR
  hr(ctx, PAD, W - PAD, y);
  y += 44;

  // Bullets
  const bullets = [
    ["No large language models", "Pure heuristic keyword scoring across five axes."],
    ["Signal balanced in context", "Each match checks the sentence for negation and affirmation before counting."],
    ["Five axes", "Establishment · Justice · Tradition · Conflict · Rigidity"],
    ["Publicly sourced", "Scores derived from publicly available online information only."],
  ];

  for (const [title, body] of bullets) {
    ctx.fillStyle = INK;
    ctx.textAlign = "left";
    ctx.font = "700 26px 'Inter', system-ui, sans-serif";
    ctx.fillText("— " + title, PAD, y);
    y += 34;

    ctx.fillStyle = MUTED;
    ctx.font = "300 22px 'Inter', system-ui, sans-serif";

    // Simple word wrap
    const words = body.split(" ");
    let line = "";
    const maxW = W - PAD * 2;
    for (const word of words) {
      const test = line ? line + " " + word : word;
      if (ctx.measureText(test).width > maxW && line) {
        ctx.fillText(line, PAD, y);
        y += 30;
        line = word;
      } else {
        line = test;
      }
    }
    if (line) { ctx.fillText(line, PAD, y); y += 30; }
    y += 18;
  }

  // HR + URL
  y += 10;
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
