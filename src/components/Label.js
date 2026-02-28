/**
 * Bauhaus World Clock Framework
 * Label Component
 *
 * City/timezone labels with optional time display.
 */

import { createLabel as createLabelPrimitive, createText } from '../primitives/index.js';
import { getTimezoneInfo, formatTime } from '../core/ClockEngine.js';

/**
 * Create a clock label
 * @param {Object} options
 * @param {number} options.x - X position
 * @param {number} options.y - Y position
 * @param {string} options.zone - Timezone string
 * @param {string} [options.position] - 'above', 'below', 'left', 'right', 'inside'
 * @param {boolean} [options.showTime] - Show digital time
 * @param {boolean} [options.showOffset] - Show UTC offset
 * @param {string} [options.color] - Text color
 * @param {string} [options.size] - Text size ('xs', 'sm', 'md')
 * @param {Object} [options.time] - Current time object
 * @returns {string} SVG elements string
 */
export function createClockLabel({
  x,
  y,
  zone,
  position = 'below',
  showTime = false,
  showOffset = false,
  color = '#000000',
  size = 'sm',
  time = null
}) {
  const info = getTimezoneInfo(zone);
  const city = info.city;

  const elements = [];

  // City name
  elements.push(createText({
    x, y,
    text: city.toUpperCase(),
    fill: color,
    size,
    weight: 'bold',
    anchor: 'middle',
    letterSpacing: 1,
    className: 'bauhaus-label-city'
  }));

  // Optional time display
  if (showTime && time) {
    const timeStr = formatTime(time.hours, time.minutes);
    const timeY = y + (size === 'xs' ? 12 : size === 'sm' ? 16 : 20);

    elements.push(createText({
      x,
      y: timeY,
      text: timeStr,
      fill: color,
      size: 'xs',
      weight: 'regular',
      anchor: 'middle',
      className: 'bauhaus-label-time'
    }));
  }

  // Optional UTC offset
  if (showOffset) {
    const offsetY = y + (showTime ? (size === 'xs' ? 22 : size === 'sm' ? 28 : 34) : (size === 'xs' ? 12 : size === 'sm' ? 16 : 20));

    elements.push(createText({
      x,
      y: offsetY,
      text: info.offsetString || '',
      fill: color,
      size: 'xs',
      weight: 'light',
      anchor: 'middle',
      className: 'bauhaus-label-offset'
    }));
  }

  return `<g class="bauhaus-clock-label bauhaus-label-${position}">${elements.join('')}</g>`;
}

/**
 * Calculate label position based on clock geometry
 * @param {Object} options
 * @param {number} options.cx - Clock center X
 * @param {number} options.cy - Clock center Y
 * @param {number} options.radius - Clock radius
 * @param {string} options.position - Label position
 * @param {number} [options.padding] - Padding from clock edge
 * @returns {Object} { x, y } coordinates
 */
export function getLabelPosition({ cx, cy, radius, position, padding = 10 }) {
  switch (position) {
    case 'above':
      return { x: cx, y: cy - radius - padding - 10 };

    case 'below':
      return { x: cx, y: cy + radius + padding + 15 };

    case 'left':
      return { x: cx - radius - padding - 40, y: cy };

    case 'right':
      return { x: cx + radius + padding + 40, y: cy };

    case 'inside':
      return { x: cx, y: cy + radius * 0.35 };

    default:
      return { x: cx, y: cy + radius + padding + 15 };
  }
}

/**
 * Create a positioned label for a clock
 */
export function createPositionedLabel({
  cx,
  cy,
  radius,
  zone,
  position = 'below',
  showTime = false,
  showOffset = false,
  color = '#000000',
  size = 'sm',
  time = null,
  padding = 10
}) {
  const { x, y } = getLabelPosition({ cx, cy, radius, position, padding });

  return createClockLabel({
    x, y, zone,
    position,
    showTime,
    showOffset,
    color,
    size,
    time
  });
}

export default createClockLabel;
