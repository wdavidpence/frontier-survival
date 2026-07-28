# Frontier Survival

Browser **keyboard + mouse** survival sandbox inspired by the *systems* of Survivalcraft (not a copy of its assets or branding).

You are stranded in a blocky wilderness. **Cold, hunger, exhaustion, and predators** matter as much as mining.

## Play (dev)

Serve the **project root** (so `/public` and `/js` both resolve):

```bash
cd /mnt/c/Users/wdavi/Projects/SurvivalCraftMobile
python3 -m http.server 8765 --bind 127.0.0.1
# open http://127.0.0.1:8765/public/
```

```bash
node tests/smoke.mjs
```

## Docs
- `docs/SCM.md` — design pillars, roadmap, architecture
- `docs/plan.md` — checklist
- `docs/session-handoff.md` — resume point

## Stack
Three.js (ES modules), vanilla JS, static hosting.

## Status
Early construction — see plan checklist.
