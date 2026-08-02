// Polyfills for running game code in Node.js environment
import { fileURLToPath } from 'url';

// Basic browser globals polyfill
const globals = {
  window: globalThis,
  document: {
    createElement() { return {}; },
    createElementNS() { return {}; },
    getElementById() { return null; },
    getElementsByTagName() { return []; },
    querySelector() { return null; },
    body: { appendChild() {}, innerHTML: '', style: {} }
  },
  location: { href: 'http://localhost', search: '' },
  navigator: { userAgent: 'node' },
  setTimeout(fn, ms) { return setTimeout(fn, ms); },
  clearTimeout(id) { return clearTimeout(id); },
  setInterval(fn, ms) { return setInterval(fn, ms); },
  clearInterval(id) { return clearInterval(id); },
  requestAnimationFrame() { return setTimeout(() => {}, 16); },
  cancelAnimationFrame(id) { clearTimeout(id); }
};

// Mock DOM methods that might be used in game code
const mockMethods = [
  'addEventListener', 'removeEventListener', 
  'getAttribute', 'setAttribute',
  'classList', 'style', 'scrollX', 'scrollY',
  'offsetWidth', 'offsetHeight'
];

for (const method of mockMethods) {
  if (!globals.document[method]) {
    globals.document[method] = () => {};
  }
}

// Export for use in other modules
export const browserGlobals = globals;
