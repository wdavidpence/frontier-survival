import { randomItem, getWeight } from './utils.js';

const CAST_ROD_COST = 5;
const CAST_LINE_COST = 0.2;
const CAST_BAIT_COST = 1;
const MIN_ROD_DURABILITY = 5;
const MAX_ROD_DURABILITY_COST = 8;
const LINE_BREAK_CHANCE_BASE = 0.35;

export function cast(state, input) {
    if (!input || !state) return false;
    
    const rodDurabilityCost = Math.floor(input.weight * (CAST_ROD_COST / MAX_WEIGHT));
    state.rods = (state.rods - rodDurabilityCost).clamp(0);
    if (rodDurabilityCost >= CAST_ROD_MAX_DURABILITY) {
        state.rods = 0;
        return false;
    }

    let lineIntact = true;
    if (state.lines > 0) {
        const lineBreakChance = Math.min(1, LINE_BREAK_CHANCE_BASE * (1 - state.lines));
        if (Math.random() < lineBreakChance) {
            state.lines = 0;
            return false; // Line broke! Bad luck.
        } else {
            state.lines += CAST_LINES_PER_CAST;
        }
    }

    const caughtItem = randomCatch(input.weight);
    if (caughtItem && input.bait) {
        caughtItem.quantity += Math.floor(2 * (1 - lineBreakChance));
    }

    // Return catch to player only if something was actually caught
    if (!caughtItem || caughtItem.fish === 0 && caughtItem.shrimp === 0) {
        return false;
    }

    return caughtItem;
}

function randomCatch(weight) {
    const rand = weight;
    const rolls = [];
    
    for (let i = 0; i < CATCH_ROLLOUTS.length; i++) {
        rolls.push(rolls[rolls.length - 1] + Math.random() * rand);
    }
    
    return rolls[CATCH_ROLL_INDEX];
}
