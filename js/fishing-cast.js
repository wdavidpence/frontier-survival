// Frontier Survival - Water, Plank, Bottle, Fishing Systems
const FISHING_CAST_SECONDS = 2.2;

function createFishingState() {
  return { rod: null, line: null, bait: null, bucket: false };
}

function updateFishingCast(state, input) {
  if (!state.bucket && state.line === null) {
    return { cast: false, catch: false };
  }
  
  const roll = Math.random();
  let catchResult = { caught: false, fish: null };
  
  if (roll < 0.55) {
    catchResult.caught = true;
    catchResult.fish = { type: 'small', weight: 12 + Math.floor(Math.random() * 8), value: 3 };
  } else if (roll < 0.75) {
    catchResult.caught = true;
    catchResult.fish = { type: 'medium', weight: 18 + Math.floor(Math.random() * 6), value: 8 };
  } else if (roll < 0.92) {
    catchResult.caught = true;
    catchResult.fish = { type: 'large', weight: 25 + Math.floor(Math.random() * 10), value: 15 };
  }
  
  return { cast: state.line !== null, catch: catchResult };
}

function consumeResource(state) {
  const bucket = state.bucket;
  let rodDurability;
  
  if (bucket) {
    if (state.rod === null || state.rod < 100) {
      state.rod = Math.min(95, state.rod + 5);
    } else {
      state.rod = Math.max(0, state.rod - 3);
    }
  } else if (state.line !== null && state.line > 0) {
    state.line--;
    rodDurability = 1;
  } else if (state.bait === 'fish' || state.bait === 'worm') {
    state.bait = null;
    rodDurability = 2;
  } else {
    return false;
  }
  
  return rodDurability > 0 ? true : false;
}
