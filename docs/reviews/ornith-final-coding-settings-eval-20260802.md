# Ornith final coding-settings eval (2026-08-02 late)

Hardware note: Windows laptop, GTX 1080 8GB. **Must be single-stream only** — a second concurrent prompt stalls token generation on the first.

Settings under test: user-optimized coding settings; reasoning cap ~4096; better coding temperature; 64k context; full KV.

## Scoreboard (behavior-verified)

| # | Card | Channel | Result | Notes |
|---|------|---------|--------|-------|
| 1 | approach/clamp (previously failed math) | Hermes agent | **PASS** | Correct step/overshoot; self-check green (~4 min) |
| 2 | inventory stacks full/partial/split | chat completions API | **PASS** | All edge cases correct (incl. split) (~4.5 min) |
| 2b | same stacks | Hermes agent | **NO_FILE** | Context-exceeded abort mid-run (Hermes/server glitch) |
| 3 | redstone signal pure helpers | chat completions API | **PASS** | clamp/torch/dust/or all correct (~1.7 min) |
| 4 | cooldown create/tryFire | OpenCode | **FAIL API shape** | Stores `ms` (improvement) but returns bare state, not `{ok,state}` |
| 5 | nutrition (prior) | OpenCode | **PASS** | Still correct sat-first drain |
| — | Concurrent second jobs | any | **HARMS** | Second prompt pauses first stream on 1080 |

**Hard behavior score this round: 4/5 modules correct** (cooldown wrong contract).

## vs earlier today

| Era | Hermes starts | approach() | stacks split | Agent reliability | Concurrent |
|-----|---------------|------------|--------------|-------------------|------------|
| 32k quant KV | No | n/a agent | wrong | Poor | n/a |
| 64k full KV first pass | Yes | wrong | wrong/partial | Mixed | Over-dispatched |
| **Final coding settings** | Yes | **right** | **right (API)** | Better on pure+tests | **Must be 1** |

Not “dramatically AGI-level,” but **clearly improved** on pure-module correctness when given:
- one GPU stream
- explicit acceptance checks
- enough time (minutes, not seconds)

## Still weak
- Hermes intermittent “context exceeded” ~8k even with 64k config
- OpenCode can miss return contracts
- Too slow/fragile for unattended multi-file `game.js` work
- 1080 cannot multitask prompts

## Ops recommendation
- If used: **depth 1 only**, pure modules, smoke-required, no parallel ornith/Hermes/OpenCode/Kanban on same endpoint
- Kill leftover `work kanban task` before eval or feature work
- Prefer qwen/Luna for vertical features
