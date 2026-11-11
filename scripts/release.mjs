// Builds the signed installer and, with `publish`, releases it as a new version.
//
//   npm run release                                   → release/BeautyShellSetup.exe and release/latest.json
//   npm run release:publish -- 0.1.1 "What changed"   → also bumps the version and creates the GitHub release
//
// The updater requires signatures: every installer is signed with ~/.tauri/beauty-shell.key and the app rejects it
// unless it matches the public key in tauri.conf.json. The key's password is asked for here (or read from
// TAURI_SIGNING_PRIVATE_KEY_PASSWORD) and never stored.
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { createInterface } from "node:readline";

const REPO = "fabriciovla/BeautyShell";
const NSIS = "src-tauri/target/release/bundle/nsis";
const [mode, newVersion, notes = ""] = process.argv.slice(2);
const publish = mode === "publish";

const fail = (msg) => {
  console.error(`\n✗ ${msg}`);
  process.exit(1);
};

const conf = JSON.parse(readFileSync("src-tauri/tauri.conf.json", "utf8"));
if (publish) {
  if (!/^\d+\.\d+\.\d+$/.test(newVersion ?? "")) fail('Missing version: npm run release:publish -- 0.1.1 "What changed"');
  if (newVersion === conf.version) fail(`${newVersion} is already the current version: publish a newer one.`);
  // The version lives in three places and they must match, since the app compares itself against latest.json.
  const swap = (file, from, to) => writeFileSync(file, readFileSync(file, "utf8").replace(from, to));
  swap("src-tauri/tauri.conf.json", `"version": "${conf.version}"`, `"version": "${newVersion}"`);
  swap("package.json", /"version": "[^"]+"/, `"version": "${newVersion}"`);
  swap("src-tauri/Cargo.toml", /^version = "[^"]+"/m, `version = "${newVersion}"`);
  conf.version = newVersion;
  console.log(`Version ${newVersion}`);
}
const version = conf.version;

const keyPath = join(homedir(), ".tauri", "beauty-shell.key");
if (!process.env.TAURI_SIGNING_PRIVATE_KEY) {
  if (!existsSync(keyPath)) fail(`The private key was not found at ${keyPath}.`);
  process.env.TAURI_SIGNING_PRIVATE_KEY = readFileSync(keyPath, "utf8");
}

function askHidden(question) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    rl.stdoutMuted = false;
    rl._writeToOutput = (s) => {
      if (!rl.stdoutMuted) rl.output.write(s);
    };
    rl.question(question, (answer) => {
      rl.close();
      process.stdout.write("\n");
      resolve(answer);
    });
    rl.stdoutMuted = true;
  });
}

if (process.env.TAURI_SIGNING_PRIVATE_KEY_PASSWORD === undefined) {
  process.env.TAURI_SIGNING_PRIVATE_KEY_PASSWORD = await askHidden("Signing key password: ");
}

const run = (cmd, args) => {
  const r = spawnSync(cmd, args, { stdio: "inherit", shell: true });
  if (r.status !== 0) fail(`Failed: ${cmd} ${args.join(" ")}`);
};
run("npx", ["tauri", "build"]);

const setup = join(NSIS, `Beauty Shell_${version}_x64-setup.exe`);
const sig = `${setup}.sig`;
if (!existsSync(setup)) fail(`The installer ${setup} is missing.`);
if (!existsSync(sig)) fail(`The signature ${sig} is missing: was the password right?`);

// The installer keeps the same name in every release, so the website's download link
// (…/releases/latest/download/BeautyShellSetup.exe) never changes. The signature covers the content, not the name.
mkdirSync("release", { recursive: true });
copyFileSync(setup, "release/BeautyShellSetup.exe");
const latest = {
  version,
  notes,
  pub_date: new Date().toISOString(),
  platforms: {
    "windows-x86_64": {
      signature: readFileSync(sig, "utf8").trim(),
      url: `https://github.com/${REPO}/releases/download/v${version}/BeautyShellSetup.exe`,
    },
  },
};
writeFileSync("release/latest.json", `${JSON.stringify(latest, null, 2)}\n`);
console.log(`\n✓ release/BeautyShellSetup.exe and release/latest.json (version ${version})`);

if (publish) {
  run("gh", [
    "release", "create", `v${version}`,
    "release/BeautyShellSetup.exe", "release/latest.json",
    "--repo", REPO,
    "--title", `"Beauty Shell ${version}"`,
    "--notes", JSON.stringify(notes || `Beauty Shell ${version}`),
  ]);
  console.log(`\n✓ Published: https://github.com/${REPO}/releases/tag/v${version}`);
  console.log(`  Download: https://github.com/${REPO}/releases/latest/download/BeautyShellSetup.exe`);
}
