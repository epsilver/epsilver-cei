import { loadProfiles, getPortraitSrc } from "../components/data.js";
import { radarSVG } from "../components/radar.js";
import { showTip } from "../components/tooltip.js";
import { generateCompareCard } from "../components/compareCard.js";
import { showCardInline } from "../components/cardDisplay.js";

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
  return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

function cleanAscii(s){
  return String(s ?? "").replace(/[^\x09\x0A\x0D\x20-\x7E]/g, "");
}

function renderEvidenceSummary(p){
  const ev = p.modelReadout?.evidence;
  const axes = ["establishment","justice","tradition","conflict","rigidity"];
  const any = ev && axes.some(k => Array.isArray(ev[k]) && ev[k].length);
  if (!any) return `<div class="small"><i>No scored triggers on record.</i></div>`;

  return axes.map(k => {
    const items = Array.isArray(ev?.[k]) ? ev[k] : [];
    if (!items.length) return "";
    return `<div style="margin-top:6px"><div class="small"><b>${k.charAt(0).toUpperCase()+k.slice(1)}:</b></div>` +
      items.slice(0, 3).map(x => {
        const dir = Number(x.weight) < 0 ? "reduced" : "added";
        return `<div class="small" style="margin-left:8px;margin-top:3px">&bull; <b>${escapeHtml(x.term)}</b> (${dir}): ${escapeHtml(cleanAscii(x.sentence || ""))}</div>`;
      }).join("") + `</div>`;
  }).join("");
}

function axisRows(a, b){
  const axes = [
    ["Establishment", "establishment"],
    ["Justice", "justice"],
    ["Tradition", "tradition"],
    ["Conflict", "conflict"],
    ["Rigidity", "rigidity"]
  ];
  return axes.map(([label,key]) => {
    const av = a?.scores?.[key] ?? 50;
    const bv = b?.scores?.[key] ?? 50;
    const d = av - bv;
    const sign = d === 0 ? "" : (d > 0 ? "+" : "");
    return `<div class="item">
      <div class="left">
        <div><b>${label}</b></div>
        <div class="meta">${a.name}: ${av} | ${b.name}: ${bv}</div>
      </div>
      <div class="pill">${sign}${d}</div>
    </div>`;
  }).join("");
}

export async function ComparePage(root, { a="", b="" }) {
  let profiles = [];
  try {
    profiles = await loadProfiles();
  } catch (e) {
    root.innerHTML = `<div class="card"><div class="h1">Data error</div><div class="small">${e?.message || e}</div></div>`;
    return;
  }

  const _qr = localStorage.getItem("ceiQuizResult");
  if (_qr) {
    try { profiles = [JSON.parse(_qr), ...profiles]; } catch(e) {}
  }

  const opts = `<option value="" disabled selected>Select a profile…</option>` + profiles
    .slice()
    .sort((x,y)=>String(x.name).localeCompare(String(y.name)))
    .map(p => `<option value="${p.slug}">${p.name}</option>`)
    .join("");

  const card = document.createElement("div");
  card.className = "card";
  card.innerHTML = `
    <div class="h1">Compare Profiles</div>
    <div class="small">Pick two profiles. Wheels and deltas update instantly.</div>
    <div class="hr"></div>
    <div class="search" style="flex-wrap:wrap;justify-content:center">
      <select id="a" class="btn" style="flex:1;min-width:140px;max-width:45%">${opts}</select>
      <select id="b" class="btn" style="flex:1;min-width:140px;max-width:45%">${opts}</select>
      <button id="go" class="btn">Go</button>
    </div>
    <div class="hr"></div>
    <div id="content"></div>
  `;

  root.appendChild(card);

  const sa = card.querySelector("#a");
  const sb = card.querySelector("#b");
  const go = card.querySelector("#go");
  const content = card.querySelector("#content");

  if (a) sa.value = a;
  if (b) sb.value = b;

  function render() {
    const pa = profiles.find(p => p.slug === sa.value);
    const pb = profiles.find(p => p.slug === sb.value);
    if (!pa || !pb) {
      content.innerHTML = `<div class="small">Select two profiles.</div>`;
      return;
    }

    const ceiA = pa.cei || computeCEIFromScores(pa.scores);
    const ceiB = pb.cei || computeCEIFromScores(pb.scores);

    const winner =
      ceiA.value === ceiB.value ? "Tie"
      : (ceiA.value > ceiB.value ? pa.name : pb.name);

    const leftPortrait = getPortraitSrc(pa);
    const rightPortrait = getPortraitSrc(pb);

    content.innerHTML = `
      <div class="small" style="text-align:center"><b>${pa.name}</b> vs <b>${pb.name}</b></div>
      <div class="hr"></div>

      <div class="grid" style="grid-template-columns:1fr 1fr; margin-top:0; gap:10px">
        <div class="card" style="padding:12px;display:flex;flex-direction:column;align-items:center">
          ${leftPortrait
            ? `<div class="portrait" style="width:clamp(60px,6vw,100px);height:clamp(90px,9vw,150px);margin-bottom:8px"><img src="${leftPortrait}" alt="${pa.name}"></div>`
            : `<div style="display:flex;align-items:center;justify-content:center;width:clamp(60px,6vw,100px);height:clamp(90px,9vw,150px);margin-bottom:8px;font-family:'HelveticaNeueHeavy','Helvetica Neue',Helvetica,Arial,sans-serif;font-weight:900;font-size:clamp(20px,3vw,40px);text-align:center;line-height:1.1">${pa.name}</div>`
          }
          <div class="name" style="font-size:clamp(16px,1.8vw,36px);line-height:1.2;text-align:center;margin-bottom:10px;min-height:1.2em">${leftPortrait ? pa.name : ""}</div>
          <div class="cei" style="padding:8px 10px;width:100%;box-sizing:border-box">
            <div class="cei-score" style="font-size:clamp(14px, 2vw, 32px)">CEI ${ceiA.value}</div>
            <div class="cei-right">
              <div class="cei-tier" style="font-size:clamp(7px, 0.9vw, 11px)">${ceiA.tier}</div>
              <div class="cei-lean" style="font-size:clamp(6px, 0.8vw, 10px)">${pa.primaryLean || ""}</div>
            </div>
          </div>
        </div>

        <div class="card" style="padding:12px;display:flex;flex-direction:column;align-items:center">
          ${rightPortrait
            ? `<div class="portrait" style="width:clamp(60px,6vw,100px);height:clamp(90px,9vw,150px);margin-bottom:8px"><img src="${rightPortrait}" alt="${pb.name}"></div>`
            : `<div style="display:flex;align-items:center;justify-content:center;width:clamp(60px,6vw,100px);height:clamp(90px,9vw,150px);margin-bottom:8px;font-family:'HelveticaNeueHeavy','Helvetica Neue',Helvetica,Arial,sans-serif;font-weight:900;font-size:clamp(20px,3vw,40px);text-align:center;line-height:1.1">${pb.name}</div>`
          }
          <div class="name" style="font-size:clamp(16px,1.8vw,36px);line-height:1.2;text-align:center;margin-bottom:10px;min-height:1.2em">${rightPortrait ? pb.name : ""}</div>
          <div class="cei" style="padding:8px 10px;width:100%;box-sizing:border-box">
            <div class="cei-score" style="font-size:clamp(14px, 2vw, 32px)">CEI ${ceiB.value}</div>
            <div class="cei-right">
              <div class="cei-tier" style="font-size:clamp(7px, 0.9vw, 11px)">${ceiB.tier}</div>
              <div class="cei-lean" style="font-size:clamp(6px, 0.8vw, 10px)">${pb.primaryLean || ""}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="hr"></div>
      <div id="combinedWheel" style="max-width:380px;margin:0 auto"></div>

      <div class="hr"></div>
      <div class="cei">
        <div class="cei-score" style="font-size:28px">${escapeHtml(winner)}</div>
        <div class="cei-right">
          <div class="cei-tier">Result</div>
          <div class="cei-lean">Higher CEI wins</div>
        </div>
      </div>

      <div class="hr"></div>
      <div class="h1">Axis Deltas (A - B)</div>
      <div class="list">
        ${axisRows(pa, pb)}
      </div>

      <div class="hr"></div>
      <div id="compareCardDisplay"></div>

      <div class="hr"></div>
      <div class="h1">Signal Triggers</div>
      <div id="triggerSection"></div>
    `;

    const combinedWheel = content.querySelector("#combinedWheel");
    const svgCombined = radarSVG({
      scores: pa.scores || {},
      scores2: pb.scores || {},
      nameA: pa.name,
      nameB: pb.name,
      size: 320,
      onHover: showTip
    });
    combinedWheel.appendChild(svgCombined);

    showCardInline(generateCompareCard(pa, pb), content.querySelector("#compareCardDisplay"));

    const triggerSection = content.querySelector("#triggerSection");
    for (const [profile, evidence] of [[pa, renderEvidenceSummary(pa)], [pb, renderEvidenceSummary(pb)]]) {
      const block = document.createElement("div");
      block.style.marginBottom = "12px";
      const btn = document.createElement("button");
      btn.className = "btn";
      btn.style.cssText = "width:100%;font-size:clamp(14px, 2vw, 22px);margin-bottom:8px;text-align:left";
      btn.textContent = profile.name + " — show triggers ▾";
      const body = document.createElement("div");
      body.style.display = "none";
      body.innerHTML = evidence;
      btn.addEventListener("click", () => {
        const open = body.style.display !== "none";
        body.style.display = open ? "none" : "block";
        btn.textContent = profile.name + (open ? " — show triggers ▾" : " — hide triggers ▴");
      });
      block.appendChild(btn);
      block.appendChild(body);
      triggerSection.appendChild(block);
    }
  }

  sa.addEventListener("change", render);
  sb.addEventListener("change", render);

  go.addEventListener("click", () => {
    location.hash = `#/compare?a=${encodeURIComponent(sa.value)}&b=${encodeURIComponent(sb.value)}`;
  });

  render();
}
