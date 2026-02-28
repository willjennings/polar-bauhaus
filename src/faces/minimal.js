/**
 * Bauhaus World Clock Framework
 * Minimal / Single-Hand Face (Meistersinger-inspired)
 *
 * The ultimate reduction in clock design.
 * Features:
 * - ONE hand that sweeps once per 12 hours
 * - Color gradient band around circumference shows time-of-day
 * - Nearly empty face with minimal indices
 * - Time becomes ambient, not urgent
 */

import { wrapFace, pointOnCircle, createRingSegment, getPaletteColors } from './FaceBase.js';
import { getTimeOfDay } from '../core/ClockEngine.js';

// ═══════════════════════════════════════════════════════════════════════════
// METADATA
// ═══════════════════════════════════════════════════════════════════════════

export const meta = {
  id: 'minimal',
  name: 'Minimal',
  era: 'Contemporary',
  description: 'Single-hand clock - time as ambient presence',
  category: 'analog',
  preferredPalette: 'kandinsky'
};

// Time-of-day colors
const TIME_COLORS = {
  night: '#1a1a2e',    // Deep blue-black
  dawn: '#e8a87c',     // Warm peach
  day: '#f5f5dc',      // Warm white
  dusk: '#c2847a'      // Dusty rose
};

// ═══════════════════════════════════════════════════════════════════════════
// RENDER
// ═══════════════════════════════════════════════════════════════════════════

export function render({ cx, cy, radius, time, palette = 'kandinsky', zone = 'local' }) {
  const colors = getPaletteColors(palette);

  // Single hand angle: completes one rotation in 12 hours
  const hour12 = time.hours % 12;
  const totalMinutes = hour12 * 60 + time.minutes;
  const handAngle = (totalMinutes / 720) * 360; // 720 minutes = 12 hours

  const faceRadius = radius * 0.95;
  const bandOuter = radius * 0.95;
  const bandInner = radius * 0.85;
  const handLength = radius * 0.75;
  const handWidth = radius * 0.02;

  const parts = [];

  // Background circle
  parts.push(`<circle
    cx="${cx}" cy="${cy}" r="${faceRadius}"
    fill="${colors.light}"
    stroke="${colors.dark}"
    stroke-width="${radius * 0.005}"
  />`);

  // Time-of-day color band (4 segments)
  const segments = [
    { start: 0, end: 90, color: TIME_COLORS.night },      // 12am-3am
    { start: 90, end: 150, color: TIME_COLORS.night },    // 3am-5am
    { start: 150, end: 210, color: TIME_COLORS.dawn },    // 5am-7am
    { start: 210, end: 270, color: TIME_COLORS.day },     // 7am-9am
    { start: 270, end: 330, color: TIME_COLORS.day },     // 9am-11am
    { start: 330, end: 360, color: TIME_COLORS.day }      // 11am-12pm (continues)
  ];

  // Actually, let's map 24 hours to the ring
  // 12 o'clock = 0°, each hour = 30°
  const hourSegments = [];
  for (let h = 0; h < 12; h++) {
    const startAngle = h * 30;
    const endAngle = (h + 1) * 30;
    let color;

    // Map hours to time of day
    // 0-5 (12am-5am) = night, 5-7 = dawn, 7-17 = day, 17-19 = dusk, 19-24 = night
    const actualHour = h; // For 12-hour display
    if (actualHour < 5 || actualHour >= 10) {
      // Represent as if this is the typical usage
      // Let's use a simple scheme: darker at bottom, lighter at top
      const brightness = Math.cos((h / 12) * Math.PI * 2) * 0.5 + 0.5;
      color = `hsl(220, 20%, ${30 + brightness * 50}%)`;
    } else if (actualHour < 6) {
      color = TIME_COLORS.dawn;
    } else {
      color = TIME_COLORS.day;
    }

    hourSegments.push({ start: startAngle, end: endAngle, color });
  }

  // Simplified: Create a gradient ring using arc segments
  parts.push(`<defs>
    <linearGradient id="time-gradient-${zone.replace(/\//g, '-')}" gradientTransform="rotate(90)">
      <stop offset="0%" stop-color="${TIME_COLORS.day}" />
      <stop offset="25%" stop-color="${TIME_COLORS.dusk}" />
      <stop offset="50%" stop-color="${TIME_COLORS.night}" />
      <stop offset="75%" stop-color="${TIME_COLORS.dawn}" />
      <stop offset="100%" stop-color="${TIME_COLORS.day}" />
    </linearGradient>
  </defs>`);

  // Color band as a simple circle with gradient
  parts.push(`<circle
    cx="${cx}" cy="${cy}" r="${(bandOuter + bandInner) / 2}"
    fill="none"
    stroke="url(#time-gradient-${zone.replace(/\//g, '-')})"
    stroke-width="${bandOuter - bandInner}"
    opacity="0.6"
  />`);

  // Minimal indices at 12, 3, 6, 9 only
  [0, 90, 180, 270].forEach(angle => {
    const outer = pointOnCircle(cx, cy, bandInner - radius * 0.02, angle);
    const inner = pointOnCircle(cx, cy, bandInner - radius * 0.08, angle);
    parts.push(`<line
      x1="${inner.x}" y1="${inner.y}"
      x2="${outer.x}" y2="${outer.y}"
      stroke="${colors.dark}"
      stroke-width="${radius * 0.01}"
      stroke-linecap="butt"
    />`);
  });

  // Single hand
  parts.push(`<g
    id="hand-hour"
    class="bauhaus-clock-hand minimal-hand"
    transform="rotate(${handAngle} ${cx} ${cy})"
  >
    <line
      x1="${cx}" y1="${cy}"
      x2="${cx}" y2="${cy - handLength}"
      stroke="${colors.dark}"
      stroke-width="${handWidth}"
      stroke-linecap="butt"
    />
    <!-- Subtle arrow tip -->
    <polygon
      points="${cx},${cy - handLength - radius * 0.02} ${cx - radius * 0.02},${cy - handLength + radius * 0.03} ${cx + radius * 0.02},${cy - handLength + radius * 0.03}"
      fill="${colors.dark}"
    />
  </g>`);

  // Center dot
  parts.push(`<circle
    cx="${cx}" cy="${cy}"
    r="${radius * 0.02}"
    fill="${colors.dark}"
  />`);

  return wrapFace(parts.join('\n'), { cx, cy, radius, faceId: meta.id, zone });
}

// ═══════════════════════════════════════════════════════════════════════════
// UPDATE
// ═══════════════════════════════════════════════════════════════════════════

export function update(clockEl, time, prevTime) {
  const hour12 = time.hours % 12;
  const totalMinutes = hour12 * 60 + time.minutes;
  const handAngle = (totalMinutes / 720) * 360;

  const circle = clockEl.querySelector('circle');
  if (!circle) return;

  const cx = parseFloat(circle.getAttribute('cx'));
  const cy = parseFloat(circle.getAttribute('cy'));

  const hand = clockEl.querySelector('#hand-hour');
  if (hand) {
    hand.setAttribute('transform', `rotate(${handAngle} ${cx} ${cy})`);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// CSS
// ═══════════════════════════════════════════════════════════════════════════

export function getCSS() {
  return `
.minimal-hand {
  transition: transform 1s linear; /* Slow, meditative movement */
}

@media (prefers-reduced-motion: reduce) {
  .minimal-hand {
    transition: none;
  }
}
`;
}

export default { meta, render, update, getCSS };
