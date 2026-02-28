/**
 * Bauhaus World Clock Framework
 * Skeleton Watch Face (Haute Horlogerie)
 *
 * The visible mechanism as design.
 * Features:
 * - Transparent background
 * - Interlocking gear wheels
 * - Large gear at hour speed
 * - Smaller gear at minute speed
 * - Escape wheel ticking at second speed
 * - Bridge plates connecting axles
 * - Metallic silver/gold colors
 */

import { wrapFace, pointOnCircle, createGearPath, getPaletteColors } from './FaceBase.js';
import { getHandAngles } from '../core/ClockEngine.js';

// ═══════════════════════════════════════════════════════════════════════════
// METADATA
// ═══════════════════════════════════════════════════════════════════════════

export const meta = {
  id: 'skeleton',
  name: 'Skeleton',
  era: 'Haute Horlogerie',
  description: 'Visible mechanism - engineering as art',
  category: 'mechanical',
  preferredPalette: 'moholy'
};

// ═══════════════════════════════════════════════════════════════════════════
// GEAR GENERATOR
// ═══════════════════════════════════════════════════════════════════════════

function createGear(cx, cy, innerRadius, outerRadius, teeth, rotation, id, colors) {
  const points = [];
  const angleStep = 360 / (teeth * 2);

  for (let i = 0; i < teeth * 2; i++) {
    const baseAngle = i * angleStep + rotation;
    const r = i % 2 === 0 ? outerRadius : innerRadius;
    const point = pointOnCircle(cx, cy, r, baseAngle);
    points.push(`${point.x},${point.y}`);
  }

  return `
    <g id="${id}" class="skeleton-gear" transform="rotate(0 ${cx} ${cy})">
      <!-- Gear teeth -->
      <polygon
        points="${points.join(' ')}"
        fill="none"
        stroke="${colors.primary}"
        stroke-width="1.5"
      />
      <!-- Gear body -->
      <circle
        cx="${cx}" cy="${cy}"
        r="${innerRadius * 0.85}"
        fill="${colors.light}"
        stroke="${colors.secondary}"
        stroke-width="1"
        opacity="0.3"
      />
      <!-- Spokes -->
      ${[0, 60, 120, 180, 240, 300].map(angle => {
        const inner = pointOnCircle(cx, cy, innerRadius * 0.2, angle);
        const outer = pointOnCircle(cx, cy, innerRadius * 0.75, angle);
        return `<line x1="${inner.x}" y1="${inner.y}" x2="${outer.x}" y2="${outer.y}" stroke="${colors.secondary}" stroke-width="2" />`;
      }).join('')}
      <!-- Axle hole -->
      <circle
        cx="${cx}" cy="${cy}"
        r="${innerRadius * 0.15}"
        fill="${colors.dark}"
        stroke="${colors.primary}"
        stroke-width="1"
      />
      <!-- Jewel bearing -->
      <circle
        cx="${cx}" cy="${cy}"
        r="${innerRadius * 0.08}"
        fill="#c41e3a"
        opacity="0.8"
      />
    </g>
  `;
}

// ═══════════════════════════════════════════════════════════════════════════
// RENDER
// ═══════════════════════════════════════════════════════════════════════════

export function render({ cx, cy, radius, time, palette = 'moholy', zone = 'local' }) {
  const colors = getPaletteColors(palette);
  const angles = getHandAngles(time, true);

  // Gear sizes and positions
  const mainGearRadius = radius * 0.35;
  const secondGearRadius = radius * 0.25;
  const escapeWheelRadius = radius * 0.15;

  // Gear positions (arranged for visual interest)
  const mainGearX = cx - radius * 0.15;
  const mainGearY = cy + radius * 0.1;

  const secondGearX = cx + radius * 0.25;
  const secondGearY = cy - radius * 0.15;

  const escapeX = cx + radius * 0.1;
  const escapeY = cy + radius * 0.35;

  // Calculate gear rotations based on time
  // Hour gear: 1 rotation per 12 hours
  const hourGearRotation = (angles.hour / 360) * 360;
  // Minute gear: 1 rotation per hour (interlocked, counter-rotation)
  const minuteGearRotation = -(angles.minute / 360) * 360 * 2;
  // Escape wheel: ticks with seconds
  const escapeRotation = angles.second * 2;

  const parts = [];

  // Transparent backing plate
  parts.push(`<circle
    cx="${cx}" cy="${cy}" r="${radius * 0.95}"
    fill="${colors.light}"
    opacity="0.1"
    stroke="${colors.dark}"
    stroke-width="${radius * 0.01}"
  />`);

  // Bridge plates (connect the gears)
  parts.push(`<path
    d="M ${mainGearX} ${mainGearY}
       Q ${cx} ${cy - radius * 0.1} ${secondGearX} ${secondGearY}
       L ${secondGearX + radius * 0.1} ${secondGearY}
       Q ${cx + radius * 0.05} ${cy} ${mainGearX - radius * 0.1} ${mainGearY}
       Z"
    fill="${colors.secondary}"
    opacity="0.4"
    stroke="${colors.dark}"
    stroke-width="1"
  />`);

  parts.push(`<path
    d="M ${mainGearX} ${mainGearY}
       Q ${cx - radius * 0.1} ${cy + radius * 0.2} ${escapeX} ${escapeY}
       L ${escapeX + radius * 0.08} ${escapeY}
       Q ${cx} ${cy + radius * 0.15} ${mainGearX + radius * 0.1} ${mainGearY}
       Z"
    fill="${colors.secondary}"
    opacity="0.4"
    stroke="${colors.dark}"
    stroke-width="1"
  />`);

  // Main gear (hour - largest, slowest)
  parts.push(`<g transform="rotate(${hourGearRotation} ${mainGearX} ${mainGearY})" class="skeleton-hour-gear">
    ${createGear(mainGearX, mainGearY, mainGearRadius * 0.75, mainGearRadius, 24, 0, 'gear-hour', colors)}
  </g>`);

  // Second gear (minute - medium, counter-rotating)
  parts.push(`<g transform="rotate(${minuteGearRotation} ${secondGearX} ${secondGearY})" class="skeleton-minute-gear">
    ${createGear(secondGearX, secondGearY, secondGearRadius * 0.7, secondGearRadius, 18, 0, 'gear-minute', colors)}
  </g>`);

  // Escape wheel (seconds - small, fast)
  parts.push(`<g transform="rotate(${escapeRotation} ${escapeX} ${escapeY})" class="skeleton-escape-wheel">
    ${createGear(escapeX, escapeY, escapeWheelRadius * 0.6, escapeWheelRadius, 12, 0, 'gear-escape', colors)}
  </g>`);

  // Hour markers around the edge
  for (let i = 0; i < 12; i++) {
    const angle = i * 30;
    const pos = pointOnCircle(cx, cy, radius * 0.88, angle);
    const innerPos = pointOnCircle(cx, cy, radius * 0.82, angle);

    parts.push(`<line
      x1="${innerPos.x}" y1="${innerPos.y}"
      x2="${pos.x}" y2="${pos.y}"
      stroke="${colors.dark}"
      stroke-width="${i % 3 === 0 ? radius * 0.015 : radius * 0.008}"
    />`);
  }

  // Hands (thin, elegant)
  parts.push(`<g
    id="hand-hour"
    class="bauhaus-clock-hand skeleton-hand"
    transform="rotate(${angles.hour} ${cx} ${cy})"
  >
    <line
      x1="${cx}" y1="${cy + radius * 0.05}"
      x2="${cx}" y2="${cy - radius * 0.45}"
      stroke="${colors.dark}"
      stroke-width="${radius * 0.02}"
    />
  </g>`);

  parts.push(`<g
    id="hand-minute"
    class="bauhaus-clock-hand skeleton-hand"
    transform="rotate(${angles.minute} ${cx} ${cy})"
  >
    <line
      x1="${cx}" y1="${cy + radius * 0.05}"
      x2="${cx}" y2="${cy - radius * 0.65}"
      stroke="${colors.dark}"
      stroke-width="${radius * 0.015}"
    />
  </g>`);

  parts.push(`<g
    id="hand-second"
    class="bauhaus-clock-hand skeleton-hand"
    transform="rotate(${angles.second} ${cx} ${cy})"
  >
    <line
      x1="${cx}" y1="${cy + radius * 0.1}"
      x2="${cx}" y2="${cy - radius * 0.75}"
      stroke="${colors.accent}"
      stroke-width="${radius * 0.008}"
    />
  </g>`);

  // Center arbor
  parts.push(`<circle
    cx="${cx}" cy="${cy}"
    r="${radius * 0.03}"
    fill="${colors.dark}"
    stroke="${colors.primary}"
    stroke-width="${radius * 0.005}"
  />`);

  return wrapFace(parts.join('\n'), { cx, cy, radius, faceId: meta.id, zone });
}

// ═══════════════════════════════════════════════════════════════════════════
// UPDATE
// ═══════════════════════════════════════════════════════════════════════════

export function update(clockEl, time, prevTime) {
  const angles = getHandAngles(time, true);

  // Update hands
  ['hour', 'minute', 'second'].forEach(type => {
    const hand = clockEl.querySelector(`#hand-${type}`);
    if (hand) {
      const transform = hand.getAttribute('transform');
      const match = transform.match(/rotate\([\d.-]+\s+([\d.]+)\s+([\d.]+)\)/);
      if (match) {
        hand.setAttribute('transform', `rotate(${angles[type]} ${match[1]} ${match[2]})`);
      }
    }
  });

  // The gear rotations would need recalculation - for now handled via full render
}

// ═══════════════════════════════════════════════════════════════════════════
// CSS
// ═══════════════════════════════════════════════════════════════════════════

export function getCSS() {
  return `
.skeleton-gear {
  will-change: transform;
}

.skeleton-hour-gear {
  transition: transform 1s linear;
}

.skeleton-minute-gear {
  transition: transform 0.5s linear;
}

.skeleton-escape-wheel {
  transition: transform 0.1s linear;
}

.skeleton-hand {
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

@media (prefers-reduced-motion: reduce) {
  .skeleton-gear, .skeleton-hand,
  .skeleton-hour-gear, .skeleton-minute-gear, .skeleton-escape-wheel {
    transition: none;
  }
}
`;
}

export default { meta, render, update, getCSS };
