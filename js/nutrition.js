export function clamp01(n) {
    return Math.min(1, Math.max(0, n));
}

export function createNutritionState() {
    return { hunger: 1, saturation: 0 };
}

export function applyEat(state, { food = 0, sat = 0 } = {}) {
    return {
        hunger: clamp01(state.hunger + food),
        saturation: clamp01(state.saturation + sat)
    };
}

export function tickNutrition(state, dtSec, { drain = 0.01 } = {}) {
    const totalDrain = drain * dtSec;
    let satReduction = Math.min(totalDrain, state.saturation);
    let hungerReduction = Math.max(0, totalDrain - satReduction);
    return {
        hunger: clamp01(state.hunger - hungerReduction),
        saturation: clamp01(state.saturation - satReduction)
    };
}
