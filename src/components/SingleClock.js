/**
 * Bauhaus World Clock Framework
 * SingleClock Component
 *
 * A complete analog clock with face, hands, and label.
 * Supports multiple face types via the faces module.
 */

import { ClockCircle } from '../primitives/index.js';
import { createClockFace } from './ClockFace.js';
import { createAllHands, getHandAnimationCSS } from './Hand.js';
import { createPositionedLabel } from './Label.js';
import { getTimeForZone } from '../core/ClockEngine.js';
import { Config } from '../core/Config.js';
import { getFace, hasFace, getAllFaceCSS } from '../faces/index.js';

/**
 * Create a single complete clock
 * @param {Object} options
 * @param {number} options.cx - Center X
 * @param {number} options.cy - Center Y
 * @param {number} options.radius - Clock radius
 * @param {string} [options.zone] - Timezone (default: 'local')
 * @param {string} [options.faceType] - Face type (default: 'classic')
 * @param {Object} [options.config] - Configuration object or Config instance
 * @returns {string} SVG group element string
 */
export function createSingleClock({
  cx,
  cy,
  radius,
  zone = 'local',
  faceType = 'classic',
  config = {}
}) {
  // Normalize config
  const cfg = config instanceof Config ? config : new Config(config, { silent: true });
  const theme = cfg.getTheme();
  const clock = cfg.getClock();
  const layout = cfg.getLayout();
  const palette = cfg.getPalette();

  // Get current time for this zone
  const time = getTimeForZone(zone);

  // Check if using a custom face type
  if (faceType !== 'classic' && hasFace(faceType)) {
    const face = getFace(faceType);
    return face.render({
      cx,
      cy,
      radius,
      time,
      palette: theme.palette,
      zone,
      options: { theme, clock, layout }
    });
  }

  // Classic face rendering (original behavior)
  const elements = [];

  // Clock face
  elements.push(createClockFace({
    cx, cy, radius,
    shape: clock.face,
    fill: theme.background === 'dark' ? palette.dark : palette.light,
    stroke: theme.background === 'dark' ? palette.light : palette.dark,
    strokeWidth: radius * 0.02,
    markers: {
      style: clock.markers?.style || 'line',
      count: clock.markers?.count || 12,
      color: theme.background === 'dark' ? palette.light : palette.dark
    },
    numerals: {
      style: clock.numerals || 'none',
      color: theme.background === 'dark' ? palette.light : palette.dark
    }
  }));

  // Hands
  const handConfig = {
    hourStyle: clock.hands?.hour || 'triangle',
    minuteStyle: clock.hands?.minute || 'line',
    secondStyle: clock.hands?.second || 'line',
    showSecond: clock.hands?.showSecond !== false,
    hourLength: clock.proportions?.hourHand || 0.5,
    minuteLength: clock.proportions?.minuteHand || 0.75,
    secondLength: clock.proportions?.secondHand || 0.85,
    hourWidth: radius * 0.06,
    minuteWidth: radius * 0.04,
    secondWidth: radius * 0.02
  };

  const handColors = {
    hour: palette.dark,
    minute: palette.dark,
    second: palette.primary
  };

  elements.push(createAllHands({
    cx, cy, radius,
    time,
    config: handConfig,
    colors: handColors,
    smooth: true
  }));

  // Center pivot
  elements.push(ClockCircle.pivot(cx, cy, radius * 0.04, {
    fill: palette.dark
  }));

  // Label (if enabled)
  if (layout.labels?.show !== false) {
    elements.push(createPositionedLabel({
      cx, cy, radius,
      zone,
      position: layout.labels?.position || 'below',
      showTime: layout.labels?.showTime || false,
      showOffset: layout.labels?.showOffset || false,
      color: theme.background === 'dark' ? palette.light : palette.dark,
      size: 'sm',
      time
    }));
  }

  const groupId = `clock-${zone.replace(/\//g, '-')}`;
  return `<g id="${groupId}" class="bauhaus-single-clock" data-zone="${zone}">${elements.join('')}</g>`;
}

/**
 * Create a standalone SVG clock
 * @param {Object} options - Same as createSingleClock
 * @param {number} [options.width] - SVG width
 * @param {number} [options.height] - SVG height
 * @returns {string} Complete SVG element string
 */
export function createStandaloneClock({
  width = 200,
  height = 240,
  zone = 'local',
  config = {}
}) {
  const padding = 20;
  const labelSpace = 40;
  const clockSize = Math.min(width, height - labelSpace) - padding * 2;
  const radius = clockSize / 2;
  const cx = width / 2;
  const cy = padding + radius;

  const clock = createSingleClock({
    cx, cy, radius,
    zone,
    faceType: config.clock?.faceType || 'classic',
    config
  });

  const style = `<style>${getHandAnimationCSS()}${getAllFaceCSS()}</style>`;

  return `<svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 ${width} ${height}"
    width="${width}"
    height="${height}"
    class="bauhaus-clock-svg"
  >
    ${style}
    ${clock}
  </svg>`;
}

/**
 * Render clock to a DOM container
 * @param {HTMLElement|string} container - Container element or selector
 * @param {Object} options - Clock options
 * @returns {Object} Clock controller
 */
export function renderClock(container, options = {}) {
  const el = typeof container === 'string'
    ? document.querySelector(container)
    : container;

  if (!el) {
    throw new Error('Container not found');
  }

  const { zone = 'local', config = {}, width, height } = options;

  // Initial render
  const render = () => {
    el.innerHTML = createStandaloneClock({
      width: width || el.clientWidth || 200,
      height: height || el.clientHeight || 240,
      zone,
      config
    });
  };

  render();

  // Animation loop
  let animationId = null;
  let running = true;

  const tick = () => {
    if (!running) return;
    render();
    animationId = requestAnimationFrame(tick);
  };

  // Start animation
  tick();

  // Return controller
  return {
    stop() {
      running = false;
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    },
    start() {
      if (!running) {
        running = true;
        tick();
      }
    },
    update(newOptions) {
      Object.assign(options, newOptions);
      render();
    },
    destroy() {
      this.stop();
      el.innerHTML = '';
    }
  };
}

export default createSingleClock;
