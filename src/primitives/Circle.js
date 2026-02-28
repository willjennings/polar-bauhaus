/**
 * Bauhaus World Clock Framework
 * Circle Primitive
 *
 * A perfect circle - the most fundamental Bauhaus shape.
 * Used for clock faces, center pivots, and dot markers.
 */

import { ShapeGuardrails, ColorGuardrails } from '../core/Guardrails.js';

/**
 * Create an SVG circle element
 * @param {Object} options - Circle options
 * @param {number} options.cx - Center X coordinate
 * @param {number} options.cy - Center Y coordinate
 * @param {number} options.r - Radius
 * @param {string} [options.fill] - Fill color (hex)
 * @param {string} [options.stroke] - Stroke color (hex)
 * @param {number} [options.strokeWidth] - Stroke width
 * @param {string} [options.id] - Element ID
 * @param {string} [options.className] - CSS class
 * @returns {string} SVG circle element string
 */
export function createCircle({
  cx,
  cy,
  r,
  fill = 'none',
  stroke = 'none',
  strokeWidth = 0,
  id = '',
  className = ''
}) {
  // Validate colors
  if (fill !== 'none' && !ColorGuardrails.isValidHexColor(fill)) {
    console.warn(`Circle: Invalid fill color "${fill}", using none`);
    fill = 'none';
  }
  if (stroke !== 'none' && !ColorGuardrails.isValidHexColor(stroke)) {
    console.warn(`Circle: Invalid stroke color "${stroke}", using none`);
    stroke = 'none';
  }

  // Ensure positive radius
  r = Math.max(0, r);

  const attrs = [
    `cx="${cx}"`,
    `cy="${cy}"`,
    `r="${r}"`,
    `fill="${fill}"`,
    `stroke="${stroke}"`,
    `stroke-width="${strokeWidth}"`
  ];

  if (id) attrs.push(`id="${id}"`);
  if (className) attrs.push(`class="${className}"`);

  return `<circle ${attrs.join(' ')} />`;
}

/**
 * Create an SVG circle DOM element
 * @param {Object} options - Same as createCircle
 * @returns {SVGCircleElement} SVG circle element
 */
export function createCircleElement(options) {
  const svg = createCircle(options);
  const template = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  template.innerHTML = svg;
  return template.firstChild;
}

/**
 * Circle with clock-specific defaults
 */
export const ClockCircle = {
  /**
   * Create clock face circle
   */
  face(cx, cy, radius, { fill = '#FFFFFF', stroke = '#000000', strokeWidth = 2 } = {}) {
    return createCircle({
      cx, cy, r: radius,
      fill, stroke, strokeWidth,
      className: 'bauhaus-clock-face'
    });
  },

  /**
   * Create center pivot circle
   */
  pivot(cx, cy, radius, { fill = '#000000' } = {}) {
    return createCircle({
      cx, cy, r: radius,
      fill,
      className: 'bauhaus-clock-pivot'
    });
  },

  /**
   * Create dot marker
   */
  marker(cx, cy, radius, { fill = '#000000' } = {}) {
    return createCircle({
      cx, cy, r: radius,
      fill,
      className: 'bauhaus-clock-marker'
    });
  }
};

export default createCircle;
