import { loadProfiles, getPortraitSrc } from "../components/data.js";
import { radarSVG } from "../components/radar.js";
import { showTip } from "../components/tooltip.js";
import { downloadProfileCard } from "../components/profileCard.js";

function tierFromCEI(cei){
  if (cei <= 20) return "Minimal";
  if (cei <= 40) return "Moderate";
  if (cei <= 60) return "Elevated";
  if (cei <= 80) return "High";
  return "Extreme";
}

function computeCEIFromScores(scores){
  const b = 50;
  const wt = { establishment: 1.0, justice: 0.6, tradition: 0.6, conflict: 1.4, rigidity: 1.3 };
  const axes = ["establishment","justice","tradition","conflict","rigidity"];
  const weighted = axes.map(a => Math.abs((scores?.[a] ?? b) - b) * wt[a]);
  const meanSq = weighted.reduce((a,d) => a + d*d, 0) / weighted.length;
  const rawDist = Math.sqrt(meanSq);

  const confOver = Math.max(0, ((scores?.conflict ?? b) - b) / 50);
  const rigOver  = Math.max(0, ((scores?.rigidity ?? b) - b) / 50);
  let raw = rawDist * (1 + 0.10 * confOver + 0.30 * rigOver);

  const est = scores?.establishment ?? b;
  if (est >= 80) {
    const over = (est - 80) / 20;
    raw = raw * (1 - 0.20 * Math.max(0, Math.min(1, over)));
  }

  const sqrtRaw = Math.sqrt(raw);
  const k = 1.2, m = 3.0;
  const logistic01 = x => 1 / (1 + Math.exp(-k * (x - m)));
  const s0 = logistic01(0);
  const sr = logistic01(sqrtRaw);
  const x01 = (sr - s0) / (1 - s0);
  const cei = Math.max(0, Math.min(100, Math.round(x01 * 100)));
  return { value: cei, tier: tierFromCEI(cei) };
}

function escapeHtml(s){
  if (s == null) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Strip weird bytes (prevents mojibake blocks from nuking layout)
function cleanAscii(s){
  return String(s ?? "").replace(/[^\x09\x0A\x0D\x20-\x7E]/g, "");
}

function trimToSentence(s) {
  const text = String(s || "").trim();
  if (!text) return "";
  const m = text.match(/^([\s\S]*[.!?])/);
  return m ? m[1] : text;
}

function safeLean(s){
  const x = String(s ?? "").trim();
  if (!x) return "—";
  if (/[ÃÂâ€šÂ¬ï¸]/.test(x)) return "—";
  return x;
}

function renderAdjustments(p){
  const arr = Array.isArray(p.adjustments) ? p.adjustments : [];
  const notes = arr
    .map(a => {
      const note = cleanAscii(a?.note || "");
      return note.trim();
    })
    .filter(Boolean);

  if (!notes.length) return "No manual adjustments recorded.";
  return notes.map(n => `• ${escapeHtml(n)}`).join("<br>");
}

function axisLabel(k){
  switch (k) {
    case "establishment": return "Establishment";
    case "justice": return "Justice";
    case "tradition": return "Tradition";
    case "conflict": return "Conflict";
    case "rigidity": return "Rigidity";
    default: return k;
  }
}

function fmtWeight(w){
  const n = Number(w);
  if (!Number.isFinite(n)) return "0";
  // keep it readable
  const s = Math.abs(n) >= 10 ? n.toFixed(0) : n.toFixed(1);
  return s.replace(/\.0$/, "");
}

function renderModelEvidence(p){
  const mr = p.modelReadout || {};
  const ev = mr.evidence || null;

  const axes = ["establishment","justice","tradition","conflict","rigidity"];

  // If no evidence saved, keep it quiet (don’t show noisy empty block)
  const any = ev && axes.some(k => Array.isArray(ev[k]) && ev[k].length);
  if (!any && !(mr.pfFallbackApplied || mr.salienceApplied)) {
    return `<div class="small" style="margin-top:10px"><i>Scored trigger excerpts:</i> No scored triggers detected.</div>`;
  }

  const autoNotes = [];
  if (mr.pfFallbackApplied) autoNotes.push("public-figure fallback bump (low signal density)");
  if (mr.salienceApplied) autoNotes.push("salience-term bump");

  const autoLine = autoNotes.length
    ? `<div class="small" style="margin-top:10px"><b>Automatic normalization:</b> ${escapeHtml(autoNotes.join(" + "))}</div>`
    : "";

  const blocks = axes.map(k => {
    const items = Array.isArray(ev?.[k]) ? ev[k] : [];

    if (!items.length) {
      return `<div class="small"><b>${axisLabel(k)}:</b> <i>No scored triggers detected.</i></div>`;
    }

    const rows = items.slice(0, 8).map(x => {
      const term = escapeHtml(x?.term || "");
      const sentence = escapeHtml(cleanAscii(x?.sentence || ""));
      const w = Number(x?.weight);
      const dir = Number.isFinite(w) && w < 0 ? "reduced" : "added";
      const wTxt = fmtWeight(w);

      // “Complete sentences ripped from the article itself”:
      // We show the actual sentence + a small preface explaining the effect.
      return `<div class=”meta” style=”margin-left:10px;margin-top:6px”>
        • Matched “<b>${term}</b>” (${dir}, weight ${escapeHtml(wTxt)}): ${sentence}
      </div>`;
    }).join("");

    return `<div style="margin-top:8px">
      <div class="small"><b>${axisLabel(k)}:</b></div>
      ${rows}
    </div>`;
  }).join("");

  return `
    <div class="small" style="margin-top:12px">
      <b>Scored trigger excerpts (what the model actually used):</b>
    </div>
    ${blocks}
    ${autoLine}
  `;
}

export async function ProfilePage(root, { slug }) {
  let profiles = [];
  try {
    profiles = await loadProfiles();
  } catch (e) {
    root.innerHTML = `<div class="card"><div class="h1">Data error</div><div class="small">${escapeHtml(e?.message || e)}</div></div>`;
    return;
  }

  const p = profiles.find(x => x.slug === slug);
  if (!p) {
    root.innerHTML = `<div class="card"><div class="h1">Not found</div><div class="small">No profile for slug: ${escapeHtml(slug)}</div></div>`;
    return;
  }

  const cei = p.cei || computeCEIFromScores(p.scores);
  const primaryLean = safeLean(p.primaryLean);

  const grid = document.createElement("div");
  grid.className = "grid";

  const left = document.createElement("div");
  left.className = "card";

  const portrait = getPortraitSrc(p);

  const modelSummary = p.computedSummary
    ? escapeHtml(cleanAscii(p.computedSummary))
    : escapeHtml(
        "Epsilver CEI model ingest: public-source summary normalized into a five-axis signal wheel. " +
        "Inputs observed: Wikipedia lead + infobox fields. Confidence " +
        Math.round((p.confidence || 0) * 100) + "%."
      );

  left.innerHTML = `
    <div class="row">
      <div class="portrait">${portrait ? `<img src="${portrait}" alt="${escapeHtml(p.name)}">` : ""}</div>
      <div style="flex:1">
        <div class="name">${escapeHtml(p.name || "")}</div>
        <div class="small" style="margin-top:6px">${escapeHtml(cleanAscii(trimToSentence(p.researchSummary || "")))}</div>
      </div>
    </div>

    <div class="hr"></div>

    <div class="cei">
      <div class="cei-score">CEI ${cei.value}</div>
      <div class="cei-right">
        <div class="cei-tier">${escapeHtml(cei.tier)}</div>
        <div class="cei-lean">${escapeHtml(primaryLean)}</div>
      </div>
    </div>

    <div class="hr"></div>

    <div class="h1">Model Readout</div>
    <div class="small">${modelSummary}</div>

    ${renderModelEvidence(p)}

    <div class="hr"></div>
    
    <div class="h1">Adjustments</div>
    <div class="small">${renderAdjustments(p)}</div>

    <div class="hr"></div>

    <button class="btn" id="saveCard" style="width:100%;margin-bottom:14px">Save Profile Card</button>

    <div class="small">

      <b>Sources</b><br>
      ${(p.sources||[]).map(s => {
        const url = String(s || "");
        const safe = escapeHtml(url);
        return `<div><a href="${safe}" target="_blank" rel="noreferrer">${safe}</a></div>`;
      }).join("")}
    </div>
  `;

  const right = document.createElement("div");
  right.className = "card";
  right.innerHTML = `
    <div class="h1">Signal Wheel</div>
    <div class="small">Hover sectors for axis detail. Polygon stretches into place.</div>
    <div class="hr"></div>
  `;

  const wheelWrap = document.createElement("div");
  wheelWrap.style.maxWidth = "420px";
  wheelWrap.style.margin = "0 auto";

  const svg = radarSVG({
    scores: p.scores || {},
    size: 320,
    onHover: (tip) => showTip(tip)
  });

  wheelWrap.appendChild(svg);
  right.appendChild(wheelWrap);

  right.appendChild(Object.assign(document.createElement("div"), { className: "hr" }));

  // Axis Glossary
  const glossary = document.createElement("div");
  glossary.className = "list glossary";
  glossary.innerHTML = `
    <div class="h1">Axis Glossary</div>
    <div class="item"><div class="left"><b>Establishment</b><div class="meta">Alignment with institutional legitimacy and mainstream systems.</div></div></div>
    <div class="item"><div class="left"><b>Justice</b><div class="meta">Rights/inequality framing; emphasis on fairness enforcement.</div></div></div>
    <div class="item"><div class="left"><b>Tradition</b><div class="meta">Preference for continuity, norms, and heritage narratives.</div></div></div>
    <div class="item"><div class="left"><b>Conflict</b><div class="meta">Tolerance for confrontation and culture-war engagement.</div></div></div>
    <div class="item"><div class="left"><b>Rigidity</b><div class="meta">Tendency toward “us vs. them” framing, purity politics, and rejection of compromise.</div></div></div>
  `;
  right.appendChild(glossary);



  grid.appendChild(left);
  grid.appendChild(right);
  root.innerHTML = "";
  root.appendChild(grid);

  left.querySelector("#saveCard").addEventListener("click", () => {
    const btn = left.querySelector("#saveCard");
    btn.textContent = "Generating…";
    btn.disabled = true;
    downloadProfileCard(p).finally(() => {
      btn.textContent = "Save Profile Card";
      btn.disabled = false;
    });
  });
}