import assert from 'node:assert/strict';
import test from 'node:test';
import {
  SPECIES,
  WOLF_THREAT,
  inferWolfThreatPhase,
  resolveWolfThreat,
  wolfSenseRange,
  wolfThreatAttention,
  wolfThreatMoveState,
} from '../js/animals.js';

test('wolf remains the low-threat early hostile without a wild_dog species', () => {
  assert.equal(SPECIES.wolf.hostile, true);
  assert.equal(SPECIES.wolf.feedItem, 'raw_meat');
  assert.equal(SPECIES.wolf.senseRange, WOLF_THREAT.daySense);
  assert.equal(SPECIES.wolf.nightSense, WOLF_THREAT.nightSense);
  assert.equal(SPECIES.wolf.attackCd, WOLF_THREAT.attackCd);
  assert.equal(SPECIES.wolf.damage, 10);
  assert.ok(!Object.prototype.hasOwnProperty.call(SPECIES, 'wild_dog'));
});

test('wolf sense and telegraph helpers are deterministic', () => {
  assert.equal(wolfSenseRange(false, 1), 8);
  assert.equal(wolfSenseRange(true, 1), 12);
  assert.equal(wolfSenseRange(true, 0.5), 6);
  assert.equal(wolfThreatAttention('alert'), 'alert');
  assert.equal(wolfThreatAttention('idle'), 'idle');
  assert.equal(wolfThreatMoveState('attack'), 'attack');
  assert.equal(wolfThreatMoveState('idle'), 'wander');
  const a = resolveWolfThreat({ phase: 'idle', dist: 6, hostilePolicy: 'hunt', dt: 0.05 });
  const b = resolveWolfThreat({ phase: 'idle', dist: 6, hostilePolicy: 'hunt', dt: 0.05 });
  assert.deepEqual(a, b);
  assert.equal(a.phase, 'alert');
  assert.equal(a.dealDamage, false);
  assert.equal(a.setLeash, true);
  assert.equal(a.alertT, WOLF_THREAT.alertHold);
});

test('hunt telegraphs alert then chase then windup before damage', () => {
  let next = resolveWolfThreat({ phase: 'idle', dist: 6, hostilePolicy: 'hunt', dt: 0.05 });
  assert.equal(next.phase, 'alert');
  assert.equal(next.dealDamage, false);

  next = resolveWolfThreat({
    phase: 'alert',
    alertT: 0.05,
    dist: 6,
    hostilePolicy: 'hunt',
    dt: 0.05,
  });
  assert.equal(next.phase, 'chase');
  assert.equal(next.dealDamage, false);

  next = resolveWolfThreat({
    phase: 'chase',
    dist: 1.2,
    attackTimer: 0,
    hostilePolicy: 'hunt',
    dt: 0.05,
  });
  assert.equal(next.phase, 'attack');
  assert.equal(next.windupT, WOLF_THREAT.attackWindup);
  assert.equal(next.dealDamage, false);

  next = resolveWolfThreat({
    phase: 'attack',
    windupT: 0.05,
    dist: 1.2,
    attackTimer: 0,
    hostilePolicy: 'hunt',
    dt: 0.05,
  });
  assert.equal(next.phase, 'chase');
  assert.equal(next.dealDamage, true);
  assert.equal(next.attackTimer, WOLF_THREAT.attackCd);
});

test('provoke stays idle until hit, then skips alert', () => {
  const idle = resolveWolfThreat({
    phase: 'idle',
    dist: 3,
    hostilePolicy: 'provoke',
    dt: 0.05,
  });
  assert.equal(idle.phase, 'idle');
  assert.equal(idle.dealDamage, false);

  const hit = resolveWolfThreat({
    phase: 'idle',
    dist: 3,
    hostilePolicy: 'provoke',
    aggro: true,
    dt: 0.05,
  });
  assert.equal(hit.phase, 'chase');
  assert.equal(hit.setLeash, true);
  assert.equal(hit.dealDamage, false);
});

test('off policy and missing multipliers disable threat', () => {
  assert.equal(resolveWolfThreat({
    phase: 'chase',
    dist: 2,
    hostilePolicy: 'off',
    dt: 0.05,
  }).phase, 'idle');
  assert.equal(resolveWolfThreat({
    phase: 'chase',
    dist: 2,
    hostilePolicy: 'hunt',
    damageMult: 0,
    dt: 0.05,
  }).disengage, true);
});

test('explicit leash and lose-distance disengage', () => {
  const leashed = resolveWolfThreat({
    phase: 'chase',
    dist: 6,
    homeDist: WOLF_THREAT.leashRange + 1,
    hostilePolicy: 'hunt',
    dt: 0.05,
  });
  assert.equal(leashed.phase, 'idle');
  assert.equal(leashed.disengage, true);
  assert.equal(leashed.clearLeash, true);
  assert.ok(leashed.reengageT >= WOLF_THREAT.reengageCd);

  const lost = resolveWolfThreat({
    phase: 'chase',
    dist: wolfSenseRange(false, 1) + WOLF_THREAT.losePad + 0.2,
    homeDist: 2,
    hostilePolicy: 'hunt',
    dt: 0.05,
  });
  assert.equal(lost.phase, 'idle');
  assert.equal(lost.disengage, true);
});

test('starter ring caps unprovoked first contact', () => {
  const blocked = resolveWolfThreat({
    phase: 'idle',
    dist: 4,
    originDist: 2,
    playerOriginDist: 3,
    hostilePolicy: 'hunt',
    dt: 0.05,
  });
  assert.equal(blocked.phase, 'idle');

  const cap = resolveWolfThreat({
    phase: 'idle',
    dist: 5,
    originDist: 22,
    playerOriginDist: 4,
    starterEngaging: 1,
    hostilePolicy: 'hunt',
    dt: 0.05,
  });
  assert.equal(cap.phase, 'idle');

  const provoked = resolveWolfThreat({
    phase: 'idle',
    dist: 4,
    originDist: 2,
    playerOriginDist: 3,
    hostilePolicy: 'hunt',
    aggro: true,
    dt: 0.05,
  });
  assert.equal(provoked.phase, 'chase');
});

test('legacy chase in melee still deals damage for save/test compatibility', () => {
  const next = resolveWolfThreat({
    phase: 'chase',
    dist: 1.2,
    attackTimer: 0,
    hostilePolicy: 'hunt',
    dt: 0.05,
    legacyInstantAttack: true,
  });
  assert.equal(next.dealDamage, true);
  assert.equal(next.phase, 'chase');
});

test('inferWolfThreatPhase prefers provoked chase and saved telegraph states', () => {
  assert.equal(inferWolfThreatPhase(null), 'idle');
  assert.equal(inferWolfThreatPhase({ state: 'wander' }), 'idle');
  assert.equal(inferWolfThreatPhase({ state: 'alert' }), 'alert');
  assert.equal(inferWolfThreatPhase({
    threatPhase: 'idle',
    state: 'chase',
    aggro: true,
  }), 'chase');
});
