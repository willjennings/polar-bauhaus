/**
 * Bauhaus World Clock Framework
 * Astronomical Clock Face (Prague, 1410)
 *
 * Dense celestial information display.
 * Features:
 * - Concentric rotating rings
 * - Outer ring: Roman hour numerals
 * - Middle ring: zodiac symbols
 * - Inner: day/night gradient
 * - Sun and moon indicators
 * - Deep blue/gold palette
 */

import { wrapFace, pointOnCircle, toRomanNumeral, createRingSegment, getPaletteColors } from './FaceBase.js';
import { getHandAngles, getTimeOfDay } from '../core/ClockEngine.js';

// ═══════════════════════════════════════════════════════════════════════════
// METADATA
// ═══════════════════════════════════════════════════════════════════════════

export const meta = {
  id: 'astronomical',
  name: 'Astronomical',
  era: '1410',
  description: 'Prague-inspired celestial mechanics',
  category: 'astronomical',
  preferredPalette: 'moholy'
};

// Zodiac symbols (Unicode)
const ZODIAC = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'];

// Astronomical colors
const ASTRO_COLORS = {
  nightSky: '#0a1628',
  daySky: '#4a90d9',
  gold: '#d4af37',
  silver: '#c0c0c0'
};

// ═══════════════════════════════════════════════════════════════════════════
// RENDER
// ═══════════════════════════════════════════════════════════════════════════

export function render({ cx, cy, radius, time, palette = 'moholy', zone = 'local' }) {
  const colors = getPaletteColors(palette);
  const angles = getHandAngles(time, true);
  const timeOfDay = getTimeOfDay(time.hours);

  const outerRing = radius * 0.95;
  const middleRing = radius * 0.75;
  const innerRing = radius * 0.55;
  const centerRing = radius * 0.35;

  const gold = ASTRO_COLORS.gold;
  const silver = ASTRO_COLORS.silver;

  const parts = [];

  // Define gradients
  parts.push(`<defs>
    <radialGradient id="sky-gradient-${zone.replace(/\//g, '-')}">
      <stop offset="0%" stop-color="${ASTRO_COLORS.daySky}" />
      <stop offset="100%" stop-color="${ASTRO_COLORS.nightSky}" />
    </radialGradient>
    <linearGradient id="day-night-${zone.replace(/\//g, '-')}" gradientTransform="rotate(${-angles.hour + 180})">
      <stop offset="0%" stop-color="${ASTRO_COLORS.daySky}" />
      <stop offset="50%" stop-color="${ASTRO_COLORS.nightSky}" />
      <stop offset="100%" stop-color="${ASTRO_COLORS.daySky}" />
    </linearGradient>
  </defs>`);

  // Background (night sky)
  parts.push(`<circle
    cx="${cx}" cy="${cy}" r="${outerRing}"
    fill="${ASTRO_COLORS.nightSky}"
    stroke="${gold}"
    stroke-width="${radius * 0.02}"
  />`);

  // Outer ring - 24-hour Roman numerals (rotates with time)
  const hourRotation = (time.hours % 24) * 15; // 15° per hour
  parts.push(`<g transform="rotate(${-hourRotation} ${cx} ${cy})" class="astro-hour-ring">`);

  for (let h = 1; h <= 24; h++) {
    const angle = (h - 1) * 15; // 15° per hour
    const pos = pointOnCircle(cx, cy, (outerRing + middleRing) / 2, angle);

    // Tick mark
    const tickOuter = pointOnCircle(cx, cy, outerRing - radius * 0.02, angle);
    const tickInner = pointOnCircle(cx, cy, middleRing + radius * 0.02, angle);
    parts.push(`<line
      x1="${tickInner.x}" y1="${tickInner.y}"
      x2="${tickOuter.x}" y2="${tickOuter.y}"
      stroke="${gold}"
      stroke-width="${h % 6 === 0 ? radius * 0.015 : radius * 0.005}"
    />`);

    // Roman numeral (every 3 hours)
    if (h % 3 === 0) {
      const numPos = pointOnCircle(cx, cy, (outerRing + middleRing) / 2 - radius * 0.05, angle);
      parts.push(`<text
        x="${numPos.x}" y="${numPos.y}"
        font-family="'Times New Roman', serif"
        font-size="${radius * 0.08}"
        fill="${gold}"
        text-anchor="middle"
        dominant-baseline="middle"
        transform="rotate(${angle + 90} ${numPos.x} ${numPos.y})"
      >${toRomanNumeral(h > 12 ? h - 12 : h)}</text>`);
    }
  }
  parts.push('</g>');

  // Middle ring divider
  parts.push(`<circle
    cx="${cx}" cy="${cy}" r="${middleRing}"
    fill="none"
    stroke="${gold}"
    stroke-width="${radius * 0.01}"
  />`);

  // Zodiac ring (rotates slowly - ~1 sign per month)
  const zodiacRotation = ((time.month + time.date / 30) / 12) * 360;
  parts.push(`<g transform="rotate(${-zodiacRotation} ${cx} ${cy})" class="astro-zodiac-ring">`);

  ZODIAC.forEach((symbol, idx) => {
    const angle = idx * 30 + 15; // 30° per sign, offset to center
    const pos = pointOnCircle(cx, cy, (middleRing + innerRing) / 2, angle);

    parts.push(`<text
      x="${pos.x}" y="${pos.y}"
      font-family="serif"
      font-size="${radius * 0.12}"
      fill="${silver}"
      text-anchor="middle"
      dominant-baseline="middle"
    >${symbol}</text>`);
  });
  parts.push('</g>');

  // Inner ring divider
  parts.push(`<circle
    cx="${cx}" cy="${cy}" r="${innerRing}"
    fill="none"
    stroke="${gold}"
    stroke-width="${radius * 0.01}"
  />`);

  // Day/night inner circle
  parts.push(`<circle
    cx="${cx}" cy="${cy}" r="${innerRing - radius * 0.02}"
    fill="url(#day-night-${zone.replace(/\//g, '-')})"
  />`);

  // Center ring
  parts.push(`<circle
    cx="${cx}" cy="${cy}" r="${centerRing}"
    fill="${ASTRO_COLORS.nightSky}"
    stroke="${gold}"
    stroke-width="${radius * 0.008}"
  />`);

  // Sun indicator (on hour ring)
  const sunAngle = angles.hour; // 12-hour position
  const sunPos = pointOnCircle(cx, cy, centerRing * 0.7, sunAngle);
  parts.push(`<g id="hand-hour" transform="rotate(0 ${cx} ${cy})">
    <circle
      cx="${sunPos.x}" cy="${sunPos.y}"
      r="${radius * 0.06}"
      fill="${gold}"
    />
    <!-- Sun rays -->
    ${[0, 45, 90, 135, 180, 225, 270, 315].map(rayAngle => {
      const ray1 = pointOnCircle(sunPos.x, sunPos.y, radius * 0.08, rayAngle);
      const ray2 = pointOnCircle(sunPos.x, sunPos.y, radius * 0.1, rayAngle);
      return `<line x1="${ray1.x}" y1="${ray1.y}" x2="${ray2.x}" y2="${ray2.y}" stroke="${gold}" stroke-width="${radius * 0.01}" />`;
    }).join('')}
  </g>`);

  // Moon indicator (opposite sun, slightly offset)
  const moonAngle = sunAngle + 180;
  const moonPos = pointOnCircle(cx, cy, centerRing * 0.5, moonAngle);
  parts.push(`<g id="hand-minute">
    <circle
      cx="${moonPos.x}" cy="${moonPos.y}"
      r="${radius * 0.04}"
      fill="${silver}"
    />
    <!-- Moon shadow (crescent effect) -->
    <circle
      cx="${moonPos.x + radius * 0.015}" cy="${moonPos.y}"
      r="${radius * 0.035}"
      fill="${ASTRO_COLORS.nightSky}"
    />
  </g>`);

  // Hour hand (golden pointer)
  parts.push(`<g
    id="hand-second"
    class="bauhaus-clock-hand"
    transform="rotate(${angles.second} ${cx} ${cy})"
  >
    <line
      x1="${cx}" y1="${cy}"
      x2="${cx}" y2="${cy - centerRing}"
      stroke="${gold}"
      stroke-width="${radius * 0.01}"
      stroke-linecap="butt"
    />
    <polygon
      points="${cx},${cy - centerRing - radius * 0.02} ${cx - radius * 0.015},${cy - centerRing + radius * 0.01} ${cx + radius * 0.015},${cy - centerRing + radius * 0.01}"
      fill="${gold}"
    />
  </g>`);

  return wrapFace(parts.join('\n'), { cx, cy, radius, faceId: meta.id, zone });
}

// ═══════════════════════════════════════════════════════════════════════════
// UPDATE
// ═══════════════════════════════════════════════════════════════════════════

export function update(clockEl, time, prevTime) {
  // Astronomical clock has multiple rotating elements - complex update
  // For now, rely on full re-render for accuracy
}

// ═══════════════════════════════════════════════════════════════════════════
// CSS
// ═══════════════════════════════════════════════════════════════════════════

export function getCSS() {
  return `
.astro-hour-ring {
  transition: transform 60s linear;
}

.astro-zodiac-ring {
  transition: transform 3600s linear; /* Very slow - monthly */
}

@media (prefers-reduced-motion: reduce) {
  .astro-hour-ring, .astro-zodiac-ring {
    transition: none;
  }
}
`;
}

export default { meta, render, update, getCSS };
