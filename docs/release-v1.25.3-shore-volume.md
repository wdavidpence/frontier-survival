# Frontier Survival v1.25.3 — contact stain, beach stair, water volume

Login-wow follow-up on v1.25.2.

- Shader contact darkening stains sand/walls at the waterline.
- Coastal grade is a 1-block stair inland. Never drops land below sea level. Sync and worker stay mirrored.
- Water sides go deep teal; tops pick up volume tint and a broader foam sparkle.
- Cache: `main.js?v=757` → `game.js?v=737` → `atlas.js?v=317` / `world.js?v=495` / `gen.js?v=317` / `chunk-worker.js?v=344`.

Honest limit: still not Minecraft water/SSR. Opening cove should read wetter, darker at the feet, and less cliffed.
