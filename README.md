# Frontier Survival

Browser **keyboard + mouse** open-world survival sandbox.

Inspired by the *systems* of Survivalcraft (harsh nature, clothing, sleep, predators) — **original code, art, and audio**. Not affiliated with Candy Rufus Games.

You wash up in a blocky wilderness where **cold, hunger, fatigue, and wolves** matter as much as mining.

![Status](https://img.shields.io/badge/status-playable%201.0%20slice-brightgreen)
![Stack](https://img.shields.io/badge/stack-Three.js%20ESM-blue)
![Tests](https://img.shields.io/badge/tests-30%20smoke-lightgrey)

---

## Play locally

Serve the **repository root** (so `./js` resolves):

```bash
cd /path/to/SurvivalCraftMobile
python3 -m http.server 8765 --bind 127.0.0.1
```

Open: **http://127.0.0.1:8765/**

Legacy path still works if you open `/public/` (uses `../js`).

```bash
node tests/smoke.mjs   # 30 pure-logic tests
```

---

## Controls (PC 1.0)

| Input | Action |
|-------|--------|
| Click canvas | Lock mouse |
| WASD | Move |
| Mouse | Look |
| Space | Jump |
| Shift | Sprint (stamina) |
| LMB | Mine blocks / attack animals |
| RMB | Place selected hotbar block |
| 1–9 | Hotbar |
| E | Inventory & crafting |
| F | Cook meat (by fire) · equip clothes · sleep (look at bed) |
| R | Eat |
| K | Quick save |
| Esc | Release mouse |

Progress **auto-saves** (also on inventory close / tab close). Title screen: **Continue** / **New world**.

---

## What makes it survival (not soft Minecraft)

- **Body systems:** health, hunger, stamina, body temperature, fatigue, wetness  
- **Cold nights** hurt without fire and/or warm clothes  
- **Hunt** hares/deer (meat + hide); **wolves** hunt you (worse at night)  
- **Cook** raw meat at campfire heat (raw food can poison)  
- **Craft** tools, torches, campfires, cloth, coat/hat/boots, bed  
- **Sleep** in a bed at night to clear fatigue and skip time  
- **Greedy-meshed** voxel world with procedural texture atlas + ambient soundscape  

---

## Project layout

```
index.html          # play entry (GitHub Pages friendly)
public/index.html   # same UI; script path ../js for /public/ serving
js/                 # game modules (Three.js ESM via import map CDN)
docs/SCM.md         # design pillars + long roadmap
docs/plan.md        # checklist
docs/session-handoff.md
tests/smoke.mjs
```

**Stack:** vanilla JS, Three.js (CDN), Web Audio (procedural), `localStorage` saves. No bundler required.

---

## Deploy (GitHub Pages)

1. Create an empty GitHub repo (e.g. `frontier-survival`).
2. From this folder:

```bash
git remote add origin https://github.com/<you>/frontier-survival.git
git branch -M main
git push -u origin main
```

3. Repo **Settings → Pages → Build from branch `main` / root `/`**.
4. After deploy, play at:  
   `https://<you>.github.io/frontier-survival/`

A `.nojekyll` file is included so GitHub won’t break ES module paths.

---

## Legal / IP

- **Original** implementation, procedural textures, and synth audio.  
- Survivalcraft is a design **reference** only (publicly described mechanics).  
- Do not ship Candy Rufus assets, names, or trademarks as your own.

---

## Roadmap (beyond this slice)

See `docs/SCM.md`: more biomes, spear/bow, electricity/logic, boats, difficulty modes, multiplayer later.

---

## Status

**Playable browser 1.0 vertical slice** — fun session loop with survival pressure.  
Not commercial Survivalcraft feature parity; depth continues from the plan checklist.
