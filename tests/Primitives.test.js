/**
 * Bauhaus World Clock Framework
 * Primitives Unit Tests
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

import {
  createCircle,
  ClockCircle,
  createSquare,
  createCenteredSquare,
  ClockSquare,
  createTriangle,
  createHandTriangle,
  ClockTriangle,
  createLine,
  createRadialLine,
  createHandLine,
  ClockLine,
  createText,
  createNumeral,
  createLabel,
  BAUHAUS_FONTS,
  FONT_SIZES
} from '../src/primitives/index.js';

// ═══════════════════════════════════════════════════════════════════════════
// CIRCLE TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe('Circle primitive', () => {
  it('should create basic circle SVG', () => {
    const svg = createCircle({ cx: 50, cy: 50, r: 25 });
    assert.ok(svg.includes('<circle'));
    assert.ok(svg.includes('cx="50"'));
    assert.ok(svg.includes('cy="50"'));
    assert.ok(svg.includes('r="25"'));
  });

  it('should apply fill and stroke', () => {
    const svg = createCircle({
      cx: 0, cy: 0, r: 10,
      fill: '#FF0000',
      stroke: '#000000',
      strokeWidth: 2
    });
    assert.ok(svg.includes('fill="#FF0000"'));
    assert.ok(svg.includes('stroke="#000000"'));
    assert.ok(svg.includes('stroke-width="2"'));
  });

  it('should reject invalid colors', () => {
    const svg = createCircle({
      cx: 0, cy: 0, r: 10,
      fill: 'red' // Invalid - not hex
    });
    assert.ok(svg.includes('fill="none"'));
  });

  it('should create clock face circle', () => {
    const svg = ClockCircle.face(100, 100, 50);
    assert.ok(svg.includes('bauhaus-clock-face'));
    assert.ok(svg.includes('r="50"'));
  });

  it('should create pivot circle', () => {
    const svg = ClockCircle.pivot(100, 100, 5);
    assert.ok(svg.includes('bauhaus-clock-pivot'));
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// SQUARE TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe('Square primitive', () => {
  it('should create basic square SVG', () => {
    const svg = createSquare({ x: 10, y: 10, width: 50 });
    assert.ok(svg.includes('<rect'));
    assert.ok(svg.includes('x="10"'));
    assert.ok(svg.includes('width="50"'));
    assert.ok(svg.includes('height="50"'));
  });

  it('should create rectangle when height differs', () => {
    const svg = createSquare({ x: 0, y: 0, width: 100, height: 50 });
    assert.ok(svg.includes('width="100"'));
    assert.ok(svg.includes('height="50"'));
  });

  it('should snap rotation to valid Bauhaus angles', () => {
    const svg = createSquare({ x: 0, y: 0, width: 50, rotation: 47 });
    assert.ok(svg.includes('rotate(45')); // 47 snaps to 45
  });

  it('should create centered square', () => {
    const svg = createCenteredSquare({ cx: 50, cy: 50, size: 20 });
    assert.ok(svg.includes('x="40"')); // 50 - 20/2
    assert.ok(svg.includes('y="40"'));
  });

  it('should create clock face square', () => {
    const svg = ClockSquare.face(100, 100, 80);
    assert.ok(svg.includes('bauhaus-clock-face'));
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// TRIANGLE TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe('Triangle primitive', () => {
  it('should create basic triangle SVG', () => {
    const svg = createTriangle({ cx: 50, cy: 50, width: 20, height: 30 });
    assert.ok(svg.includes('<polygon'));
    assert.ok(svg.includes('points='));
  });

  it('should create triangle in different directions', () => {
    const up = createTriangle({ cx: 50, cy: 50, width: 20, height: 30, direction: 'up' });
    const down = createTriangle({ cx: 50, cy: 50, width: 20, height: 30, direction: 'down' });
    assert.notStrictEqual(up, down);
  });

  it('should snap rotation to valid angles', () => {
    const svg = createTriangle({ cx: 50, cy: 50, width: 20, height: 30, rotation: 91 });
    assert.ok(svg.includes('rotate(90')); // 91 snaps to 90
  });

  it('should create hand triangle', () => {
    const svg = createHandTriangle({ cx: 100, cy: 100, length: 50, width: 10, angle: 90 });
    assert.ok(svg.includes('<polygon'));
    assert.ok(svg.includes('rotate(90'));
  });

  it('should use miter join for sharp corners', () => {
    const svg = createTriangle({ cx: 50, cy: 50, width: 20, height: 30 });
    assert.ok(svg.includes('stroke-linejoin="miter"'));
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// LINE TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe('Line primitive', () => {
  it('should create basic line SVG', () => {
    const svg = createLine({ x1: 0, y1: 0, x2: 100, y2: 100 });
    assert.ok(svg.includes('<line'));
    assert.ok(svg.includes('x1="0"'));
    assert.ok(svg.includes('y2="100"'));
  });

  it('should enforce butt/square stroke caps only', () => {
    const roundSvg = createLine({
      x1: 0, y1: 0, x2: 100, y2: 0,
      strokeCap: 'round' // Should be corrected
    });
    assert.ok(roundSvg.includes('stroke-linecap="butt"'));

    const squareSvg = createLine({
      x1: 0, y1: 0, x2: 100, y2: 0,
      strokeCap: 'square'
    });
    assert.ok(squareSvg.includes('stroke-linecap="square"'));
  });

  it('should create radial line from center', () => {
    const svg = createRadialLine({
      cx: 100, cy: 100, length: 50, angle: 0
    });
    assert.ok(svg.includes('<line'));
    // At angle 0 (12 o'clock), y2 should be above cy
    assert.ok(svg.includes('y2="50"')); // 100 - 50
  });

  it('should create hand line with rotation group', () => {
    const svg = createHandLine({
      cx: 100, cy: 100, length: 40, angle: 90
    });
    assert.ok(svg.includes('<g'));
    assert.ok(svg.includes('rotate(90'));
    assert.ok(svg.includes('<line'));
  });

  it('should create clock marker line', () => {
    const svg = ClockLine.marker(100, 100, 40, 50, 0);
    assert.ok(svg.includes('bauhaus-clock-marker'));
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// TEXT TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe('Text primitive', () => {
  it('should create basic text SVG', () => {
    const svg = createText({ x: 50, y: 50, text: 'Hello' });
    assert.ok(svg.includes('<text'));
    assert.ok(svg.includes('>Hello</text>'));
  });

  it('should use Bauhaus font stack', () => {
    const svg = createText({ x: 0, y: 0, text: 'Test' });
    assert.ok(svg.includes('font-family='));
    assert.ok(svg.includes('Futura'));
  });

  it('should apply size from predefined scale', () => {
    const small = createText({ x: 0, y: 0, text: 'S', size: 'sm' });
    const large = createText({ x: 0, y: 0, text: 'L', size: 'lg' });
    assert.ok(small.includes(`font-size="${FONT_SIZES.sm}"`));
    assert.ok(large.includes(`font-size="${FONT_SIZES.lg}"`));
  });

  it('should default to md size for invalid size', () => {
    const svg = createText({ x: 0, y: 0, text: 'Test', size: 'invalid' });
    assert.ok(svg.includes(`font-size="${FONT_SIZES.md}"`));
  });

  it('should escape HTML entities', () => {
    const svg = createText({ x: 0, y: 0, text: '<script>' });
    assert.ok(svg.includes('&lt;script&gt;'));
  });

  it('should create clock numeral', () => {
    const svg = createNumeral({ cx: 100, cy: 100, radius: 40, hour: 12 });
    assert.ok(svg.includes('>12</text>'));
    assert.ok(svg.includes('bauhaus-clock-numeral'));
  });

  it('should position numerals correctly', () => {
    // Hour 3 should be to the right (x > cx)
    const svg = createNumeral({ cx: 100, cy: 100, radius: 40, hour: 3 });
    assert.ok(svg.includes('x="140"')); // 100 + 40
  });

  it('should create city label', () => {
    const svg = createLabel({ x: 100, y: 150, city: 'New York' });
    assert.ok(svg.includes('NEW YORK')); // Uppercase
    assert.ok(svg.includes('bauhaus-clock-label'));
  });

  it('should create label with time', () => {
    const svg = createLabel({ x: 100, y: 150, city: 'London', time: '14:30' });
    assert.ok(svg.includes('LONDON'));
    assert.ok(svg.includes('14:30'));
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// INTEGRATION TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe('Primitives integration', () => {
  it('should produce valid SVG that can be combined', () => {
    const face = ClockCircle.face(100, 100, 50);
    const hand = ClockLine.hand(100, 100, 40, 90);
    const pivot = ClockCircle.pivot(100, 100, 3);

    const combined = `<svg viewBox="0 0 200 200">${face}${hand}${pivot}</svg>`;
    assert.ok(combined.includes('<svg'));
    assert.ok(combined.includes('<circle'));
    assert.ok(combined.includes('<g'));
    assert.ok(combined.includes('<line'));
  });
});
