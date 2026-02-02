/**
 * Bauhaus World Clock Framework
 * WorldClock Component
 *
 * Multi-timezone clock display with grid layout.
 * The main public API for the framework.
 */

import { calculateGrid, getResponsiveColumns, enforceMinimumSize } from './Grid.js';
import { createSingleClock } from './SingleClock.js';
import { getHandAnimationCSS } from './Hand.js';
import { Config } from '../core/Config.js';
import { getTimeForZone } from '../core/ClockEngine.js';

/**
 * Create a multi-timezone world clock SVG
 * @param {Object} options
 * @param {string[]} options.zones - Array of timezone strings
 * @param {number} options.width - Container width
 * @param {number} options.height - Container height
 * @param {Object} [options.config] - Configuration object
 * @returns {string} Complete SVG string
 */
export function createWorldClock({
  zones = ['local'],
  width = 800,
  height = 400,
  config = {}
}) {
  // Normalize config
  const cfg = config instanceof Config ? config : new Config(config, { silent: true });
  const layout = cfg.getLayout();
  const theme = cfg.getTheme();
  const palette = cfg.getPalette();

  // Calculate grid
  const grid = calculateGrid({
    count: zones.length,
    width,
    height,
    columns: layout.columns,
    hierarchy: layout.hierarchy,
    gap: 20,
    padding: 20
  });

  // Enforce minimum touch target size
  const cells = enforceMinimumSize(grid.cells, 80);

  // Create each clock
  const clocks = cells.map((cell, i) => {
    const zone = zones[i];
    return createSingleClock({
      cx: cell.cx,
      cy: cell.cy,
      radius: cell.radius,
      zone,
      config: cfg
    });
  });

  // Background color
  const bgColor = theme.background === 'dark' ? palette.dark : palette.light;

  // Build SVG
  const style = `<style>
    ${getHandAnimationCSS()}
    .bauhaus-world-clock-bg { fill: ${bgColor}; }
  </style>`;

  const background = `<rect class="bauhaus-world-clock-bg" x="0" y="0" width="${width}" height="${height}" fill="${bgColor}" />`;

  return `<svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 ${width} ${height}"
    width="${width}"
    height="${height}"
    class="bauhaus-world-clock"
    role="img"
    aria-label="World Clock showing ${zones.length} timezone${zones.length > 1 ? 's' : ''}"
  >
    ${style}
    ${background}
    <g class="bauhaus-clocks">
      ${clocks.join('\n')}
    </g>
  </svg>`;
}

/**
 * WorldClock class for interactive use
 */
export class WorldClock {
  constructor(container, options = {}) {
    this.container = typeof container === 'string'
      ? document.querySelector(container)
      : container;

    if (!this.container) {
      throw new Error('WorldClock: Container not found');
    }

    this.zones = options.zones || ['local'];
    this.config = new Config(options.config || options, { silent: true });
    this.width = options.width || this.container.clientWidth || 800;
    this.height = options.height || this.container.clientHeight || 400;

    this._running = false;
    this._animationId = null;
    this._eventHandlers = {};

    this._render();
    this.start();
  }

  /**
   * Render the clock
   */
  _render() {
    this.container.innerHTML = createWorldClock({
      zones: this.zones,
      width: this.width,
      height: this.height,
      config: this.config
    });

    this._emit('render', { zones: this.zones });
  }

  /**
   * Animation loop
   */
  _tick() {
    if (!this._running) return;

    this._render();

    // Emit tick event with current times
    const times = this.zones.map(zone => ({
      zone,
      time: getTimeForZone(zone)
    }));
    this._emit('tick', { times });

    this._animationId = requestAnimationFrame(() => this._tick());
  }

  /**
   * Start animation
   */
  start() {
    if (this._running) return this;
    this._running = true;
    this._tick();
    return this;
  }

  /**
   * Stop animation
   */
  stop() {
    this._running = false;
    if (this._animationId) {
      cancelAnimationFrame(this._animationId);
      this._animationId = null;
    }
    return this;
  }

  /**
   * Set theme by name or object
   */
  setTheme(theme) {
    if (typeof theme === 'string') {
      this.config = new Config({
        ...this.config.get(),
        theme: { palette: theme }
      }, { silent: true });
    } else {
      this.config = new Config({
        ...this.config.get(),
        theme
      }, { silent: true });
    }
    this._render();
    this._emit('themeChange', { theme: this.config.getTheme() });
    return this;
  }

  /**
   * Set zones
   */
  setZones(zones) {
    this.zones = zones;
    this._render();
    this._emit('zonesChange', { zones });
    return this;
  }

  /**
   * Add a zone
   */
  addZone(zone) {
    if (!this.zones.includes(zone)) {
      this.zones.push(zone);
      this._render();
      this._emit('zoneAdd', { zone });
    }
    return this;
  }

  /**
   * Remove a zone
   */
  removeZone(zone) {
    const index = this.zones.indexOf(zone);
    if (index > -1) {
      this.zones.splice(index, 1);
      this._render();
      this._emit('zoneRemove', { zone });
    }
    return this;
  }

  /**
   * Set layout options
   */
  setLayout(layout) {
    this.config = new Config({
      ...this.config.get(),
      layout
    }, { silent: true });
    this._render();
    this._emit('layoutChange', { layout: this.config.getLayout() });
    return this;
  }

  /**
   * Resize the clock
   */
  resize(width, height) {
    this.width = width || this.container.clientWidth;
    this.height = height || this.container.clientHeight;
    this._render();
    return this;
  }

  /**
   * Event handling
   */
  on(event, handler) {
    if (!this._eventHandlers[event]) {
      this._eventHandlers[event] = [];
    }
    this._eventHandlers[event].push(handler);
    return this;
  }

  off(event, handler) {
    if (this._eventHandlers[event]) {
      const index = this._eventHandlers[event].indexOf(handler);
      if (index > -1) {
        this._eventHandlers[event].splice(index, 1);
      }
    }
    return this;
  }

  _emit(event, data) {
    if (this._eventHandlers[event]) {
      this._eventHandlers[event].forEach(handler => handler(data));
    }
  }

  /**
   * Get current configuration
   */
  getConfig() {
    return this.config.get();
  }

  /**
   * Get current times for all zones
   */
  getTimes() {
    return this.zones.map(zone => ({
      zone,
      time: getTimeForZone(zone)
    }));
  }

  /**
   * Destroy the clock
   */
  destroy() {
    this.stop();
    this.container.innerHTML = '';
    this._eventHandlers = {};
  }
}

export default WorldClock;
