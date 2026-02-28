/**
 * Bauhaus World Clock Framework
 * Text Primitive
 *
 * Text elements with Bauhaus typography constraints.
 * - Geometric sans-serif fonts only
 * - Limited to specific sizes following the golden ratio
 * - No decorative styling
 */

import { ColorGuardrails } from '../core/Guardrails.js';

// Bauhaus-appropriate font stack (geometric sans-serif)
const BAUHAUS_FONTS = [
  'Futura',
  'Avant Garde',
  'Century Gothic',
  'Avenir',
  'DIN',
  'Helvetica Neue',
  'Arial',
  'sans-serif'
].join(', ');

// Valid font sizes (based on golden ratio scale)
const FONT_SIZES = {
  xs: 10,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 26
};

// Valid font weights (limited palette)
const FONT_WEIGHTS = {
  light: 300,
  regular: 400,
  medium: 500,
  bold: 700
};

/**
 * Create an SVG text element
 * @param {Object} options - Text options
 * @param {number} options.x - X coordinate
 * @param {number} options.y - Y coordinate
 * @param {string} options.text - Text content
 * @param {string} [options.fill] - Text color (hex)
 * @param {string} [options.size] - Size key: 'xs', 'sm', 'md', 'lg', 'xl'
 * @param {string} [options.weight] - Weight key: 'light', 'regular', 'medium', 'bold'
 * @param {string} [options.anchor] - Text anchor: 'start', 'middle', 'end'
 * @param {string} [options.baseline] - Dominant baseline
 * @param {string} [options.id] - Element ID
 * @param {string} [options.className] - CSS class
 * @returns {string} SVG text element string
 */
export function createText({
  x,
  y,
  text,
  fill = '#000000',
  size = 'md',
  weight = 'regular',
  anchor = 'middle',
  baseline = 'central',
  letterSpacing = 0,
  id = '',
  className = ''
}) {
  // Validate color
  if (!ColorGuardrails.isValidHexColor(fill)) {
    console.warn(`Text: Invalid fill color "${fill}", using #000000`);
    fill = '#000000';
  }

  // Get validated size (default to md if invalid)
  const fontSize = FONT_SIZES[size] || FONT_SIZES.md;

  // Get validated weight (default to regular if invalid)
  const fontWeight = FONT_WEIGHTS[weight] || FONT_WEIGHTS.regular;

  const attrs = [
    `x="${x}"`,
    `y="${y}"`,
    `fill="${fill}"`,
    `font-family="${BAUHAUS_FONTS}"`,
    `font-size="${fontSize}"`,
    `font-weight="${fontWeight}"`,
    `text-anchor="${anchor}"`,
    `dominant-baseline="${baseline}"`
  ];

  if (letterSpacing) {
    attrs.push(`letter-spacing="${letterSpacing}"`);
  }

  if (id) attrs.push(`id="${id}"`);
  if (className) attrs.push(`class="${className}"`);

  // Escape HTML entities in text
  const safeText = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  return `<text ${attrs.join(' ')}>${safeText}</text>`;
}

/**
 * Create numeral for clock face
 * @param {Object} options
 * @param {number} options.cx - Clock center X
 * @param {number} options.cy - Clock center Y
 * @param {number} options.radius - Radius for numeral placement
 * @param {number} options.hour - Hour (1-12)
 * @param {string} [options.fill] - Color
 * @param {string} [options.size] - Size key
 * @returns {string} SVG text element
 */
export function createNumeral({
  cx,
  cy,
  radius,
  hour,
  fill = '#000000',
  size = 'md',
  id = '',
  className = ''
}) {
  // Calculate position (0 = 12 o'clock)
  const angle = ((hour % 12) * 30 - 90) * (Math.PI / 180);
  const x = cx + radius * Math.cos(angle);
  const y = cy + radius * Math.sin(angle);

  return createText({
    x, y,
    text: String(hour === 0 ? 12 : hour),
    fill, size,
    weight: 'medium',
    anchor: 'middle',
    baseline: 'central',
    id,
    className: `bauhaus-clock-numeral ${className}`
  });
}

/**
 * Create timezone/city label
 * @param {Object} options
 * @param {number} options.x - X position
 * @param {number} options.y - Y position
 * @param {string} options.city - City name
 * @param {string} [options.time] - Optional time string
 * @param {string} [options.fill] - Color
 * @param {string} [options.size] - Size key
 * @returns {string} SVG text element(s)
 */
export function createLabel({
  x,
  y,
  city,
  time = '',
  fill = '#000000',
  size = 'sm',
  id = '',
  className = ''
}) {
  const elements = [];

  // City name (uppercase for Bauhaus aesthetic)
  elements.push(createText({
    x, y,
    text: city.toUpperCase(),
    fill, size,
    weight: 'bold',
    anchor: 'middle',
    letterSpacing: 1,
    className: `bauhaus-clock-label-city ${className}`
  }));

  // Optional time
  if (time) {
    elements.push(createText({
      x,
      y: y + (FONT_SIZES[size] || 12) + 4,
      text: time,
      fill,
      size: 'xs',
      weight: 'regular',
      anchor: 'middle',
      className: `bauhaus-clock-label-time ${className}`
    }));
  }

  if (id) {
    return `<g id="${id}">${elements.join('')}</g>`;
  }
  return elements.join('');
}

/**
 * Create an SVG text DOM element
 */
export function createTextElement(options) {
  const svg = createText(options);
  const template = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  template.innerHTML = svg;
  return template.firstChild;
}

/**
 * Text with clock-specific defaults
 */
export const ClockText = {
  /**
   * Create hour numeral
   */
  numeral(cx, cy, radius, hour, { fill = '#000000', size = 'md' } = {}) {
    return createNumeral({
      cx, cy, radius, hour, fill, size
    });
  },

  /**
   * Create city label
   */
  label(x, y, city, { fill = '#000000', size = 'sm', time = '' } = {}) {
    return createLabel({
      x, y, city, time, fill, size
    });
  }
};

// Export constants for external use
export { BAUHAUS_FONTS, FONT_SIZES, FONT_WEIGHTS };

export default createText;
