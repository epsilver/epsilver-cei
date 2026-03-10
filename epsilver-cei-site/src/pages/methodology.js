import { generateExplainerCard } from "../components/explainerCard.js";
import { showCardInline } from "../components/cardDisplay.js";

export function MethodologyPage(root) {
  const wrap = document.createElement("div");
  wrap.style.cssText = "max-width:740px;margin:24px auto;";

  wrap.innerHTML = `
    <div class="card">

      <div class="h1">Methodology</div>
      <div class="small">
        The Cultural Extremity Index is a heuristic score derived from public encyclopedia text.
        It does not measure whether someone is right or wrong, good or bad — only how far their
        documented public profile deviates from the ideological and behavioral center across five axes.
      </div>

      <div class="hr"></div>

      <!-- AXES -->
      <div class="h1" style="font-size:26px;letter-spacing:.6px;text-transform:uppercase;margin-bottom:12px">The Five Axes</div>
      <div class="small" style="margin-bottom:12px">
        Every profile is scored on five independent dimensions. Two axes capture <b>behavior</b>
        (how someone acts in public life). Three capture <b>ideology</b> (what positions they hold).
        Each axis runs from 0 to 100, with 50 as the neutral baseline.
      </div>

      <div class="list" style="margin-top:0;gap:0">
        <div class="item" style="flex-direction:column;gap:4px">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <div class="section-title">Establishment</div>
            <span class="pill" style="font-size:20px">Behavioral</span>
          </div>
          <div class="meta">
            Measures alignment with institutional power — government, mainstream media, corporate systems.
            High scores reflect establishment credentials (elected office, major network coverage, bipartisan
            endorsements). Low scores reflect outsider or anti-establishment positioning.
            Scored from the Wikipedia introduction only, since articles routinely mention institutional context there.
          </div>
        </div>
        <div class="item" style="flex-direction:column;gap:4px">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <div class="section-title">Justice</div>
            <span class="pill" style="font-size:20px">Ideological</span>
          </div>
          <div class="meta">
            Tracks progressive and left-wing ideological signals: civil rights, anti-discrimination advocacy,
            anti-capitalism, anti-imperialism, labor rights, and explicit ideological self-identification
            (socialist, democratic socialist, progressive). High scores indicate strong and consistent
            left-leaning ideological vocabulary. Scored from the introduction and any dedicated
            views or ideology section.
          </div>
        </div>
        <div class="item" style="flex-direction:column;gap:4px">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <div class="section-title">Tradition</div>
            <span class="pill" style="font-size:20px">Ideological</span>
          </div>
          <div class="meta">
            Tracks right-wing and conservative ideological signals: nationalism, religious conservatism,
            traditional values, border enforcement, demographic identity politics, and Christian nationalist
            or integralist positions. High scores indicate strong conservative or reactionary ideological
            vocabulary. Scored from the introduction and any dedicated views or ideology section.
          </div>
        </div>
        <div class="item" style="flex-direction:column;gap:4px">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <div class="section-title">Conflict</div>
            <span class="pill" style="font-size:20px">Behavioral</span>
          </div>
          <div class="meta">
            Measures behavioral confrontation: controversy, bans and deplatforming, culture-war engagement,
            protest arrests, incendiary rhetoric, and documented extremist activity. This axis captures
            how disruptively someone operates in public discourse, regardless of their ideological direction.
            Scored from the Wikipedia introduction only.
          </div>
        </div>
        <div class="item" style="flex-direction:column;gap:4px">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <div class="section-title">Rigidity</div>
            <span class="pill" style="font-size:20px">Ideological</span>
          </div>
          <div class="meta">
            Captures absolutism, purity politics, and the rejection of compromise: dogmatism,
            authoritarianism, Holocaust denial, historical revisionism, conspiracy theories, and
            self-immolation or extreme self-sacrifice in the name of ideology. High Rigidity amplifies
            the overall CEI score more than any other single axis. Scored from the introduction and
            any dedicated views or ideology section.
          </div>
        </div>
      </div>

      <div class="hr"></div>

      <!-- SIGNAL DETECTION -->
      <div class="h1" style="font-size:26px;letter-spacing:.6px;text-transform:uppercase;margin-bottom:12px">Signal Detection</div>
      <div class="small" style="margin-bottom:10px">
        Signals are collected by matching keyword clusters against Wikipedia article text.
        Each cluster is a named group of related terms with a fixed weight (positive or negative).
        When a cluster fires, its weight is added to the relevant axis score.
      </div>

      <div class="list" style="margin-top:0;gap:0">
        <div class="item" style="flex-direction:column;gap:4px">
          <div class="section-subtitle">Text sources</div>
          <div class="meta">
            Behavioral axes (Establishment, Conflict) are scored only from the Wikipedia
            <b>introduction</b> — the paragraph summary that appears before the first section heading.
            Introductions are written about the subject, not by them, and reliably describe
            what they do. Ideological axes (Justice, Tradition, Rigidity) are also scored from
            any dedicated <b>Views, Positions, Ideology, or Political Philosophy</b> section when one exists,
            because those sections describe the subject's actual stated beliefs.
            A third pass queries the <b>GDELT Project</b> — a free, open index of global news coverage —
            for recent headlines and article descriptions mentioning the subject. GDELT results are
            cached for 24 hours and run through the same keyword pipeline as the other sources,
            subject to the same axis caps. GDELT covers mainstream journalism only; figures whose
            public profile lives in gaming media, streaming platforms, or niche online spaces may
            return no results, in which case scoring falls back to Wikipedia alone. The system
            scores what public data actually says.
          </div>
        </div>
        <div class="item" style="flex-direction:column;gap:4px">
          <div class="section-subtitle">Opposition detection</div>
          <div class="meta">
            Sentences are checked for opposition framing before any cluster match is counted.
            Patterns like "critics accused him of…", "opponents claim…", "he has been labeled…",
            or "according to detractors…" cause the sentence to be skipped. This prevents an article
            describing what someone's critics think from inflating that person's score.
          </div>
        </div>
        <div class="item" style="flex-direction:column;gap:4px">
          <div class="section-subtitle">Three-pass ideological scoring</div>
          <div class="meta">
            Ideological axes use a three-pass approach.
            Pass 1 scores the Wikipedia introduction with all clusters — including dampeners like
            "pragmatic", "centrist", "free speech", "heterodox", or "contrarian" that reduce the axis score.
            Pass 2 scores the views section with <b>positive clusters only</b>, skipping any cluster
            that already fired in pass 1. This prevents a views section from canceling signals
            already established in the introduction while still adding new ideological evidence.
            Pass 3 scores GDELT news text with positive clusters only, skipping all clusters
            already fired in passes 1 and 2.
          </div>
        </div>
        <div class="item" style="flex-direction:column;gap:4px">
          <div class="section-subtitle">Axis caps</div>
          <div class="meta">
            Each axis has a maximum raw weight cap to prevent a single heavily-documented person
            from maxing out every dimension. Establishment caps at 20 points, Justice at 25,
            Tradition at 30, Conflict at 35, Rigidity at 30.
          </div>
        </div>
      </div>

      <div class="hr"></div>

      <!-- FORMULA -->
      <div class="h1" style="font-size:26px;letter-spacing:.6px;text-transform:uppercase;margin-bottom:12px">The CEI Formula</div>
      <div class="small" style="margin-bottom:12px">
        Raw axis weights are converted to 0–100 axis scores, then combined into a single CEI
        using a four-step process designed to be sensitive at low scores and compressed at high ones.
      </div>

      <div class="list" style="margin-top:0;gap:0">
        <div class="item" style="flex-direction:column;gap:4px">
          <div class="section-subtitle">Step 1 — Weighted RMS deviation</div>
          <div class="meta">
            Each axis score is compared to the 50-point neutral baseline. The deviation on each axis
            is weighted (Conflict ×1.4, Rigidity ×1.3, Establishment ×1.0, Justice ×0.6,
            Tradition ×0.6) and combined as a root-mean-square. This produces a single raw distance
            that reflects how far the overall profile is from center, with behavioral axes weighted
            more heavily than ideological ones.
          </div>
        </div>
        <div class="item" style="flex-direction:column;gap:4px">
          <div class="section-subtitle">Step 2 — Conflict and Rigidity amplifiers</div>
          <div class="meta">
            If Conflict or Rigidity exceed the 50-point baseline, the raw distance is multiplied
            by an amplifier: +10% per unit of Conflict excess, +30% per unit of Rigidity excess
            (both scaled to the 0–1 range). High Rigidity has the largest amplifying effect
            in the entire formula, reflecting its role as a marker of true ideological extremism.
          </div>
        </div>
        <div class="item" style="flex-direction:column;gap:4px">
          <div class="section-subtitle">Step 3 — Square root compression</div>
          <div class="meta">
            The amplified raw distance is square-root compressed before entering the logistic curve.
            This flattens the top of the range, ensuring that accumulating more signals past a
            certain threshold yields diminishing returns on the final score rather than runaway inflation.
          </div>
        </div>
        <div class="item" style="flex-direction:column;gap:4px">
          <div class="section-subtitle">Step 4 — Rescaled logistic → 0–100</div>
          <div class="meta">
            The compressed value is passed through a logistic function anchored so that a raw score
            of zero always maps to CEI 0. The result is stretched to the 0–100 range and rounded
            to a whole number. The logistic curve ensures the score is sensitive to small deviations
            near the center and asymptotically approaches 100 at the extreme end.
          </div>
        </div>
      </div>

      <div class="hr"></div>

      <!-- LEAN -->
      <div class="h1" style="font-size:26px;letter-spacing:.6px;text-transform:uppercase;margin-bottom:12px">Lean Classifier</div>
      <div class="meta">
        After the CEI score is computed, a separate classifier determines whether the profile
        leans <b>Woke</b> (progressive-dominant), <b>Chud</b> (reactionary-dominant),
        or <b>Normie</b> (ideologically unclassifiable in the binary).
        This is calculated from axis deltas, not from the CEI score itself.
      </div>
      <div class="meta" style="margin-top:10px">
        A <b>progressive signal</b> is calculated as: Justice minus Tradition, minus half of
        Rigidity's deviation above 50, with small adjustments for Establishment and Conflict.
        A <b>reactionary signal</b> mirrors this: Tradition minus Justice, plus half of
        Rigidity's deviation above 50, with the same adjustments inverted.
        If the difference between the two signals is less than 20 points and at least one signal
        exceeds 7 in absolute value, the profile is classified as <b>Normie</b>.
        Otherwise, whichever signal is larger determines the lean.
      </div>
      <div class="meta" style="margin-top:10px">
        <b>Normie does not mean low extremity.</b> A profile can score High or Extreme on the CEI
        and still be Normie — for example, someone who is highly confrontational and rigid but whose
        Justice and Tradition signals cancel each other out. Normie means the ideological direction
        is genuinely ambiguous, not that the person is moderate. A Normie can be dangerous, loud,
        and highly scored. What they cannot be is legible — the system cannot determine which side
        of the ideological fault line they belong to, because the evidence points both ways or
        refuses to point at all.
      </div>
      <div class="meta" style="margin-top:10px">
        The archetypal Normie operates at the fault lines of ideological culture. They may criticize
        progressive excesses and reactionary capture in equal measure, draw audience from both left
        and right, and resist clean categorization precisely because they engage with ideas across
        the spectrum without committing to a side. This is not centrism in the political sense —
        it is ideological non-capture. The Normie is not someone who believes in nothing; they are
        someone whose documented public profile does not resolve into a dominant direction.
        Bill Maher is a textbook case: decades of liberal-coded commentary balanced by documented
        anti-woke positioning, heterodox provocation, and centrist dampeners that nearly cancel
        his progressive signal. The signals exist — they just refuse to settle.
      </div>
      <div class="meta" style="margin-top:10px">
        <b>Occupation-based classification.</b> Content creators — YouTubers, streamers, podcasters —
        with zero ideological signals are classified Normie rather than receiving a forced lean.
        Their Wikipedia coverage describes output and audience, not ideology. A zero signal for a
        streamer is a data gap, not a verdict. Political figures with zero signals do not receive
        this treatment: they made decisions, cast votes, and held positions — the system simply
        did not catch them. They receive a forced lean. Profiles with low confidence scores
        (insufficient Wikipedia coverage) and zero signals also default to Normie.
      </div>
      <div class="meta" style="margin-top:10px">
        Profiles with very low signal density — where both progressive and reactionary signals are
        near zero and the subject is not a content creator or low-confidence profile — do not qualify
        for Normie. They receive a forced lean based on whichever signal is fractionally larger.
        This reflects the principle that apathy and low engagement from a documented public figure
        are themselves a signal, not an absence of one. Taylor Swift scores Chud not because she
        is reactionary but because her near-zero signal density tilts fractionally in that direction
        under the formula — and she does not qualify for the creator exemption.
      </div>
      <div class="meta" style="margin-top:10px">
        Rigidity is included in the lean calculation because extreme Rigidity — Holocaust denial,
        absolutism, dogmatism — correlates more strongly with reactionary framing in practice
        than with progressive framing, even when Justice scores are elevated.
        This ensures that a subject like Alex Jones, who can attract both anti-establishment
        left-sounding rhetoric and far-right ideological markers, is correctly classified
        by the weight of his Tradition and Rigidity axes combined.
      </div>

      <div class="hr"></div>

      <!-- EXAMPLES -->
      <div class="h1" style="font-size:26px;letter-spacing:.6px;text-transform:uppercase;margin-bottom:12px">Worked Examples</div>
      <div class="small" style="margin-bottom:16px">
        Four profiles illustrating how the algorithm produces different outcomes from different signal patterns.
      </div>

      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px">

        <!-- Taylor Swift -->
        <div style="border-top:2px solid var(--ink);padding-top:12px">
          <div style="font-size:11px;text-transform:uppercase;letter-spacing:1.4px;color:var(--muted);margin-bottom:4px">Example A</div>
          <div style="font-size:16px;font-weight:700;margin-bottom:2px">Taylor Swift</div>
          <div style="display:flex;gap:8px;align-items:baseline;margin-bottom:10px">
            <span style="font-size:28px;font-weight:900">8</span>
            <span style="font-size:11px;text-transform:uppercase;letter-spacing:1.2px;color:var(--muted)">Minimal · Chud</span>
          </div>
          <div class="small">
            Zero keyword clusters fire. The Wikipedia introduction describes her career and cultural
            influence but contains no ideological, conflict, or rigidity signals.
            A small public figure bump (+2 Establishment, +1 Conflict) is applied because she is
            a documented cultural phenomenon with mainstream salience — but these bumps are minor
            and do not cross any meaningful threshold. All five axes sit within a few points of 50.
            The resulting CEI reflects the formula's correct behavior at its lower bound: a person
            with no documented extremity scores near zero.
            She is classified <b>Chud</b> rather than Normie because both her progressive and
            reactionary signals are near zero — the Normie classification requires at least one
            signal to be meaningfully present. Her low signal density is itself a signal: apathy
            and disengagement tilt fractionally reactionary under the formula.
          </div>
        </div>

        <!-- Bernie Sanders -->
        <div style="border-top:2px solid var(--ink);padding-top:12px">
          <div style="font-size:11px;text-transform:uppercase;letter-spacing:1.4px;color:var(--muted);margin-bottom:4px">Example B</div>
          <div style="font-size:16px;font-weight:700;margin-bottom:2px">Bernie Sanders</div>
          <div style="display:flex;gap:8px;align-items:baseline;margin-bottom:10px">
            <span style="font-size:28px;font-weight:900">37</span>
            <span style="font-size:11px;text-transform:uppercase;letter-spacing:1.2px;color:var(--muted)">Moderate · Woke</span>
          </div>
          <div class="small">
            Multiple Justice clusters fire: explicit self-identification as a democratic socialist,
            anti-capitalist and class-struggle vocabulary in his views section,
            and anti-imperialist framing. A Conflict cluster fires from his documented
            protest arrest record — civil disobedience during a 1963 sit-in and a 1991 Gulf War
            demonstration. Rigidity scores modestly above baseline from his consistent single-issue
            ideological focus over decades. Justice dominates over Tradition by a wide margin,
            and Rigidity's lean contribution is insufficient to flip the classification.
            The Woke lean is determined. The resulting score reflects a clear, consistent
            left-wing ideological profile with real-world conflict behavior.
          </div>
        </div>

        <!-- Alex Jones -->
        <div style="border-top:2px solid var(--ink);padding-top:12px">
          <div style="font-size:11px;text-transform:uppercase;letter-spacing:1.4px;color:var(--muted);margin-bottom:4px">Example C</div>
          <div style="font-size:16px;font-weight:700;margin-bottom:2px">Alex Jones</div>
          <div style="display:flex;gap:8px;align-items:baseline;margin-bottom:10px">
            <span style="font-size:28px;font-weight:900">72</span>
            <span style="font-size:11px;text-transform:uppercase;letter-spacing:1.2px;color:var(--muted)">High · Chud</span>
          </div>
          <div class="small">
            A dense cluster of Conflict signals fires: banned and deplatformed from major platforms,
            documented as a conspiracy theorist, described with inflammatory and incendiary rhetoric,
            and linked to extremist activity. Tradition fires from far-right and nationalist framing.
            Rigidity fires strongly from Holocaust denial and historical revisionism markers —
            and because Rigidity amplifies the overall CEI by up to 30%, this single cluster
            has an outsized effect on the final score. Despite Justice scoring above 50 from
            anti-establishment and anti-globalist populist vocabulary, Tradition and Rigidity
            combined outweigh Justice in the lean formula, correctly classifying him as Chud.
          </div>
        </div>

        <!-- Bill Maher -->
        <div style="border-top:2px solid var(--ink);padding-top:12px">
          <div style="font-size:11px;text-transform:uppercase;letter-spacing:1.4px;color:var(--muted);margin-bottom:4px">Example D</div>
          <div style="font-size:16px;font-weight:700;margin-bottom:2px">Bill Maher</div>
          <div style="display:flex;gap:8px;align-items:baseline;margin-bottom:10px">
            <span style="font-size:28px;font-weight:900">41</span>
            <span style="font-size:11px;text-transform:uppercase;letter-spacing:1.2px;color:var(--muted)">Elevated · Normie</span>
          </div>
          <div class="small">
            A moderate number of signals fire across both directions without either dominating.
            Tradition scores below baseline from T6 dampeners — progressive and left-wing vocabulary
            in his older Wikipedia text pulls the axis down. Conflict scores below baseline from
            CD1 centrist dampeners firing. Justice sits at exactly 50 — no rights or equity clusters
            fire, but none pull it below baseline either. The progressive and reactionary signals
            compute to approximately +4.5 and −7.5 respectively — a difference of 12 points, below
            the 20-point Normie threshold, with a maximum signal of 7.5, just above the 7-point
            minimum. The classifier cannot determine a dominant direction. Maher is Normie —
            not because he has no opinions, but because his documented profile refuses to resolve.
            His CEI of 41 reflects real ideological deviation, just without a discernible lean.
          </div>
        </div>

      </div>

      <div class="hr"></div>

      <div class="small">
        Scores are generated by the <a href="https://github.com/epsilver/cei-cli" target="_blank" rel="noopener">cei-cli utility</a> from English Wikipedia data and are
        not manually assigned. All profiles are static snapshots and reflect the state of
        Wikipedia at the time of import. The algorithm is heuristic — it is designed to be
        consistent and transparent, not authoritative.
      </div>

      <div class="hr"></div>
      <div id="explainerDisplay"></div>

    </div>
  `;

  showCardInline(generateExplainerCard(), wrap.querySelector("#explainerDisplay"));
  root.appendChild(wrap);
}
