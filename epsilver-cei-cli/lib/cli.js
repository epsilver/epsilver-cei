import { stdout } from "node:process";
import { leanLabel } from "./scoring.js";
import { slugify } from "./profile.js";

// -- ANSI --
const R    = "\x1b[0m";
const BOLD = "\x1b[1m";
const DIM  = "\x1b[2m";
const ITAL = "\x1b[3m";
const BLNK = "\x1b[5m";

const PINK = "\x1b[95m";
const CYAN = "\x1b[96m";
const YEL  = "\x1b[93m";
const RED  = "\x1b[91m";
const WHT  = "\x1b[97m";
const MAG  = "\x1b[35m";
const BLU  = "\x1b[94m";
const GRN  = "\x1b[92m";

// -- Box --
const BOX_W = 58;

function p(s) { stdout.write(s + "\n"); }

function visLen(s) {
  return s.replace(/\x1b\[[0-9;]*m/g, "").length;
}

function padEnd(s, n) {
  return s + " ".repeat(Math.max(0, n - visLen(s)));
}

function center(s, n) {
  const total = Math.max(0, n - visLen(s));
  const l = Math.floor(total / 2);
  return " ".repeat(l) + s + " ".repeat(total - l);
}

function row(content) {
  return "║ " + padEnd(content, BOX_W - 2) + " ║";
}

function rowC(content) {
  return "║" + center(content, BOX_W) + "║";
}

function rowSplit(left, right) {
  const gap = Math.max(1, BOX_W - 2 - visLen(left) - visLen(right));
  return "║ " + left + " ".repeat(gap) + right + " ║";
}

function top()    { return "╔" + "═".repeat(BOX_W) + "╗"; }
function bottom() { return "╚" + "═".repeat(BOX_W) + "╝"; }

function div(label = "") {
  if (!label) return "╠" + "═".repeat(BOX_W) + "╣";
  const tag = "══ " + label + " ";
  return "╠" + tag + "═".repeat(Math.max(0, BOX_W - tag.length)) + "╣";
}

// -- Wrapping --
// Returns an array of row()-formatted strings, wrapping plain `text` to fit
// inside the box. `firstPrefix` is prepended to line 0, `contPrefix` to
// subsequent lines (both plain text, no ANSI). `color` wraps each line.
function wrapRows(text, color = "", firstPrefix = "", contPrefix = "  ") {
  const innerW = BOX_W - 2;
  const lines  = [];
  let remaining = String(text);

  while (remaining.length > 0) {
    const pfx   = lines.length === 0 ? firstPrefix : contPrefix;
    const avail = innerW - pfx.length;
    if (remaining.length <= avail) {
      lines.push(pfx + remaining);
      break;
    }
    // Prefer breaking at a space; fall back to hard character break
    const chunk     = remaining.slice(0, avail);
    const lastSpace = chunk.lastIndexOf(" ");
    const breakAt   = lastSpace > 0 ? lastSpace : avail;
    lines.push(pfx + remaining.slice(0, breakAt));
    remaining = remaining.slice(breakAt === lastSpace ? breakAt + 1 : breakAt);
  }

  return lines.map(line => row(color + line + (color ? R : "")));
}

// -- Score helpers --
function tierColor(tier) {
  if (tier === "Minimal")  return DIM + WHT;
  if (tier === "Moderate") return CYAN;
  if (tier === "Elevated") return YEL;
  if (tier === "High")     return BOLD + PINK;
  if (tier === "Extreme")  return BOLD + RED;
  return WHT;
}

function axisColor(axis, score) {
  if (Math.abs(score - 50) < 8) return DIM;
  switch (axis) {
    case "ESTABLISHMENT": return BLU;
    case "JUSTICE":       return CYAN;
    case "TRADITION":     return MAG;
    case "CONFLICT":      return RED;
    case "RIGIDITY":      return YEL;
    default:              return WHT;
  }
}

function bar(score, color) {
  const filled = Math.round(score / 10);
  const empty  = 10 - filled;
  return color + "▓".repeat(filled) + R + DIM + "░".repeat(empty) + R;
}

// -- Exports --
export function printSearchResults(results) {
  p("");
  p(top());
  p(rowC(BOLD + PINK + "✦  S E A R C H  R E S U L T S  ✦" + R));
  p(div("RESULTS"));
  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    p(row("  " + DIM + (i + 1) + R + "  " + BOLD + WHT + r.title.toUpperCase() + R));
    if (r.snippet) {
      for (const line of wrapRows(r.snippet, DIM, "     ", "     ")) p(line);
    }
    if (i < results.length - 1) p(row(""));
  }
  p(bottom());
  p("");
}

export function printPreview({ bundle, occupations, scores, ceiOut, leanOut, confidence, signalCount, status, reviewFlags }) {
  const lean = leanLabel(leanOut.code);
  const tc   = tierColor(ceiOut.tier);
  const blnk = ceiOut.tier === "Extreme" ? BLNK : "";

  p("");
  p(top());
  p(rowC(BOLD + PINK + "✦  E P S I L V E R  C E I  ✦" + R));
  p(div());

  // Name + lean
  p(rowSplit(
    BOLD + WHT + bundle.title.toUpperCase() + R,
    ITAL + PINK + lean + "  ✦" + R
  ));
  p(row(DIM + "slug: " + slugify(bundle.title) + R));

  // CEI score
  p(div("CEI SCORE"));
  p(row(""));
  p(rowC(
    blnk + tc + BOLD + "◈  " + ceiOut.cei + "  ◈" + R
    + "   "
    + tc + BOLD + ceiOut.tier.toUpperCase().split("").join(" ") + R
  ));
  p(row(""));

  // Vectors
  p(div("VECTORS"));
  const axes = [
    ["ESTABLISHMENT", scores.establishment],
    ["JUSTICE",       scores.justice],
    ["TRADITION",     scores.tradition],
    ["CONFLICT",      scores.conflict],
    ["RIGIDITY",      scores.rigidity],
  ];
  for (const [axis, score] of axes) {
    const color = axisColor(axis, score);
    const label = color + axis + R + " ".repeat(15 - axis.length);
    const num   = WHT + String(score).padStart(3) + R;
    p(row(label + "  " + bar(score, color) + "  " + num));
  }

  // Info
  p(div("INFO"));
  const stColor = status === "active" ? GRN : YEL;
  p(row(
    DIM + "confidence: " + R + WHT + Math.round(confidence * 100) + "%" + R
    + DIM + "  ·  signals: " + R + WHT + signalCount + R
    + DIM + "  ·  status: "  + R + stColor + BOLD + status.toUpperCase() + R
  ));
  if (reviewFlags.length) {
    for (const line of wrapRows(reviewFlags.join("  ·  "), YEL, "⚠  ", "   ")) p(line);
  }

  // Occupations
  if (occupations?.length) {
    p(div("OCCUPATIONS"));
    for (const line of wrapRows(occupations.slice(0, 5).join("  ·  "), DIM)) p(line);
  }

  // Source
  if (bundle.fullurl) {
    p(div("SOURCE"));
    for (const line of wrapRows(bundle.fullurl, DIM)) p(line);
  }

  p(bottom());
  p("");
}

export function printImportComplete(profile) {
  const W2 = 48;
  const row2 = content => "║ " + padEnd(content, W2 - 2) + " ║";

  p("╔" + "═".repeat(W2) + "╗");
  p(row2(center(BOLD + GRN + "✦  imported successfully  ✦" + R, W2 - 2)));
  p("╠" + "═".repeat(W2) + "╣");
  p(row2(DIM + "slug:    " + R + WHT + profile.slug + R));
  if (profile.portraitPath) {
    const url = profile.portraitPath.length > 36
      ? profile.portraitPath.slice(0, 33) + "..."
      : profile.portraitPath;
    p(row2(DIM + "portrait:" + R + " " + DIM + url + R));
  }
  if (profile.imageCredit?.license) {
    p(row2(DIM + "license: " + R + DIM + profile.imageCredit.license + R));
  }
  p("╚" + "═".repeat(W2) + "╝");
  p("");
}
