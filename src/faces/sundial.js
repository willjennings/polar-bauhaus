/**
 * Bauhaus World Clock Framework
 * Sundial Face (Ancient Egypt, ~1500 BCE)
 *
 * The oldest clock design - shadow-based.
 * Features:
 * - Semicircular dial
 * - Radial hour lines emanating from center bottom
 * - Single shadow line (gnomon) rotates to show hour
 * - Roman numerals
 * - Warm sandstone/gold palette
 * - Only shows hours (no minutes) - ancient calm
 */

import { wrapFace, pointOnCircle, toRomanNumeral, createArcPath, getPaletteColors } from './FaceBase.js';

// ═══════════════════════════════════════════════════════════════════════════
// METADATA
// ═══════════════════════════════════════════════════════════════════════════

export const meta = {
  id: 'sundial',
  name: 'Sundial',
  era: '~1500 BCE',
  description: 'Ancient shadow clock - serene hour-only display',
  category: 'analog',
  preferredPalette: 'albers' // Warm ochre tones
};

// ═══════════════════════════════════════════════════════════════════════════
// RENDER
// ═══════════════════════════════════════════════════════════════════════════

export function render({ cx, cy, radius, time, palette = 'albers', zone = 'local' }) {
  const colors = getPaletteColors(palette);

  // Sundial is semicircular, centered at bottom
  const dialRadius = radius * 0.9;
  const pivotY = cy + radius * 0.3; // Pivot point lower
  const pivotX = cx;

  // Hour angle (6am = left edge, 12pm = top, 6pm = right edge)
  // Map 6:00-18:00 to 180 degrees
  const hour12 = time.hours % 12;
  const hourWithMinutes = hour12 + time.minutes / 60;
  // 6am = -90°, 12pm = 0°, 6pm = 90° (in clock terms: 6am=270°, 12=0, 6pm=90)
  const shadowAngle = (hourWithMinutes - 6) * 15; // 15° per hour

  const parts = [];

  // Dial base (semicircle, warm stone color)
  const arcPath = createArcPath(pivotX, pivotY, dialRadius, -90, 90);
  parts.push(`<path
    d="${arcPath} L ${pivotX} ${pivotY} Z"
    fill="${colors.secondary}"
    stroke="${colors.dark}"
    stroke-width="${radius * 0.02}"
  />`);

  // Inner decorative arc
  const innerArc = createArcPath(pivotX, pivotY, dialRadius * 0.85, -90, 90);
  parts.push(`<path
    d="${innerArc}"
    fill="none"
    stroke="${colors.accent}"
    stroke-width="${radius * 0.01}"
    opacity="0.5"
  />`);

  // Hour lines (6am to 6pm = 13 lines including endpoints)
  for (let h = 6; h <= 18; h++) {
    const angle = (h - 6) * 15 - 90; // Convert to SVG angle
    const outer = pointOnCircle(pivotX, pivotY, dialRadius * 0.95, angle + 90);
    const inner = pointOnCircle(pivotX, pivotY, dialRadius * 0.6, angle + 90);

    parts.push(`<line
      x1="${inner.x}" y1="${inner.y}"
      x2="${outer.x}" y2="${outer.y}"
      stroke="${colors.dark}"
      stroke-width="${h % 3 === 0 ? radius * 0.015 : radius * 0.008}"
      stroke-linecap="butt"
    />`);

    // Roman numerals at cardinal hours (6, 9, 12, 3, 6)
    if (h === 6 || h === 9 || h === 12 || h === 15 || h === 18) {
      const labelPos = pointOnCircle(pivotX, pivotY, dialRadius * 0.5, angle + 90);
      const displayHour = h > 12 ? h - 12 : h;
      parts.push(`<text
        x="${labelPos.x}" y="${labelPos.y}"
        font-family="'Times New Roman', serif"
        font-size="${radius * 0.12}"
        fill="${colors.dark}"
        text-anchor="middle"
        dominant-baseline="middle"
      >${toRomanNumeral(displayHour)}</text>`);
    }
  }

  // Shadow (gnomon) - single dark line
  const shadowLength = dialRadius * 0.85;
  const shadowEnd = pointOnCircle(pivotX, pivotY, shadowLength, shadowAngle);

  parts.push(`<g
    id="hand-hour"
    class="bauhaus-clock-hand sundial-shadow"
  >
    <line
      x1="${pivotX}" y1="${pivotY}"
      x2="${shadowEnd.x}" y2="${shadowEnd.y}"
      stroke="${colors.dark}"
      stroke-width="${radius * 0.025}"
      stroke-linecap="butt"
      opacity="0.7"
    />
    <!-- Shadow gradient fade -->
    <line
      x1="${pivotX}" y1="${pivotY}"
      x2="${shadowEnd.x}" y2="${shadowEnd.y}"
      stroke="${colors.dark}"
      stroke-width="${radius * 0.04}"
      stroke-linecap="butt"
      opacity="0.2"
    />
  </g>`);

  // Pivot point (gnomon base)
  parts.push(`<circle
    cx="${pivotX}" cy="${pivotY}"
    r="${radius * 0.04}"
    fill="${colors.accent}"
    stroke="${colors.dark}"
    stroke-width="${radius * 0.01}"
  />`);

  return wrapFace(parts.join('\n'), { cx, cy, radius, faceId: meta.id, zone });
}

// ═══════════════════════════════════════════════════════════════════════════
// UPDATE
// ═══════════════════════════════════════════════════════════════════════════

export function update(clockEl, time, prevTime) {
  // Sundial only moves with hours, very slow - minimal updates needed
  // Full re-render is fine for hour changes
}

// ═══════════════════════════════════════════════════════════════════════════
// CSS
// ═══════════════════════════════════════════════════════════════════════════

export function getCSS() {
  return `
.sundial-shadow {
  transition: transform 60s linear; /* Very slow - moves with the sun */
}

@media (prefers-reduced-motion: reduce) {
  .sundial-shadow {
    transition: none;
  }
}
`;
}

export default { meta, render, update, getCSS };
