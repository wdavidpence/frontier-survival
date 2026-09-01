# Frontier Survival v1.27.7 — Streaming Confidence

**Release type:** verified incremental checkpoint

## Player journey

After a short warmup, the status HUD reports **Streaming · warming / playable / steady / hitching** from the live frame-time ring. That makes long-session performance visible instead of only a hidden `__FS.performance` probe.

## What changed

- Added a pure streaming-confidence classifier over the existing frame-budget samples.
- The 1s performance report stores the verdict on `__FS.performance.confidence`.
- Status HUD compact copy includes the streaming label.

## Scope remaining

This is a confidence surface, not a five-minute leak hunt or Minecraft-class visual bar. DualSense hardware proof remains open.
