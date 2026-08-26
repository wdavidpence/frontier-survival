# Frontier Survival v1.25.2 — sun, sculpted light, water glitter

Login-wow lighting checkpoint on v1.25.1 clouds.

- Visible sun disc + glow (was forced hidden every frame).
- Voxel terrain now uses world-space Lambert + sky/ground hemisphere instead of flat `abs(dot)`.
- Shader receives the live sun direction and a warmer key / cooler shade.
- Water tops pick up a sun glitter highlight.
- Cache: `main.js?v=756` → `game.js?v=736` → `atlas.js?v=316` / `sky-clouds.js?v=31`.

Honest limit: still not Minecraft PBR/shadow-maps. The opening beach should now read as a lit scene instead of a flat postcard.
