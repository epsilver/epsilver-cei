import { radarSVG } from "../components/radar.js";
import { showTip } from "../components/tooltip.js";
import { ICONS } from "../components/icons.js";
import { generateProfileCard, downloadProfileCard } from "../components/profileCard.js";

const LS_KEY = "ceiQuizResult";

// ── Questions ─────────────────────────────────────────────────────────────────

const QUESTIONS = [
  {
    text: "When a government institution makes an official statement, you typically...",
    answers: [
      { label: "Treat it as authoritative",                         deltas: { establishment:  12 } },
      { label: "Generally trust it but stay critical",              deltas: { establishment:   5 } },
      { label: "Assess it case by case",                            deltas: {} },
      { label: "Often question it",                                 deltas: { establishment:  -5 } },
      { label: "Distrust it by default",                            deltas: { establishment: -12 } },
    ]
  },
  {
    text: "Immigration and border policy should prioritize...",
    answers: [
      { label: "Open and welcoming pathways",                       deltas: { tradition: -12 } },
      { label: "Humane management with clear rules",                deltas: { tradition:  -5 } },
      { label: "A balance of security and compassion",              deltas: {} },
      { label: "National security and controlled entry",            deltas: { tradition:   8 } },
      { label: "Strict limits to protect national identity",        deltas: { tradition:  14 } },
    ]
  },
  {
    text: "Systemic inequality in society...",
    answers: [
      { label: "Is the defining crisis of our era",                 deltas: { justice:  14 } },
      { label: "Exists and demands active policy",                  deltas: { justice:   7 } },
      { label: "Is real but often misdiagnosed",                    deltas: {} },
      { label: "Is frequently overstated for political purposes",   deltas: { justice:  -7 } },
      { label: "Is largely a myth",                                 deltas: { justice: -14 } },
    ]
  },
  {
    text: "Public protest and demonstrations...",
    answers: [
      { label: "Are essential tools of democratic expression",      deltas: { conflict:  -8 } },
      { label: "Are valid when peaceful and focused",               deltas: { conflict:  -3 } },
      { label: "Are a mixed bag depending on context",              deltas: {} },
      { label: "Often go too far and create division",              deltas: { conflict:   8 } },
      { label: "Should face tighter legal restrictions",            deltas: { conflict:  14 } },
    ]
  },
  {
    text: "On your core political beliefs, you are willing to...",
    answers: [
      { label: "Always seek common ground first",                   deltas: { rigidity: -12 } },
      { label: "Compromise when genuinely necessary",               deltas: { rigidity:  -6 } },
      { label: "Hold firm on principles, flex on tactics",          deltas: {} },
      { label: "Rarely compromise — some lines don't move",         deltas: { rigidity:   8 } },
      { label: "Never compromise — principle is non-negotiable",    deltas: { rigidity:  14 } },
    ]
  },
  {
    text: "Large media organizations and corporations are...",
    answers: [
      { label: "Generally serving the public interest",             deltas: { establishment:  10 } },
      { label: "Imperfect but essential to society",                deltas: { establishment:   4 } },
      { label: "A mix of beneficial and self-interested",           deltas: {} },
      { label: "Too powerful and self-serving",                     deltas: { establishment:  -6 } },
      { label: "Actively working against ordinary people",          deltas: { establishment: -12 } },
    ]
  },
  {
    text: "Diversity, equity, and inclusion initiatives...",
    answers: [
      { label: "Are vital and should be significantly expanded",    deltas: { justice:  14 } },
      { label: "Are broadly positive with room to improve",         deltas: { justice:   6 } },
      { label: "Depend entirely on implementation",                 deltas: {} },
      { label: "Are often counterproductive and divisive",          deltas: { justice:  -7 } },
      { label: "Are discriminatory by design and should end",       deltas: { justice: -14 } },
    ]
  },
  {
    text: "National culture and identity...",
    answers: [
      { label: "Are precious and must be actively preserved",       deltas: { tradition:  12 } },
      { label: "Matter and deserve genuine respect",                deltas: { tradition:   5 } },
      { label: "Are worth acknowledging without mythologizing",     deltas: {} },
      { label: "Are often weaponized to exclude people",            deltas: { tradition:  -6 } },
      { label: "Are constructs used primarily to divide",           deltas: { tradition: -12 } },
    ]
  },
  {
    text: "When confronted with a viewpoint you strongly oppose...",
    answers: [
      { label: "I disengage — the conflict isn't worth it",         deltas: { conflict:  -8 } },
      { label: "I try to understand it before responding",          deltas: { conflict:  -3 } },
      { label: "I engage respectfully but make my view clear",      deltas: {} },
      { label: "I challenge it directly and publicly",              deltas: { conflict:   8 } },
      { label: "I call it out loudly — silence is complicity",      deltas: { conflict:  14 } },
    ]
  },
  {
    text: "In matters of politics and morality, truth is...",
    answers: [
      { label: "Absolute — some things are simply right or wrong",  deltas: { rigidity:  12 } },
      { label: "Usually clear, though context matters",             deltas: { rigidity:   5 } },
      { label: "Complicated and rarely fully black or white",       deltas: {} },
      { label: "More nuanced than most people acknowledge",         deltas: { rigidity:  -5 } },
      { label: "Largely a matter of power and perspective",         deltas: { rigidity: -12 } },
    ]
  },
  {
    text: "Electoral institutions and democratic processes...",
    answers: [
      { label: "Are fundamentally sound and trustworthy",           deltas: { establishment:  12 } },
      { label: "Work, but require meaningful reform",               deltas: { establishment:   5 } },
      { label: "Are flawed but still the best available system",    deltas: {} },
      { label: "Are deeply compromised by money and power",         deltas: { establishment:  -6 } },
      { label: "Are rigged to serve entrenched interests",          deltas: { establishment: -12 } },
    ]
  },
  {
    text: "Religion and faith in public life...",
    answers: [
      { label: "Should actively guide policy and public morality",  deltas: { tradition:  12, rigidity:  6 } },
      { label: "Have an important role in civic discourse",         deltas: { tradition:   5 } },
      { label: "Should remain largely a personal matter",           deltas: {} },
      { label: "Should be strictly separated from governance",      deltas: { tradition:  -5 } },
      { label: "Are primarily sources of division and harm",        deltas: { tradition: -10, conflict:  4 } },
    ]
  },
  {
    text: "On policing and public safety...",
    answers: [
      { label: "Police are essential and deserve full support",     deltas: { justice: -12 } },
      { label: "Reform is needed but the institution is sound",     deltas: { justice:  -5 } },
      { label: "Significant structural reform is urgent",           deltas: { justice:   7 } },
      { label: "The system requires fundamental reimagining",       deltas: { justice:  12 } },
      { label: "Abolition and alternative models are necessary",    deltas: { justice:  14 } },
    ]
  },
  {
    text: "In political debate, what matters most is...",
    answers: [
      { label: "Reaching consensus across differences",             deltas: { conflict: -10, rigidity:  -6 } },
      { label: "Listening and changing minds through persuasion",   deltas: { conflict:  -5 } },
      { label: "Making your position clear and defending it",       deltas: {} },
      { label: "Winning the argument decisively",                   deltas: { conflict:   8 } },
      { label: "Exposing opponents for what they really are",       deltas: { conflict:  12, rigidity:   8 } },
    ]
  },
  {
    text: "People who hold the opposite political views from you are...",
    answers: [
      { label: "People with different but sincerely held views",    deltas: { rigidity: -12 } },
      { label: "Often wrong but genuinely worth engaging",          deltas: { rigidity:  -5 } },
      { label: "Sometimes right, sometimes misguided",              deltas: {} },
      { label: "Usually misguided and hard to reason with",         deltas: { rigidity:   7 } },
      { label: "A genuine threat to everything that matters",       deltas: { rigidity:  12, conflict:   8 } },
    ]
  },
];

// ── Scoring ───────────────────────────────────────────────────────────────────

function accumulateScores(selections) {
  const totals = { establishment: 0, justice: 0, tradition: 0, conflict: 0, rigidity: 0 };
  for (const deltas of selections) {
    for (const [axis, val] of Object.entries(deltas)) totals[axis] += val;
  }
  const scores = {};
  for (const [axis, total] of Object.entries(totals)) {
    scores[axis] = Math.max(0, Math.min(100, 50 + total));
  }
  return scores;
}

function tierFromCEI(v) {
  if (v <= 20) return "Minimal";
  if (v <= 40) return "Moderate";
  if (v <= 60) return "Elevated";
  if (v <= 80) return "High";
  return "Extreme";
}

function computeCEI(scores) {
  const b = 50;
  const wt = { establishment: 1.0, justice: 0.6, tradition: 0.6, conflict: 1.4, rigidity: 1.3 };
  const axes = ["establishment","justice","tradition","conflict","rigidity"];
  const weighted = axes.map(a => Math.abs((scores[a] ?? b) - b) * wt[a]);
  const meanSq = weighted.reduce((a, d) => a + d * d, 0) / weighted.length;
  const rawDist = Math.sqrt(meanSq);
  const confOver = Math.max(0, (scores.conflict - b) / 50);
  const rigOver  = Math.max(0, (scores.rigidity - b) / 50);
  let raw = rawDist * (1 + 0.10 * confOver + 0.30 * rigOver);
  const est = scores.establishment ?? b;
  if (est >= 80) raw *= (1 - 0.20 * Math.max(0, Math.min(1, (est - 80) / 20)));
  const sqrtRaw = Math.sqrt(raw);
  const k = 1.2, m = 3.0;
  const logistic = x => 1 / (1 + Math.exp(-k * (x - m)));
  const s0 = logistic(0);
  const value = Math.max(0, Math.min(100, Math.round((logistic(sqrtRaw) - s0) / (1 - s0) * 100)));
  return { value, tier: tierFromCEI(value) };
}

function computeLean(scores) {
  const b = 50, ew = 0.25, cw = 0.15;
  const progressive = (scores.justice - scores.tradition) + ew * (b - scores.establishment) + cw * (scores.conflict - b);
  const reactionary = (scores.tradition - scores.justice) + ew * (scores.establishment - b) + cw * (scores.conflict - b);
  return progressive >= reactionary ? "Woke" : "Chud";
}

// ── Card helper ───────────────────────────────────────────────────────────────

function makeProfile(name, scores, cei, lean) {
  return {
    name: name || "Anonymous",
    slug: "you",
    portraitPath: "",
    cei,
    primaryLean: lean,
    scores,
    occupations: []
  };
}

// ── Quiz ──────────────────────────────────────────────────────────────────────

function renderQuiz(root, onComplete) {
  let current = 0;
  let playerName = "Anonymous";
  const selections = new Array(QUESTIONS.length).fill(null);

  function showQuestion() {
    const q      = QUESTIONS[current];
    const pct    = (current / QUESTIONS.length) * 100;
    const isLast = current === QUESTIONS.length - 1;

    root.innerHTML = `
      <div style="max-width:680px;margin:24px auto">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
          <div class="small" style="text-transform:uppercase;letter-spacing:1.2px">${current + 1} / ${QUESTIONS.length}</div>
          <div class="small" style="text-transform:uppercase;letter-spacing:1.2px">Self-Assessment</div>
        </div>
        <div style="height:1px;background:var(--rule);margin-bottom:2px">
          <div style="height:1px;background:var(--ink);width:${pct}%;transition:width .25s"></div>
        </div>
        <div style="height:1px;background:var(--rule);margin-bottom:28px"></div>
        <div class="h1" style="font-size:17px;line-height:1.45;margin-bottom:24px">${q.text}</div>
        <div class="list" id="options" style="margin-top:0;gap:0">
          ${q.answers.map((a, i) => `
            <div class="item quiz-option" data-idx="${i}">
              <div class="quiz-radio"></div>
              <span>${a.label}</span>
            </div>
          `).join("")}
        </div>
        <div class="hr"></div>
        <div style="display:flex;justify-content:space-between;gap:12px">
          <button class="btn" id="back" ${current === 0 ? "disabled style='opacity:.3'" : ""}">Back</button>
          <button class="btn" id="next" disabled style="opacity:.3">${isLast ? "See Results" : "Next"}</button>
        </div>
      </div>
    `;

    const opts    = root.querySelectorAll(".quiz-option");
    const nextBtn = root.querySelector("#next");

    if (selections[current] !== null) {
      opts[selections[current]].classList.add("quiz-selected");
      nextBtn.disabled = false;
      nextBtn.style.opacity = "1";
    }

    opts.forEach((opt, i) => {
      opt.addEventListener("click", () => {
        opts.forEach(o => o.classList.remove("quiz-selected"));
        opt.classList.add("quiz-selected");
        selections[current] = i;
        nextBtn.disabled = false;
        nextBtn.style.opacity = "1";
      });
    });

    nextBtn.addEventListener("click", () => {
      if (selections[current] === null) return;
      if (isLast) {
        const allDeltas = selections.map((sel, qi) => QUESTIONS[qi].answers[sel].deltas);
        onComplete(accumulateScores(allDeltas), playerName);
      } else {
        current++;
        showQuestion();
      }
    });

    root.querySelector("#back").addEventListener("click", () => {
      if (current > 0) { current--; showQuestion(); }
    });
  }

  root.innerHTML = `
    <div style="max-width:680px;margin:40px auto;text-align:center">
      <div class="small" style="text-transform:uppercase;letter-spacing:1.8px;margin-bottom:14px">Cultural Extremity Index</div>
      <div class="h1" style="font-size:32px;margin-bottom:6px">Self-Assessment</div>
      <div class="hr" style="margin:20px 0"></div>
      <div class="small" style="max-width:420px;margin:0 auto 28px;line-height:1.7">
        15 questions. Your answers are scored across five behavioral and ideological axes to compute your personal CEI score.
      </div>
      <input id="nameInput" placeholder="Your name (for the card)" style="display:block;width:100%;max-width:320px;margin:0 auto 18px;padding:12px 14px;border:1px solid var(--rule);border-radius:14px;font-size:16px;text-align:center;box-sizing:border-box" />
      <button class="btn" id="start" style="padding:14px 32px">Begin Assessment</button>
    </div>
  `;

  root.querySelector("#start").addEventListener("click", () => {
    playerName = root.querySelector("#nameInput").value.trim() || "Anonymous";
    showQuestion();
  });
}

// ── Result ────────────────────────────────────────────────────────────────────

function renderResult(root, scores, cei, lean, name) {
  const axisKeys   = ["establishment","justice","tradition","conflict","rigidity"];
  const axisLabels = ["Establishment","Justice","Tradition","Conflict","Rigidity"];

  const profile = makeProfile(name, scores, cei, lean);
  const shareText = `I scored ${cei.value} (${cei.tier}) on the Cultural Extremity Index. Primary Lean: ${lean}. culturalextremityindex.com`;
  const hasNativeShare = !!navigator.share;

  const grid = document.createElement("div");
  grid.className = "grid";

  const left = document.createElement("div");
  left.className = "card";
  left.innerHTML = `
    <div class="small" style="text-transform:uppercase;letter-spacing:1.4px;margin-bottom:8px">Cultural Extremity Index</div>
    <div class="h1" style="font-size:26px;margin-bottom:0">${name || "Your Self-Assessment"}</div>
    <div class="hr"></div>
    <div class="cei">
      <div class="cei-score">CEI ${cei.value}</div>
      <div class="cei-right">
        <div class="cei-tier">${cei.tier}</div>
        <div class="cei-lean">${lean}</div>
      </div>
    </div>
    <div class="hr"></div>
    <div class="h1" style="font-size:13px;margin-bottom:8px">Axis Scores</div>
    <div class="list" style="margin-top:0;gap:0">
      ${axisKeys.map((k, i) => `
        <div class="item">
          <div class="left"><b>${axisLabels[i]}</b></div>
          <div class="pill">${scores[k]}</div>
        </div>
      `).join("")}
    </div>
    <div class="hr"></div>
    <div style="display:flex;gap:10px;margin-bottom:14px">
      <button class="btn" id="saveImg" style="flex:1">Save Image</button>
      <button class="btn" id="compare" style="flex:1">Compare with Profile</button>
    </div>
    <div class="share-row">
      ${hasNativeShare ? `<button class="share-icon" id="shr-native" title="Share">${ICONS.share}</button>` : ""}
      <button class="share-icon" id="shr-x"         title="Share on X">${ICONS.x}</button>
      <button class="share-icon" id="shr-bluesky"   title="Share on Bluesky">${ICONS.bluesky}</button>
      <button class="share-icon" id="shr-facebook"  title="Share on Facebook">${ICONS.facebook}</button>
      <button class="share-icon" id="shr-mastodon"  title="Share on Mastodon">${ICONS.mastodon}</button>
      <button class="share-icon" id="shr-instagram" title="Instagram">${ICONS.instagram}</button>
      <button class="share-icon" id="shr-tiktok"    title="TikTok">${ICONS.tiktok}</button>
    </div>
    <div id="mastodon-input" class="mastodon-input" style="display:none">
      <input id="mastodon-instance" class="search input" placeholder="e.g. mastodon.social" style="flex:1;font-size:13px" />
      <button class="btn" id="mastodon-go">Share</button>
    </div>
    <div id="share-tip" class="share-tip"></div>
    <div class="hr"></div>
    <button class="btn" id="retake" style="width:100%;opacity:.6">Retake Assessment</button>
  `;

  const right = document.createElement("div");
  right.className = "card";
  right.innerHTML = `
    <div class="h1">Signal Wheel</div>
    <div class="small">Your five-axis profile.</div>
    <div class="hr"></div>
  `;
  const wheelWrap = document.createElement("div");
  wheelWrap.style.maxWidth = "360px";
  wheelWrap.style.margin = "0 auto";
  wheelWrap.appendChild(radarSVG({ scores, size: 320, onHover: showTip }));
  right.appendChild(wheelWrap);

  grid.appendChild(left);
  grid.appendChild(right);
  root.innerHTML = "";
  root.appendChild(grid);

  function showShareTip(msg) {
    const tip = left.querySelector("#share-tip");
    tip.textContent = msg;
    tip.style.opacity = "1";
    clearTimeout(tip._t);
    tip._t = setTimeout(() => { tip.style.opacity = "0"; }, 3000);
  }

  left.querySelector("#saveImg").addEventListener("click", () => {
    const btn = left.querySelector("#saveImg");
    btn.textContent = "Generating…";
    btn.disabled = true;
    downloadProfileCard(profile).finally(() => {
      btn.textContent = "Save Image";
      btn.disabled = false;
    });
  });

  left.querySelector("#compare").addEventListener("click", () => {
    location.hash = "#/compare?a=you";
  });

  left.querySelector("#retake").addEventListener("click", () => {
    localStorage.removeItem(LS_KEY);
    root.innerHTML = "";
    SelfAssessmentPage(root);
  });

  if (hasNativeShare) {
    left.querySelector("#shr-native").addEventListener("click", async () => {
      try {
        const canvas = await generateProfileCard(profile);
        canvas.toBlob(async (blob) => {
          try {
            const file = new File([blob], "cei-self-assessment.png", { type: "image/png" });
            await navigator.share({ files: [file], text: shareText });
          } catch(e) {
            if (e.name !== "AbortError") showShareTip("Share cancelled.");
          }
        }, "image/png");
      } catch(e) {
        showShareTip("Could not generate card.");
      }
    });
  }

  async function downloadThenOpen(url) {
    await downloadProfileCard(profile);
    showShareTip("Image saved \u2014 attach it to your post.");
    setTimeout(() => window.open(url, "_blank"), 200);
  }

  left.querySelector("#shr-x").addEventListener("click", () => {
    downloadThenOpen("https://twitter.com/intent/tweet?text=" + encodeURIComponent(shareText));
  });

  left.querySelector("#shr-bluesky").addEventListener("click", () => {
    downloadThenOpen("https://bsky.app/intent/compose?text=" + encodeURIComponent(shareText));
  });

  left.querySelector("#shr-facebook").addEventListener("click", () => {
    downloadThenOpen("https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent("https://culturalextremityindex.com"));
  });

  const mastodonSection = left.querySelector("#mastodon-input");
  left.querySelector("#shr-mastodon").addEventListener("click", () => {
    const open = mastodonSection.style.display !== "none";
    mastodonSection.style.display = open ? "none" : "flex";
    if (!open) left.querySelector("#mastodon-instance").focus();
  });

  left.querySelector("#mastodon-go").addEventListener("click", () => {
    const instance = left.querySelector("#mastodon-instance").value.trim().replace(/^https?:\/\//, "");
    if (!instance) return;
    downloadThenOpen("https://" + instance + "/share?text=" + encodeURIComponent(shareText));
  });

  left.querySelector("#shr-instagram").addEventListener("click", () => {
    downloadImage(scores, cei, lean);
    showShareTip("Image saved — upload to Instagram.");
  });

  left.querySelector("#shr-tiktok").addEventListener("click", () => {
    downloadImage(scores, cei, lean);
    showShareTip("Image saved — upload to TikTok.");
  });
}

// ── Page export ───────────────────────────────────────────────────────────────

export function SelfAssessmentPage(root) {
  const saved = localStorage.getItem(LS_KEY);
  if (saved) {
    try {
      const p = JSON.parse(saved);
      renderResult(root, p.scores, p.cei, p.primaryLean, p.name);
      return;
    } catch(e) {
      localStorage.removeItem(LS_KEY);
    }
  }

  renderQuiz(root, (scores, name) => {
    const cei     = computeCEI(scores);
    const lean    = computeLean(scores);
    const profile = makeProfile(name, scores, cei, lean);
    localStorage.setItem(LS_KEY, JSON.stringify(profile));
    renderResult(root, scores, cei, lean, name);
  });
}
