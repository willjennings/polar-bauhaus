/**
 * Bauhaus World Clock Framework
 * Mondrian / De Stijl Face (1917)
 *
 * The clock face IS a Mondrian composition.
 * Features:
 * - Grid of rectangles in red/blue/yellow/white
 * - Black grid lines as dividers
 * - Thin black hands cut across the composition
 * - Grid proportions subtly shift with time
 */

import { wrapFace, getPaletteColors } from './FaceBase.js';
import { getHandAngles } from '../core/ClockEngine.js';

// ═══════════════════════════════════════════════════════════════════════════
// METADATA
// ═══════════════════════════════════════════════════════════════════════════

export const meta = {
  id: 'mondrian',
  name: 'Mondrian',
  era: '1917',
  description: 'De Stijl composition as clock face',
  category: 'analog',
  preferredPalette: 'mondrian'
};

// ═══════════════════════════════════════════════════════════════════════════
// COMPOSITION GENERATOR
// ═══════════════════════════════════════════════════════════════════════════

function generateComposition(cx, cy, radius, time, colors) {
  const size = radius * 2;
  const x = cx - radius;
  const y = cy - radius;
  const lineWidth = radius * 0.04;

  // Dynamic proportions based on time
  const hourRatio = (time.hours % 12) / 12;
  const minuteRatio = time.minutes / 60;

  // Grid divisions (3×3 base, proportions shift)
  const col1 = size * (0.25 + hourRatio * 0.1);
  const col2 = size * (0.65 + minuteRatio * 0.1);
  const row1 = size * (0.35 - minuteRatio * 0.05);
  const row2 = size * (0.7 + hourRatio * 0.05);

  const rects = [];

  // Define rectangles with colors
  // Top row
  rects.push({ x: x, y: y, w: col1, h: row1, fill: colors.primary }); // Red
  rects.push({ x: x + col1, y: y, w: col2 - col1, h: row1, fill: colors.light }); // White
  rects.push({ x: x + col2, y: y, w: size - col2, h: row1, fill: colors.accent }); // Yellow

  // Middle row
  rects.push({ x: x, y: y + row1, w: col1, h: row2 - row1, fill: colors.light }); // White
  rects.push({ x: x + col1, y: y + row1, w: col2 - col1, h: row2 - row1, fill: colors.light }); // White (center)
  rects.push({ x: x + col2, y: y + row1, w: size - col2, h: row2 - row1, fill: colors.secondary }); // Blue

  // Bottom row
  rects.push({ x: x, y: y + row2, w: col1, h: size - row2, fill: colors.secondary }); // Blue
  rects.push({ x: x + col1, y: y + row2, w: col2 - col1, h: size - row2, fill: colors.light }); // White
  rects.push({ x: x + col2, y: y + row2, w: size - col2, h: size - row2, fill: colors.light }); // White

  // Grid lines
  const lines = [
    // Vertical
    { x1: x + col1, y1: y, x2: x + col1, y2: y + size },
    { x1: x + col2, y1: y, x2: x + col2, y2: y + size },
    // Horizontal
    { x1: x, y1: y + row1, x2: x + size, y2: y + row1 },
    { x1: x, y1: y + row2, x2: x + size, y2: y + row2 },
    // Border
    { x1: x, y1: y, x2: x + size, y2: y },
    { x1: x, y1: y + size, x2: x + size, y2: y + size },
    { x1: x, y1: y, x2: x, y2: y + size },
    { x1: x + size, y1: y, x2: x + size, y2: y + size }
  ];

  return { rects, lines, lineWidth };
}

// ═══════════════════════════════════════════════════════════════════════════
// RENDER
// ═══════════════════════════════════════════════════════════════════════════

export function render({ cx, cy, radius, time, palette = 'mondrian', zone = 'local' }) {
  const colors = getPaletteColors(palette);
  const angles = getHandAngles(time, true);

  const { rects, lines, lineWidth } = generateComposition(cx, cy, radius, time, colors);

  const hourHandLength = radius * 0.45;
  const minuteHandLength = radius * 0.70;
  const secondHandLength = radius * 0.80;
  const handWidth = radius * 0.025;

  const parts = [];

  // Clipping rectangle (square face)
  parts.push(`<defs>
    <clipPath id="mondrian-clip-${zone.replace(/\//g, '-')}">
      <rect x="${cx - radius}" y="${cy - radius}" width="${radius * 2}" height="${radius * 2}" />
    </clipPath>
  </defs>`);

  // Composition rectangles
  parts.push(`<g clip-path="url(#mondrian-clip-${zone.replace(/\//g, '-')})">
    ${rects.map(r => `<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" fill="${r.fill}" />`).join('\n')}
  </g>`);

  // Grid lines (black)
  lines.forEach(l => {
    parts.push(`<line
      x1="${l.x1}" y1="${l.y1}"
      x2="${l.x2}" y2="${l.y2}"
      stroke="${colors.dark}"
      stroke-width="${lineWidth}"
      stroke-linecap="square"
    />`);
  });

  // Hour hand
  parts.push(`<g
    id="hand-hour"
    class="bauhaus-clock-hand bauhaus-hand-hour"
    transform="rotate(${angles.hour} ${cx} ${cy})"
  >
    <line
      x1="${cx}" y1="${cy}"
      x2="${cx}" y2="${cy - hourHandLength}"
      stroke="${colors.dark}"
      stroke-width="${handWidth * 1.5}"
      stroke-linecap="butt"
    />
  </g>`);

  // Minute hand
  parts.push(`<g
    id="hand-minute"
    class="bauhaus-clock-hand bauhaus-hand-minute"
    transform="rotate(${angles.minute} ${cx} ${cy})"
  >
    <line
      x1="${cx}" y1="${cy}"
      x2="${cx}" y2="${cy - minuteHandLength}"
      stroke="${colors.dark}"
      stroke-width="${handWidth}"
      stroke-linecap="butt"
    />
  </g>`);

  // Second hand
  parts.push(`<g
    id="hand-second"
    class="bauhaus-clock-hand bauhaus-hand-second"
    transform="rotate(${angles.second} ${cx} ${cy})"
  >
    <line
      x1="${cx}" y1="${cy + radius * 0.1}"
      x2="${cx}" y2="${cy - secondHandLength}"
      stroke="${colors.dark}"
      stroke-width="${handWidth * 0.5}"
      stroke-linecap="butt"
    />
  </g>`);

  // Center dot
  parts.push(`<circle cx="${cx}" cy="${cy}" r="${radius * 0.025}" fill="${colors.dark}" />`);

  return wrapFace(parts.join('\n'), { cx, cy, radius, faceId: meta.id, zone });
}

// ═══════════════════════════════════════════════════════════════════════════
// UPDATE
// ═══════════════════════════════════════════════════════════════════════════

export function update(clockEl, time, prevTime) {
  const angles = getHandAngles(time, true);
  const rect = clockEl.querySelector('rect');
  if (!rect) return;

  // Estimate center from first rect
  const x = parseFloat(rect.getAttribute('x')) || 0;
  const w = parseFloat(rect.getAttribute('width')) || 100;
  const cx = x + w / 2;
  const cy = x + w / 2; // Assuming square

  ['hour', 'minute', 'second'].forEach(type => {
    const hand = clockEl.querySelector(`#hand-${type}`);
    if (hand) {
      hand.setAttribute('transform', `rotate(${angles[type]} ${cx} ${cy})`);
    }
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// CSS
// ═══════════════════════════════════════════════════════════════════════════

export function getCSS() {
  return `
.bauhaus-face-mondrian rect {
  transition: width 2s ease-out, height 2s ease-out, x 2s ease-out, y 2s ease-out;
}

@media (prefers-reduced-motion: reduce) {
  .bauhaus-face-mondrian rect {
    transition: none;
  }
}
`;
}

export default { meta, render, update, getCSS };
