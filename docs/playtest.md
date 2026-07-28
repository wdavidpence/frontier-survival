# Playtest Log

## Controls
WASD move, mouse look (click canvas), Space jump, Shift sprint, LMB mine, RMB place, 1-9 hotbar, R eat ration, Esc release mouse.

## Session 2026-07-28
- [x] Boot to world without console errors
- [x] Title → Start hides overlay and generates world
- [x] HUD meters + hotbar + help visible
- [x] Spawn on solid grass (block id 1 under feet), body temp ~37°C, full health
- [x] Day/night status line + weather + air temp
- [x] 49 chunk meshes present
- [ ] Pointer lock + look (needs real user mouse; automation limited)
- [ ] Move/jump/collide manual
- [ ] Break and place blocks manual
- [ ] Night cold + campfire recovery manual
- [ ] Sprint drains stamina manual
- [ ] Eat ration manual
- [ ] Audio feedback manual

### Notes
- First spawn landed in/near water with broken temp homeostasis (fixed: comfort air keeps 37°C; improved dry-land spawn scoring).
- Graphics are flat vertex colors (atlas later). Water shader is translucent planes — fine for prototype.
- Hunger drains on a short session timescale so survival pressure is felt in playtests.
