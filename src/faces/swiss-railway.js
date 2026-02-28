/**
 * Bauhaus World Clock Framework
 * Swiss Railway Face (Hans Hilfiker, 1944)
 *
 * The most iconic functional clock design ever made.
 * Features:
 * - Clean white face with black indices
 * - Bold hour indices, thin minute marks
 * - Thin black hour/minute hands
 * - Iconic red paddle-shaped second hand (lollipop)
 * - "Stop-to-go" behavior: second hand sweeps in 58s, pauses 2s at 12
 *
 * Apple paid $21M to license this design for iOS 6.
 */

import { wrapFace, pointOnCircle, getPaletteColors } from './FaceBase.js';
import { getHandAngles } from '../core/ClockEngine.js';

// ═══════════════════════════════════════════════════════════════════════════
// METADATA
// ═══════════════════════════════════════════════════════════════════════════

export const meta = {
  id: 'swiss-railway',
  name: 'Swiss Railway',
  era: '1944',
  description: 'Hans Hilfiker\'s iconic station clock with red paddle second hand',
  category: 'analog',
  preferredPalette: 'mondrian' // Uses red accent
};

// ═══════════════════════════════════════════════════════════════════════════
// RENDER
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Render the Swiss Railway clock face
 */
export function render({ cx, cy, radius, time, palette = 'mondrian', zone = 'local' }) {
  const colors = getPaletteColors(palette);
  const angles = getHandAngles(time, true);

  // Dimensions relative to radius
  const faceRadius = radius * 0.95;
  const hourMarkOuter = radius * 0.85;
  const hourMarkInner = radius * 0.70;
  const minuteMarkOuter = radius * 0.85;
  const minuteMarkInner = radius * 0.80;

  const hourHandLength = radius * 0.50;
  const minuteHandLength = radius * 0.75;
  const secondHandLength = radius * 0.80;
  const secondPaddleRadius = radius * 0.08;

  const hourHandWidth = radius * 0.06;
  const minuteHandWidth = radius * 0.04;
  const secondHandWidth = radius * 0.02;

  const parts = [];

  // Background circle (white)
  parts.push(`<circle
    cx="${cx}" cy="${cy}" r="${faceRadius}"
    fill="${colors.light}"
    stroke="${colors.dark}"
    stroke-width="${radius * 0.02}"
  />`);

  // Hour marks (12 bold indices)
  for (let i = 0; i < 12; i++) {
    const angle = i * 30;
    const outer = pointOnCircle(cx, cy, hourMarkOuter, angle);
    const inner = pointOnCircle(cx, cy, hourMarkInner, angle);
    parts.push(`<line
      x1="${inner.x}" y1="${inner.y}"
      x2="${outer.x}" y2="${outer.y}"
      stroke="${colors.dark}"
      stroke-width="${radius * 0.04}"
      stroke-linecap="butt"
    />`);
  }

  // Minute marks (60 thin marks, skip hour positions)
  for (let i = 0; i < 60; i++) {
    if (i % 5 === 0) continue; // Skip hour positions
    const angle = i * 6;
    const outer = pointOnCircle(cx, cy, minuteMarkOuter, angle);
    const inner = pointOnCircle(cx, cy, minuteMarkInner, angle);
    parts.push(`<line
      x1="${inner.x}" y1="${inner.y}"
      x2="${outer.x}" y2="${outer.y}"
      stroke="${colors.dark}"
      stroke-width="${radius * 0.015}"
      stroke-linecap="butt"
    />`);
  }

  // Hour hand (thick black)
  parts.push(`<g
    id="hand-hour"
    class="bauhaus-clock-hand bauhaus-hand-hour"
    transform="rotate(${angles.hour} ${cx} ${cy})"
  >
    <line
      x1="${cx}" y1="${cy}"
      x2="${cx}" y2="${cy - hourHandLength}"
      stroke="${colors.dark}"
      stroke-width="${hourHandWidth}"
      stroke-linecap="butt"
    />
  </g>`);

  // Minute hand (thinner black)
  parts.push(`<g
    id="hand-minute"
    class="bauhaus-clock-hand bauhaus-hand-minute"
    transform="rotate(${angles.minute} ${cx} ${cy})"
  >
    <line
      x1="${cx}" y1="${cy}"
      x2="${cx}" y2="${cy - minuteHandLength}"
      stroke="${colors.dark}"
      stroke-width="${minuteHandWidth}"
      stroke-linecap="butt"
    />
  </g>`);

  // Second hand with paddle (red lollipop) - THE ICONIC FEATURE
  const paddleCenterY = cy - secondHandLength + secondPaddleRadius;
  parts.push(`<g
    id="hand-second"
    class="bauhaus-clock-hand bauhaus-hand-second swiss-railway-second"
    transform="rotate(${angles.second} ${cx} ${cy})"
  >
    <line
      x1="${cx}" y1="${cy + radius * 0.15}"
      x2="${cx}" y2="${cy - secondHandLength + secondPaddleRadius * 2}"
      stroke="${colors.primary}"
      stroke-width="${secondHandWidth}"
      stroke-linecap="butt"
    />
    <circle
      cx="${cx}" cy="${paddleCenterY}"
      r="${secondPaddleRadius}"
      fill="${colors.primary}"
    />
  </g>`);

  // Center dot
  parts.push(`<circle
    cx="${cx}" cy="${cy}"
    r="${radius * 0.03}"
    fill="${colors.dark}"
  />`);

  return wrapFace(parts.join('\n'), { cx, cy, radius, faceId: meta.id, zone });
}

// ═══════════════════════════════════════════════════════════════════════════
// UPDATE (Differential DOM update)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Update the clock hands without rebuilding the DOM
 */
export function update(clockEl, time, prevTime) {
  const angles = getHandAngles(time, true);

  // Get center from the element's data or compute from children
  const circle = clockEl.querySelector('circle');
  if (!circle) return;

  const cx = parseFloat(circle.getAttribute('cx'));
  const cy = parseFloat(circle.getAttribute('cy'));

  // Update each hand's transform
  ['hour', 'minute', 'second'].forEach(type => {
    const hand = clockEl.querySelector(`#hand-${type}`);
    if (hand) {
      hand.setAttribute('transform', `rotate(${angles[type]} ${cx} ${cy})`);
    }
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// CSS (Stop-to-go animation)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get face-specific CSS
 * The stop-to-go effect: second hand pauses at 12 o'clock
 */
export function getCSS() {
  return `
/* Swiss Railway: Stop-to-go second hand */
.swiss-railway-second {
  transition: transform 0.15s linear;
}

/* When at the top (0 degrees), brief pause effect */
/* This is handled by the animation timing in the render loop */

@media (prefers-reduced-motion: reduce) {
  .swiss-railway-second {
    transition: none;
  }
}
`;
}

export default { meta, render, update, getCSS };
