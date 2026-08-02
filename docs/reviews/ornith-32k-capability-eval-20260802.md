# Ornith-1.0-9b-mtp capability eval (2026-08-02)

Constraint: model context window **32768**. Hermes Agent requires **>=64000**, so Kanban/Hermes worker path is blocked unless context_length is lied about.

## Method
- Raw OpenAI-compatible chat/completions with high max_tokens (2k-6k) and system prompt forcing code into `content`.
- Cards: tiny pure, medium pure inventory, large pure with existing noteblock file context.
- OpenCode agent path for a small tool-using write.
- Hermes `-p oss20b chat` agent path.

## Results

| Card | Path | Time | Result | Notes |
|------|------|------|--------|-------|
| TINY clamp/lerp | API completions | ~5s | **PASS** | Valid ES module, correct behavior |
| MEDIUM inventory stacks | API completions | ~101s | **PARTIAL** | Parses + exports OK; **logic bugs** (`canMerge` uses nonexistent `.room`, so full stacks still "mergeable") |
| LARGE noteblock helpers + file context | API completions | ~18s | **PASS** | Matched existing clampPitch 0..24; solid pure rewrite |
| AGENT cooldown module | OpenCode | ~tens of s | **FAIL quality** | File written, but `ms` not stored on state (`nowMs + ms` ReferenceError / wrong semantics) |
| AGENT via Hermes | hermes -p oss20b | fail fast | **BLOCKED** | "context window 32768 < minimum 64000 required by Hermes Agent" |

## Token pattern
- With enough `max_tokens`, model **does** emit `content` (not only reasoning).
- Medium card: ~2900 reasoning tokens + ~250 content tokens — slow but usable for short pure files.
- Earlier overnight failures often used too-small max_tokens or agent wrappers that blow the 32k window with tools/skills.

## Impressions
**Strengths**
- Can write small pure JS modules correctly when the prompt is closed-ended and self-contained.
- Can read a short existing file and mirror its API (noteblock pitch clamp matched exactly).
- Fast on tiny tasks; acceptable on medium if you wait ~1-2 minutes and budget thousands of completion tokens.

**Weaknesses**
- **Unfit as Hermes/Kanban worker** at true 32k (hard gate at 64k).
- Tool-using agents (OpenCode/Hermes) still unreliable: incomplete closures, forgotten fields, weak self-test.
- Medium logic quality is shallow — looks complete, fails edge cases without tests in the loop.
- Not appropriate for multi-file game.js/world integration cards or anything needing broad repo context.

## Recommendation
- Do **not** run unattended overnight Kanban on ornith.
- Optional: use **API/OpenCode only** for **tiny pure helpers** with deterministic smoke written by judge/human, max_tokens>=2048, single-file prompts, no skills dump.
- Prefer qwen27/stronger local or Luna for real FS features.
