let el = null;

export function showTip(tip) {
  if (!tip) {
    if (el) { el.remove(); el = null; }
    return;
  }
  if (!el) {
    el = document.createElement("div");
    el.className = "tooltip";
    document.body.appendChild(el);
  }
  el.style.left = tip.x + "px";
  el.style.top = tip.y + "px";
  el.innerHTML = `<div class="t">${tip.title}</div><div class="s">${tip.sub || ""}</div>`;
}