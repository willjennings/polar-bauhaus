/**
 * Bauhaus World Clock Framework
 * Binary Clock Face
 *
 * Time displayed in binary format.
 * Features:
 * - 6 columns: H₁₀ H₁ : M₁₀ M₁ : S₁₀ S₁
 * - 4 rows per column representing 8/4/2/1
 * - Lit circles = 1, dim circles = 0
 * - Clean mathematical aesthetic
 */

import { wrapFace, toBinaryArray, getPaletteColors } from './FaceBase.js';

// ═══════════════════════════════════════════════════════════════════════════
// METADATA
// ═══════════════════════════════════════════════════════════════════════════

export const meta = {
  id: 'binary',
  name: 'Binary',
  era: 'Digital Age',
  description: 'Time in binary - mathematical elegance',
  category: 'digital',
  preferredPalette: 'bayer'
};

// ═══════════════════════════════════════════════════════════════════════════
// RENDER
// ═══════════════════════════════════════════════════════════════════════════

export function render({ cx, cy, radius, time, palette = 'bayer', zone = 'local' }) {
  const colors = getPaletteColors(palette);

  // Extract digits
  const h1 = Math.floor(time.hours / 10);
  const h2 = time.hours % 10;
  const m1 = Math.floor(time.minutes / 10);
  const m2 = time.minutes % 10;
  const s1 = Math.floor(time.seconds / 10);
  const s2 = time.seconds % 10;

  // Convert to binary arrays (4 bits each, but some columns need fewer)
  const columns = [
    { bits: toBinaryArray(h1, 2), label: 'H', max: 2 },  // 0-2
    { bits: toBinaryArray(h2, 4), label: '', max: 4 },   // 0-9
    { bits: toBinaryArray(m1, 3), label: 'M', max: 3 },  // 0-5
    { bits: toBinaryArray(m2, 4), label: '', max: 4 },   // 0-9
    { bits: toBinaryArray(s1, 3), label: 'S', max: 3 },  // 0-5
    { bits: toBinaryArray(s2, 4), label: '', max: 4 }    // 0-9
  ];

  // Layout
  const gridWidth = radius * 1.6;
  const gridHeight = radius * 1.4;
  const colWidth = gridWidth / 6;
  const rowHeight = gridHeight / 5; // 4 rows + labels
  const dotRadius = Math.min(colWidth, rowHeight) * 0.3;
  const startX = cx - gridWidth / 2;
  const startY = cy - gridHeight / 2;

  const parts = [];

  // Background
  parts.push(`<rect
    x="${startX - radius * 0.1}" y="${startY - radius * 0.1}"
    width="${gridWidth + radius * 0.2}" height="${gridHeight + radius * 0.15}"
    rx="${radius * 0.08}"
    fill="${colors.dark}"
  />`);

  // Render columns
  columns.forEach((col, colIdx) => {
    const colX = startX + colIdx * colWidth + colWidth / 2;

    // Column label (H, M, S)
    if (col.label) {
      parts.push(`<text
        x="${colX + colWidth * 0.25}" y="${startY + rowHeight * 0.6}"
        font-family="'Courier New', monospace"
        font-size="${radius * 0.1}"
        fill="${colors.light}"
        opacity="0.5"
        text-anchor="middle"
      >${col.label}</text>`);
    }

    // Binary dots (4 rows, but only show needed bits)
    const fullBits = toBinaryArray(col.bits.reduce((acc, b, i) => acc + b * Math.pow(2, col.bits.length - 1 - i), 0), 4);

    for (let row = 0; row < 4; row++) {
      const rowY = startY + (row + 1) * rowHeight + rowHeight * 0.3;
      const bitValue = fullBits[row];
      const bitWeight = Math.pow(2, 3 - row); // 8, 4, 2, 1

      // Only show dots that are possible for this column
      const maxValue = colIdx % 2 === 0 ?
        (colIdx === 0 ? 2 : colIdx === 2 || colIdx === 4 ? 5 : 9) :
        9;
      const needed = bitWeight <= maxValue;

      if (needed) {
        parts.push(`<circle
          cx="${colX}" cy="${rowY}"
          r="${dotRadius}"
          fill="${bitValue ? colors.accent : colors.light}"
          opacity="${bitValue ? 1 : 0.15}"
          class="binary-dot"
          data-col="${colIdx}" data-row="${row}"
        />`);
      }
    }
  });

  // Row labels (8, 4, 2, 1) on the left
  [8, 4, 2, 1].forEach((val, idx) => {
    const rowY = startY + (idx + 1) * rowHeight + rowHeight * 0.35;
    parts.push(`<text
      x="${startX - radius * 0.08}" y="${rowY}"
      font-family="'Courier New', monospace"
      font-size="${radius * 0.08}"
      fill="${colors.light}"
      opacity="0.3"
      text-anchor="end"
      dominant-baseline="middle"
    >${val}</text>`);
  });

  return wrapFace(parts.join('\n'), { cx, cy, radius, faceId: meta.id, zone });
}

// ═══════════════════════════════════════════════════════════════════════════
// UPDATE
// ═══════════════════════════════════════════════════════════════════════════

export function update(clockEl, time, prevTime) {
  // Update each dot based on new time
  const h1 = Math.floor(time.hours / 10);
  const h2 = time.hours % 10;
  const m1 = Math.floor(time.minutes / 10);
  const m2 = time.minutes % 10;
  const s1 = Math.floor(time.seconds / 10);
  const s2 = time.seconds % 10;

  const values = [h1, h2, m1, m2, s1, s2];
  const bits = values.map(v => toBinaryArray(v, 4));

  const dots = clockEl.querySelectorAll('.binary-dot');
  dots.forEach(dot => {
    const col = parseInt(dot.getAttribute('data-col'));
    const row = parseInt(dot.getAttribute('data-row'));
    if (!isNaN(col) && !isNaN(row) && bits[col]) {
      const isOn = bits[col][row] === 1;
      dot.setAttribute('opacity', isOn ? '1' : '0.15');
      // Color change would require accessing palette
    }
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// CSS
// ═══════════════════════════════════════════════════════════════════════════

export function getCSS() {
  return `
.binary-dot {
  transition: opacity 0.15s ease-out, fill 0.15s ease-out;
}

@media (prefers-reduced-motion: reduce) {
  .binary-dot {
    transition: none;
  }
}
`;
}

export default { meta, render, update, getCSS };
