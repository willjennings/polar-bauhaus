/**
 * Bauhaus World Clock Framework
 * Braun Face (Dieter Rams, 1982)
 *
 * "As little design as possible" - ultra-clean functionalism.
 * Features:
 * - Thin circle outline
 * - Hair-thin indices every 5 minutes
 * - Tiny dots at other minutes
 * - Subtle numerals at 12/3/6/9 only
 * - Thin black hands, no second hand
 * - Maximum restraint
 */

import { wrapFace, pointOnCircle, getPaletteColors } from './FaceBase.js';
import { getHandAngles } from '../core/ClockEngine.js';

// ═══════════════════════════════════════════════════════════════════════════
// METADATA
// ═══════════════════════════════════════════════════════════════════════════

export const meta = {
  id: 'braun',
  name: 'Braun',
  era: '1982',
  description: 'Dieter Rams ultra-minimal functionalism',
  category: 'analog',
  preferredPalette: 'albers'
};

// ═══════════════════════════════════════════════════════════════════════════
// RENDER
// ═══════════════════════════════════════════════════════════════════════════

export function render({ cx, cy, radius, time, palette = 'albers', zone = 'local' }) {
  const colors = getPaletteColors(palette);
  const angles = getHandAngles(time, false); // No smooth, no second hand

  const faceRadius = radius * 0.95;
  const markerOuter = radius * 0.88;
  const markerInner5 = radius * 0.78;
  const markerInner1 = radius * 0.85;
  const numeralRadius = radius * 0.65;

  const hourHandLength = radius * 0.45;
  const minuteHandLength = radius * 0.70;
  const handWidth = radius * 0.02;

  const parts = [];

  // Thin circle outline only
  parts.push(`<circle
    cx="${cx}" cy="${cy}" r="${faceRadius}"
    fill="${colors.light}"
    stroke="${colors.dark}"
    stroke-width="${radius * 0.008}"
  />`);

  // 60 markers
  for (let i = 0; i < 60; i++) {
    const angle = i * 6;
    const outer = pointOnCircle(cx, cy, markerOuter, angle);

    if (i % 5 === 0) {
      // 5-minute marks: thin lines
      const inner = pointOnCircle(cx, cy, markerInner5, angle);
      parts.push(`<line
        x1="${inner.x}" y1="${inner.y}"
        x2="${outer.x}" y2="${outer.y}"
        stroke="${colors.dark}"
        stroke-width="${radius * 0.012}"
        stroke-linecap="butt"
      />`);
    } else {
      // 1-minute marks: tiny dots
      const dotPos = pointOnCircle(cx, cy, markerInner1, angle);
      parts.push(`<circle
        cx="${dotPos.x}" cy="${dotPos.y}"
        r="${radius * 0.008}"
        fill="${colors.dark}"
      />`);
    }
  }

  // Numerals at cardinal positions only (subtle)
  const numerals = [
    { num: '12', angle: 0 },
    { num: '3', angle: 90 },
    { num: '6', angle: 180 },
    { num: '9', angle: 270 }
  ];

  numerals.forEach(({ num, angle }) => {
    const pos = pointOnCircle(cx, cy, numeralRadius, angle);
    parts.push(`<text
      x="${pos.x}" y="${pos.y}"
      font-family="'Helvetica Neue', 'Helvetica', sans-serif"
      font-size="${radius * 0.12}"
      font-weight="300"
      fill="${colors.dark}"
      text-anchor="middle"
      dominant-baseline="central"
      opacity="0.7"
    >${num}</text>`);
  });

  // Hour hand (thin)
  parts.push(`<g
    id="hand-hour"
    class="bauhaus-clock-hand bauhaus-hand-hour"
    transform="rotate(${angles.hour} ${cx} ${cy})"
  >
    <line
      x1="${cx}" y1="${cy}"
      x2="${cx}" y2="${cy - hourHandLength}"
      stroke="${colors.dark}"
      stroke-width="${handWidth}"
      stroke-linecap="butt"
    />
  </g>`);

  // Minute hand (thin)
  parts.push(`<g
    id="hand-minute"
    class="bauhaus-clock-hand bauhaus-hand-minute"
    transform="rotate(${angles.minute} ${cx} ${cy})"
  >
    <line
      x1="${cx}" y1="${cy}"
      x2="${cx}" y2="${cy - minuteHandLength}"
      stroke="${colors.dark}"
      stroke-width="${handWidth * 0.7}"
      stroke-linecap="butt"
    />
  </g>`);

  // No second hand - pure functionalism
  // Tiny center dot
  parts.push(`<circle
    cx="${cx}" cy="${cy}"
    r="${radius * 0.015}"
    fill="${colors.dark}"
  />`);

  return wrapFace(parts.join('\n'), { cx, cy, radius, faceId: meta.id, zone });
}

// ═══════════════════════════════════════════════════════════════════════════
// UPDATE
// ═══════════════════════════════════════════════════════════════════════════

export function update(clockEl, time, prevTime) {
  const angles = getHandAngles(time, false);
  const circle = clockEl.querySelector('circle');
  if (!circle) return;

  const cx = parseFloat(circle.getAttribute('cx'));
  const cy = parseFloat(circle.getAttribute('cy'));

  ['hour', 'minute'].forEach(type => {
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
/* Braun: Ultra-smooth transitions */
.bauhaus-face-braun .bauhaus-clock-hand {
  transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

@media (prefers-reduced-motion: reduce) {
  .bauhaus-face-braun .bauhaus-clock-hand {
    transition: none;
  }
}
`;
}

export default { meta, render, update, getCSS };
