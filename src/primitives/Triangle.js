/**
 * Bauhaus World Clock Framework
 * Triangle Primitive
 *
 * An equilateral or isoceles triangle - the dynamic Bauhaus shape.
 * Used for clock hands and directional markers.
 */

import { ShapeGuardrails, ColorGuardrails } from '../core/Guardrails.js';

/**
 * Create an SVG polygon element for a triangle
 * @param {Object} options - Triangle options
 * @param {number} options.cx - Center X coordinate
 * @param {number} options.cy - Center Y coordinate
 * @param {number} options.width - Base width
 * @param {number} options.height - Height (tip to base)
 * @param {string} [options.fill] - Fill color (hex)
 * @param {string} [options.stroke] - Stroke color (hex)
 * @param {number} [options.strokeWidth] - Stroke width
 * @param {number} [options.rotation] - Rotation in degrees (snapped to valid angles)
 * @param {string} [options.direction] - 'up', 'down', 'left', 'right' (before rotation)
 * @param {string} [options.id] - Element ID
 * @param {string} [options.className] - CSS class
 * @returns {string} SVG polygon element string
 */
export function createTriangle({
  cx,
  cy,
  width,
  height,
  fill = 'none',
  stroke = 'none',
  strokeWidth = 0,
  rotation = 0,
  direction = 'up',
  id = '',
  className = ''
}) {
  // Validate colors
  if (fill !== 'none' && !ColorGuardrails.isValidHexColor(fill)) {
    console.warn(`Triangle: Invalid fill color "${fill}", using none`);
    fill = 'none';
  }
  if (stroke !== 'none' && !ColorGuardrails.isValidHexColor(stroke)) {
    console.warn(`Triangle: Invalid stroke color "${stroke}", using none`);
    stroke = 'none';
  }

  // Snap rotation to valid Bauhaus angle
  const snappedRotation = ShapeGuardrails.snapAngle(rotation);

  // Calculate triangle points based on direction
  // Default is pointing up (tip at top)
  const halfWidth = width / 2;
  let points;

  switch (direction) {
    case 'up':
      points = [
        [cx, cy - height / 2],           // tip (top)
        [cx - halfWidth, cy + height / 2], // bottom left
        [cx + halfWidth, cy + height / 2]  // bottom right
      ];
      break;
    case 'down':
      points = [
        [cx, cy + height / 2],           // tip (bottom)
        [cx - halfWidth, cy - height / 2], // top left
        [cx + halfWidth, cy - height / 2]  // top right
      ];
      break;
    case 'left':
      points = [
        [cx - height / 2, cy],           // tip (left)
        [cx + height / 2, cy - halfWidth], // top right
        [cx + height / 2, cy + halfWidth]  // bottom right
      ];
      break;
    case 'right':
      points = [
        [cx + height / 2, cy],           // tip (right)
        [cx - height / 2, cy - halfWidth], // top left
        [cx - height / 2, cy + halfWidth]  // bottom left
      ];
      break;
    default:
      points = [
        [cx, cy - height / 2],
        [cx - halfWidth, cy + height / 2],
        [cx + halfWidth, cy + height / 2]
      ];
  }

  const pointsStr = points.map(p => p.join(',')).join(' ');

  const attrs = [
    `points="${pointsStr}"`,
    `fill="${fill}"`,
    `stroke="${stroke}"`,
    `stroke-width="${strokeWidth}"`,
    `stroke-linejoin="miter"` // Sharp corners, not rounded
  ];

  // Add rotation transform if needed
  if (snappedRotation !== 0) {
    attrs.push(`transform="rotate(${snappedRotation} ${cx} ${cy})"`);
  }

  if (id) attrs.push(`id="${id}"`);
  if (className) attrs.push(`class="${className}"`);

  return `<polygon ${attrs.join(' ')} />`;
}

/**
 * Create a hand-style triangle (elongated, pointing from center outward)
 * @param {Object} options
 * @param {number} options.cx - Pivot center X
 * @param {number} options.cy - Pivot center Y
 * @param {number} options.length - Length of hand
 * @param {number} options.width - Base width of hand
 * @param {number} options.angle - Angle in degrees (0 = 12 o'clock)
 * @param {string} [options.fill] - Fill color
 * @returns {string} SVG polygon element string
 */
export function createHandTriangle({
  cx,
  cy,
  length,
  width,
  angle = 0,
  fill = '#000000',
  id = '',
  className = ''
}) {
  // Validate color
  if (!ColorGuardrails.isValidHexColor(fill)) {
    console.warn(`HandTriangle: Invalid fill color "${fill}", using #000000`);
    fill = '#000000';
  }

  const halfWidth = width / 2;

  // Triangle pointing up from center (at angle 0)
  // Base at center, tip pointing outward
  const points = [
    [cx, cy - length],           // tip
    [cx - halfWidth, cy],        // base left
    [cx + halfWidth, cy]         // base right
  ];

  const pointsStr = points.map(p => p.join(',')).join(' ');

  const attrs = [
    `points="${pointsStr}"`,
    `fill="${fill}"`,
    `stroke="none"`,
    `stroke-linejoin="miter"`,
    `transform="rotate(${angle} ${cx} ${cy})"` // Apply hand angle
  ];

  if (id) attrs.push(`id="${id}"`);
  if (className) attrs.push(`class="bauhaus-clock-hand ${className}"`);

  return `<polygon ${attrs.join(' ')} />`;
}

/**
 * Create an SVG triangle DOM element
 */
export function createTriangleElement(options) {
  const svg = createTriangle(options);
  const template = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  template.innerHTML = svg;
  return template.firstChild;
}

/**
 * Triangle with clock-specific defaults
 */
export const ClockTriangle = {
  /**
   * Create triangle hand
   */
  hand(cx, cy, length, width, angle, { fill = '#000000' } = {}) {
    return createHandTriangle({
      cx, cy, length, width, angle, fill,
      className: 'bauhaus-clock-hand'
    });
  },

  /**
   * Create triangle marker
   */
  marker(cx, cy, size, { fill = '#000000', rotation = 0 } = {}) {
    return createTriangle({
      cx, cy,
      width: size,
      height: size,
      fill, rotation,
      direction: 'up',
      className: 'bauhaus-clock-marker'
    });
  }
};

export default createTriangle;
