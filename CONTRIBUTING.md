# Contributing

Thanks for helping make Beauty Shell better.

## Before you start

For anything larger than a small fix, open an issue first so we can agree on the approach. Beauty Shell aims to
stay simple: fewer options done well.

## Development

1. Install Node 20 or newer, Rust (`stable-x86_64-pc-windows-msvc`) and Visual Studio Build Tools with the
   **Desktop development with C++** workload.
2. Run the app:

   ```powershell
   npm install
   npm run tauri dev
   ```

3. The website lives in `page/`: `npm --prefix page install`, then `npm run site:dev`.

Before opening a pull request, make sure `npm run build` and `cargo check` (in `src-tauri`) pass.

## Guidelines

- Code, comments and commit messages are in English.
- Keep comments few and technical: explain why, not what.
- User-facing text goes through `t("Español", "English")` in TypeScript and `lang::t` in Rust. Fixed texts in
  `index.html` are written in English and listed in the Spanish table in `main.ts`.
- The frontend has no framework on purpose: plain TypeScript and DOM.
- Follow the style in `.editorconfig`.

## Branches

| Branch | Purpose |
| --- | --- |
| `main` | Released versions only. Every merge is tagged (`v0.1.8`, `v0.2.0`…). |
| `develop` | Integration branch for the next release. Pull requests target it. |
| `feat/…`, `fix/…`, `docs/…` | One change each, branched from `develop` and deleted after merging. |
| `release/x.y.z` | Final polish of a release, branched from `develop` and merged into `main` and `develop`. |
| `hotfix/x.y.z` | Urgent fixes to a release, branched from `main` and merged into `main` and `develop`. |

## Commits and pull requests

- Branch from `develop` (`feat/…`, `fix/…`, `docs/…`) and open the pull request against it.
- Use [Conventional Commits](https://www.conventionalcommits.org): `feat(sidebar): …`, `fix(pty): …`, `docs: …`.
- Keep pull requests focused on one change and describe how you tested it.

## Releases

`npm run release:publish -- 0.1.8 "What changed"` bumps the version, builds the signed installer and publishes it with
the update feed (`latest.json`). It needs the updater's private signing key, so only maintainers can run it.
