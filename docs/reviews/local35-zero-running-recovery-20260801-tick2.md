# Zero‑Running Recovery Audit
## Index.html Parity
The main index file is located at `public/index.html`. The root project has no separate `index.html`, confirming the expected structure.
## Relative ES Import Cache‑Bust
Script tag `<script type="module" src="./js/main.js?v=240"></script>` includes a query parameter for cache busting, satisfying the requirement.
## Version Marker
The page displays title *Frontier Survival v1.12.9* and meta content shows `v1.12.9`, matching repository version.
## HTTP 200
A `curl` request to http://127.0.0.1:8767/ returned status code 200.
## Start‑to‑HUD Reachability
The HTML contains a button with id `btn-start`; the HUD is defined in the page. No errors detected during load.
---
No blockers found.