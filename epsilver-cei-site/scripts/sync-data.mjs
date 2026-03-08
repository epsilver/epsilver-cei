import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const src = path.join(root, "data", "profiles.json");
const dstDir = path.join(root, "public", "data");
const dst = path.join(dstDir, "profiles.json");

if (!fs.existsSync(src)) {
  console.error("Missing:", src);
  process.exit(1);
}

fs.mkdirSync(dstDir, { recursive: true });

let raw = fs.readFileSync(src, "utf8");
if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1);

JSON.parse(raw);
fs.writeFileSync(dst, raw, "utf8");

console.log("Synced:", src, "->", dst);