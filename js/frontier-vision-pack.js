import * as THREE from 'three';
import { BLOCK } from './blocks.js?v=298';
import { firstExpeditionSummary } from './first-expedition.js?v=1';

const MEMORY_KEY = 'frontier-golden-cove-memory-v1';
const TAU = Math.PI * 2;

const CSS = `
  #golden-cove-vision{position:absolute;inset:0;z-index:18;pointer-events:none;font-family:Inter,ui-sans-serif,system-ui,sans-serif;color:#f5ead8;--gcv-accent:#f3c987;--gcv-cool:#8fe1e5;--gcv-grade:0;}
  #golden-cove-vision::before{content:"";position:absolute;inset:0;pointer-events:none;opacity:0;transition:opacity .9s ease;background:radial-gradient(ellipse at 50% 18%,rgba(98,139,161,.22),transparent 48%),linear-gradient(180deg,rgba(22,45,65,.24),transparent 42%,rgba(5,17,25,.12));mix-blend-mode:multiply}#golden-cove-vision[data-weather="rain"]::before{opacity:.42}#golden-cove-vision[data-weather="storm"]::before{opacity:.72;background:radial-gradient(ellipse at 54% 14%,rgba(84,122,149,.34),transparent 44%),linear-gradient(180deg,rgba(15,36,56,.42),transparent 48%,rgba(3,12,19,.24))}#golden-cove-vision[data-night="true"]::before{opacity:.32;background:radial-gradient(ellipse at 50% 76%,rgba(85,136,151,.16),transparent 38%),linear-gradient(180deg,rgba(5,12,32,.42),rgba(9,22,39,.16) 52%,rgba(2,8,14,.34))}
  #golden-cove-vision::after{content:"";position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse at 50% 68%,rgba(255,205,146,.12),transparent 42%),linear-gradient(180deg,rgba(255,183,105,.10),transparent 28%,transparent 78%,rgba(4,12,19,.12));mix-blend-mode:screen;opacity:var(--gcv-grade);transition:opacity .8s ease;}
  .gcv-ribbon{position:absolute;top:58px;left:50%;transform:translateX(-50%);width:min(430px,calc(100vw - 320px));min-width:280px;padding:8px 11px 9px;border:1px solid rgba(255,227,181,.22);border-radius:11px;background:linear-gradient(110deg,rgba(7,15,23,.76),rgba(13,25,33,.52));box-shadow:0 10px 28px rgba(0,0,0,.22),inset 0 1px rgba(255,255,255,.08);backdrop-filter:blur(10px);pointer-events:auto;animation:gcv-in .8s ease both;}
  .gcv-priority{display:flex;align-items:center;gap:6px;margin-top:6px;padding-top:5px;border-top:1px solid rgba(255,255,255,.08);font-size:9px}.gcv-priority span{color:#89aeb1;letter-spacing:.1em;text-transform:uppercase}.gcv-priority b{font-weight:600;color:#f3c987}
  .gcv-expedition{display:flex;align-items:center;gap:7px;margin-top:6px;color:#9db8bc;font-size:8px;letter-spacing:.08em;text-transform:uppercase}.gcv-expedition strong{color:#a9e5e4;font-weight:600}.gcv-expedition i{flex:1;height:3px;border-radius:99px;background:rgba(255,255,255,.1);overflow:hidden}.gcv-expedition i::after{content:"";display:block;width:var(--gcv-expedition-progress,0%);height:100%;background:linear-gradient(90deg,#63c7bd,#f3c987);transition:width .35s ease}
  .gcv-voyage{position:absolute;left:50%;bottom:116px;transform:translateX(-50%) translateY(8px);width:min(320px,calc(100vw - 32px));padding:8px 11px;border:1px solid rgba(143,225,229,.25);border-radius:12px;background:linear-gradient(110deg,rgba(5,18,26,.84),rgba(9,33,39,.68));box-shadow:0 12px 30px rgba(0,0,0,.26),inset 0 1px rgba(255,255,255,.1);backdrop-filter:blur(10px);opacity:0;visibility:hidden;transition:opacity .25s ease,transform .25s ease}.gcv-voyage.on{opacity:1;visibility:visible;transform:translateX(-50%) translateY(0)}.gcv-voyage-head{display:flex;justify-content:space-between;align-items:center;color:#a9e5e4;font-size:8px;letter-spacing:.16em;text-transform:uppercase}.gcv-voyage-state{color:#f3c987;font-weight:700;letter-spacing:.08em}.gcv-voyage-detail{display:flex;justify-content:space-between;gap:8px;margin-top:5px;color:#d5e6e3;font-size:10px}.gcv-voyage-detail b{color:#fff1d1}.gcv-voyage-meter{height:3px;margin-top:7px;border-radius:999px;background:rgba(255,255,255,.1);overflow:hidden}.gcv-voyage-meter i{display:block;height:100%;width:0;background:linear-gradient(90deg,#63c7bd,#f3c987);transition:width .25s ease}.gcv-voyage-note{margin-top:4px;color:#8eafb2;font-size:8px}
  .gcv-kicker{font-size:8px;letter-spacing:.19em;text-transform:uppercase;color:var(--gcv-accent);opacity:.82}.gcv-location{margin-top:2px;font:600 16px/1.05 Georgia,serif;letter-spacing:.015em}.gcv-context{display:flex;align-items:center;gap:8px;margin-top:5px;color:#c9dce0;font-size:10px}.gcv-sep{width:3px;height:3px;border-radius:50%;background:var(--gcv-cool);box-shadow:0 0 8px var(--gcv-cool)}.gcv-toggle{float:right;margin-top:-3px;border:1px solid rgba(255,226,175,.25);border-radius:999px;padding:4px 7px;background:rgba(255,255,255,.06);color:#f7e5c5;font-size:8px;letter-spacing:.08em;text-transform:uppercase;cursor:pointer}.gcv-toggle:hover{background:rgba(255,255,255,.13)}
  .gcv-arrival{position:absolute;top:26%;left:50%;transform:translateX(-50%);width:min(470px,calc(100vw - 70px));padding:17px 20px;border:1px solid rgba(255,226,176,.32);border-radius:15px;background:linear-gradient(145deg,rgba(10,19,27,.82),rgba(31,33,30,.56));box-shadow:0 18px 48px rgba(0,0,0,.28),inset 0 1px rgba(255,255,255,.12);backdrop-filter:blur(12px);text-align:center;transition:opacity .8s ease,transform .8s ease;}.gcv-arrival.hide{opacity:0;transform:translate(-50%,-10px)}.gcv-arrival-kicker{font-size:8px;letter-spacing:.25em;color:var(--gcv-accent);text-transform:uppercase}.gcv-arrival-title{margin-top:6px;font:600 27px/1 Georgia,serif}.gcv-arrival-copy{margin-top:7px;color:#cbd8d4;font-size:11px;line-height:1.45}.gcv-arrival-route{display:inline-block;margin-top:11px;padding:5px 9px;border:1px solid rgba(143,225,229,.22);border-radius:999px;color:#a9e5e4;font-size:9px;letter-spacing:.07em;text-transform:uppercase}
  .gcv-dossier{position:absolute;top:106px;left:50%;transform:translateX(-50%);width:min(520px,calc(100vw - 32px));max-height:min(590px,calc(100vh - 130px));overflow:auto;padding:15px;border:1px solid rgba(255,227,181,.28);border-radius:15px;background:rgba(7,14,22,.91);box-shadow:0 24px 80px rgba(0,0,0,.44),inset 0 1px rgba(255,255,255,.1);backdrop-filter:blur(18px);pointer-events:auto;opacity:0;visibility:hidden;transition:opacity .2s ease,transform .2s ease}.gcv-dossier.on{opacity:1;visibility:visible;transform:translateX(-50%) translateY(0)}.gcv-dossier-head{display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid rgba(255,255,255,.1);padding-bottom:10px}.gcv-dossier-title{font:600 20px Georgia,serif}.gcv-dossier-sub{margin-top:3px;color:#9db8bc;font-size:9px}.gcv-close{border:0;background:transparent;color:#c9d6d0;font-size:18px;cursor:pointer}.gcv-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:11px}.gcv-card{min-height:62px;padding:9px;border:1px solid rgba(255,255,255,.09);border-radius:10px;background:linear-gradient(145deg,rgba(255,255,255,.065),rgba(255,255,255,.02))}.gcv-card.wide{grid-column:1/-1}.gcv-card-label{font-size:8px;color:var(--gcv-accent);letter-spacing:.15em;text-transform:uppercase}.gcv-card-value{margin-top:5px;font-size:13px;color:#f4eee1}.gcv-card-note{margin-top:4px;color:#9db5b8;font-size:9px;line-height:1.35}.gcv-meter{height:4px;margin-top:7px;border-radius:999px;background:rgba(255,255,255,.09);overflow:hidden}.gcv-meter i{display:block;height:100%;width:0;border-radius:inherit;background:linear-gradient(90deg,#63c7bd,#f3c987);transition:width .4s ease}.gcv-memory{display:flex;gap:7px;align-items:center;padding:6px 0;border-bottom:1px solid rgba(255,255,255,.07);font-size:10px}.gcv-memory:last-child{border-bottom:0}.gcv-memory-dot{width:6px;height:6px;border-radius:50%;background:#8fe1e5;box-shadow:0 0 9px #8fe1e5}.gcv-memory-time{margin-left:auto;color:#718c91;font-size:8px}
  .gcv-dossier::-webkit-scrollbar{width:5px}.gcv-dossier::-webkit-scrollbar-thumb{background:rgba(255,255,255,.2);border-radius:5px}
  @keyframes gcv-in{from{opacity:0;transform:translateX(-50%) translateY(-7px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
  @media(max-width:720px){.gcv-voyage{bottom:226px;width:calc(100vw - 28px - env(safe-area-inset-left) - env(safe-area-inset-right));}.gcv-ribbon{top:225px;left:calc(10px + env(safe-area-inset-left));right:calc(10px + env(safe-area-inset-right));transform:none;width:auto;min-width:0;animation:none}.gcv-arrival{top:42%;left:calc(50% + (env(safe-area-inset-left) - env(safe-area-inset-right))/2);width:calc(100vw - 28px - env(safe-area-inset-left) - env(safe-area-inset-right));padding:10px 13px}.gcv-arrival-title{font-size:21px}.gcv-arrival-copy{font-size:10px;line-height:1.28;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.gcv-arrival-route{margin-top:7px;font-size:8px}.gcv-dossier{top:225px;left:calc(50% + (env(safe-area-inset-left) - env(safe-area-inset-right))/2);width:calc(100vw - 20px - env(safe-area-inset-left) - env(safe-area-inset-right));max-height:calc(100vh - 245px)}.gcv-grid{grid-template-columns:1fr}.gcv-card.wide{grid-column:auto}.gcv-toggle{font-size:7px}}
  @media(prefers-reduced-motion:reduce){#golden-cove-vision *,#golden-cove-vision::before,#golden-cove-vision::after{animation:none!important;transition:none!important}}
`;

function clamp01(n) { return Math.max(0, Math.min(1, Number.isFinite(n) ? n : 0)); }
function formatDistance(n) { return n < 1000 ? `${Math.max(0, Math.round(n))}m` : `${(n / 1000).toFixed(1)}km`; }
function bearingTo(from, to) {
  if (!from || !to) return { degrees: 0, label: 'N' };
  const degrees = (Math.atan2(to.x - from.x, -(to.z - from.z)) * 180 / Math.PI + 360) % 360;
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return { degrees, label: dirs[Math.round(degrees / 45) % 8] };
}
function loadMemories() {
  try { return JSON.parse(localStorage.getItem(MEMORY_KEY) || '[]'); } catch { return []; }
}
function saveMemories(memories) {
  try { localStorage.setItem(MEMORY_KEY, JSON.stringify(memories.slice(-12))); } catch { /* private mode */ }
}
function setText(root, selector, value) {
  const el = root.querySelector(selector);
  if (el && el.textContent !== String(value)) el.textContent = String(value);
}
function setWidth(root, selector, value) {
  const el = root.querySelector(selector);
  if (el) el.style.width = `${Math.round(clamp01(value) * 100)}%`;
}

export function fieldRisk(survival = {}) {
  return Math.max(
    clamp01((24 - (survival.health ?? 100)) / 24),
    clamp01((20 - (survival.thirst ?? 100)) / 20),
    clamp01((20 - (survival.hunger ?? 100)) / 20),
    clamp01((34.4 - (survival.bodyTemp ?? 37)) / 3),
    clamp01((survival._debug?.dps ?? 0) / 2.4),
  );
}

export function wildlifeSpoorLabel(nearestAnimal) {
  return nearestAnimal && nearestAnimal.distance < 26
    ? `Fresh spoor · ${nearestAnimal.type}`
    : 'No fresh spoor';
}

function snapshot(game) {
  const player = game.player;
  const pos = player?.position;
  const destination = game._destinationState?.destination || null;
  const distance = destination && pos ? Math.hypot(destination.x - pos.x, destination.z - pos.z) : 0;
  const tide = 0.5 + 0.5 * Math.sin(((game.time?.dayPhase || 0) + 0.1) * TAU);
  const weather = game.time?.weather || 'clear';
  const waterProbe = [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]];
  const nearWater = !!(game._cameraInWater || game._boat?.mounted || waterProbe.some(([dx, dz]) => game.world?.getBlock?.(Math.floor((pos?.x || 0) + dx), Math.floor((pos?.y || 0) - 1), Math.floor((pos?.z || 0) + dz)) === BLOCK.WATER));
  const boat = game._boat;
  const survival = game.survival || {};
  const boatReadiness = boat ? clamp01((boat.hull ?? 0) * .5 + (boat.mast ?? 0) * .25 + (boat.sail ?? 0) * .25) : 0;
  const boatCargo = boat?.chest?.slots?.reduce?.((sum, slot) => sum + (slot?.count || 0), 0) || 0;
  const wakeActive = !!(game._boatWake?.some?.((mesh) => mesh.visible));
  const fishPhase = game._fishState?.phase || 'ready';
  const fishLabel = fishPhase === 'bite' ? 'Bite window' : fishPhase === 'hooked' ? 'Fish on' : fishPhase === 'casting' ? 'Line traveling' : 'Waiting for a bite';
  const livingAnimals = game.fauna?.living?.() || [];
  const nearestAnimal = livingAnimals.reduce((best, animal) => {
    if (!pos) return best;
    const d = Math.hypot(animal.x - pos.x, animal.z - pos.z);
    return !best || d < best.distance ? { type: animal.type, distance: d } : best;
  }, null);
  const p2Pos = game.player2?.position;
  const p2Distance = pos && p2Pos ? Math.hypot(pos.x - p2Pos.x, pos.z - p2Pos.z) : Infinity;
  const crewTogether = !!(game.coopMode && p2Pos && p2Distance < 12);
  const crewStatus = !game.coopMode ? 'Solo fieldcraft' : !p2Pos ? 'Second station not ready' : crewTogether ? 'Crew together' : `Crew split · ${Math.round(p2Distance)}m apart`;
  const risk = fieldRisk(survival);
  const edits = game._builtEdits?.size || 0;
  const campDistance = game._spawnPos && pos ? Math.hypot(pos.x - game._spawnPos.x, pos.z - game._spawnPos.z) : 999;
  let campBed = false;
  if (game._builtEdits?.entries) {
    for (const [key, id] of game._builtEdits.entries()) {
      if (id !== BLOCK.BED || !game._spawnPos) continue;
      const [x, , z] = String(key).split(',').map(Number);
      if (Math.hypot(x - game._spawnPos.x, z - game._spawnPos.z) < 20) { campBed = true; break; }
    }
  }
  const campfireBuilt = !!(game._campFuel?.size);
  let nearestCampfire = null;
  let campfireDistance = Infinity;
  if (game._campFuel?.entries && pos) {
    for (const [key, fuel] of game._campFuel.entries()) {
      if (!(fuel > 0)) continue;
      const [x, y, z] = String(key).split(',').map(Number);
      const d = Math.hypot(x + .5 - pos.x, z + .5 - pos.z);
      if (d < campfireDistance) { campfireDistance = d; nearestCampfire = { x: x + .5, y, z: z + .5 }; }
    }
  }
  const hasCampfireItem = !!game.player?.slots?.some?.((slot) => slot?.id === BLOCK.CAMPFIRE && slot.count > 0);
  const roofed = !!game._roofed;
  const shelter = clamp01((edits / 16) * .25 + (campBed ? .2 : 0) + (campfireBuilt ? .2 : 0) + (roofed ? .35 : 0));
  const activity = Math.min(1, (livingAnimals.length / 70) + ((game._fishSchoolMeshes?.length || 0) / 20));
  const phase = game.time?.dayPhase || 0;
  const night = phase > 0.54 || phase < 0.12;
  const expedition = firstExpeditionSummary(game._firstExpedition);
  const craftLabel = hasCampfireItem ? 'Place the campfire at the tide edge' : campfireBuilt ? 'Feed the campfire before sunset' : (game._builtEdits?.size || 0) < 3 ? 'Raise the first shelter' : game._boat ? 'Prepare the next voyage' : 'Shape a skiff from the shoreline';
  const rhythm = night ? 'Night field · wildlife quiets' : phase < .2 ? 'Dawn field · gather while it is cool' : phase > .42 ? 'Late light · secure the camp edge' : 'Day field · coast is readable';
  const location = game._spawnLandmark || (game._destinationState?.phase === 'arrived' ? (destination?.name || 'Cane Garden Bay · Tortola') : 'Cane Garden Bay · Tortola');
  const bearing = bearingTo(pos, destination || game._spawnPos);
  return {
    pos, destination, distance, tide, weather, nearWater, boat, survival, risk, edits, campDistance,
    shelter, campBed, campfireBuilt, nearestCampfire, campfireDistance, roofed, activity, night, location, bearing,
    fishPhase, fishLabel, nearestAnimal,
    animalCount: livingAnimals.length,
    p2Distance, crewTogether, crewStatus,
    craftLabel, rhythm, expedition,
    boatSpeed: boat ? Math.hypot(boat.vx || 0, boat.vz || 0) : 0,
    boatReadiness, boatCargo, wakeActive,
    warmth: clamp01((game._lastHeat || 0) / 18),
    sea: weather === 'rain' || weather === 'storm' ? 'Rising swell' : tide > .72 ? 'Flood tide' : tide < .28 ? 'Ebb tide' : 'Calm water',
    depth: boat?.mounted ? (distance > 55 ? 'Open water' : 'Channel edge') : nearWater ? 'Shoreline shallows' : 'Dry land',
  };
}

export function createGoldenCoveVision({ scene, hudRoot } = {}) {
  if (!scene || !hudRoot) return { tick() {}, setActive() {}, dispose() {} };
  const style = document.createElement('style');
  style.id = 'golden-cove-vision-style';
  style.textContent = CSS;
  document.head.appendChild(style);
  const root = document.createElement('div');
  root.id = 'golden-cove-vision';
  root.innerHTML = `
    <section class="gcv-ribbon" aria-live="polite">
      <button class="gcv-toggle" type="button">Field dossier · V</button>
      <div class="gcv-kicker">Field notes · Golden Cove</div>
      <div class="gcv-location" data-gcv="location">Cane Garden Bay · Tortola</div>
      <div class="gcv-context"><span data-gcv="weather">Clear arrival</span><i class="gcv-sep"></i><span data-gcv="sea">Calm water</span><i class="gcv-sep"></i><span data-gcv="depth">Shoreline shallows</span></div>
      <div class="gcv-priority"><span>Next move</span><b data-gcv="priority">Raise the first shelter</b></div>
      <div class="gcv-expedition"><strong data-gcv="expedition">Landfall</strong><span data-gcv="expeditionIndex">01 / 08</span><i aria-hidden="true"></i></div>
    </section>
    <section class="gcv-voyage" data-voyage aria-live="polite">
      <div class="gcv-voyage-head"><span>Open-water passage</span><span class="gcv-voyage-state" data-gcv="voyageState">SKIFF READY</span></div>
      <div class="gcv-voyage-detail"><span><b data-gcv="voyageSpeed">0.0 m/s</b> · <span data-gcv="voyageSea">Calm water</span></span><span data-gcv="voyageWake">wake quiet</span></div>
      <div class="gcv-voyage-meter"><i data-gcv-meter="voyage"></i></div>
      <div class="gcv-voyage-note" data-gcv="voyageNoteLive">Board when the channel opens · E storage · F disembark</div>
    </section>
    <section class="gcv-arrival" data-arrival>
      <div class="gcv-arrival-kicker">A new page in the log</div>
      <div class="gcv-arrival-title">Make landfall</div>
      <div class="gcv-arrival-copy">Read the cove, secure fresh water, and keep the open channel in view. Your first voyage starts at the edge of the tide.</div>
      <div class="gcv-arrival-route">Beach camp → reef channel</div>
    </section>
    <section class="gcv-dossier" data-dossier>
      <div class="gcv-dossier-head"><div><div class="gcv-dossier-title">Golden Cove field dossier</div><div class="gcv-dossier-sub">A living route plan for the next memorable return</div></div><button class="gcv-close" type="button" aria-label="Close field dossier">×</button></div>
      <div class="gcv-grid">
        <article class="gcv-card wide"><div class="gcv-card-label">01 · Sea state</div><div class="gcv-card-value" data-gcv="seaDetail">Calm water · Shoreline shallows</div><div class="gcv-card-note">Tide cycles are a guide, not a wall. The channel is safest when you can still read the sand beneath the hull.</div><div class="gcv-meter"><i data-gcv-meter="tide"></i></div></article>
        <article class="gcv-card"><div class="gcv-card-label">02 · Expedition bearing</div><div class="gcv-card-value" data-gcv="bearing">N · 0m</div><div class="gcv-card-note" data-gcv="route">Keep the cove behind you.</div></article>
        <article class="gcv-card"><div class="gcv-card-label">03 · Weather window</div><div class="gcv-card-value" data-gcv="forecast">Clear horizon</div><div class="gcv-card-note" data-gcv="forecastNote">A good hour to gather, build, and scout.</div></article>
        <article class="gcv-card"><div class="gcv-card-label">04 · Camp memory</div><div class="gcv-card-value" data-gcv="camp">Unclaimed shoreline</div><div class="gcv-card-note">Shelter quality · <span data-gcv="campNote">Find a safe place to begin.</span></div><div class="gcv-meter"><i data-gcv-meter="camp"></i></div></article>
        <article class="gcv-card"><div class="gcv-card-label">05 · Voyage readiness</div><div class="gcv-card-value" data-gcv="voyage">On foot</div><div class="gcv-card-note" data-gcv="voyageNote">A skiff turns the horizon into a route.</div><div class="gcv-meter"><i data-gcv-meter="boat"></i></div></article>
        <article class="gcv-card"><div class="gcv-card-label">06 · Campfire warmth</div><div class="gcv-card-value" data-gcv="warmth">No warmth nearby</div><div class="gcv-card-note" data-gcv="warmthNote">A living fire changes the margin after sunset.</div><div class="gcv-meter"><i data-gcv-meter="warmth"></i></div></article>
        <article class="gcv-card"><div class="gcv-card-label">07 · Fishing window</div><div class="gcv-card-value" data-gcv="fishing">Waiting for a bite</div><div class="gcv-card-note" data-gcv="fishingNote">Cast where the water changes color.</div></article>
        <article class="gcv-card"><div class="gcv-card-label">08 · Field risk</div><div class="gcv-card-value" data-gcv="risk">Low pressure</div><div class="gcv-card-note" data-gcv="riskNote">Keep water close and shelter before dark.</div><div class="gcv-meter"><i data-gcv-meter="risk"></i></div></article>
        <article class="gcv-card"><div class="gcv-card-label">09 · Living coast</div><div class="gcv-card-value" data-gcv="ecology">Quiet shoreline</div><div class="gcv-card-note" data-gcv="ecologyNote">Wildlife leaves clues before it leaves the clearing.</div><div class="gcv-meter"><i data-gcv-meter="ecology"></i></div></article>
        <article class="gcv-card"><div class="gcv-card-label">10 · Field signs</div><div class="gcv-card-value" data-gcv="tracks">No fresh spoor</div><div class="gcv-card-note" data-gcv="tracksNote">Move softly and watch the edge of the forest.</div></article>
        <article class="gcv-card"><div class="gcv-card-label">11 · Next craft</div><div class="gcv-card-value" data-gcv="craft">Raise the first shelter</div><div class="gcv-card-note">Progression is a route, not a menu.</div></article>
        <article class="gcv-card"><div class="gcv-card-label">12 · Field rhythm</div><div class="gcv-card-value" data-gcv="rhythm">Day field · coast is readable</div><div class="gcv-card-note">Light, wildlife, and weather shape the safest hour.</div></article>
        <article class="gcv-card wide"><div class="gcv-card-label">13 · Crew plan</div><div class="gcv-card-value" data-gcv="crew">Solo fieldcraft</div><div class="gcv-card-note" data-gcv="crewNote">Navigator: read the coast. Scout: read the living water.</div></article>
        <article class="gcv-card wide"><div class="gcv-card-label">14 · Persistent expedition timeline</div><div data-gcv="memories"></div></article>
      </div>
    </section>`;
  hudRoot.appendChild(root);
  // Keep the field layer fully out of the launch composition until Start.
  root.style.display = 'none';

  const foam = new THREE.Group();
  foam.name = 'goldenCoveTideFoam';
  const foamMaterial = new THREE.MeshBasicMaterial({ color: 0xb9eff0, transparent: true, opacity: 0.25, depthWrite: false });
  for (let i = 0; i < 3; i++) {
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.62 + i * 0.34, 0.67 + i * 0.34, 24), foamMaterial.clone());
    ring.rotation.x = -Math.PI * 0.5;
    ring.userData.phase = i * 1.7;
    foam.add(ring);
  }
  foam.visible = false;
  scene.add(foam);
  const warmthHalo = new THREE.Group();
  warmthHalo.name = 'goldenCoveWarmthHalo';
  for (let i = 0; i < 2; i++) {
    const halo = new THREE.Mesh(
      new THREE.RingGeometry(0.78 + i * 0.52, 0.84 + i * 0.52, 32),
      new THREE.MeshBasicMaterial({ color: 0xffb35d, transparent: true, opacity: 0.12 - i * 0.035, depthWrite: false }),
    );
    halo.rotation.x = -Math.PI * 0.5;
    halo.userData.phase = i * 1.4;
    warmthHalo.add(halo);
  }
  warmthHalo.visible = false;
  scene.add(warmthHalo);
  const fireGlow = new THREE.Group();
  fireGlow.name = 'goldenCoveCampfireGlow';
  const fireEmber = new THREE.Mesh(
    new THREE.ConeGeometry(0.15, 0.34, 8),
    new THREE.MeshBasicMaterial({ color: 0xff6a2a, transparent: true, opacity: 0.82, depthWrite: false }),
  );
  fireEmber.position.y = 0.9;
  fireGlow.add(fireEmber);
  const fireLight = new THREE.PointLight(0xff8844, 0, 6, 2);
  fireGlow.add(fireLight);
  fireGlow.visible = false;
  scene.add(fireGlow);
  const bitePulse = new THREE.Group();
  bitePulse.name = 'goldenCoveFishingBitePulse';
  const biteRing = new THREE.Mesh(
    new THREE.RingGeometry(0.18, 0.25, 24),
    new THREE.MeshBasicMaterial({ color: 0x8fe1e5, transparent: true, opacity: 0.7, depthWrite: false }),
  );
  biteRing.rotation.x = -Math.PI * 0.5;
  bitePulse.add(biteRing);
  bitePulse.visible = false;
  scene.add(bitePulse);

  const memories = loadMemories();
  let active = false;
  let arrivalT = 12;
  let lastLocation = '';
  let lastWeather = '';
  let elapsed = 0;
  let sampleT = 0;
  let lastSnapshot = null;
  const toggle = root.querySelector('.gcv-toggle');
  const dossier = root.querySelector('[data-dossier]');
  const setDossier = (on) => dossier?.classList.toggle('on', !!on);
  toggle?.addEventListener('click', () => setDossier(!dossier.classList.contains('on')));
  root.querySelector('.gcv-close')?.addEventListener('click', () => setDossier(false));
  const onKey = (event) => { if (event.key.toLowerCase() === 'v' && active && !event.repeat) setDossier(!dossier.classList.contains('on')); };
  window.addEventListener('keydown', onKey);

  function addMemory(label, detail) {
    const key = `${label}|${detail}`;
    if (memories.some((m) => m.key === key)) return;
    memories.push({ key, label, detail, time: Date.now() });
    saveMemories(memories);
  }
  function renderMemories() {
    const el = root.querySelector('[data-gcv="memories"]');
    if (!el) return;
    const rows = memories.slice(-4).reverse();
    el.innerHTML = rows.length ? rows.map((m) => `<div class="gcv-memory"><span class="gcv-memory-dot"></span><span>${m.label} · ${m.detail}</span><span class="gcv-memory-time">logged</span></div>`).join('') : '<div class="gcv-card-note">No memories secured yet. The first one is waiting beyond the beach.</div>';
  }
  renderMemories();

  function tick({ game, dt = 0 } = {}) {
    if (!game?.started || !active) return;
    elapsed += Math.max(0, dt);
    sampleT -= Math.max(0, dt);
    if (sampleT <= 0 || !lastSnapshot) {
      sampleT = 0.2;
      lastSnapshot = snapshot(game);
    }
    const s = lastSnapshot;
    const weatherLabel = s.weather === 'clear' ? (s.night ? 'Clear night' : 'Clear horizon') : s.weather === 'rain' ? 'Rain moving in' : s.weather === 'snow' ? 'Cold front' : 'Storm pressure';
    const grade = s.weather === 'rain' || s.weather === 'storm' ? .18 : s.night ? .08 : .34 + s.tide * .08;
    root.dataset.weather = s.weather;
    root.dataset.night = s.night ? 'true' : 'false';
    root.style.setProperty('--gcv-grade', grade.toFixed(2));
    setText(root, '[data-gcv="location"]', s.location);
    setText(root, '[data-gcv="weather"]', weatherLabel);
    setText(root, '[data-gcv="sea"]', s.sea);
    setText(root, '[data-gcv="depth"]', s.depth);
    setText(root, '[data-gcv="expedition"]', s.expedition.label);
    setText(root, '[data-gcv="expeditionIndex"]', s.expedition.complete ? '08 / 08' : `${String(s.expedition.index + 1).padStart(2, '0')} / 08`);
    root.querySelector('.gcv-expedition i')?.style.setProperty('--gcv-expedition-progress', `${Math.round(s.expedition.progress * 100)}%`);
    const priority = s.risk > .7 ? 'Drink, warm up, seek shelter' : s.risk > .35 ? 'Secure camp before scouting farther' : s.expedition.prompt || (s.fishPhase === 'bite' ? 'Set the hook now' : s.boat?.mounted ? (s.wakeActive ? 'Hold course into the channel' : 'Build speed for the crossing') : s.craftLabel);
    setText(root, '[data-gcv="priority"]', priority);
    setText(root, '[data-gcv="seaDetail"]', `${s.sea} · ${s.depth}`);
    setText(root, '[data-gcv="bearing"]', `${s.bearing.label} · ${formatDistance(s.distance)}`);
    setText(root, '[data-gcv="route"]', s.destination ? `Route to ${s.destination.name || 'the next landmark'} · ${s.bearing.degrees.toFixed(0)}°` : 'Keep the cove behind you.');
    setText(root, '[data-gcv="forecast"]', weatherLabel);
    const forecastNote = s.weather === 'storm' ? 'Storm front closing in · secure fire, roof, and water.' : s.weather === 'rain' ? 'Rain is moving across the cove · shelter fuel and dry ground matter.' : s.night ? 'Low light settles over the cove · keep the fire and shoreline in view.' : 'A good hour to gather, build, and scout.';
    setText(root, '[data-gcv="forecastNote"]', forecastNote);
    const campLabel = s.campDistance < 28 ? (s.shelter > .7 ? 'Camp is taking shape' : 'Camp needs a stronger edge') : 'Camp is behind you';
    setText(root, '[data-gcv="camp"]', campLabel);
    const campFactors = [s.campfireBuilt ? 'fire secured' : 'fire needed', s.roofed ? 'roofed' : 'roof missing', s.campBed ? 'bed ready' : 'bed missing'];
    setText(root, '[data-gcv="campNote"]', `${Math.round(s.shelter * 100)}% comfort · ${campFactors.join(' · ')} · ${s.edits} edits remembered`);
    const boatReady = s.boatReadiness;
    setText(root, '[data-gcv="voyage"]', s.boat?.mounted ? 'Underway' : s.boat ? 'Skiff ready' : 'On foot');
    setText(root, '[data-gcv="voyageNote"]', s.boat?.mounted ? `${s.sea} · ${s.boatSpeed > .18 ? `${(s.boatSpeed * 10).toFixed(1)}m/s` : 'drifting'} · ${s.wakeActive ? 'wake running' : 'quiet water'} · ${s.boatCargo} cargo` : s.boat ? `Board the skiff when the channel opens · ${s.boatCargo} cargo` : 'A skiff turns the horizon into a route.');
    const voyage = root.querySelector('[data-voyage]');
    const underway = !!s.boat?.mounted;
    voyage?.classList.toggle('on', underway && !dossier.classList.contains('on'));
    setText(root, '[data-gcv="voyageState"]', underway ? (s.wakeActive ? 'UNDERWAY' : 'DRIFTING') : s.boat ? 'SKIFF READY' : 'ON FOOT');
    setText(root, '[data-gcv="voyageSpeed"]', `${(s.boatSpeed * 10).toFixed(1)} m/s`);
    setText(root, '[data-gcv="voyageSea"]', `${s.sea} · ${s.depth}`);
    setText(root, '[data-gcv="voyageWake"]', s.wakeActive ? 'wake running' : 'wake quiet');
    setText(root, '[data-gcv="voyageNoteLive"]', underway ? 'WASD steer · E storage · F disembark' : s.boat ? 'Board when the channel opens · E storage · F disembark' : 'A skiff turns the horizon into a route');
    setWidth(root, '[data-gcv-meter="voyage"]', s.boatReadiness);
    const warmthLabel = s.warmth > .7 ? 'Fire at your shoulder' : s.warmth > .15 ? 'A little warmth nearby' : 'No warmth nearby';
    setText(root, '[data-gcv="warmth"]', warmthLabel);
    setText(root, '[data-gcv="warmthNote"]', s.warmth > .15 ? 'Warmth buys time when the tide turns cold.' : 'A living fire changes the margin after sunset.');
    setText(root, '[data-gcv="fishing"]', s.fishLabel);
    setText(root, '[data-gcv="fishingNote"]', s.fishPhase === 'bite' ? 'Read the tension. Set the hook now.' : 'Cast where the water changes color.');
    const ecologyLabel = s.activity > .7 ? 'Coast in motion' : s.activity > .25 ? 'Signs of life' : 'Quiet shoreline';
    setText(root, '[data-gcv="ecology"]', ecologyLabel);
    setText(root, '[data-gcv="ecologyNote"]', `${s.animalCount || 0} land signals · ${game._fishSchoolMeshes?.length || 0} water signals`);
    const trackLabel = wildlifeSpoorLabel(s.nearestAnimal);
    setText(root, '[data-gcv="tracks"]', trackLabel);
    setText(root, '[data-gcv="tracksNote"]', s.nearestAnimal && s.nearestAnimal.distance < 26 ? `Movement at ${Math.round(s.nearestAnimal.distance)}m · follow the forest edge.` : 'Move softly and watch the edge of the forest.');
    setText(root, '[data-gcv="craft"]', s.craftLabel);
    setText(root, '[data-gcv="rhythm"]', s.rhythm);
    const riskLabel = s.risk > .7 ? 'Critical pressure' : s.risk > .35 ? 'Watch the margins' : 'Low pressure';
    setText(root, '[data-gcv="risk"]', riskLabel);
    setText(root, '[data-gcv="riskNote"]', s.risk > .35 ? 'Drink, warm up, and secure a roof before scouting farther.' : 'Keep water close and shelter before dark.');
    setText(root, '[data-gcv="crew"]', s.crewStatus);
    setText(root, '[data-gcv="crewNote"]', !game.coopMode ? 'Read the coast first. Let the horizon become a route.' : s.crewTogether ? 'Navigator and scout are together. Share the next bearing.' : s.p2Distance < Infinity ? 'Navigator reads the route. Scout reads the living water. Rendezvous before the crossing.' : 'Connect the second station to share the expedition.');
    setWidth(root, '[data-gcv-meter="tide"]', s.tide);
    setWidth(root, '[data-gcv-meter="camp"]', s.shelter);
    setWidth(root, '[data-gcv-meter="boat"]', boatReady);
    setWidth(root, '[data-gcv-meter="warmth"]', s.warmth);
    setWidth(root, '[data-gcv-meter="ecology"]', s.activity);
    setWidth(root, '[data-gcv-meter="risk"]', s.risk);

    if (s.location !== lastLocation) { if (lastLocation) addMemory('Location', s.location); lastLocation = s.location; renderMemories(); }
    if (s.weather !== lastWeather && lastWeather) { addMemory('Weather', weatherLabel); renderMemories(); }
    lastWeather = s.weather;
    if (s.boat?.mounted && !memories.some((m) => m.key.startsWith('Voyage|'))) { addMemory('Voyage', 'left the shoreline'); renderMemories(); }
    if (game._marineSighting && !memories.some((m) => m.key.startsWith('Marine life|'))) { addMemory('Marine life', 'reef movement sighted'); renderMemories(); }
    if (s.fishPhase === 'hooked' && !memories.some((m) => m.key.startsWith('Catch|'))) { addMemory('Catch', 'first bite secured'); renderMemories(); }
    if (s.nearestAnimal && s.nearestAnimal.distance < 12 && !memories.some((m) => m.key.startsWith('Wildlife|'))) { addMemory('Wildlife', `${s.nearestAnimal.type} at the forest edge`); renderMemories(); }
    if (s.crewTogether && !memories.some((m) => m.key.startsWith('Crew|'))) { addMemory('Crew', 'navigator and scout rendezvous'); renderMemories(); }

    arrivalT -= Math.max(0, dt);
    const arrival = root.querySelector('[data-arrival]');
    if (arrival) arrival.classList.toggle('hide', arrivalT <= 0 || dossier.classList.contains('on') || s.boat?.mounted);
    const waterVisible = s.nearWater && !dossier.classList.contains('on');
    foam.visible = waterVisible;
    if (waterVisible && s.pos) {
      foam.position.set(s.pos.x, Math.max(0.03, s.pos.y - 1.02), s.pos.z);
      foam.children.forEach((ring, i) => {
        ring.userData.phase += Math.max(0, dt) * (1.3 + i * .32);
        const pulse = 1 + Math.sin(ring.userData.phase) * .09;
        ring.scale.setScalar(pulse);
        ring.material.opacity = .10 + .11 * (1 - i / 3) + .04 * Math.sin(ring.userData.phase * 1.7);
      });
    }
    const warmthVisible = s.warmth > .03 && s.nearestCampfire && s.campfireDistance < 18 && !dossier.classList.contains('on');
    warmthHalo.visible = !!warmthVisible;
    if (warmthVisible) {
      warmthHalo.position.set(s.nearestCampfire.x, s.nearestCampfire.y + 0.02, s.nearestCampfire.z);
      warmthHalo.children.forEach((halo, i) => {
        halo.userData.phase += Math.max(0, dt) * (0.9 + i * .25);
        const pulse = 1 + Math.sin(halo.userData.phase) * .06;
        halo.scale.setScalar(pulse);
        halo.material.opacity = (0.08 + s.warmth * .12) * (1 - i * .18);
      });
    }
    const fireVisible = !!(warmthVisible && s.nearestCampfire);
    fireGlow.visible = fireVisible;
    if (fireVisible) {
      fireGlow.position.set(s.nearestCampfire.x, s.nearestCampfire.y, s.nearestCampfire.z);
      const flicker = 0.88 + Math.sin(elapsed * 11) * .1 + Math.sin(elapsed * 19) * .05;
      fireGlow.scale.setScalar(0.92 + flicker * .12);
      fireEmber.material.opacity = 0.65 + flicker * .22;
      fireLight.intensity = 0.65 + flicker * .4;
    }
    const biteVisible = s.fishPhase === 'bite' || s.fishPhase === 'hooked';
    bitePulse.visible = biteVisible && !dossier.classList.contains('on');
    if (bitePulse.visible && s.pos) {
      bitePulse.position.set(s.pos.x, Math.max(0.05, s.pos.y - 1.02), s.pos.z);
      bitePulse.scale.setScalar(1 + Math.sin(elapsed * 8) * .24);
      biteRing.material.opacity = s.fishPhase === 'hooked' ? .95 : .58;
    }
  }
  function setActive(value) {
    active = !!value;
    root.style.display = active ? '' : 'none';
    foam.visible = false;
    warmthHalo.visible = false;
    fireGlow.visible = false;
    bitePulse.visible = false;
    if (!active) setDossier(false);
    else arrivalT = 12;
  }
  function dispose() {
    window.removeEventListener('keydown', onKey);
    scene.remove(foam);
    scene.remove(warmthHalo);
    scene.remove(fireGlow);
    scene.remove(bitePulse);
    foam.traverse((obj) => { obj.geometry?.dispose?.(); obj.material?.dispose?.(); });
    warmthHalo.traverse((obj) => { obj.geometry?.dispose?.(); obj.material?.dispose?.(); });
    fireGlow.traverse((obj) => { obj.geometry?.dispose?.(); obj.material?.dispose?.(); });
    bitePulse.traverse((obj) => { obj.geometry?.dispose?.(); obj.material?.dispose?.(); });
    root.remove();
    style.remove();
  }
  return { tick, setActive, dispose, snapshot };
}
