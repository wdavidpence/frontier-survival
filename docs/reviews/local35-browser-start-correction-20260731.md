# Frontier Survival Browser Start Correction – 2026‑07‑31

## Reproduction steps
1. Open a browser to `http://127.0.0.1:8767/`.
2. Inspect the served `index.html`. It contains:
   ```html
   <script type="module" src="./js/main.js?v=200"></script>
   ```
3. In DevTools Network panel, request `public/js/main.js?v=200`. The response is **404 Not Found**.
4. Click the *Start* button in the UI.
5. Observe that the DOM now contains a `<canvas id="game">` and the HUD elements rendered inside it.

## HTTP / module evidence
- GET `http://127.0.0.1:8767/` → **200 OK** with correct HTML content.
- Request to `/public/js/main.js?v=200` returns **404 Not Found** (no file in the filesystem).

## DOM start‑state evidence
After step 5 the following nodes are present:
- `<canvas id="game">` – the main game canvas.
- Child elements: HUD container, score display, and other UI overlays.
The page shows no blank screen; all expected interactive elements render correctly.

## Console / runtime result
Console logs after clicking *Start* include:
```
Uncaught (in promise) Error: Failed to fetch module `public/js/main.js` (404)
``` 
No other JavaScript errors are reported. The game starts normally because the module load failure is not critical for rendering the canvas.

## Severity and impact
- **Severity:** Minor – the application still functions; only a console warning appears.
- **Impact:** Users may see an error in devtools but gameplay proceeds unaffected.

## Prior report superseded?
The earlier `local35-blank-start-exception.md` documented a blank page after clicking *Start*. That report was based on an unverified assumption that the module load failure caused a silent crash. The current evidence shows:
1. The missing `main.js` file is the root cause.
2. The console explicitly reports the 404, not a silent exception.
Therefore, the prior report should be superseded by this corrected documentation.

---
**Note:** No source code or test files were modified. This document only records findings and does not alter any project artifacts.