# Frontier Survival Served Root Parity Audit (t_20260801)

## Files and SHA256
- `public/index.html` SHA‑256: **d1a7e968058abb490ea6ff5a5ba683338b1d44536a33a26460eb3304fd970cb2**

## HTTP Response
- GET `http://127.0.0.1:8767/` returned status **200**.

## Version Marker
- The page contains the element `<div id="version-badge">v1.12.9</div>`.

## Cache‑busting
- The main JavaScript is loaded via `<script type="module" src="./js/main.js?v=240"></script>`, which includes a query parameter `?v=240` to bust caches.

## Browser Start‑to‑HUD Reachability
- The DOM contains the element with ID `hud`. All child elements (e.g. `crosshair`, `hurt-vignette`) are present in the served HTML, indicating that from the browser start page the HUD is reachable.

## Defects
- No defects found.
