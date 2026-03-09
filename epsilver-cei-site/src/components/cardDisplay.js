export function showCardInline(canvas, container) {
  const existing = container.querySelector(".card-display-wrap");
  if (existing) existing.remove();

  const wrap = document.createElement("div");
  wrap.className = "card-display-wrap";
  wrap.style.cssText = "margin-top:14px;text-align:center";

  const tip = document.createElement("div");
  tip.style.cssText = "font-size:14px;color:#444;opacity:.7;margin-bottom:8px";
  tip.textContent = "Hold to save on mobile · Right-click to save on desktop";

  const img = document.createElement("img");
  img.src = canvas.toDataURL("image/png");
  img.style.cssText = "max-width:100%;border:1px solid #d9d9d9;display:block;margin:0 auto";
  img.alt = "Generated card";

  wrap.appendChild(tip);
  wrap.appendChild(img);
  container.appendChild(wrap);
  wrap.scrollIntoView({ behavior: "smooth", block: "nearest" });
}
