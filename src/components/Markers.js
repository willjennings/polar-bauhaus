/**
 * Bauhaus World Clock Framework
 * Markers Component
 *
 * Hour markers around the clock face (12 or 4 positions).
 * Supports line, dot, triangle, and square styles.
 */

import { ClockLine, ClockCircle, ClockTriangle, ClockSquare } from '../primitives/index.js';
import { getMarkerAngles, isCardinalMarker } from '../core/ClockEngine.js';

/**
 * Create hour markers around the clock
 * @param {Object} options
 * @param {number} options.cx - Center X
 * @param {number} options.cy - Center Y
 * @param {number} options.radius - Clock radius
 * @param {string} [options.style] - 'line', 'dot', 'triangle', 'square', 'none'
 * @param {number} [options.count] - Number of markers (4 or 12)
 * @param {number} [options.inset] - Inset from edge (as proportion 0-1)
 * @param {number} [options.length] - Marker length (as proportion)
 * @param {string} [options.color] - Marker color
 * @param {number} [options.strokeWidth] - Line stroke width
 * @param {number} [options.size] - Dot/shape size
 * @param {boolean} [options.cardinalEmphasis] - Make 12/3/6/9 larger
 * @returns {string} SVG elements string
 */
export function createMarkers({
  cx,
  cy,
  radius,
  style = 'line',
  count = 12,
  inset = 0.85,
  length = 0.1,
  color = '#000000',
  strokeWidth = 2,
  size = 4,
  cardinalEmphasis = true
}) {
  if (style === 'none') {
    return '';
  }

  const angles = getMarkerAngles(count);
  const markers = [];

  angles.forEach((angle) => {
    const isCardinal = isCardinalMarker(angle);
    const emphasisMult = cardinalEmphasis && isCardinal ? 1.5 : 1;

    // Calculate position on the radius
    const radians = (angle - 90) * (Math.PI / 180);
    const outerR = radius * inset;
    const innerR = outerR - (radius * length * emphasisMult);

    // Position for dots/shapes
    const markerX = cx + outerR * Math.cos(radians);
    const markerY = cy + outerR * Math.sin(radians);

    switch (style) {
      case 'line':
        markers.push(ClockLine.marker(
          cx, cy,
          innerR,
          outerR,
          angle,
          { stroke: color, strokeWidth: strokeWidth * emphasisMult }
        ));
        break;

      case 'dot':
        markers.push(ClockCircle.marker(
          markerX,
          markerY,
          (size / 2) * emphasisMult,
          { fill: color }
        ));
        break;

      case 'triangle':
        markers.push(ClockTriangle.marker(
          markerX,
          markerY,
          size * emphasisMult,
          { fill: color, rotation: angle }
        ));
        break;

      case 'square':
        markers.push(ClockSquare.marker(
          markerX,
          markerY,
          size * emphasisMult,
          { fill: color, rotation: 45 } // Rotated 45° for diamond effect
        ));
        break;
    }
  });

  return `<g class="bauhaus-markers bauhaus-markers-${style}">${markers.join('')}</g>`;
}

/**
 * Create cardinal markers only (12, 3, 6, 9)
 */
export function createCardinalMarkers(options) {
  return createMarkers({ ...options, count: 4 });
}

/**
 * Create mixed markers (different style for cardinals)
 * @param {Object} options
 * @param {Object} options.cardinal - Options for cardinal markers
 * @param {Object} options.regular - Options for regular markers
 */
export function createMixedMarkers({
  cx,
  cy,
  radius,
  cardinal = {},
  regular = {}
}) {
  const cardinalMarkers = [];
  const regularMarkers = [];

  // Cardinal angles (0, 90, 180, 270 = 12, 3, 6, 9 o'clock)
  const cardinalAngles = [0, 90, 180, 270];
  const regularAngles = [30, 60, 120, 150, 210, 240, 300, 330];

  // Default styles
  const cardinalStyle = cardinal.style || 'line';
  const regularStyle = regular.style || 'dot';

  const cardinalColor = cardinal.color || '#000000';
  const regularColor = regular.color || '#000000';

  const inset = 0.85;
  const markerLength = 0.1;

  // Create cardinal markers
  cardinalAngles.forEach((angle) => {
    const radians = (angle - 90) * (Math.PI / 180);
    const outerR = radius * inset;
    const innerR = outerR - (radius * markerLength * 1.5);
    const markerX = cx + outerR * Math.cos(radians);
    const markerY = cy + outerR * Math.sin(radians);

    if (cardinalStyle === 'line') {
      cardinalMarkers.push(ClockLine.marker(cx, cy, innerR, outerR, angle, {
        stroke: cardinalColor,
        strokeWidth: cardinal.strokeWidth || 3
      }));
    } else if (cardinalStyle === 'dot') {
      cardinalMarkers.push(ClockCircle.marker(markerX, markerY, (cardinal.size || 6) / 2, {
        fill: cardinalColor
      }));
    }
  });

  // Create regular markers
  regularAngles.forEach((angle) => {
    const radians = (angle - 90) * (Math.PI / 180);
    const outerR = radius * inset;
    const innerR = outerR - (radius * markerLength);
    const markerX = cx + outerR * Math.cos(radians);
    const markerY = cy + outerR * Math.sin(radians);

    if (regularStyle === 'line') {
      regularMarkers.push(ClockLine.marker(cx, cy, innerR, outerR, angle, {
        stroke: regularColor,
        strokeWidth: regular.strokeWidth || 1
      }));
    } else if (regularStyle === 'dot') {
      regularMarkers.push(ClockCircle.marker(markerX, markerY, (regular.size || 3) / 2, {
        fill: regularColor
      }));
    }
  });

  return `<g class="bauhaus-markers bauhaus-markers-mixed">
    <g class="bauhaus-markers-regular">${regularMarkers.join('')}</g>
    <g class="bauhaus-markers-cardinal">${cardinalMarkers.join('')}</g>
  </g>`;
}

export default createMarkers;
