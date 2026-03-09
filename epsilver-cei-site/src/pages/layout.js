export function mountLayout(root, active) {
  const wrap = document.createElement("div");
  wrap.className = "wrap";

  wrap.innerHTML = `
    <div class="topbar">
      <div class="stripe"></div>
      <div class="topbar-inner">
        <div class="brand">
          <a class="kicker" href="https://epsilver.xyz" target="_blank" rel="noopener">Epsilver</a>
          <a class="title" href="#/">Cultural Extremity Index</a>
        </div>
        <div class="nav">
          <a href="#/" class="${active==="home"?"active":""}">Profiles</a>
          <a href="#/compare" class="${active==="compare"?"active":""}">Compare</a>
          <a href="#/self-assessment" class="${active==="self-assessment"?"active":""}">Self-Assessment</a>
          <a href="#/methodology" class="${active==="methodology"?"active":""}">Methodology</a>
        </div>
      </div>
    </div>

    <div id="outlet"></div>

    <div style="text-align:center;padding:40px 0 60px;color:#444;font-size:16px;letter-spacing:.4px">
      Contact us: <a href="mailto:contact@culturalextremityindex.com">contact@culturalextremityindex.com</a>
    </div>
  `;

  root.appendChild(wrap);
}