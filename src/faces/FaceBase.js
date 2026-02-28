/**
 * Bauhaus World Clock Framework
 * FaceBase - Shared utilities for clock face modules
 *
 * Provides common SVG helpers, time formatting, and face wrapper utilities
 * that all clock faces can use.
 */

import { getHandAngles, getTimeOfDay } from '../core/ClockEngine.js';
import { PALETTES } from '../themes/tokens.js';

// ═══════════════════════════════════════════════════════════════════════════
// SVG PATH UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Create an SVG arc path
 * @param {number} cx - Center X
 * @param {number} cy - Center Y
 * @param {number} radius - Arc radius
 * @param {number} startAngle - Start angle in degrees (0 = 12 o'clock)
 * @param {number} endAngle - End angle in degrees
 * @returns {string} SVG path d attribute
 */
export function createArcPath(cx, cy, radius, startAngle, endAngle) {
  // Convert clock angles (0 = top) to SVG angles (0 = right)
  const startRad = (startAngle - 90) * Math.PI / 180;
  const endRad = (endAngle - 90) * Math.PI / 180;

  const x1 = cx + radius * Math.cos(startRad);
  const y1 = cy + radius * Math.sin(startRad);
  const x2 = cx + radius * Math.cos(endRad);
  const y2 = cy + radius * Math.sin(endRad);

  const largeArc = (endAngle - startAngle) > 180 ? 1 : 0;

  return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`;
}

/**
 * Create a ring segment (arc with thickness)
 */
export function createRingSegment(cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill = '#000') {
  const startRad = (startAngle - 90) * Math.PI / 180;
  const endRad = (endAngle - 90) * Math.PI / 180;

  const x1Outer = cx + outerRadius * Math.cos(startRad);
  const y1Outer = cy + outerRadius * Math.sin(startRad);
  const x2Outer = cx + outerRadius * Math.cos(endRad);
  const y2Outer = cy + outerRadius * Math.sin(endRad);

  const x1Inner = cx + innerRadius * Math.cos(endRad);
  const y1Inner = cy + innerRadius * Math.sin(endRad);
  const x2Inner = cx + innerRadius * Math.cos(startRad);
  const y2Inner = cy + innerRadius * Math.sin(startRad);

  const largeArc = (endAngle - startAngle) > 180 ? 1 : 0;

  const d = [
    `M ${x1Outer} ${y1Outer}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x2Outer} ${y2Outer}`,
    `L ${x1Inner} ${y1Inner}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x2Inner} ${y2Inner}`,
    'Z'
  ].join(' ');

  return `<path d="${d}" fill="${fill}" />`;
}

/**
 * Create a point on a circle
 */
export function pointOnCircle(cx, cy, radius, angleDegrees) {
  const rad = (angleDegrees - 90) * Math.PI / 180;
  return {
    x: cx + radius * Math.cos(rad),
    y: cy + radius * Math.sin(rad)
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// TIME FORMATTING
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get time as words for word clock
 * @param {Object} time - Time object from ClockEngine
 * @returns {Object} { words: string[], minuteDots: number }
 */
export function getTimeWords(time) {
  const hours = time.hours % 12 || 12;
  const minutes = time.minutes;
  const minuteDots = minutes % 5;

  const hourWords = [
    'TWELVE', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE',
    'SIX', 'SEVEN', 'EIGHT', 'NINE', 'TEN', 'ELEVEN'
  ];

  const words = ['IT', 'IS'];

  if (minutes < 5) {
    words.push(hourWords[hours % 12], "O'CLOCK");
  } else if (minutes < 10) {
    words.push('FIVE', 'PAST', hourWords[hours % 12]);
  } else if (minutes < 15) {
    words.push('TEN', 'PAST', hourWords[hours % 12]);
  } else if (minutes < 20) {
    words.push('QUARTER', 'PAST', hourWords[hours % 12]);
  } else if (minutes < 25) {
    words.push('TWENTY', 'PAST', hourWords[hours % 12]);
  } else if (minutes < 30) {
    words.push('TWENTY', 'FIVE', 'PAST', hourWords[hours % 12]);
  } else if (minutes < 35) {
    words.push('HALF', 'PAST', hourWords[hours % 12]);
  } else if (minutes < 40) {
    words.push('TWENTY', 'FIVE', 'TO', hourWords[(hours + 1) % 12 || 12]);
  } else if (minutes < 45) {
    words.push('TWENTY', 'TO', hourWords[(hours + 1) % 12 || 12]);
  } else if (minutes < 50) {
    words.push('QUARTER', 'TO', hourWords[(hours + 1) % 12 || 12]);
  } else if (minutes < 55) {
    words.push('TEN', 'TO', hourWords[(hours + 1) % 12 || 12]);
  } else {
    words.push('FIVE', 'TO', hourWords[(hours + 1) % 12 || 12]);
  }

  return { words, minuteDots };
}

/**
 * Format time as digital HH:MM
 */
export function formatDigitalTime(time, showSeconds = false) {
  const h = String(time.hours).padStart(2, '0');
  const m = String(time.minutes).padStart(2, '0');
  if (showSeconds) {
    const s = String(time.seconds).padStart(2, '0');
    return `${h}:${m}:${s}`;
  }
  return `${h}:${m}`;
}

/**
 * Convert number to binary array
 */
export function toBinaryArray(num, bits = 4) {
  const arr = [];
  for (let i = bits - 1; i >= 0; i--) {
    arr.push((num >> i) & 1);
  }
  return arr;
}

/**
 * Roman numeral conversion (for sundial, astronomical)
 */
export function toRomanNumeral(num) {
  const map = [
    ['XII', 12], ['XI', 11], ['X', 10], ['IX', 9],
    ['VIII', 8], ['VII', 7], ['VI', 6], ['V', 5],
    ['IV', 4], ['III', 3], ['II', 2], ['I', 1]
  ];
  for (const [roman, value] of map) {
    if (num === value) return roman;
  }
  return String(num);
}

// ═══════════════════════════════════════════════════════════════════════════
// FACE WRAPPER
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Wrap face SVG content in a group with standard attributes
 */
export function wrapFace(content, { cx, cy, radius, faceId, zone }) {
  const zoneId = zone ? zone.replace(/\//g, '-') : 'local';
  return `<g
    id="clock-${zoneId}"
    class="bauhaus-single-clock bauhaus-face-${faceId}"
    data-face-type="${faceId}"
    data-zone="${zone || 'local'}"
    transform="translate(0,0)"
  >
    ${content}
  </g>`;
}

/**
 * Get CSS for a specific face (for animations, transitions)
 */
export function getFaceCSS(faceId) {
  const baseCSS = `
.bauhaus-face-${faceId} {
  /* Face-specific styles */
}
`;
  return baseCSS;
}

// ═══════════════════════════════════════════════════════════════════════════
// PALETTE HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get palette colors by name
 */
export function getPaletteColors(paletteName = 'mondrian') {
  return PALETTES[paletteName] || PALETTES.mondrian;
}

/**
 * Get time-of-day adjusted colors
 */
export function getTimeAdjustedPalette(paletteName, time) {
  const palette = getPaletteColors(paletteName);
  const timeOfDay = getTimeOfDay(time.hours);

  // Subtle adjustments based on time of day
  // This is a placeholder - could be expanded with actual color shifting
  return {
    ...palette,
    timeOfDay,
    isDark: timeOfDay === 'night' || timeOfDay === 'dusk'
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// GEAR UTILITIES (for skeleton face)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Create a gear shape with teeth
 */
export function createGearPath(cx, cy, innerRadius, outerRadius, teeth = 12) {
  const points = [];
  const angleStep = 360 / (teeth * 2);

  for (let i = 0; i < teeth * 2; i++) {
    const angle = i * angleStep;
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const point = pointOnCircle(cx, cy, radius, angle);
    points.push(`${point.x},${point.y}`);
  }

  return `<polygon points="${points.join(' ')}" />`;
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export default {
  createArcPath,
  createRingSegment,
  pointOnCircle,
  getTimeWords,
  formatDigitalTime,
  toBinaryArray,
  toRomanNumeral,
  wrapFace,
  getFaceCSS,
  getPaletteColors,
  getTimeAdjustedPalette,
  createGearPath
};
