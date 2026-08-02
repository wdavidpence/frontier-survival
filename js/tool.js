// Utility functions shared across game modules
// No dependency on other files - pure vanilla JS

var tool = {

  // Math helpers
  random: function(min, max) {
    return Math.random() * (max - min) + min;
  },

  randomInt: function(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  lerp: function(a, b, t) {
    return a + (b - a) * t;
  },

  clamp: function(val, min, max) {
    if (val < min) return min;
    if (val > max) return max;
    return val;
  },

  // Math.pow is built-in but useful as quick access
  pow: Math.pow,
  
  abs: Math.abs,
  floor: Math.floor,
  ceil: Math.ceil,
  round: Math.round,

  // String helpers
  pad: function(str, len, ch) {
    if (typeof str !== 'string') return '';
    var c = ch || ' ';
    while (str.length < len) str = ch + str;
    return str.substring(str.length - len);
  },

  truncate: function(str, maxLen, suffix) {
    suffix = suffix || '...';
    if (typeof str !== 'string') return '';
    if (str.length <= maxLen) return str;
    return str.substring(0, maxLen - suffix.length) + suffix;
  },

  repeat: function(str, n) {
    var result = '';
    for (var i = 0; i < n; i++) result += str;
    return result;
  },

  // Color helpers
  hexToRgb: function(hex) {
    if (!hex || typeof hex !== 'string') return [255, 255, 255];
    var h = hex.replace('#', '');
    var r = parseInt(h.substring(0, 2), 16);
    var g = parseInt(h.substring(2, 4), 16);
    var b = parseInt(h.substring(4, 6), 16);
    return [r, g, b];
  },

  rgbToHex: function(r, g, b) {
    r = Math.floor(tool.clamp(r, 0, 255));
    g = Math.floor(tool.clamp(g, 0, 255));
    b = Math.floor(tool.clamp(b, 0, 255));
    return '#' + tool.pad(r.toString(16), 2, '0') +
           tool.pad(g.toString(16), 2, '0') +
           tool.pad(b.toString(16), 2, '0');
  },

  // Timing
  now: function() {
    return Date.now();
  },

  delay: function(ms) {
    if (!ms || ms < 0) return Promise.resolve();
    return new Promise(function(resolve) { setTimeout(resolve, ms); });
  },

  sleep: function(ms) {
    var start = tool.now();
    while (tool.now() - start < ms) {}
  },

  // Array helpers
  unique: function(arr) {
    if (!Array.isArray(arr)) return [];
    return [...new Set(arr)];
  },

  shuffle: function(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  },

  flatten: function(arr) {
    if (!Array.isArray(arr)) return [arr];
    var result = [];
    arr.forEach(function(item) {
      if (Array.isArray(item)) result.push.apply(result, tool.flatten(item));
      else result.push(item);
    });
    return result;
  },

  // DOM helpers - these are global
  createElement: function(tag, opts) {
    var el = document.createElement(tag);
    if (opts && opts.className) el.className = opts.className;
    if (opts && opts.id) el.id = opts.id;
    if (opts && opts.style) Object.keys(opts.style).forEach(function(k) {
      el.style[k] = opts.style[k];
    });
    return el;
  },

  addClass: function(el, cls) {
    if (!el || !cls) return el;
    var c = ' ' + el.className + ' ';
    if (c.indexOf(' ' + cls + ' ') === -1) {
      el.className += ' ' + cls;
    }
    return el;
  },

  removeClass: function(el, cls) {
    if (!el || !cls) return el;
    var c = el.className.split(/\s+/);
    var idx = -1;
    for (var i = 0; i < c.length; i++) {
      if (c[i] === cls) { idx = i; break; }
    }
    if (idx !== -1) {
      el.className = c.join(' ').replace(/\s+/g, ' ');
    }
    return el;
  },

  removeElement: function(el) {
    if (!el || !el.parentNode) return;
    el.parentNode.removeChild(el);
  },

  // Logging - can be overridden for testing
  log: console.log,
  warn: console.warn,
  error: console.error,
  
  // Debug helpers
  profileStart: function(name) {
    if (typeof performance !== 'undefined') {
      this.profile = this.profile || {};
      this.profile[name] = performance.now();
    } else {
      var start = new Date().getTime();
      this.profile = this.profile || {};
      this.profile[name] = start;
    }
  },

  profileEnd: function(name) {
    if (name === 'all') return this.profileStats();
    var end = typeof performance !== 'undefined' ? performance.now() : new Date().getTime();
    var delta = end - this.profile[name];
    this.log('Profile ' + name + ': ' + delta.toFixed(1) + 'ms');
  },

  profileStats: function() {
    if (!this.profile || Object.keys(this.profile).length === 0) return '';
    var stats = {};
    for (var k in this.profile) {
      if (typeof this.profile[k] === 'number') {
        stats[k] = typeof performance !== 'undefined' ? 
          ((performance.now() - this.profile[k]).toFixed(1)) :
          ((new Date().getTime() - this.profile[k]).toFixed(1));
      } else {
        stats[k] = (this.profile[k] / 1000).toFixed(2) + 's';
      }
    }
    return JSON.stringify(stats);
  },

  // Version tracking for game state
  setGameState: function(state, opts) {
    if (!state) state = {};
    var now = Date.now();
    this.lastStateChange = now;
    this.gameState = Object.assign({}, state);
    this.statesDuration = (this.statesDuration || {}) + '||' + now;
  },

  getGameState: function(key, def) {
    if (!key && !def) return this.gameState || {};
    if (typeof key === 'object') return this.gameState ? Object.assign({}, this.gameState) : {};
    var val = this.gameState ? this.gameState[key] : undefined;
    return typeof val !== 'undefined' ? val : def;
  }

};

if (!window) {
  // Not in browser - just export tool as module (for Node environments or future use)
  module.exports = tool;
} else {
  window.tool = tool;
}
