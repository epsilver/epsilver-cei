import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

export function ensureDir(p) { if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true }); }

export function cachePath(cacheDir, key) {
  ensureDir(cacheDir);
  const h = crypto.createHash("sha1").update(key).digest("hex");
  return path.join(cacheDir, `${h}.json`);
}

export function readCache(filePath) {
  if (!fs.existsSync(filePath)) return null;
  try { return JSON.parse(fs.readFileSync(filePath, "utf8")); } catch { return null; }
}

export function writeCache(filePath, obj) {
  fs.writeFileSync(filePath, JSON.stringify(obj, null, 2), "utf8");
}
