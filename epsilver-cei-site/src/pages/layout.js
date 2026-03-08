export function mountLayout(root, active) {
  const wrap = document.createElement("div");
  wrap.className = "wrap";

  wrap.innerHTML = `
    <div class="topbar">
      <div class="stripe"></div>
      <div class="topbar-inner">
        <div class="brand">
          <div class="kicker">Epsilver</div>
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
  `;

  root.appendChild(wrap);
}