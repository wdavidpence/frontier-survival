// Cooldown state machine — pure, no side effects.
// createCooldown(ms) -> {ms, readyAt: 0}
// tryFire(state, nowMs) -> {ok: boolean, state}

function createCooldown(ms) {
    return { ms, readyAt: 0 };
}

function tryFire(state, nowMs) {
    if (nowMs < state.readyAt) {
        // Not ready yet — return a defensive copy so callers can mutate freely.
        return { ok: false, state: { ...state } };
    }
    const next = { ...state, readyAt: nowMs + state.ms };
    return { ok: true, state: next };
}

export { createCooldown, tryFire };
