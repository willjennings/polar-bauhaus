/**
 * Bauhaus World Clock Framework
 * Hourglass / Sand Timer Face (Medieval Europe)
 *
 * Visceral representation of time passing.
 * Features:
 * - Two connected chambers (top/bottom)
 * - Top chamber empties as hour progresses
 * - Fill level = minutes remaining in the hour
 * - Falling sand particle animation
 * - Flips at the hour (visual inversion)
 */

import { wrapFace, getPaletteColors } from './FaceBase.js';

// ═══════════════════════════════════════════════════════════════════════════
// METADATA
// ═══════════════════════════════════════════════════════════════════════════

export const meta = {
  id: 'hourglass',
  name: 'Hourglass',
  era: 'Medieval',
  description: 'Sand timer with falling particle animation',
  category: 'mechanical',
  preferredPalette: 'klee'
};

// ═══════════════════════════════════════════════════════════════════════════
// RENDER
// ═══════════════════════════════════════════════════════════════════════════

export function render({ cx, cy, radius, time, palette = 'klee', zone = 'local' }) {
  const colors = getPaletteColors(palette);

  // Calculate fill based on minutes (0-59)
  // At minute 0, top is full. At minute 59, top is nearly empty.
  const topFillPercent = (60 - time.minutes) / 60;
  const bottomFillPercent = time.minutes / 60;

  const glassWidth = radius * 0.6;
  const glassHeight = radius * 1.6;
  const neckWidth = radius * 0.08;
  const neckHeight = radius * 0.1;

  const topY = cy - glassHeight / 2;
  const bottomY = cy + glassHeight / 2;
  const neckY = cy;

  const sandColor = colors.accent;
  const glassColor = colors.light;
  const frameColor = colors.dark;

  const parts = [];

  // Hourglass outline path
  const hourglassPath = `
    M ${cx - glassWidth / 2} ${topY}
    L ${cx + glassWidth / 2} ${topY}
    L ${cx + neckWidth / 2} ${neckY - neckHeight / 2}
    L ${cx + neckWidth / 2} ${neckY + neckHeight / 2}
    L ${cx + glassWidth / 2} ${bottomY}
    L ${cx - glassWidth / 2} ${bottomY}
    L ${cx - neckWidth / 2} ${neckY + neckHeight / 2}
    L ${cx - neckWidth / 2} ${neckY - neckHeight / 2}
    Z
  `;

  // Glass background
  parts.push(`<path
    d="${hourglassPath}"
    fill="${glassColor}"
    stroke="${frameColor}"
    stroke-width="${radius * 0.02}"
    opacity="0.9"
  />`);

  // Top chamber clipping
  parts.push(`<defs>
    <clipPath id="top-chamber-${zone.replace(/\//g, '-')}">
      <polygon points="
        ${cx - glassWidth / 2},${topY}
        ${cx + glassWidth / 2},${topY}
        ${cx + neckWidth / 2},${neckY - neckHeight / 2}
        ${cx - neckWidth / 2},${neckY - neckHeight / 2}
      "/>
    </clipPath>
    <clipPath id="bottom-chamber-${zone.replace(/\//g, '-')}">
      <polygon points="
        ${cx - neckWidth / 2},${neckY + neckHeight / 2}
        ${cx + neckWidth / 2},${neckY + neckHeight / 2}
        ${cx + glassWidth / 2},${bottomY}
        ${cx - glassWidth / 2},${bottomY}
      "/>
    </clipPath>
  </defs>`);

  // Top sand (fills from bottom of top chamber)
  const topChamberHeight = (neckY - neckHeight / 2) - topY;
  const topSandHeight = topChamberHeight * topFillPercent;
  const topSandY = (neckY - neckHeight / 2) - topSandHeight;

  if (topFillPercent > 0) {
    parts.push(`<rect
      x="${cx - glassWidth / 2}"
      y="${topSandY}"
      width="${glassWidth}"
      height="${topSandHeight}"
      fill="${sandColor}"
      clip-path="url(#top-chamber-${zone.replace(/\//g, '-')})"
    />`);
  }

  // Bottom sand (fills from bottom up)
  const bottomChamberHeight = bottomY - (neckY + neckHeight / 2);
  const bottomSandHeight = bottomChamberHeight * bottomFillPercent;

  if (bottomFillPercent > 0) {
    parts.push(`<rect
      x="${cx - glassWidth / 2}"
      y="${bottomY - bottomSandHeight}"
      width="${glassWidth}"
      height="${bottomSandHeight}"
      fill="${sandColor}"
      clip-path="url(#bottom-chamber-${zone.replace(/\//g, '-')})"
    />`);
  }

  // Falling sand particles (animated)
  // Create 3 particles at different positions in their fall
  const particleRadius = radius * 0.015;
  for (let i = 0; i < 3; i++) {
    const phase = (time.seconds * 3 + i * 20) % 60; // Stagger particles
    const fallProgress = phase / 60;
    const particleY = (neckY - neckHeight / 2) + (neckHeight + radius * 0.3) * fallProgress;

    if (topFillPercent > 0.05) { // Only show if there's sand to fall
      parts.push(`<circle
        cx="${cx + (Math.sin(i * 2) * neckWidth * 0.2)}"
        cy="${particleY}"
        r="${particleRadius}"
        fill="${sandColor}"
        class="hourglass-particle"
        style="animation-delay: ${i * 0.2}s"
      />`);
    }
  }

  // Neck stream (when sand is flowing)
  if (topFillPercent > 0.02 && bottomFillPercent < 0.98) {
    parts.push(`<line
      x1="${cx}" y1="${neckY - neckHeight / 2}"
      x2="${cx}" y2="${neckY + neckHeight / 2}"
      stroke="${sandColor}"
      stroke-width="${radius * 0.02}"
      class="hourglass-stream"
    />`);
  }

  // Frame ends (top and bottom caps)
  parts.push(`<rect
    x="${cx - glassWidth / 2 - radius * 0.05}"
    y="${topY - radius * 0.05}"
    width="${glassWidth + radius * 0.1}"
    height="${radius * 0.06}"
    fill="${frameColor}"
    rx="${radius * 0.02}"
  />`);
  parts.push(`<rect
    x="${cx - glassWidth / 2 - radius * 0.05}"
    y="${bottomY - radius * 0.01}"
    width="${glassWidth + radius * 0.1}"
    height="${radius * 0.06}"
    fill="${frameColor}"
    rx="${radius * 0.02}"
  />`);

  // Time display (subtle)
  parts.push(`<text
    x="${cx}" y="${bottomY + radius * 0.2}"
    font-family="'Futura', sans-serif"
    font-size="${radius * 0.1}"
    fill="${colors.dark}"
    text-anchor="middle"
    opacity="0.5"
  >:${String(60 - time.minutes).padStart(2, '0')}</text>`);

  return wrapFace(parts.join('\n'), { cx, cy, radius, faceId: meta.id, zone });
}

// ═══════════════════════════════════════════════════════════════════════════
// UPDATE
// ═══════════════════════════════════════════════════════════════════════════

export function update(clockEl, time, prevTime) {
  // For hourglass, re-render is simpler due to complex fill calculations
  // The CSS animations handle the particles
}

// ═══════════════════════════════════════════════════════════════════════════
// CSS
// ═══════════════════════════════════════════════════════════════════════════

export function getCSS() {
  return `
.hourglass-particle {
  animation: sand-fall 0.6s linear infinite;
}

@keyframes sand-fall {
  0% {
    opacity: 1;
    transform: translateY(0);
  }
  100% {
    opacity: 0.5;
    transform: translateY(20px);
  }
}

.hourglass-stream {
  animation: stream-flow 0.3s ease-in-out infinite alternate;
}

@keyframes stream-flow {
  0% { stroke-width: 2px; opacity: 0.8; }
  100% { stroke-width: 3px; opacity: 1; }
}

@media (prefers-reduced-motion: reduce) {
  .hourglass-particle, .hourglass-stream {
    animation: none;
  }
}
`;
}

export default { meta, render, update, getCSS };
