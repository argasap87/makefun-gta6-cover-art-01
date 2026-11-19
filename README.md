# V12 Neon Heist — GTA 6 Cover Maker

[![Make GTA 6](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/c/gta6-cover-art-01)
[![Make GTA 6 rank](https://make.fun/badge/gta6-cover-art-01/argasap87/makefun-gta6-cover-art-01/rank.svg)](https://make.fun/c/gta6-cover-art-01)
[![Make GTA 6 reward](https://make.fun/badge/gta6-cover-art-01/argasap87/makefun-gta6-cover-art-01/reward.svg)](https://make.fun/c/gta6-cover-art-01)

**Bounty:** [Make GTA 6 Cover Art — gta6-cover-art-01, $250](https://make.fun/c/gta6-cover-art-01)
**Referral code:** `1ae1r9cj`

## The idea — 1 car. 1 light. 6 ways out.

A cover-art **maker**, not just a picture. The signature output is one giant
neon numeral: the **"6" is the background, the car, and the title at once** —
a flat electric-blue "6" filling the frame, a red sports car racing across
it, and huge flat "GTA VI" block type at the bottom. The "6" is one thick
solid flat numeral (no grid lines, no glow bleed); the car is a clean dark
silhouette with red paint and a single white headlight streak.

## How it works — 3 steps to a PNG

1. **Add a photo** — upload your own, drag it on the preview to position it,
   or use the built-in sample photo. Zoom and nudge sliders fine-tune it.
2. **Pick a layout and caption** — Hero 6 (one giant "6"), Split 2, or
   Grid 4 panels; edit the big title, tagline, and badge; pick a grade
   (Neon Night / Vice Sunset / Midnight).
3. **Export PNG** — 1080×1080, 1080×1350, or 1920×1080, or all three at once.

The preview and the export share one canvas renderer, so what you see is
exactly what you get.

## Run it

Plain static files — no build step, no network. Serve `app/` any way you
like and open it in desktop Chrome:

```sh
cd app && python3 -m http.server 8000
# open http://127.0.0.1:8000
```

Everything (scripts, styles, the sample photo) lives under `app/`. Your
photos never leave your browser.

## Originality

All artwork is drawn in code (sunset, skyline, car, the "6") or generated
programmatically for the sample photo. No Rockstar Games logo, wordmark,
official artwork, character, or font is used anywhere; the only typefaces
are system font stacks.

## Files

- `app/index.html`, `app/style.css`, `app/app.js` — the maker
- `app/samples/neon-street.png` — built-in sample photo (generated, no real person)
- `screenshots/` — the exported hero cover first, then the editor at work
- `main.ts` — copies `app/` + `screenshots/` to the output dir and writes
  `dossier.json` with the vendored make.fun library
- `vendor/makefun-app.ts` — the make.fun dossier library, vendored unchanged
