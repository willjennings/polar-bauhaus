/**
 * Bauhaus World Clock Framework
 * Line Primitive
 *
 * A straight line - the most essential Bauhaus element.
 * Used for clock hands and hour markers.
 * Note: Stroke caps are ALWAYS 'butt' or 'square', never 'round'.
 */

import { ShapeGuardrails, ColorGuardrails } from '../core/Guardrails.js';

/**
 * Create an SVG line element
 * @param {Object} options - Line options
 * @param {number} options.x1 - Start X
 * @param {number} options.y1 - Start Y
 * @param {number} options.x2 - End X
 * @param {number} options.y2 - End Y
 * @param {string} [options.stroke] - Stroke color (hex)
 * @param {number} [options.strokeWidth] - Stroke width
 * @param {string} [options.strokeCap] - 'butt' or 'square' (never 'round')
 * @param {string} [options.id] - Element ID
 * @param {string} [options.className] - CSS class
 * @returns {string} SVG line element string
 */
export function createLine({
  x1,
  y1,
  x2,
  y2,
  stroke = '#000000',
  strokeWidth = 1,
  strokeCap = 'butt',
  id = '',
  className = ''
}) {
  // Validate color
  if (!ColorGuardrails.isValidHexColor(stroke)) {
    console.warn(`Line: Invalid stroke color "${stroke}", using #000000`);
    stroke = '#000000';
  }

  // Enforce Bauhaus stroke cap constraint
  const { value: validCap } = ShapeGuardrails.validateStrokeCap(strokeCap);

  const attrs = [
    `x1="${x1}"`,
    `y1="${y1}"`,
    `x2="${x2}"`,
    `y2="${y2}"`,
    `stroke="${stroke}"`,
    `stroke-width="${strokeWidth}"`,
    `stroke-linecap="${validCap}"`
  ];

  if (id) attrs.push(`id="${id}"`);
  if (className) attrs.push(`class="${className}"`);

  return `<line ${attrs.join(' ')} />`;
}

/**
 * Create a line from center point with angle and length
 * @param {Object} options
 * @param {number} options.cx - Center/pivot X
 * @param {number} options.cy - Center/pivot Y
 * @param {number} options.length - Length of line
 * @param {number} options.angle - Angle in degrees (0 = pointing up/12 o'clock)
 * @param {number} [options.inset] - Inset from center (for markers)
 * @param {string} [options.stroke] - Stroke color
 * @param {number} [options.strokeWidth] - Stroke width
 * @param {string} [options.strokeCap] - 'butt' or 'square'
 * @returns {string} SVG line element string
 */
export function createRadialLine({
  cx,
  cy,
  length,
  angle = 0,
  inset = 0,
  stroke = '#000000',
  strokeWidth = 1,
  strokeCap = 'butt',
  id = '',
  className = ''
}) {
  // Convert clock angle (0 = 12 o'clock) to math angle (0 = 3 o'clock)
  const mathAngle = (angle - 90) * (Math.PI / 180);

  // Calculate start point (with inset from center)
  const x1 = cx + inset * Math.cos(mathAngle);
  const y1 = cy + inset * Math.sin(mathAngle);

  // Calculate end point
  const x2 = cx + length * Math.cos(mathAngle);
  const y2 = cy + length * Math.sin(mathAngle);

  return createLine({
    x1, y1, x2, y2,
    stroke, strokeWidth, strokeCap,
    id, className
  });
}

/**
 * Create a clock hand line (from center, rotatable)
 * Uses CSS transform for smooth animation
 * @param {Object} options
 * @param {number} options.cx - Pivot X
 * @param {number} options.cy - Pivot Y
 * @param {number} options.length - Hand length
 * @param {number} options.angle - Current angle (0 = 12 o'clock)
 * @param {string} [options.stroke] - Color
 * @param {number} [options.strokeWidth] - Width
 * @returns {string} SVG group with line
 */
export function createHandLine({
  cx,
  cy,
  length,
  angle = 0,
  stroke = '#000000',
  strokeWidth = 2,
  strokeCap = 'butt',
  id = '',
  className = ''
}) {
  // Validate color
  if (!ColorGuardrails.isValidHexColor(stroke)) {
    stroke = '#000000';
  }

  // Enforce stroke cap
  const { value: validCap } = ShapeGuardrails.validateStrokeCap(strokeCap);

  // Hand line pointing straight up (will be rotated via transform)
  const x1 = cx;
  const y1 = cy;
  const x2 = cx;
  const y2 = cy - length;

  const lineAttrs = [
    `x1="${x1}"`,
    `y1="${y1}"`,
    `x2="${x2}"`,
    `y2="${y2}"`,
    `stroke="${stroke}"`,
    `stroke-width="${strokeWidth}"`,
    `stroke-linecap="${validCap}"`
  ];

  // Wrap in group with rotation transform for animation
  const groupAttrs = [
    `transform="rotate(${angle} ${cx} ${cy})"`,
    `style="transform-origin: ${cx}px ${cy}px"`
  ];

  if (id) groupAttrs.push(`id="${id}"`);
  if (className) groupAttrs.push(`class="bauhaus-clock-hand ${className}"`);

  return `<g ${groupAttrs.join(' ')}><line ${lineAttrs.join(' ')} /></g>`;
}

/**
 * Create an SVG line DOM element
 */
export function createLineElement(options) {
  const svg = createLine(options);
  const template = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  template.innerHTML = svg;
  return template.firstChild;
}

/**
 * Line with clock-specific defaults
 */
export const ClockLine = {
  /**
   * Create line hand (hour/minute/second)
   */
  hand(cx, cy, length, angle, { stroke = '#000000', strokeWidth = 2 } = {}) {
    return createHandLine({
      cx, cy, length, angle,
      stroke, strokeWidth,
      className: 'bauhaus-clock-hand'
    });
  },

  /**
   * Create hour marker line
   */
  marker(cx, cy, innerRadius, outerRadius, angle, { stroke = '#000000', strokeWidth = 1 } = {}) {
    return createRadialLine({
      cx, cy,
      length: outerRadius,
      inset: innerRadius,
      angle,
      stroke, strokeWidth,
      className: 'bauhaus-clock-marker'
    });
  }
};

export default createLine;
