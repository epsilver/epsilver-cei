// ── Helpers ───────────────────────────────────────────────────────────────────

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload  = () => resolve(img);
    img.onerror = () => reject(new Error("Image load failed: " + src));
    img.src = src;
  });
}

function wrapText(ctx, text, maxWidth, maxLines) {
  const words = text.split(" ");
  const lines = [];
  let line = "";
  for (const word of words) {
    const test = line ? line + " " + word : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      if (lines.length >= maxLines) return lines;
      line = word;
    } else {
      line = test;
    }
  }
  if (line && lines.length < maxLines) lines.push(line);
  return lines;
}

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

// ── Radar ─────────────────────────────────────────────────────────────────────

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

  // Filled polygon
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

  // Labels
  ctx.fillStyle = "#666";
  ctx.textAlign = "center";
  ctx.font = "800 18px 'Helvetica Neue', Helvetica, Arial, sans-serif";
  for (let i = 0; i < n; i++) {
    const ang = (Math.PI * 2 * i) / n - Math.PI / 2;
    const p = radarPoint(cx, cy, r + 26, ang);
    ctx.fillText(RADAR_AXES[i].label, p.x, p.y + 6);
  }
}

// ── Font loader ───────────────────────────────────────────────────────────────

async function loadHeavyFont() {
  if (document.fonts && !loadHeavyFont._loaded) {
    try {
      const ff = new FontFace(
        "HelveticaNeueHeavy",
        "url('/Fonts/helvetica-neue-5/HelveticaNeueHeavy.otf') format('opentype')"
      );
      const loaded = await ff.load();
      document.fonts.add(loaded);
      loadHeavyFont._loaded = true;
    } catch(e) { /* fall back to system font */ }
  }
}

// ── Shared bottom section ─────────────────────────────────────────────────────

function drawBottom(ctx, p, y, W, H, PAD, INK, MUTED, RULE) {
  const scores     = p.scores || {};
  const axisKeys   = ["establishment", "justice", "tradition", "conflict", "rigidity"];
  const axisLabels = ["Establishment", "Justice", "Tradition", "Conflict", "Rigidity"];
  const cei        = p.cei || { value: 0, tier: "Minimal" };
  const lean       = p.primaryLean || "";

  // HR
  hr(ctx, PAD, W - PAD, y);
  y += 32;

  // CEI box
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
  ctx.font = "900 100px 'HelveticaNeueHeavy', 'Helvetica Neue', Helvetica, Arial, sans-serif";
  ctx.fillText("CEI " + String(cei.value ?? ""), PAD + BOX_PAD, y + BOX_H / 2 + 30);

  ctx.fillStyle = MUTED;
  ctx.textAlign = "right";
  ctx.font = "bold 34px 'Helvetica Neue', Helvetica, Arial, sans-serif";
  setSpacing(ctx, 1.5);
  ctx.fillText((cei.tier || "").toUpperCase(), PAD + BOX_W2 - BOX_PAD, y + BOX_H / 2 - 8);

  ctx.font = "bold 26px 'Helvetica Neue', Helvetica, Arial, sans-serif";
  setSpacing(ctx, 1.8);
  ctx.fillText(lean.toUpperCase(), PAD + BOX_W2 - BOX_PAD, y + BOX_H / 2 + 30);
  setSpacing(ctx, 0);

  y += BOX_H + 28;

  // HR
  hr(ctx, PAD, W - PAD, y);
  y += 28;

  // Axis bars
  const LABEL_W = 230;
  const VAL_W   = 56;
  const barX    = PAD + LABEL_W;
  const barW    = W - PAD * 2 - LABEL_W - VAL_W - 10;

  for (let i = 0; i < axisKeys.length; i++) {
    const val = scores[axisKeys[i]] ?? 50;

    ctx.fillStyle = INK;
    ctx.textAlign = "left";
    ctx.font = "bold 24px 'Helvetica Neue', Helvetica, Arial, sans-serif";
    setSpacing(ctx, 0.8);
    ctx.fillText(axisLabels[i].toUpperCase(), PAD, y + 22);
    setSpacing(ctx, 0);

    ctx.fillStyle = RULE;
    ctx.fillRect(barX, y + 16, barW, 3);
    ctx.fillStyle = INK;
    ctx.fillRect(barX, y + 16, (val / 100) * barW, 3);

    ctx.fillStyle = MUTED;
    ctx.textAlign = "right";
    ctx.font = "400 24px 'Helvetica Neue', Helvetica, Arial, sans-serif";
    ctx.fillText(String(val), W - PAD, y + 22);

    y += 48;
  }

  y += 14;

  // HR + URL
  hr(ctx, PAD, W - PAD, y);
  const url = (window.location.hostname || "culturalextremityindex.com").replace(/^www\./, "");
  const urlY = y + (H - y) / 2 + 8;
  ctx.fillStyle = MUTED;
  ctx.textAlign = "center";
  ctx.font = "400 22px 'Helvetica Neue', Helvetica, Arial, sans-serif";
  setSpacing(ctx, 2.5);
  ctx.fillText(url.toUpperCase(), W / 2, urlY);
  setSpacing(ctx, 0);
}

// ── Card generator ────────────────────────────────────────────────────────────

export async function generateProfileCard(p) {
  await loadHeavyFont();

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
  ctx.font = "400 24px 'Helvetica Neue', Helvetica, Arial, sans-serif";
  setSpacing(ctx, 2.5);
  ctx.fillText("CULTURAL EXTREMITY INDEX", W / 2, 6 + 36);
  setSpacing(ctx, 0);

  const hasPortrait = !!p.portraitPath;

  if (hasPortrait) {
    // ── Profile card: portrait left, radar right ───────────────────────────

    const COL_Y    = 6 + 60;
    const COL_H    = 480;
    const PHOTO_W  = 320;
    const GAP      = 32;
    const RADAR_W  = W - PAD * 2 - PHOTO_W - GAP;
    const PHOTO_X  = PAD;
    const RADAR_X  = PHOTO_X + PHOTO_W + GAP;
    const RADAR_CX = RADAR_X + RADAR_W / 2;
    const RADAR_CY = COL_Y + COL_H / 2;
    const RADAR_R  = Math.min(RADAR_W, COL_H) / 2 - 30;

    // Portrait
    try {
      const img = await loadImage(p.portraitPath);
      const dstAspect = PHOTO_W / COL_H;
      const srcAspect = img.naturalWidth / img.naturalHeight;
      let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;
      if (srcAspect > dstAspect) {
        sw = img.naturalHeight * dstAspect;
        sx = (img.naturalWidth - sw) / 2;
      } else {
        sh = img.naturalWidth / dstAspect;
        sy = (img.naturalHeight - sh) / 2;
      }
      ctx.drawImage(img, sx, sy, sw, sh, PHOTO_X, COL_Y, PHOTO_W, COL_H);
    } catch(e) {
      ctx.fillStyle = "#f4f4f4";
      ctx.fillRect(PHOTO_X, COL_Y, PHOTO_W, COL_H);
    }

    // Radar
    drawRadar(ctx, p.scores || {}, RADAR_CX, RADAR_CY, RADAR_R);

    let y = COL_Y + COL_H + 36;

    // Name
    const name = p.name || "";
    ctx.fillStyle = INK;
    ctx.textAlign = "center";
    ctx.font = "bold 100px 'Helvetica Neue', Helvetica, Arial, sans-serif";
    if (ctx.measureText(name).width > W - PAD * 2) {
      ctx.font = "bold 70px 'Helvetica Neue', Helvetica, Arial, sans-serif";
    }
    ctx.fillText(name, W / 2, y + 78);
    y += 106;

    // Occupations
    const occs = Array.isArray(p.occupations) ? p.occupations : [];
    if (occs.length) {
      y += 24;
      const occLine = occs.slice(0, 4).join("  ·  ");
      ctx.fillStyle = MUTED;
      ctx.textAlign = "center";
      ctx.font = "300 30px 'Helvetica Neue', Helvetica, Arial, sans-serif";
      const lines = wrapText(ctx, occLine, W - PAD * 2, 2);
      for (const line of lines) { ctx.fillText(line, W / 2, y); y += 40; }
      y += 14;
    } else {
      y += 24;
    }

    drawBottom(ctx, p, y, W, H, PAD, INK, MUTED, RULE);

  } else {
    // ── Self-assessment card: name hero, radar below ───────────────────────

    let y = 6 + 60;

    // Name
    const name = p.name || "Self-Assessment";
    ctx.fillStyle = INK;
    ctx.textAlign = "center";
    ctx.font = "bold 100px 'Helvetica Neue', Helvetica, Arial, sans-serif";
    if (ctx.measureText(name).width > W - PAD * 2) {
      ctx.font = "bold 70px 'Helvetica Neue', Helvetica, Arial, sans-serif";
    }
    ctx.fillText(name, W / 2, y + 78);
    y += 130;

    // Radar wheel centered
    const RADAR_SIZE = 560;
    const RADAR_R    = RADAR_SIZE / 2 - 36;
    drawRadar(ctx, p.scores || {}, W / 2, y + RADAR_SIZE / 2, RADAR_R);
    y += RADAR_SIZE + 28;

    drawBottom(ctx, p, y, W, H, PAD, INK, MUTED, RULE);
  }

  return canvas;
}

export function downloadProfileCard(p) {
  return generateProfileCard(p).then(canvas => {
    const a = document.createElement("a");
    a.href     = canvas.toDataURL("image/png");
    a.download = (p.slug || "cei-profile") + "-card.png";
    a.click();
  });
}
