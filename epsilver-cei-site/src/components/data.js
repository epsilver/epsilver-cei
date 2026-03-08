export async function loadProfiles() {
  const res = await fetch(import.meta.env.BASE_URL + "data/profiles.json", { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load profiles.json: ${res.status}`);
  const doc = await res.json();
  const profiles = Array.isArray(doc?.profiles) ? doc.profiles : [];
  return profiles;
}

export function getPortraitSrc(p) {
  const s = p?.portraitPath || "";
  if (!s) return "";
  if (p?.portraitIsRemote) return s;
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  return s;
}