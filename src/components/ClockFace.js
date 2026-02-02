/**
 * Bauhaus World Clock Framework
 * ClockFace Component
 *
 * The clock face including background shape and markers.
 */

import { ClockCircle, ClockSquare, createNumeral } from '../primitives/index.js';
import { createMarkers, createMixedMarkers } from './Markers.js';

/**
 * Create a clock face
 * @param {Object} options
 * @param {number} options.cx - Center X
 * @param {number} options.cy - Center Y
 * @param {number} options.radius - Face radius
 * @param {string} [options.shape] - 'circle', 'square', or 'none'
 * @param {string} [options.fill] - Background fill color
 * @param {string} [options.stroke] - Border stroke color
 * @param {number} [options.strokeWidth] - Border width
 * @param {Object} [options.markers] - Marker configuration
 * @param {Object} [options.numerals] - Numeral configuration
 * @returns {string} SVG elements string
 */
export function createClockFace({
  cx,
  cy,
  radius,
  shape = 'circle',
  fill = '#FFFFFF',
  stroke = '#000000',
  strokeWidth = 2,
  markers = {},
  numerals = {}
}) {
  const elements = [];

  // Background shape
  if (shape !== 'none') {
    if (shape === 'circle') {
      elements.push(ClockCircle.face(cx, cy, radius, { fill, stroke, strokeWidth }));
    } else if (shape === 'square') {
      elements.push(ClockSquare.face(cx, cy, radius * 2, { fill, stroke, strokeWidth }));
    }
  }

  // Markers
  if (markers.style !== 'none') {
    const markerConfig = {
      cx, cy, radius,
      style: markers.style || 'line',
      count: markers.count || 12,
      color: markers.color || stroke,
      strokeWidth: markers.strokeWidth || strokeWidth * 0.5,
      size: markers.size || 4,
      inset: markers.inset || 0.9,
      length: markers.length || 0.08,
      cardinalEmphasis: markers.cardinalEmphasis !== false
    };

    if (markers.mixed) {
      elements.push(createMixedMarkers({
        cx, cy, radius,
        cardinal: markers.cardinal || {},
        regular: markers.regular || {}
      }));
    } else {
      elements.push(createMarkers(markerConfig));
    }
  }

  // Numerals
  if (numerals.style && numerals.style !== 'none') {
    const numeralRadius = radius * (numerals.inset || 0.75);
    const numeralColor = numerals.color || stroke;
    const numeralSize = numerals.size || 'md';

    let hours = [];
    switch (numerals.style) {
      case 'cardinal':
        hours = [12, 3, 6, 9];
        break;
      case 'all':
        hours = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
        break;
      case 'indices':
        // Roman numerals or indices
        hours = [12, 3, 6, 9];
        break;
      default:
        hours = [];
    }

    const numeralGroup = hours.map(hour =>
      createNumeral({
        cx, cy,
        radius: numeralRadius,
        hour,
        fill: numeralColor,
        size: numeralSize
      })
    ).join('');

    elements.push(`<g class="bauhaus-numerals">${numeralGroup}</g>`);
  }

  return `<g class="bauhaus-clock-face">${elements.join('')}</g>`;
}

/**
 * Create a minimal clock face (circle only, no markers)
 */
export function createMinimalFace(cx, cy, radius, { fill = '#FFFFFF', stroke = '#000000' } = {}) {
  return createClockFace({
    cx, cy, radius,
    shape: 'circle',
    fill, stroke,
    markers: { style: 'none' },
    numerals: { style: 'none' }
  });
}

/**
 * Create a classic clock face (circle with line markers)
 */
export function createClassicFace(cx, cy, radius, { fill = '#FFFFFF', stroke = '#000000' } = {}) {
  return createClockFace({
    cx, cy, radius,
    shape: 'circle',
    fill, stroke,
    markers: { style: 'line', count: 12 },
    numerals: { style: 'none' }
  });
}

/**
 * Create a Mondrian-style clock face (square with bold markers)
 */
export function createMondrianFace(cx, cy, radius, palette = {}) {
  return createClockFace({
    cx, cy, radius,
    shape: 'square',
    fill: palette.light || '#FFFFFF',
    stroke: palette.dark || '#000000',
    strokeWidth: 4,
    markers: {
      style: 'line',
      count: 4,
      color: palette.dark || '#000000',
      strokeWidth: 4
    },
    numerals: { style: 'none' }
  });
}

export default createClockFace;
