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

function cleanSubtitle(p) {
  const s = String(p.researchSummary || "").trim();
  if (!s) return "";
  // Take first sentence
  const first = s.split(/(?<=[.!?])\s+/)[0] || s;
  // Remove parenthetical birth/death dates: (born ...) or (XX Month YYYY – ...)
  return first
    .replace(/\s*\([^)]*(?:born|died|\d{4})[^)]*\)/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
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

// ── Card generator ────────────────────────────────────────────────────────────

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

export async function generateProfileCard(p) {
  await loadHeavyFont();
  const W = 1080;
  const H = (p.portraitPath) ? 1350 : 800;
  const canvas = document.createElement("canvas");
  canvas.width  = W * 2;
  canvas.height = H * 2;
  const ctx = canvas.getContext("2d");
  ctx.scale(2, 2);

  const PAD   = 64;
  const INK   = "#0a0a0a";
  const MUTED = "#444";
  const RULE  = "#d9d9d9";

  // ── Background ──────────────────────────────────────────────────────────────
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);

  // ── Rainbow stripe ──────────────────────────────────────────────────────────
  const grad = ctx.createLinearGradient(0, 0, W, 0);
  grad.addColorStop(0,   "#ff2a2a");
  grad.addColorStop(0.2, "#ff7a00");
  grad.addColorStop(0.4, "#ffd400");
  grad.addColorStop(0.6, "#10c070");
  grad.addColorStop(0.8, "#2c6bff");
  grad.addColorStop(1.0, "#8a2be2");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, 6);

  // ── Kicker (above photo) ────────────────────────────────────────────────────
  ctx.fillStyle = MUTED;
  ctx.textAlign = "center";
  ctx.font = "400 24px 'Helvetica Neue', Helvetica, Arial, sans-serif";
  setSpacing(ctx, 2.5);
  ctx.fillText("CULTURAL EXTREMITY INDEX", W / 2, 6 + 36);
  setSpacing(ctx, 0);

  // ── Photo (vertical portrait rectangle, centered) ───────────────────────────
  const PHOTO_W = 320;
  const PHOTO_H = 480;
  const PHOTO_X = (W - PHOTO_W) / 2;
  const PHOTO_Y = 6 + 60;
  const photoSrc = p.portraitPath || "";
  let photoLoaded = false;

  if (photoSrc) {
    try {
      const img = await loadImage(photoSrc);
      // Center-crop source to PHOTO_W × PHOTO_H
      const srcAspect = img.naturalWidth / img.naturalHeight;
      const dstAspect = PHOTO_W / PHOTO_H;
      let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;
      if (srcAspect > dstAspect) {
        sw = img.naturalHeight * dstAspect;
        sx = (img.naturalWidth - sw) / 2;
      } else {
        sh = img.naturalWidth / dstAspect;
        sy = (img.naturalHeight - sh) / 2;
      }
      ctx.drawImage(img, sx, sy, sw, sh, PHOTO_X, PHOTO_Y, PHOTO_W, PHOTO_H);
      photoLoaded = true;
    } catch(e) {
      // fall through to placeholder
    }
  }

  if (!photoLoaded) {
    if (photoSrc) {
      // Provided but failed to load — show placeholder
      ctx.fillStyle = "#f4f4f4";
      ctx.fillRect(PHOTO_X, PHOTO_Y, PHOTO_W, PHOTO_H);
      ctx.fillStyle = RULE;
      ctx.font = "bold 18px 'Helvetica Neue', Helvetica, Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("NO IMAGE", W / 2, PHOTO_Y + PHOTO_H / 2);
    }
  }

  // No portrait: name is the hero — skip photo space entirely
  let y = photoLoaded || photoSrc ? PHOTO_Y + PHOTO_H + 36 : PHOTO_Y + 20;

  // ── Name (centered) ─────────────────────────────────────────────────────────
  ctx.fillStyle = INK;
  ctx.textAlign = "center";
  const name = p.name || "";
  ctx.font = "bold 100px 'Helvetica Neue', Helvetica, Arial, sans-serif";
  if (ctx.measureText(name).width > W - PAD * 2) {
    ctx.font = "bold 70px 'Helvetica Neue', Helvetica, Arial, sans-serif";
  }
  ctx.fillText(name, W / 2, y + 78);
  y += 106;

  // ── Gap between name and occupations ────────────────────────────────────────
  y += 24;

  // ── Occupations (centered) ──────────────────────────────────────────────────
  const occs = Array.isArray(p.occupations) ? p.occupations : [];
  if (occs.length) {
    const occLine = occs.slice(0, 4).join("  ·  ");
    ctx.fillStyle = MUTED;
    ctx.textAlign = "center";
    ctx.font = "300 30px 'Helvetica Neue', Helvetica, Arial, sans-serif";
    const lines = wrapText(ctx, occLine, W - PAD * 2, 2);
    for (const line of lines) {
      ctx.fillText(line, W / 2, y);
      y += 40;
    }
    y += 14;
  }

  // ── HR ──────────────────────────────────────────────────────────────────────
  hr(ctx, PAD, W - PAD, y);
  y += 32;

  // ── CEI box (mirrors site .cei component) ───────────────────────────────────
  // Layout: "CEI" small label top-left · big number bottom-left · tier+lean stacked right-center
  const cei = p.cei || { value: 0, tier: "Minimal" };
  const lean = p.primaryLean || "";
  const BOX_PAD = 28;
  const BOX_H   = 135;
  const BOX_X   = PAD;
  const BOX_W2  = W - PAD * 2;

  // Border
  ctx.save();
  ctx.strokeStyle = RULE;
  ctx.lineWidth = 1;
  ctx.strokeRect(BOX_X, y, BOX_W2, BOX_H);
  ctx.restore();

  // "CEI 94" — single unified line, vertically centered left inside box
  ctx.fillStyle = INK;
  ctx.textAlign = "left";
  ctx.font = "900 100px 'HelveticaNeueHeavy', 'Helvetica Neue', Helvetica, Arial, sans-serif";
  ctx.fillText("CEI " + String(cei.value ?? ""), BOX_X + BOX_PAD, y + BOX_H / 2 + 30);

  // Tier — right side, upper half of box
  ctx.fillStyle = MUTED;
  ctx.textAlign = "right";
  ctx.font = "bold 34px 'Helvetica Neue', Helvetica, Arial, sans-serif";
  setSpacing(ctx, 1.5);
  ctx.fillText((cei.tier || "").toUpperCase(), BOX_X + BOX_W2 - BOX_PAD, y + BOX_H / 2 - 8);

  // Lean — right side, below tier
  ctx.font = "bold 26px 'Helvetica Neue', Helvetica, Arial, sans-serif";
  setSpacing(ctx, 1.8);
  ctx.fillText(lean.toUpperCase(), BOX_X + BOX_W2 - BOX_PAD, y + BOX_H / 2 + 30);
  setSpacing(ctx, 0);

  y += BOX_H + 28;

  // ── HR ──────────────────────────────────────────────────────────────────────
  hr(ctx, PAD, W - PAD, y);
  y += 28;

  // ── Axis bars ───────────────────────────────────────────────────────────────
  const axisKeys   = ["establishment", "justice", "tradition", "conflict", "rigidity"];
  const axisLabels = ["Establishment", "Justice", "Tradition", "Conflict", "Rigidity"];
  const scores = p.scores || {};
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

    // Track
    ctx.fillStyle = RULE;
    ctx.fillRect(barX, y + 16, barW, 3);
    // Fill
    ctx.fillStyle = INK;
    ctx.fillRect(barX, y + 16, (val / 100) * barW, 3);

    ctx.fillStyle = MUTED;
    ctx.textAlign = "right";
    ctx.font = "400 24px 'Helvetica Neue', Helvetica, Arial, sans-serif";
    ctx.fillText(String(val), W - PAD, y + 22);

    y += 48;
  }

  y += 14;

  // ── HR ──────────────────────────────────────────────────────────────────────
  const hrY = y;
  hr(ctx, PAD, W - PAD, hrY);

  // ── URL (pinned to bottom, centered in remaining space) ──────────────────────
  const url = (window.location.hostname || "culturalextremityindex.com").replace(/^www\./, "");
  const urlY = hrY + (H - hrY) / 2 + 8;
  ctx.fillStyle = MUTED;
  ctx.textAlign = "center";
  ctx.font = "400 22px 'Helvetica Neue', Helvetica, Arial, sans-serif";
  setSpacing(ctx, 2.5);
  ctx.fillText(url.toUpperCase(), W / 2, urlY);
  setSpacing(ctx, 0);

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
