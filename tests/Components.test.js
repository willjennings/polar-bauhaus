/**
 * Bauhaus World Clock Framework
 * Components Unit Tests
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

import {
  createHand,
  createAllHands,
  createMarkers,
  createMixedMarkers,
  createClockFace,
  createClockLabel,
  getLabelPosition,
  createSingleClock,
  createStandaloneClock
} from '../src/components/index.js';

// ═══════════════════════════════════════════════════════════════════════════
// HAND TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe('Hand component', () => {
  it('should create line hand', () => {
    const svg = createHand({
      type: 'hour',
      cx: 100, cy: 100,
      length: 40,
      angle: 90,
      style: 'line'
    });
    assert.ok(svg.includes('<g'));
    assert.ok(svg.includes('<line'));
    assert.ok(svg.includes('rotate(90'));
  });

  it('should create triangle hand', () => {
    const svg = createHand({
      type: 'minute',
      cx: 100, cy: 100,
      length: 60,
      angle: 180,
      style: 'triangle'
    });
    assert.ok(svg.includes('<polygon'));
  });

  it('should create all three hands', () => {
    const time = { hours: 3, minutes: 15, seconds: 30, milliseconds: 0 };
    const svg = createAllHands({
      cx: 100, cy: 100, radius: 50,
      time
    });
    assert.ok(svg.includes('hand-hour'));
    assert.ok(svg.includes('hand-minute'));
    assert.ok(svg.includes('hand-second'));
  });

  it('should hide second hand when configured', () => {
    const time = { hours: 12, minutes: 0, seconds: 0, milliseconds: 0 };
    const svg = createAllHands({
      cx: 100, cy: 100, radius: 50,
      time,
      config: { showSecond: false }
    });
    assert.ok(!svg.includes('hand-second'));
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// MARKERS TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe('Markers component', () => {
  it('should create 12 line markers', () => {
    const svg = createMarkers({
      cx: 100, cy: 100, radius: 50,
      style: 'line',
      count: 12
    });
    assert.ok(svg.includes('bauhaus-markers'));
    assert.ok(svg.includes('<line'));
  });

  it('should create 4 dot markers', () => {
    const svg = createMarkers({
      cx: 100, cy: 100, radius: 50,
      style: 'dot',
      count: 4
    });
    assert.ok(svg.includes('<circle'));
  });

  it('should return empty for none style', () => {
    const svg = createMarkers({
      cx: 100, cy: 100, radius: 50,
      style: 'none'
    });
    assert.strictEqual(svg, '');
  });

  it('should create mixed markers', () => {
    const svg = createMixedMarkers({
      cx: 100, cy: 100, radius: 50,
      cardinal: { style: 'line' },
      regular: { style: 'dot' }
    });
    assert.ok(svg.includes('bauhaus-markers-cardinal'));
    assert.ok(svg.includes('bauhaus-markers-regular'));
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// CLOCK FACE TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe('ClockFace component', () => {
  it('should create circle face', () => {
    const svg = createClockFace({
      cx: 100, cy: 100, radius: 50,
      shape: 'circle'
    });
    assert.ok(svg.includes('bauhaus-clock-face'));
    assert.ok(svg.includes('<circle'));
  });

  it('should create square face', () => {
    const svg = createClockFace({
      cx: 100, cy: 100, radius: 50,
      shape: 'square'
    });
    assert.ok(svg.includes('<rect'));
  });

  it('should include markers', () => {
    const svg = createClockFace({
      cx: 100, cy: 100, radius: 50,
      markers: { style: 'line', count: 12 }
    });
    assert.ok(svg.includes('bauhaus-markers'));
  });

  it('should include numerals when configured', () => {
    const svg = createClockFace({
      cx: 100, cy: 100, radius: 50,
      numerals: { style: 'cardinal' }
    });
    assert.ok(svg.includes('bauhaus-numerals'));
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// LABEL TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe('Label component', () => {
  it('should create city label', () => {
    const svg = createClockLabel({
      x: 100, y: 150,
      zone: 'America/New_York'
    });
    assert.ok(svg.includes('NEW YORK'));
    assert.ok(svg.includes('bauhaus-clock-label'));
  });

  it('should show time when configured', () => {
    const svg = createClockLabel({
      x: 100, y: 150,
      zone: 'local',
      showTime: true,
      time: { hours: 14, minutes: 30 }
    });
    assert.ok(svg.includes('14:30'));
  });

  it('should calculate label position below clock', () => {
    const pos = getLabelPosition({
      cx: 100, cy: 100, radius: 50,
      position: 'below'
    });
    assert.ok(pos.y > 150);
  });

  it('should calculate label position above clock', () => {
    const pos = getLabelPosition({
      cx: 100, cy: 100, radius: 50,
      position: 'above'
    });
    assert.ok(pos.y < 50);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// SINGLE CLOCK TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe('SingleClock component', () => {
  it('should create complete clock', () => {
    const svg = createSingleClock({
      cx: 100, cy: 100, radius: 50,
      zone: 'local'
    });
    assert.ok(svg.includes('bauhaus-single-clock'));
    assert.ok(svg.includes('bauhaus-clock-face'));
    assert.ok(svg.includes('hand-hour'));
    assert.ok(svg.includes('hand-minute'));
  });

  it('should include zone data attribute', () => {
    const svg = createSingleClock({
      cx: 100, cy: 100, radius: 50,
      zone: 'Europe/London'
    });
    assert.ok(svg.includes('data-zone="Europe/London"'));
  });

  it('should create standalone SVG', () => {
    const svg = createStandaloneClock({
      width: 200,
      height: 240,
      zone: 'Asia/Tokyo'
    });
    assert.ok(svg.includes('<svg'));
    assert.ok(svg.includes('viewBox'));
    assert.ok(svg.includes('<style>'));
    assert.ok(svg.includes('Asia/Tokyo'));
  });

  it('should apply theme configuration', () => {
    const svg = createSingleClock({
      cx: 100, cy: 100, radius: 50,
      zone: 'local',
      config: {
        theme: { palette: 'kandinsky' },
        clock: { face: 'square' }
      }
    });
    assert.ok(svg.includes('<rect')); // Square face
  });
});
