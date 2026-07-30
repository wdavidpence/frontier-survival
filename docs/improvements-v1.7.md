# Frontier Survival — 20 Polishes (v1.7)

| # | Item | Status |
|---|------|--------|
| 1 | Diagnose black canvas | ✅ |
| 2 | Opaque WebGL clear color | ✅ |
| 3 | Boot resize/camera/render | ✅ |
| 4 | Brighter night terrain ambient | ✅ |
| 5 | Reset sleep-fade on boot | ✅ |
| 6 | Bleed HUD wired to survival.bleed | ✅ |
| 7 | Biome on status line | ✅ |
| 8 | Version v1.7 HTML+main | ✅ |
| 9 | Smoke regression 80 pass | ✅ |
| 10 | Publish GitHub | ✅ |
| 11-20 | Deeper SC content (bucket, live logic tick, map…) | ⏳ next board wave |

Black canvas root cause: page body is `#0a0e14`; without opaque WebGL clear + successful mesh boot the canvas reads as black while HUD still paints. Also night sky/shader ambient was near-black. Fixes above harden day/night visibility.
