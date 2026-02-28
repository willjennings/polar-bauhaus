/**
 * Bauhaus World Clock Framework
 * Art Deco Face (1920s)
 *
 * Gatsby-era glamour through geometric precision.
 * Features:
 * - Octagonal frame
 * - Geometric angular numerals
 * - Radiating sunburst pattern
 * - Gold on black (or cream on dark green)
 * - Diamond-tipped hands
 */

import { wrapFace, pointOnCircle, getPaletteColors } from './FaceBase.js';
import { getHandAngles } from '../core/ClockEngine.js';

// ═══════════════════════════════════════════════════════════════════════════
// METADATA
// ═══════════════════════════════════════════════════════════════════════════

export const meta = {
  id: 'art-deco',
  name: 'Art Deco',
  era: '1920s',
  description: 'Gatsby-era geometric glamour',
  category: 'analog',
  preferredPalette: 'moholy' // Gold and dark
};

// Art Deco specific colors
const DECO_COLORS = {
  gold: '#D4AF37',
  black: '#1a1a1a',
  cream: '#F5F5DC',
  emerald: '#046307'
};

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

function createOctagon(cx, cy, radius) {
  const points = [];
  for (let i = 0; i < 8; i++) {
    const angle = (i * 45) - 22.5; // Offset so flat edge is at top
    const point = pointOnCircle(cx, cy, radius, angle);
    points.push(`${point.x},${point.y}`);
  }
  return points.join(' ');
}

// ═══════════════════════════════════════════════════════════════════════════
// RENDER
// ═══════════════════════════════════════════════════════════════════════════

export function render({ cx, cy, radius, time, palette = 'moholy', zone = 'local' }) {
  const colors = getPaletteColors(palette);
  const angles = getHandAngles(time, true);

  const gold = DECO_COLORS.gold;
  const black = DECO_COLORS.black;

  const frameRadius = radius * 0.95;
  const innerRadius = radius * 0.85;
  const sunburstRadius = radius * 0.75;
  const numeralRadius = radius * 0.65;

  const hourHandLength = radius * 0.40;
  const minuteHandLength = radius * 0.60;
  const handWidth = radius * 0.025;

  const parts = [];

  // Outer octagon frame (gold)
  parts.push(`<polygon
    points="${createOctagon(cx, cy, frameRadius)}"
    fill="${black}"
    stroke="${gold}"
    stroke-width="${radius * 0.03}"
  />`);

  // Inner octagon
  parts.push(`<polygon
    points="${createOctagon(cx, cy, innerRadius)}"
    fill="none"
    stroke="${gold}"
    stroke-width="${radius * 0.01}"
    opacity="0.5"
  />`);

  // Sunburst rays
  for (let i = 0; i < 24; i++) {
    const angle = i * 15;
    const outer = pointOnCircle(cx, cy, sunburstRadius, angle);
    const inner = pointOnCircle(cx, cy, radius * 0.2, angle);
    const isMajor = i % 2 === 0;

    parts.push(`<line
      x1="${inner.x}" y1="${inner.y}"
      x2="${outer.x}" y2="${outer.y}"
      stroke="${gold}"
      stroke-width="${isMajor ? radius * 0.008 : radius * 0.003}"
      opacity="${isMajor ? 0.6 : 0.3}"
    />`);
  }

  // Art Deco numerals (geometric style)
  const numerals = ['12', '3', '6', '9'];
  const numeralAngles = [0, 90, 180, 270];

  numeralAngles.forEach((angle, idx) => {
    const pos = pointOnCircle(cx, cy, numeralRadius, angle);
    parts.push(`<text
      x="${pos.x}" y="${pos.y}"
      font-family="'Copperplate', 'Futura', sans-serif"
      font-size="${radius * 0.15}"
      font-weight="bold"
      fill="${gold}"
      text-anchor="middle"
      dominant-baseline="central"
      letter-spacing="${radius * 0.02}"
    >${numerals[idx]}</text>`);
  });

  // Hour markers (small diamonds at other hours)
  for (let i = 0; i < 12; i++) {
    if (i % 3 === 0) continue; // Skip cardinal positions
    const angle = i * 30;
    const pos = pointOnCircle(cx, cy, numeralRadius, angle);
    const size = radius * 0.03;

    parts.push(`<polygon
      points="${pos.x},${pos.y - size} ${pos.x + size * 0.6},${pos.y} ${pos.x},${pos.y + size} ${pos.x - size * 0.6},${pos.y}"
      fill="${gold}"
    />`);
  }

  // Hour hand (with diamond tip)
  parts.push(`<g
    id="hand-hour"
    class="bauhaus-clock-hand art-deco-hand"
    transform="rotate(${angles.hour} ${cx} ${cy})"
  >
    <line
      x1="${cx}" y1="${cy + radius * 0.05}"
      x2="${cx}" y2="${cy - hourHandLength + radius * 0.05}"
      stroke="${gold}"
      stroke-width="${handWidth * 1.5}"
      stroke-linecap="butt"
    />
    <polygon
      points="${cx},${cy - hourHandLength - radius * 0.03} ${cx - radius * 0.025},${cy - hourHandLength + radius * 0.02} ${cx + radius * 0.025},${cy - hourHandLength + radius * 0.02}"
      fill="${gold}"
    />
  </g>`);

  // Minute hand (with diamond tip)
  parts.push(`<g
    id="hand-minute"
    class="bauhaus-clock-hand art-deco-hand"
    transform="rotate(${angles.minute} ${cx} ${cy})"
  >
    <line
      x1="${cx}" y1="${cy + radius * 0.05}"
      x2="${cx}" y2="${cy - minuteHandLength + radius * 0.05}"
      stroke="${gold}"
      stroke-width="${handWidth}"
      stroke-linecap="butt"
    />
    <polygon
      points="${cx},${cy - minuteHandLength - radius * 0.025} ${cx - radius * 0.018},${cy - minuteHandLength + radius * 0.015} ${cx + radius * 0.018},${cy - minuteHandLength + radius * 0.015}"
      fill="${gold}"
    />
  </g>`);

  // Center jewel
  parts.push(`<circle
    cx="${cx}" cy="${cy}"
    r="${radius * 0.04}"
    fill="${gold}"
    stroke="${black}"
    stroke-width="${radius * 0.01}"
  />`);
  parts.push(`<circle
    cx="${cx}" cy="${cy}"
    r="${radius * 0.02}"
    fill="${black}"
  />`);

  return wrapFace(parts.join('\n'), { cx, cy, radius, faceId: meta.id, zone });
}

// ═══════════════════════════════════════════════════════════════════════════
// UPDATE
// ═══════════════════════════════════════════════════════════════════════════

export function update(clockEl, time, prevTime) {
  const angles = getHandAngles(time, true);
  const polygon = clockEl.querySelector('polygon');
  if (!polygon) return;

  // Parse center from the polygon's points
  const points = polygon.getAttribute('points').split(' ');
  if (points.length < 2) return;

  const firstPoint = points[0].split(',');
  const cx = parseFloat(firstPoint[0]);
  // This is approximate - ideally we'd store cx/cy in data attributes

  ['hour', 'minute'].forEach(type => {
    const hand = clockEl.querySelector(`#hand-${type}`);
    if (hand) {
      const transform = hand.getAttribute('transform');
      const match = transform.match(/rotate\([\d.]+\s+([\d.]+)\s+([\d.]+)\)/);
      if (match) {
        hand.setAttribute('transform', `rotate(${angles[type]} ${match[1]} ${match[2]})`);
      }
    }
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// CSS
// ═══════════════════════════════════════════════════════════════════════════

export function getCSS() {
  return `
.art-deco-hand {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Subtle pulse on the sunburst */
.bauhaus-face-art-deco line {
  animation: deco-pulse 4s ease-in-out infinite;
}

@keyframes deco-pulse {
  0%, 100% { opacity: inherit; }
  50% { opacity: calc(inherit * 1.2); }
}

@media (prefers-reduced-motion: reduce) {
  .art-deco-hand {
    transition: none;
  }
  .bauhaus-face-art-deco line {
    animation: none;
  }
}
`;
}

export default { meta, render, update, getCSS };
