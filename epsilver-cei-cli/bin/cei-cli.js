#!/usr/bin/env node
import readline from "node:readline/promises";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { stdin as input, stdout as output } from "node:process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

import { DEFAULTS } from "../lib/config.js";
import { wikiSearch } from "../lib/wiki.js";
import { runPipeline, makeAutoAdjustments } from "../lib/pipeline.js";
import { buildProfile, mergeIntoProfilesJson } from "../lib/profile.js";
import { leanLabel } from "../lib/scoring.js";
import { printPreview, printImportComplete, printSearchResults } from "../lib/cli.js";

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--help"    || a === "-h") { args.help    = true; continue; }
    if (a === "--first"  || a === "-f") { args.first   = true; continue; }
    if (a === "--import" || a === "-i") { args.import  = true; continue; }
    if (a === "--refresh"|| a === "-r") { args.refresh = true; continue; }
    if (a.startsWith("--")) {
      const k = a.slice(2);
      const v = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : true;
      args[k] = v;
    } else {
      args._.push(a);
    }
  }
  return args;
}

function cfgFromArgs(args) {
  return {
    ...DEFAULTS,
    cacheDir:  args["cache-dir"]  ? String(args["cache-dir"])  : DEFAULTS.cacheDir,
    sleepMs:   args["sleep-ms"]   ? Number(args["sleep-ms"])   : DEFAULTS.sleepMs,
    userAgent: args["user-agent"] ? String(args["user-agent"]) : DEFAULTS.userAgent
  };
}

function print(s = "") { output.write(String(s) + "\n"); }

function help() {
  print("cei-cli - Epsilver Cultural Extremity Index");
  print("");
  print("Usage:");
  print("  cei-cli \"Name\" [--first] [--import]");
  print("");
  print("  --first, -f     Auto-select the first search result");
  print("  --import, -i    Write profile into the site after previewing");
  print("  --refresh, -r   Re-import all profiles from profiles.json");
  print("  --help, -h      Show this help");
  print("");
  print("Examples:");
  print("  cei-cli \"Taylor Swift\"");
  print("  cei-cli \"John Smith\" --first");
  print("  cei-cli \"John Smith\" --first --import");
}

async function chooseResult(results, autoFirst) {
  if (!results.length) throw new Error("No results.");
  printSearchResults(results);

  if (autoFirst) return results[0].title;

  const rl = readline.createInterface({ input, output });
  const ans = await rl.question("Select [1-3] (default 1): ");
  rl.close();

  const k = ans.trim() === "" ? 1 : Number(ans.trim());
  if (![1, 2, 3].includes(k)) return results[0].title;
  return results[k - 1].title;
}

async function refresh(cfg) {
  const dataPath = path.resolve(__dirname, "../../epsilver-cei-site/public/data/profiles.json");
  if (!fs.existsSync(dataPath)) {
    print("error: profiles.json not found at " + dataPath);
    process.exit(1);
  }

  const doc = JSON.parse(fs.readFileSync(dataPath, "utf8"));
  const profiles = Array.isArray(doc?.profiles) ? doc.profiles : [];
  const names = profiles.map(p => p.name).filter(Boolean);
  const total = names.length;
  const failed = [];

  print("");
  print("╔" + "═".repeat(50) + "╗");
  print("║              REFRESH ALL PROFILES               ║");
  print("║  " + total + " profiles found" + " ".repeat(50 - 4 - String(total).length - 15) + "║");
  print("╚" + "═".repeat(50) + "╝");
  print("");

  for (let i = 0; i < names.length; i++) {
    const name = names[i];
    print("[" + (i + 1) + "/" + total + "] " + name + "...");
    try {
      const results = await wikiSearch(name, cfg);
      if (!results.length) throw new Error("No results");
      const pipeline = await runPipeline(results[0].title, cfg);
      const { bundle, imageInfo, scores, ceiOut, leanOut, confidence, reviewFlags, status, occupations } = pipeline;
      const profile = buildProfile({
        bundle, imageInfo, scores, confidence, reviewFlags, status, occupations,
        adjustments: makeAutoAdjustments(bundle)
      });
      profile.cei         = { value: ceiOut.cei, tier: ceiOut.tier };
      profile.primaryLean = leanLabel(leanOut.code);
      mergeIntoProfilesJson(profile);
      print("  ✓ CEI " + ceiOut.cei + " · " + profile.primaryLean);
    } catch(e) {
      failed.push(name);
      print("  ✗ " + (e?.message || e));
    }
    // Pause between profiles to avoid rate limiting
    if (i < names.length - 1) await new Promise(r => setTimeout(r, cfg.sleepMs));
  }

  print("");
  print("╔" + "═".repeat(50) + "╗");
  print("║  Refresh complete" + " ".repeat(32) + "║");
  print("║  " + (total - failed.length) + "/" + total + " imported successfully" + " ".repeat(50 - 4 - String(total).length * 2 - 22) + "║");
  if (failed.length) {
    print("╠" + "═".repeat(50) + "╣");
    print("║  Failed:" + " ".repeat(41) + "║");
    for (const n of failed) print("║  · " + n + " ".repeat(Math.max(0, 46 - n.length)) + "║");
  }
  print("╚" + "═".repeat(50) + "╝");
  print("");
}

async function main() {
  const args = parseArgs(process.argv);
  const cfg  = cfgFromArgs(args);

  if (args.help || !args._.length && !args.refresh) { help(); process.exit(args._.length ? 0 : 1); }

  if (args.refresh) { await refresh(cfg); return; }

  const query = args._.join(" ").trim();

  try {
    const results  = await wikiSearch(query, cfg);
    const title    = await chooseResult(results, args.first);
    const pipeline = await runPipeline(title, cfg);

    printPreview(pipeline);

    if (!args.import) return;

    const { bundle, imageInfo, scores, ceiOut, leanOut, confidence, reviewFlags, status, occupations } = pipeline;

    const profile = buildProfile({
      bundle, imageInfo, scores, confidence, reviewFlags, status, occupations,
      adjustments: makeAutoAdjustments(bundle)
    });

    profile.cei         = { value: ceiOut.cei, tier: ceiOut.tier };
    profile.primaryLean = leanLabel(leanOut.code);

    mergeIntoProfilesJson(profile);
    printImportComplete(profile);
  } catch (e) {
    console.error("error:", e?.message || e);
    process.exit(1);
  }
}

main();
