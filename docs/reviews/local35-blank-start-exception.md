# Blank Start Exception

## Reproduction
1. Run the dev server (e.g., `npm run dev`).
2. Open http://127.0.0.1:8767/.
3. Click **Start surviving** button (#btn-start).

The page remains blank and no JavaScript errors appear in console because the main script is missing.

## Likely source
`<script type="module" src="./js/main.js?v=200"></script>` points to `public/js/main.js`, but that file does not exist. The browser fails to load a module, causing the runtime to abort without throwing an error.

## Severity
Critical – prevents any gameplay; user cannot progress beyond title screen.

## Recommendation
Add a valid `main.js` in `public/js/` or adjust script path to correct entry point. Ensure the file is served with proper MIME type and that module syntax is supported.
