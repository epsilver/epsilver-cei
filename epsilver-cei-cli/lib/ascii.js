export function asciiSafe(s) {
  if (s == null) return s;
  let x = String(s);

  x = x
    .replace(/[\u2014\u2013]/g, "-")   // em dash, en dash
    .replace(/\u2022/g, "|")          // bullet
    .replace(/\u2026/g, "...")        // ellipsis
    .replace(/[\u201C\u201D]/g, '"')  // curly double quotes
    .replace(/[\u2018\u2019]/g, "'")  // curly single quotes
    .replace(/\u00A0/g, " ");         // nbsp

  return x;
}

export function asciiSafeDeep(obj) {
  if (obj == null) return obj;
  if (typeof obj === "string") return asciiSafe(obj);
  if (Array.isArray(obj)) return obj.map(asciiSafeDeep);
  if (typeof obj === "object") {
    const out = {};
    for (const [k, v] of Object.entries(obj)) out[k] = asciiSafeDeep(v);
    return out;
  }
  return obj;
}
