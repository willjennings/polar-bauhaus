/**
 * Bauhaus World Clock Framework
 * Hand Component
 *
 * Clock hands (hour, minute, second) with smooth CSS animation.
 */

import { createHandLine, createHandTriangle } from '../primitives/index.js';
import { getHandAngles } from '../core/ClockEngine.js';

/**
 * Create a clock hand
 * @param {Object} options
 * @param {string} options.type - 'hour', 'minute', or 'second'
 * @param {number} options.cx - Pivot center X
 * @param {number} options.cy - Pivot center Y
 * @param {number} options.length - Hand length
 * @param {number} options.angle - Current angle in degrees (0 = 12 o'clock)
 * @param {string} [options.style] - 'line', 'triangle', or 'rectangle'
 * @param {string} [options.color] - Hand color
 * @param {number} [options.width] - Hand width/thickness
 * @param {boolean} [options.animated] - Whether to use CSS transition
 * @returns {string} SVG element string
 */
export function createHand({
  type,
  cx,
  cy,
  length,
  angle,
  style = 'line',
  color = '#000000',
  width = 2,
  animated = true
}) {
  const id = `hand-${type}`;
  const className = `bauhaus-hand bauhaus-hand-${type}`;

  // Add animation class for smooth transitions
  const animClass = animated ? ' bauhaus-animated' : '';

  switch (style) {
    case 'triangle':
      return createHandTriangle({
        cx, cy,
        length,
        width: width * 3, // Triangle base is wider
        angle,
        fill: color,
        id,
        className: className + animClass
      });

    case 'rectangle':
      // Rectangle hand is a thick line with square cap
      return createHandLine({
        cx, cy, length, angle,
        stroke: color,
        strokeWidth: width,
        strokeCap: 'square',
        id,
        className: className + animClass
      });

    case 'line':
    default:
      return createHandLine({
        cx, cy, length, angle,
        stroke: color,
        strokeWidth: width,
        strokeCap: 'butt',
        id,
        className: className + animClass
      });
  }
}

/**
 * Create all three clock hands
 * @param {Object} options
 * @param {number} options.cx - Center X
 * @param {number} options.cy - Center Y
 * @param {number} options.radius - Clock radius
 * @param {Object} options.time - Time object with hours, minutes, seconds, milliseconds
 * @param {Object} [options.config] - Hand configuration
 * @param {Object} [options.colors] - Hand colors
 * @param {boolean} [options.smooth] - Smooth second hand animation
 * @returns {string} SVG elements string
 */
export function createAllHands({
  cx,
  cy,
  radius,
  time,
  config = {},
  colors = {},
  smooth = true
}) {
  const angles = getHandAngles(time, smooth);

  // Default proportions
  const proportions = {
    hour: config.hourLength || 0.5,
    minute: config.minuteLength || 0.75,
    second: config.secondLength || 0.85
  };

  // Default styles
  const styles = {
    hour: config.hourStyle || 'triangle',
    minute: config.minuteStyle || 'line',
    second: config.secondStyle || 'line'
  };

  // Default widths
  const widths = {
    hour: config.hourWidth || 6,
    minute: config.minuteWidth || 4,
    second: config.secondWidth || 2
  };

  // Default colors
  const handColors = {
    hour: colors.hour || '#000000',
    minute: colors.minute || '#000000',
    second: colors.second || '#DE0100'
  };

  const hands = [];

  // Hour hand (draw first, behind others)
  hands.push(createHand({
    type: 'hour',
    cx, cy,
    length: radius * proportions.hour,
    angle: angles.hour,
    style: styles.hour,
    color: handColors.hour,
    width: widths.hour
  }));

  // Minute hand
  hands.push(createHand({
    type: 'minute',
    cx, cy,
    length: radius * proportions.minute,
    angle: angles.minute,
    style: styles.minute,
    color: handColors.minute,
    width: widths.minute
  }));

  // Second hand (draw last, on top)
  if (config.showSecond !== false) {
    hands.push(createHand({
      type: 'second',
      cx, cy,
      length: radius * proportions.second,
      angle: angles.second,
      style: styles.second,
      color: handColors.second,
      width: widths.second
    }));
  }

  return hands.join('');
}

/**
 * Generate CSS for hand animations
 * Note: We do NOT set transform-origin as it conflicts with SVG transform="rotate(angle cx cy)"
 * SVG transforms are applied via the transform attribute, and we use CSS transitions to animate them.
 */
export function getHandAnimationCSS() {
  return `
/* Smooth transitions for clock hands */
.bauhaus-clock-hand {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Faster transition for second hand - more responsive feel */
.bauhaus-hand-second {
  transition: transform 0.15s linear;
}

/* Disable transitions when hands need to jump (e.g., 359->0 wrap) */
.bauhaus-clock-hand.no-transition {
  transition: none !important;
}

/* Sweeping second hand option - continuous motion */
.bauhaus-sweep .bauhaus-hand-second {
  transition: transform 1s linear;
}

/* Respect reduced motion preference */
@media (prefers-reduced-motion: reduce) {
  .bauhaus-clock-hand {
    transition: none;
  }
}
`;
}

/**
 * Calculate the shortest rotation path between two angles
 * Handles the 359->0 wrap-around case
 * @param {number} from - Current angle
 * @param {number} to - Target angle
 * @returns {Object} { angle: number, needsJump: boolean }
 */
export function getSmartRotation(from, to) {
  // Normalize angles to 0-360
  from = ((from % 360) + 360) % 360;
  to = ((to % 360) + 360) % 360;

  // Calculate the difference
  let diff = to - from;

  // If the difference is greater than 180, we're crossing the 0/360 boundary
  // This happens at the top of the clock (11:59 -> 12:00)
  if (Math.abs(diff) > 180) {
    // We need to jump without animation
    return { angle: to, needsJump: true };
  }

  return { angle: to, needsJump: false };
}

export default createHand;
