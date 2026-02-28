/**
 * Bauhaus World Clock Framework
 * Word Clock Face (QLOCKTWO-inspired, 2009)
 *
 * Time displayed as illuminated words on a letter grid.
 * Features:
 * - 11×10 grid of letters
 * - Active words highlight to spell time: "IT IS TWENTY PAST THREE"
 * - Inactive letters at low opacity
 * - Four corner dots show minutes past the 5-minute mark
 * - Clean, typographic design
 */

import { wrapFace, getTimeWords, getPaletteColors } from './FaceBase.js';

// ═══════════════════════════════════════════════════════════════════════════
// METADATA
// ═══════════════════════════════════════════════════════════════════════════

export const meta = {
  id: 'word-clock',
  name: 'Word Clock',
  era: '2009',
  description: 'Time spelled out in illuminated words',
  category: 'digital',
  preferredPalette: 'bayer'
};

// Word grid - each row is a string, active words are extracted by position
const WORD_GRID = [
  'ITLISASAMPM',
  'ACQUARTERDC',
  'TWENTYFIVEX',
  'HALFBTENFTO',
  'PASTERUNINE',
  'ONESIXTHREE',
  'FOURFIVETWO',
  'EIGHTELEVEN',
  'SEVENTWELVE',
  'TENSEOCLOCK'
];

// Word positions: [row, startCol, word]
const WORD_POSITIONS = {
  'IT': [0, 0], 'IS': [0, 3],
  'A': [1, 0], 'QUARTER': [1, 2],
  'TWENTY': [2, 0], 'FIVE': [2, 6],
  'HALF': [3, 0], 'TEN': [3, 5], 'TO': [3, 9],
  'PAST': [4, 0],
  'NINE': [4, 7],
  'ONE': [5, 0], 'SIX': [5, 3], 'THREE': [5, 6],
  'FOUR': [6, 0], 'FIVE_HOUR': [6, 4], 'TWO': [6, 8],
  'EIGHT': [7, 0], 'ELEVEN': [7, 5],
  'SEVEN': [8, 0], 'TWELVE': [8, 5],
  'TEN_HOUR': [9, 0], 'OCLOCK': [9, 5]
};

// ═══════════════════════════════════════════════════════════════════════════
// RENDER
// ═══════════════════════════════════════════════════════════════════════════

export function render({ cx, cy, radius, time, palette = 'bayer', zone = 'local' }) {
  const colors = getPaletteColors(palette);
  const { words, minuteDots } = getTimeWords(time);

  const gridWidth = radius * 1.9;
  const gridHeight = radius * 1.7;
  const cellWidth = gridWidth / 11;
  const cellHeight = gridHeight / 10;
  const startX = cx - gridWidth / 2;
  const startY = cy - gridHeight / 2;
  const fontSize = Math.min(cellWidth, cellHeight) * 0.75;

  const parts = [];

  // Background
  parts.push(`<rect
    x="${startX - radius * 0.05}" y="${startY - radius * 0.05}"
    width="${gridWidth + radius * 0.1}" height="${gridHeight + radius * 0.1}"
    rx="${radius * 0.05}"
    fill="${colors.dark}"
  />`);

  // Build active letters set
  const activeLetters = new Set();
  words.forEach(word => {
    let wordKey = word.replace("'", '');
    if (wordKey === 'FIVE' && words.includes('PAST') || wordKey === 'FIVE' && words.includes('TO')) {
      wordKey = 'FIVE'; // minute five
    } else if (wordKey === 'FIVE') {
      wordKey = 'FIVE_HOUR';
    }
    if (wordKey === 'TEN' && words.includes('PAST') || wordKey === 'TEN' && words.includes('TO')) {
      wordKey = 'TEN'; // minute ten
    } else if (wordKey === 'TEN' && words.includes("O'CLOCK")) {
      wordKey = 'TEN_HOUR';
    }
    if (wordKey === 'OCLOCK') wordKey = 'OCLOCK';

    const pos = WORD_POSITIONS[wordKey];
    if (pos) {
      const [row, col] = pos;
      const len = wordKey === 'FIVE_HOUR' ? 4 : wordKey === 'TEN_HOUR' ? 3 : wordKey.length;
      for (let i = 0; i < len; i++) {
        activeLetters.add(`${row}-${col + i}`);
      }
    }
  });

  // Render letter grid
  WORD_GRID.forEach((row, rowIdx) => {
    [...row].forEach((letter, colIdx) => {
      const x = startX + colIdx * cellWidth + cellWidth / 2;
      const y = startY + rowIdx * cellHeight + cellHeight * 0.7;
      const isActive = activeLetters.has(`${rowIdx}-${colIdx}`);

      parts.push(`<text
        x="${x}" y="${y}"
        font-family="'Futura', 'Helvetica Neue', sans-serif"
        font-size="${fontSize}"
        font-weight="bold"
        fill="${isActive ? colors.accent : colors.light}"
        opacity="${isActive ? 1 : 0.15}"
        text-anchor="middle"
        class="word-clock-letter${isActive ? ' active' : ''}"
      >${letter}</text>`);
    });
  });

  // Corner dots for extra minutes
  const dotRadius = radius * 0.025;
  const dotInset = radius * 0.08;
  const corners = [
    [startX + dotInset, startY + dotInset],
    [startX + gridWidth - dotInset, startY + dotInset],
    [startX + gridWidth - dotInset, startY + gridHeight - dotInset],
    [startX + dotInset, startY + gridHeight - dotInset]
  ];

  corners.forEach(([dx, dy], idx) => {
    const isLit = idx < minuteDots;
    parts.push(`<circle
      cx="${dx}" cy="${dy}"
      r="${dotRadius}"
      fill="${isLit ? colors.accent : colors.light}"
      opacity="${isLit ? 1 : 0.15}"
      class="word-clock-dot"
    />`);
  });

  return wrapFace(parts.join('\n'), { cx, cy, radius, faceId: meta.id, zone });
}

// ═══════════════════════════════════════════════════════════════════════════
// UPDATE
// ═══════════════════════════════════════════════════════════════════════════

export function update(clockEl, time, prevTime) {
  // For word clock, a full re-render is simpler since many letters may change
  // The transition is handled by CSS opacity transitions
  // In a production implementation, we'd diff the active letters
}

// ═══════════════════════════════════════════════════════════════════════════
// CSS
// ═══════════════════════════════════════════════════════════════════════════

export function getCSS() {
  return `
.word-clock-letter {
  transition: opacity 0.3s ease-out, fill 0.3s ease-out;
}

.word-clock-dot {
  transition: opacity 0.3s ease-out;
}

@media (prefers-reduced-motion: reduce) {
  .word-clock-letter, .word-clock-dot {
    transition: none;
  }
}
`;
}

export default { meta, render, update, getCSS };
