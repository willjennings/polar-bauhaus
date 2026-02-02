/**
 * Bauhaus World Clock Framework
 * ClockEngine Unit Tests
 *
 * Tests time calculations, angle conversions, and timezone handling.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

import {
  getTimeForZone,
  getHandAngles,
  getHandEndpoint,
  getTimezoneInfo,
  formatTime,
  isDaytime,
  getTimeOfDay,
  degreesToRadians,
  clockAngleToSvgAngle
} from '../src/core/ClockEngine.js';

// ═══════════════════════════════════════════════════════════════════════════
// ANGLE CONVERSION TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe('Angle conversions', () => {
  describe('degreesToRadians', () => {
    it('should convert 0 degrees to 0 radians', () => {
      assert.strictEqual(degreesToRadians(0), 0);
    });

    it('should convert 180 degrees to PI radians', () => {
      assert.strictEqual(degreesToRadians(180), Math.PI);
    });

    it('should convert 360 degrees to 2*PI radians', () => {
      const result = degreesToRadians(360);
      assert.ok(Math.abs(result - 2 * Math.PI) < 0.0001);
    });

    it('should convert 90 degrees to PI/2 radians', () => {
      const result = degreesToRadians(90);
      assert.ok(Math.abs(result - Math.PI / 2) < 0.0001);
    });
  });

  describe('clockAngleToSvgAngle', () => {
    it('should convert 0 (12 oclock) to -90 (SVG top)', () => {
      assert.strictEqual(clockAngleToSvgAngle(0), -90);
    });

    it('should convert 90 (3 oclock) to 0 (SVG right)', () => {
      assert.strictEqual(clockAngleToSvgAngle(90), 0);
    });

    it('should convert 180 (6 oclock) to 90 (SVG bottom)', () => {
      assert.strictEqual(clockAngleToSvgAngle(180), 90);
    });

    it('should convert 270 (9 oclock) to 180 (SVG left)', () => {
      assert.strictEqual(clockAngleToSvgAngle(270), 180);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// TIME CALCULATION TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe('getTimeForZone', () => {
  it('should return time object for local zone', () => {
    const time = getTimeForZone('local');
    assert.ok(typeof time.hours === 'number');
    assert.ok(typeof time.minutes === 'number');
    assert.ok(typeof time.seconds === 'number');
    assert.ok(typeof time.milliseconds === 'number');
    assert.ok(typeof time.date === 'number'); // day of month
    assert.ok(typeof time.timestamp === 'number');
  });

  it('should return valid hour range', () => {
    const time = getTimeForZone('local');
    assert.ok(time.hours >= 0 && time.hours < 24);
  });

  it('should return valid minute range', () => {
    const time = getTimeForZone('local');
    assert.ok(time.minutes >= 0 && time.minutes < 60);
  });

  it('should return valid second range', () => {
    const time = getTimeForZone('local');
    assert.ok(time.seconds >= 0 && time.seconds < 60);
  });

  it('should return valid millisecond range', () => {
    const time = getTimeForZone('local');
    assert.ok(time.milliseconds >= 0 && time.milliseconds < 1000);
  });

  it('should handle IANA timezone', () => {
    const time = getTimeForZone('UTC');
    assert.ok(typeof time.hours === 'number');
    assert.ok(time.hours >= 0 && time.hours < 24);
  });

  it('should handle specific timezone', () => {
    const time = getTimeForZone('America/New_York');
    assert.ok(typeof time.hours === 'number');
    assert.ok(typeof time.minutes === 'number');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// HAND ANGLE TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe('getHandAngles', () => {
  it('should return angles for all three hands', () => {
    const time = { hours: 12, minutes: 0, seconds: 0, milliseconds: 0 };
    const angles = getHandAngles(time);

    assert.ok(typeof angles.hour === 'number');
    assert.ok(typeof angles.minute === 'number');
    assert.ok(typeof angles.second === 'number');
  });

  it('should return 0 degrees for all hands at 12:00:00', () => {
    const time = { hours: 12, minutes: 0, seconds: 0, milliseconds: 0 };
    const angles = getHandAngles(time, false);

    assert.strictEqual(angles.hour, 0);
    assert.strictEqual(angles.minute, 0);
    assert.strictEqual(angles.second, 0);
  });

  it('should return 90 degrees for minute hand at 15 minutes', () => {
    const time = { hours: 12, minutes: 15, seconds: 0, milliseconds: 0 };
    const angles = getHandAngles(time, false);

    assert.strictEqual(angles.minute, 90);
  });

  it('should return 180 degrees for minute hand at 30 minutes', () => {
    const time = { hours: 12, minutes: 30, seconds: 0, milliseconds: 0 };
    const angles = getHandAngles(time, false);

    assert.strictEqual(angles.minute, 180);
  });

  it('should return 90 degrees for hour hand at 3:00', () => {
    const time = { hours: 3, minutes: 0, seconds: 0, milliseconds: 0 };
    const angles = getHandAngles(time, false);

    assert.strictEqual(angles.hour, 90);
  });

  it('should return 180 degrees for hour hand at 6:00', () => {
    const time = { hours: 6, minutes: 0, seconds: 0, milliseconds: 0 };
    const angles = getHandAngles(time, false);

    assert.strictEqual(angles.hour, 180);
  });

  it('should account for minutes in hour hand position', () => {
    const time = { hours: 3, minutes: 30, seconds: 0, milliseconds: 0 };
    const angles = getHandAngles(time, false);

    // At 3:30, hour hand should be halfway between 3 and 4
    // 3:00 = 90 degrees, 4:00 = 120 degrees, so 3:30 = 105 degrees
    assert.strictEqual(angles.hour, 105);
  });

  it('should support smooth second animation', () => {
    const time = { hours: 12, minutes: 0, seconds: 30, milliseconds: 500 };
    const smoothAngles = getHandAngles(time, true);
    const discreteAngles = getHandAngles(time, false);

    // Smooth should account for milliseconds
    assert.ok(smoothAngles.second > discreteAngles.second);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// HAND ENDPOINT TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe('getHandEndpoint', () => {
  it('should return correct endpoint for 0 degrees (12 oclock)', () => {
    const { x, y } = getHandEndpoint(100, 100, 50, 0);

    // At 12 o'clock, endpoint should be directly above center
    assert.ok(Math.abs(x - 100) < 0.001);
    assert.ok(Math.abs(y - 50) < 0.001);
  });

  it('should return correct endpoint for 90 degrees (3 oclock)', () => {
    const { x, y } = getHandEndpoint(100, 100, 50, 90);

    // At 3 o'clock, endpoint should be to the right
    assert.ok(Math.abs(x - 150) < 0.001);
    assert.ok(Math.abs(y - 100) < 0.001);
  });

  it('should return correct endpoint for 180 degrees (6 oclock)', () => {
    const { x, y } = getHandEndpoint(100, 100, 50, 180);

    // At 6 o'clock, endpoint should be below center
    assert.ok(Math.abs(x - 100) < 0.001);
    assert.ok(Math.abs(y - 150) < 0.001);
  });

  it('should return correct endpoint for 270 degrees (9 oclock)', () => {
    const { x, y } = getHandEndpoint(100, 100, 50, 270);

    // At 9 o'clock, endpoint should be to the left
    assert.ok(Math.abs(x - 50) < 0.001);
    assert.ok(Math.abs(y - 100) < 0.001);
  });

  it('should respect hand length', () => {
    const short = getHandEndpoint(100, 100, 30, 0);
    const long = getHandEndpoint(100, 100, 60, 0);

    assert.ok(short.y > long.y); // Shorter hand ends closer to center
    assert.strictEqual(short.y, 70);
    assert.strictEqual(long.y, 40);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// TIMEZONE INFO TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe('getTimezoneInfo', () => {
  it('should return info for valid timezone', () => {
    const info = getTimezoneInfo('America/New_York');

    assert.strictEqual(info.timezone, 'America/New_York');
    assert.ok(typeof info.offset === 'number');
    assert.ok(typeof info.abbr === 'string');
    assert.ok(typeof info.city === 'string');
  });

  it('should extract city name', () => {
    const info = getTimezoneInfo('Europe/Paris');
    assert.strictEqual(info.city, 'Paris');
  });

  it('should handle underscores in city names', () => {
    const info = getTimezoneInfo('America/New_York');
    assert.strictEqual(info.city, 'New York');
  });

  it('should handle local timezone', () => {
    const info = getTimezoneInfo('local');
    assert.ok(info.timezone);
    assert.ok(typeof info.city === 'string');
  });

  it('should handle unknown timezone gracefully', () => {
    const info = getTimezoneInfo('Unknown/Zone');
    assert.strictEqual(info.timezone, 'Unknown/Zone');
    assert.strictEqual(info.city, 'Zone');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// TIME FORMATTING TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe('formatTime', () => {
  it('should format time as HH:MM', () => {
    const formatted = formatTime(14, 30);
    assert.strictEqual(formatted, '14:30');
  });

  it('should pad hours with zero', () => {
    const formatted = formatTime(9, 30);
    assert.strictEqual(formatted, '09:30');
  });

  it('should pad minutes with zero', () => {
    const formatted = formatTime(9, 5);
    assert.strictEqual(formatted, '09:05');
  });

  it('should handle midnight', () => {
    const formatted = formatTime(0, 0);
    assert.strictEqual(formatted, '00:00');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// DAY/NIGHT TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe('isDaytime', () => {
  it('should return true for noon', () => {
    assert.strictEqual(isDaytime(12), true);
  });

  it('should return true for 9am', () => {
    assert.strictEqual(isDaytime(9), true);
  });

  it('should return false for midnight', () => {
    assert.strictEqual(isDaytime(0), false);
  });

  it('should return false for 3am', () => {
    assert.strictEqual(isDaytime(3), false);
  });

  it('should return false for 10pm', () => {
    assert.strictEqual(isDaytime(22), false);
  });

  it('should return true at 6am (boundary)', () => {
    assert.strictEqual(isDaytime(6), true);
  });

  it('should return false at 6pm (boundary)', () => {
    assert.strictEqual(isDaytime(18), false);
  });
});

describe('getTimeOfDay', () => {
  it('should return night for late night hours', () => {
    assert.strictEqual(getTimeOfDay(2), 'night');
    assert.strictEqual(getTimeOfDay(4), 'night');
  });

  it('should return dawn for early morning', () => {
    assert.strictEqual(getTimeOfDay(5), 'dawn');
    assert.strictEqual(getTimeOfDay(7), 'dawn');
  });

  it('should return day for daytime hours', () => {
    assert.strictEqual(getTimeOfDay(8), 'day');
    assert.strictEqual(getTimeOfDay(12), 'day');
    assert.strictEqual(getTimeOfDay(16), 'day');
  });

  it('should return dusk for evening', () => {
    assert.strictEqual(getTimeOfDay(17), 'dusk');
    assert.strictEqual(getTimeOfDay(19), 'dusk');
  });

  it('should return night for late evening', () => {
    assert.strictEqual(getTimeOfDay(20), 'night');
    assert.strictEqual(getTimeOfDay(23), 'night');
  });
});
