/**
 * Bauhaus World Clock Framework
 * Flip Clock Face (Split-Flap Display, 1890/1950s)
 *
 * Classic mechanical flip digit display.
 * Features:
 * - Dark background with cream/white digits
 * - HH:MM format with large split-flap panels
 * - Horizontal split line across each digit
 * - Subtle shadow/depth effect at the split
 * - Flip animation when digits change
 *
 * Inspired by airport/train station departure boards
 * and the iconic alarm clock from Groundhog Day.
 */

import { wrapFace, formatDigitalTime, getPaletteColors } from './FaceBase.js';

// ═══════════════════════════════════════════════════════════════════════════
// METADATA
// ═══════════════════════════════════════════════════════════════════════════

export const meta = {
  id: 'flip-clock',
  name: 'Flip Clock',
  era: '1950s',
  description: 'Retro split-flap display with mechanical flip animation',
  category: 'digital',
  preferredPalette: 'klee' // Dark, warm tones
};

// ═══════════════════════════════════════════════════════════════════════════
// RENDER
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Create a single flip digit panel
 */
function createDigitPanel(x, y, width, height, digit, colors, id) {
  const splitY = y + height / 2;
  const cornerRadius = width * 0.08;
  const fontSize = height * 0.75;
  const textY = y + height * 0.72;

  return `
    <g class="flip-digit" id="${id}" data-digit="${digit}">
      <!-- Top half -->
      <rect
        x="${x}" y="${y}"
        width="${width}" height="${height / 2}"
        rx="${cornerRadius}" ry="${cornerRadius}"
        fill="${colors.dark}"
      />
      <!-- Bottom half (slightly lighter for depth) -->
      <rect
        x="${x}" y="${splitY}"
        width="${width}" height="${height / 2}"
        rx="${cornerRadius}" ry="${cornerRadius}"
        fill="${colors.dark}"
        style="filter: brightness(1.1)"
      />
      <!-- Split line shadow -->
      <line
        x1="${x}" y1="${splitY}"
        x2="${x + width}" y2="${splitY}"
        stroke="rgba(0,0,0,0.4)"
        stroke-width="2"
      />
      <!-- Split line highlight -->
      <line
        x1="${x}" y1="${splitY + 1}"
        x2="${x + width}" y2="${splitY + 1}"
        stroke="rgba(255,255,255,0.1)"
        stroke-width="1"
      />
      <!-- Digit text -->
      <text
        x="${x + width / 2}" y="${textY}"
        font-family="'Futura', 'Helvetica Neue', sans-serif"
        font-size="${fontSize}"
        font-weight="bold"
        fill="${colors.light}"
        text-anchor="middle"
        class="flip-digit-text"
      >${digit}</text>
      <!-- Clip mask for top half text (optional enhancement) -->
    </g>
  `;
}

/**
 * Render the Flip Clock face
 */
export function render({ cx, cy, radius, time, palette = 'klee', zone = 'local' }) {
  const colors = getPaletteColors(palette);

  // Layout calculations
  const totalWidth = radius * 1.8;
  const digitWidth = totalWidth * 0.22;
  const digitHeight = radius * 1.2;
  const colonWidth = totalWidth * 0.08;
  const gap = totalWidth * 0.02;

  // Calculate positions for HH:MM layout
  const startX = cx - totalWidth / 2;
  const topY = cy - digitHeight / 2;

  const h1X = startX;
  const h2X = h1X + digitWidth + gap;
  const colonX = h2X + digitWidth + gap;
  const m1X = colonX + colonWidth + gap;
  const m2X = m1X + digitWidth + gap;

  const h1 = Math.floor(time.hours / 10);
  const h2 = time.hours % 10;
  const m1 = Math.floor(time.minutes / 10);
  const m2 = time.minutes % 10;

  const parts = [];

  // Background panel (darker surround)
  const bgPadding = radius * 0.15;
  parts.push(`<rect
    x="${startX - bgPadding}" y="${topY - bgPadding}"
    width="${totalWidth + bgPadding * 2}" height="${digitHeight + bgPadding * 2}"
    rx="${radius * 0.1}" ry="${radius * 0.1}"
    fill="${colors.dark}"
    opacity="0.95"
  />`);

  // Hour digits
  parts.push(createDigitPanel(h1X, topY, digitWidth, digitHeight, h1, colors, 'digit-h1'));
  parts.push(createDigitPanel(h2X, topY, digitWidth, digitHeight, h2, colors, 'digit-h2'));

  // Colon separator (two dots)
  const colonDotRadius = radius * 0.04;
  const colonCenterX = colonX + colonWidth / 2;
  parts.push(`<circle
    cx="${colonCenterX}" cy="${cy - digitHeight * 0.15}"
    r="${colonDotRadius}"
    fill="${colors.light}"
    class="flip-colon"
  />`);
  parts.push(`<circle
    cx="${colonCenterX}" cy="${cy + digitHeight * 0.15}"
    r="${colonDotRadius}"
    fill="${colors.light}"
    class="flip-colon"
  />`);

  // Minute digits
  parts.push(createDigitPanel(m1X, topY, digitWidth, digitHeight, m1, colors, 'digit-m1'));
  parts.push(createDigitPanel(m2X, topY, digitWidth, digitHeight, m2, colors, 'digit-m2'));

  // Optional: Small seconds indicator
  const secondsY = topY + digitHeight + radius * 0.08;
  parts.push(`<text
    x="${cx}" y="${secondsY}"
    font-family="'Futura', 'Helvetica Neue', sans-serif"
    font-size="${radius * 0.12}"
    fill="${colors.light}"
    opacity="0.5"
    text-anchor="middle"
    class="flip-seconds"
  >:${String(time.seconds).padStart(2, '0')}</text>`);

  return wrapFace(parts.join('\n'), { cx, cy, radius, faceId: meta.id, zone });
}

// ═══════════════════════════════════════════════════════════════════════════
// UPDATE (Differential DOM update)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Update the flip clock without rebuilding DOM
 * Triggers flip animation when digits change
 */
export function update(clockEl, time, prevTime) {
  const h1 = Math.floor(time.hours / 10);
  const h2 = time.hours % 10;
  const m1 = Math.floor(time.minutes / 10);
  const m2 = time.minutes % 10;

  const digits = [
    { id: 'digit-h1', value: h1 },
    { id: 'digit-h2', value: h2 },
    { id: 'digit-m1', value: m1 },
    { id: 'digit-m2', value: m2 }
  ];

  digits.forEach(({ id, value }) => {
    const digitEl = clockEl.querySelector(`#${id}`);
    if (digitEl) {
      const currentDigit = digitEl.getAttribute('data-digit');
      if (currentDigit !== String(value)) {
        // Update digit
        digitEl.setAttribute('data-digit', value);
        const textEl = digitEl.querySelector('.flip-digit-text');
        if (textEl) {
          textEl.textContent = value;
        }
        // Trigger flip animation class
        digitEl.classList.add('flipping');
        setTimeout(() => digitEl.classList.remove('flipping'), 300);
      }
    }
  });

  // Update seconds
  const secondsEl = clockEl.querySelector('.flip-seconds');
  if (secondsEl) {
    secondsEl.textContent = `:${String(time.seconds).padStart(2, '0')}`;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// CSS (Flip animation)
// ═══════════════════════════════════════════════════════════════════════════

export function getCSS() {
  return `
/* Flip Clock styles */
.flip-digit {
  transform-style: preserve-3d;
}

.flip-digit.flipping .flip-digit-text {
  animation: flipDigit 0.3s ease-out;
}

@keyframes flipDigit {
  0% {
    transform: rotateX(0deg);
    opacity: 1;
  }
  50% {
    transform: rotateX(-90deg);
    opacity: 0.5;
  }
  100% {
    transform: rotateX(0deg);
    opacity: 1;
  }
}

/* Colon blink */
.flip-colon {
  animation: colonBlink 1s ease-in-out infinite;
}

@keyframes colonBlink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0.3; }
}

@media (prefers-reduced-motion: reduce) {
  .flip-digit.flipping .flip-digit-text {
    animation: none;
  }
  .flip-colon {
    animation: none;
  }
}
`;
}

export default { meta, render, update, getCSS };
