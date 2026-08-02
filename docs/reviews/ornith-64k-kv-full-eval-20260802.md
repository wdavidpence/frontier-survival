# Ornith 64k + full KV eval (2026-08-02)

Changes under test: context window raised to **64k**, KV cache **not quantized**.

## Summary table

| Card | Path | Time | Result | Quality notes |
|------|------|------|--------|----------------|
| Ping ORNITH64_OK | Hermes agent | ~1m44s | PASS | Hermes now accepts model (was hard-blocked at 32k) |
| TINY clamp01/approach | Hermes agent write | ~3m | PARTIAL | File written + syntax OK; **approach() math wrong** (uses clamp01 on distance incorrectly → 30 instead of 3) |
| MEDIUM inventory stacks | Hermes agent write | ~5m+ | PARTIAL | `canMerge`/`mergeStacks` **correct** (better than 32k eval); **splitStack broken** (keep not reduced; split count wrong) |
| Nutrition module | OpenCode | wrote | **PASS** | Full correct sat-first drain semantics; smoke green |
| Pressure-plate pure | chat/completions + file context | ~30s | **PASS** | platePower/edge/rising-edge correct |
| FIX broken approach | Hermes resume session | fail | FAIL | Bogus "context exceeded" at ~8k tokens on resume/compress path |

## Compared to 32k eval earlier today

| Dimension | 32k + quant KV | 64k + full KV |
|-----------|----------------|---------------|
| Hermes agent starts | No (<64k gate) | **Yes** |
| Can write files via tools | Rarely / hang | **Yes** |
| Tiny correct logic | Yes (API) | Hermes writes but **logic still weak** |
| Medium edge cases | canMerge fully wrong | canMerge fixed; split still wrong |
| Nutrition real module | Failed | **Succeeded** |
| Speed | API tiny 5s; med 100s | Agent 2–5+ min/card (slow) |
| Unattended Kanban trust | No | **Still no** without mandatory tests |

## Impressions
- **Material upgrade for agent usability**: Hermes can load and edit; OpenCode can land a correct pure module.
- **Still not “smart” on first-try correctness** for non-trivial APIs: looks complete, fails edge cases unless the prompt forces a self-check and the model actually runs it.
- **64k does not remove** long reasoning latency or occasional server/Hermes context mis-reports on session resume.
- Best use now: **depth-1 pure JS cards with explicit acceptance tests in the card**, judge verifies smoke; not multi-file game.js features alone overnight.

## Recommendation
- Optional **limited** ornith lane: pure modules only, one at a time, card must include `node tests/smoke.mjs` assertions, reclaim if no diff in ~15m.
- Do not treat as peer to Luna/qwen27 for vertical gameplay integration yet.
