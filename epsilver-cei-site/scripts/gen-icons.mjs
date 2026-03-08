import sharp from "sharp";
import { readFileSync } from "node:fs";

const favicon     = readFileSync("public/favicon.svg");
const ogSvg       = readFileSync("public/og-image.svg");
const twitterSvg  = readFileSync("public/twitter-avatar.svg");
const bannerSvg   = readFileSync("public/twitter-banner.svg");

await sharp(favicon).resize(16,  16).toFile("public/favicon-16x16.png");
await sharp(favicon).resize(32,  32).toFile("public/favicon-32x32.png");
await sharp(favicon).resize(180,180).png().toFile("public/apple-touch-icon.png");
await sharp(ogSvg).resize(1200, 630).png().toFile("public/og-image.png");
await sharp(twitterSvg).resize(400, 400).png().toFile("public/twitter-avatar.png");
await sharp(bannerSvg).resize(1500, 500).png().toFile("public/twitter-banner.png");

console.log("Icons generated.");
