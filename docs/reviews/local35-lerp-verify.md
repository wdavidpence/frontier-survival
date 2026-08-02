## Lerp Helper Verification

* **File:** `js/coop-proximity.js` contains an exported function `lerp(a, b, t)` that performs linear interpolation between two numbers with `t` clamped to `[0,1]`. The implementation uses a helper `clamp01(n)` and returns `a + (b - a) * clamp01(t)`.

* **Smoke Tests:** In `tests/smoke.mjs`, the import list includes `lerp` and a test block validates its behavior:
  ```
  test('lerp uses clamp01 for t', () => {
    assert.strictEqual(lerp(0, 10, 0), 0);
    assert.strictEqual(lerp(0, 10, 1), 10);
    assert.strictEqual(lerp(0, 10, 0.5), 5);
    assert.strictEqual(lerp(0, 10, -0.5), 0);
    assert.strictEqual(lerp(0, 10, 2), 10);
    assert.strictEqual(lerp(3, 7, NaN), 3);
    assert.strictEqual(lerp(3, 7, Infinity), 3);
  });
  ```

* **Conclusion:** The `lerp` helper is present, correctly exported, and exercised by smoke tests.
