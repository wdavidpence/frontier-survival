import assert from 'node:assert/strict';
import {
  wrapPhase,
  sunArcRadians,
  sunDirection,
  moonDirection,
  skyGlowFromNdc,
  shadowFollow,
} from '../js/atmosphere-sky.js';

function test(name, fn) {
  fn();
  console.log('PASS', name);
}

test('sun noon sits in front of the arrival yaw', () => {
  const yaw = 0.92;
  const noon = sunDirection(0.30, yaw);
  const fx = -Math.sin(yaw);
  const fz = -Math.cos(yaw);
  const alongLook = noon.x * fx + noon.z * fz;
  assert.ok(noon.y > 0.7, 'noon should be high');
  assert.ok(alongLook > 0.15, 'noon should sit in the opening vista');
  const rise = sunDirection(0.05, yaw);
  assert.ok(rise.y < noon.y);
});

test('moon is opposite the sun', () => {
  const sun = sunDirection(0.25, 0);
  const moon = moonDirection(0.25, 0);
  const dot = sun.x * moon.x + sun.y * moon.y + sun.z * moon.z;
  assert.ok(dot < 0.15);
});

test('css glow hides when the sun is behind the camera', () => {
  const front = skyGlowFromNdc(0.2, 0.4, 0.8);
  assert.equal(front.visible, true);
  assert.ok(front.x > 50 && front.y < 50);
  const back = skyGlowFromNdc(0, 0, -1);
  assert.equal(back.visible, false);
});

test('shadow follow keeps the key light aimed at the player', () => {
  const follow = shadowFollow({ x: -9.5, y: 17, z: -27.5 }, { x: 0.2, y: 0.9, z: 0.3 }, 68);
  assert.ok(follow.lightY > follow.targetY);
  assert.equal(follow.targetX, -9.5);
  assert.equal(follow.targetZ, -27.5);
  assert.equal(wrapPhase(1.25), 0.25);
  assert.ok(sunArcRadians(0.30) > 1);
});
