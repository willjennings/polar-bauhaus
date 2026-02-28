/**
 * Bauhaus World Clock Framework
 * Square Primitive
 *
 * A perfect square or rectangle - the rational Bauhaus shape.
 * Used for clock faces and markers.
 * Note: Corners are ALWAYS sharp (no border-radius) per Bauhaus principles.
 */

import { ShapeGuardrails, ColorGuardrails } from '../core/Guardrails.js';

/**
 * Create an SVG rect element (square or rectangle)
 * @param {Object} options - Square options
 * @param {number} options.x - Top-left X coordinate
 * @param {number} options.y - Top-left Y coordinate
 * @param {number} options.width - Width
 * @param {number} options.height - Height (defaults to width for square)
 * @param {string} [options.fill] - Fill color (hex)
 * @param {string} [options.stroke] - Stroke color (hex)
 * @param {number} [options.strokeWidth] - Stroke width
 * @param {number} [options.rotation] - Rotation in degrees (will be snapped to valid Bauhaus angles)
 * @param {number} [options.rotateX] - Rotation center X (defaults to center)
 * @param {number} [options.rotateY] - Rotation center Y (defaults to center)
 * @param {string} [options.id] - Element ID
 * @param {string} [options.className] - CSS class
 * @returns {string} SVG rect element string
 */
export function createSquare({
  x,
  y,
  width,
  height = width,
  fill = 'none',
  stroke = 'none',
  strokeWidth = 0,
  rotation = 0,
  rotateX,
  rotateY,
  id = '',
  className = ''
}) {
  // Validate colors
  if (fill !== 'none' && !ColorGuardrails.isValidHexColor(fill)) {
    console.warn(`Square: Invalid fill color "${fill}", using none`);
    fill = 'none';
  }
  if (stroke !== 'none' && !ColorGuardrails.isValidHexColor(stroke)) {
    console.warn(`Square: Invalid stroke color "${stroke}", using none`);
    stroke = 'none';
  }

  // Snap rotation to valid Bauhaus angle
  const snappedRotation = ShapeGuardrails.snapAngle(rotation);

  // Ensure positive dimensions
  width = Math.max(0, width);
  height = Math.max(0, height);

  const attrs = [
    `x="${x}"`,
    `y="${y}"`,
    `width="${width}"`,
    `height="${height}"`,
    `fill="${fill}"`,
    `stroke="${stroke}"`,
    `stroke-width="${strokeWidth}"`
  ];

  // Add rotation transform if needed
  if (snappedRotation !== 0) {
    const cx = rotateX !== undefined ? rotateX : x + width / 2;
    const cy = rotateY !== undefined ? rotateY : y + height / 2;
    attrs.push(`transform="rotate(${snappedRotation} ${cx} ${cy})"`);
  }

  if (id) attrs.push(`id="${id}"`);
  if (className) attrs.push(`class="${className}"`);

  return `<rect ${attrs.join(' ')} />`;
}

/**
 * Create a centered square (x,y is center, not top-left)
 */
export function createCenteredSquare({
  cx,
  cy,
  size,
  ...options
}) {
  return createSquare({
    x: cx - size / 2,
    y: cy - size / 2,
    width: size,
    height: size,
    rotateX: cx,
    rotateY: cy,
    ...options
  });
}

/**
 * Create an SVG rect DOM element
 */
export function createSquareElement(options) {
  const svg = createSquare(options);
  const template = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  template.innerHTML = svg;
  return template.firstChild;
}

/**
 * Square with clock-specific defaults
 */
export const ClockSquare = {
  /**
   * Create square clock face
   */
  face(cx, cy, size, { fill = '#FFFFFF', stroke = '#000000', strokeWidth = 2 } = {}) {
    return createCenteredSquare({
      cx, cy, size,
      fill, stroke, strokeWidth,
      className: 'bauhaus-clock-face'
    });
  },

  /**
   * Create square marker
   */
  marker(cx, cy, size, { fill = '#000000', rotation = 0 } = {}) {
    return createCenteredSquare({
      cx, cy, size,
      fill, rotation,
      className: 'bauhaus-clock-marker'
    });
  }
};

export default createSquare;
