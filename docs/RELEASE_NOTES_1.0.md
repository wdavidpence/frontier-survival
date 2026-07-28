# Frontier Survival — 1.0 playable slice

Shipped as a browser PC (keyboard/mouse) survival sandbox.

## Included
- Voxel world (greedy mesh, radius 5 chunks, procedural atlas)
- Survival meters: health, hunger, stamina, temperature, fatigue
- Day/night, weather, campfire heat
- Inventory + crafting (tools, torches, fire, cloth, clothes, bed)
- Wildlife: hare, deer, wolf; meat/hide; cook at fire
- Clothing warmth + bed sleep (time skip)
- Ambient audio (wind/rain/fire/water/birds/howls)
- localStorage save/load + continue

## Verify
```bash
node tests/smoke.mjs
# expect 30 tests passed
python3 -m http.server 8765 --bind 127.0.0.1
# open http://127.0.0.1:8765/
```

## Not in this slice
- Full SC electricity, boats, multiplayer
- AAA art pack / recorded soundtrack
- Mobile touch-first UI

## Credits
Original code/art/audio. Systems inspired by the Survivalcraft genre/public design descriptions.
