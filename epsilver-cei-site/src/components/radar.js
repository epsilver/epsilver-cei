const AXES = [
  { key: "establishment", label: "Estab." },
  { key: "justice",       label: "Justice" },
  { key: "tradition",     label: "Trad." },
  { key: "conflict",      label: "Conflict" },
  { key: "rigidity",      label: "Rigid" }
];

function polar(cx, cy, r, ang) {
  return { x: cx + r * Math.cos(ang), y: cy + r * Math.sin(ang) };
}
function clamp01(x){ return Math.max(0, Math.min(1, x)); }

function pointsFor(scores, t, cx, cy, r) {
  const n = AXES.length;
  const pts = [];
  for (let i = 0; i < n; i++) {
    const ang = (Math.PI * 2 * i) / n - Math.PI / 2;
    const v = clamp01(((scores?.[AXES[i].key] ?? 50) / 100)) * t;
    const p = polar(cx, cy, r * v, ang);
    pts.push(`${p.x.toFixed(2)},${p.y.toFixed(2)}`);
  }
  return pts.join(" ");
}

export function radarSVG({ scores, scores2 = null, nameA = "", nameB = "", size = 260, onHover }) {
  const pad = 34;
  const legendH = scores2 ? 28 : 0;
  const w = size, h = size;
  const cx = w / 2, cy = h / 2;
  const r = (size / 2) - pad;
  const n = AXES.length;
  const rings = [0.2, 0.4, 0.6, 0.8, 1.0];

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", `0 0 ${w} ${h + legendH}`);
  svg.style.width = "100%";
  svg.style.height = "auto";
  svg.style.display = "block";

  for (const rr of rings) {
    const poly = document.createElementNS(svg.namespaceURI, "polygon");
    poly.setAttribute("points", pointsFor(Object.fromEntries(AXES.map(a => [a.key, rr*100])), 1, cx, cy, r));
    poly.setAttribute("fill", "none");
    poly.setAttribute("stroke", "#d9d9d0");
    poly.setAttribute("stroke-width", "1");
    svg.appendChild(poly);
  }

  for (let i = 0; i < n; i++) {
    const ang = (Math.PI * 2 * i) / n - Math.PI / 2;
    const p2 = polar(cx, cy, r, ang);

    const line = document.createElementNS(svg.namespaceURI, "line");
    line.setAttribute("x1", cx); line.setAttribute("y1", cy);
    line.setAttribute("x2", p2.x); line.setAttribute("y2", p2.y);
    line.setAttribute("stroke", "#d9d9d0");
    line.setAttribute("stroke-width", "1");
    svg.appendChild(line);

    const lab = document.createElementNS(svg.namespaceURI, "text");
    const out = polar(cx, cy, r + 18, ang);
    lab.setAttribute("x", out.x);
    lab.setAttribute("y", out.y);
    lab.setAttribute("text-anchor", "middle");
    lab.setAttribute("dominant-baseline", "central");
    lab.setAttribute("font-size", "11");
    lab.setAttribute("font-weight", "800");
    lab.setAttribute("fill", "#666");
    lab.textContent = AXES[i].label;
    svg.appendChild(lab);
  }

  const polyA = document.createElementNS(svg.namespaceURI, "polygon");
  polyA.setAttribute("fill", "rgba(0,0,0,0.06)");
  polyA.setAttribute("stroke", "#111");
  polyA.setAttribute("stroke-width", "1.4");
  polyA.setAttribute("points", pointsFor(scores, 0.01, cx, cy, r));
  svg.appendChild(polyA);

  let polyB = null;
  if (scores2) {
    polyB = document.createElementNS(svg.namespaceURI, "polygon");
    polyB.setAttribute("fill", "rgba(44,107,255,0.10)");
    polyB.setAttribute("stroke", "#2c6bff");
    polyB.setAttribute("stroke-width", "1.4");
    polyB.setAttribute("points", pointsFor(scores2, 0.01, cx, cy, r));
    svg.appendChild(polyB);
  }

  for (let i = 0; i < n; i++) {
    const ang = (Math.PI * 2 * i) / n - Math.PI / 2;
    const ang2 = (Math.PI * 2 * (i+1)) / n - Math.PI / 2;
    const a = polar(cx, cy, r, ang);
    const b = polar(cx, cy, r, ang2);

    const path = document.createElementNS(svg.namespaceURI, "path");
    path.setAttribute("d", `M ${cx} ${cy} L ${a.x} ${a.y} L ${b.x} ${b.y} Z`);
    path.setAttribute("fill", "transparent");

    const key = AXES[i].key;
    const label = AXES[i].label;
    path.addEventListener("mousemove", (e) => {
      if (!onHover) return;
      const val = scores?.[key] ?? 50;
      const tip = scores2
        ? `${label}: ${val} / ${scores2?.[key] ?? 50}`
        : `${label}: ${val}`;
      onHover({ x: e.clientX, y: e.clientY, title: tip });
    });
    path.addEventListener("mouseleave", () => onHover && onHover(null));
    svg.appendChild(path);
  }

  if (scores2 && (nameA || nameB)) {
    const ly = h + 9;
    const sw = 10;
    const mkRect = (x, color) => {
      const el = document.createElementNS(svg.namespaceURI, "rect");
      el.setAttribute("x", x); el.setAttribute("y", ly);
      el.setAttribute("width", sw); el.setAttribute("height", sw);
      el.setAttribute("fill", color);
      return el;
    };
    const mkText = (x, label) => {
      const el = document.createElementNS(svg.namespaceURI, "text");
      el.setAttribute("x", x); el.setAttribute("y", ly + sw / 2);
      el.setAttribute("dominant-baseline", "central");
      el.setAttribute("font-size", "10"); el.setAttribute("fill", "#444");
      el.textContent = label;
      return el;
    };
    svg.appendChild(mkRect(w / 2 - 90, "#111"));
    svg.appendChild(mkText(w / 2 - 90 + sw + 4, nameA));
    svg.appendChild(mkRect(w / 2 + 10, "#2c6bff"));
    svg.appendChild(mkText(w / 2 + 10 + sw + 4, nameB));
  }

  const dur = 520;
  const start = performance.now();
  function tick(now) {
    const t = Math.min(1, (now - start) / dur);
    const e = 1 - Math.pow(1 - t, 3);
    polyA.setAttribute("points", pointsFor(scores, e, cx, cy, r));
    if (polyB) polyB.setAttribute("points", pointsFor(scores2, e, cx, cy, r));
    if (t < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  return svg;
}