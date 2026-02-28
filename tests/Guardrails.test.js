/**
 * Bauhaus World Clock Framework
 * Guardrails Unit Tests
 *
 * Tests the validation system that enforces Bauhaus design constraints.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

import {
  Guardrails,
  ValidationResult,
  ColorGuardrails,
  ShapeGuardrails,
  ProportionGuardrails,
  LayoutGuardrails,
  VALID_ANGLES,
  VALID_PRIMITIVES,
  MIN_CLOCK_SIZE,
  MAX_CLOCKS,
  MAX_COLORS
} from '../src/core/Guardrails.js';

// ═══════════════════════════════════════════════════════════════════════════
// VALIDATION RESULT TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe('ValidationResult', () => {
  it('should start valid with no errors or warnings', () => {
    const result = new ValidationResult();
    assert.strictEqual(result.valid, true);
    assert.deepStrictEqual(result.errors, []);
    assert.deepStrictEqual(result.warnings, []);
    assert.deepStrictEqual(result.corrections, {});
  });

  it('should become invalid when error is added', () => {
    const result = new ValidationResult();
    result.addError('Test error');
    assert.strictEqual(result.valid, false);
    assert.strictEqual(result.errors.length, 1);
    assert.strictEqual(result.errors[0], 'Test error');
  });

  it('should remain valid when warning is added', () => {
    const result = new ValidationResult();
    result.addWarning('Test warning');
    assert.strictEqual(result.valid, true);
    assert.strictEqual(result.warnings.length, 1);
  });

  it('should track corrections with metadata', () => {
    const result = new ValidationResult();
    result.addCorrection('field', 'original', 'corrected', 'reason');
    assert.strictEqual(result.valid, true);
    assert.strictEqual(result.warnings.length, 1);
    assert.deepStrictEqual(result.corrections.field, {
      original: 'original',
      corrected: 'corrected',
      reason: 'reason'
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// COLOR GUARDRAILS TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe('ColorGuardrails', () => {
  describe('isValidHexColor', () => {
    it('should accept valid 6-digit hex colors', () => {
      assert.strictEqual(ColorGuardrails.isValidHexColor('#FF0000'), true);
      assert.strictEqual(ColorGuardrails.isValidHexColor('#000000'), true);
      assert.strictEqual(ColorGuardrails.isValidHexColor('#FFFFFF'), true);
      assert.strictEqual(ColorGuardrails.isValidHexColor('#abcdef'), true);
    });

    it('should accept valid 3-digit hex colors', () => {
      assert.strictEqual(ColorGuardrails.isValidHexColor('#F00'), true);
      assert.strictEqual(ColorGuardrails.isValidHexColor('#000'), true);
      assert.strictEqual(ColorGuardrails.isValidHexColor('#abc'), true);
    });

    it('should reject invalid colors', () => {
      assert.strictEqual(ColorGuardrails.isValidHexColor('red'), false);
      assert.strictEqual(ColorGuardrails.isValidHexColor('rgb(255,0,0)'), false);
      assert.strictEqual(ColorGuardrails.isValidHexColor('#GGGGGG'), false);
      assert.strictEqual(ColorGuardrails.isValidHexColor('FF0000'), false);
      assert.strictEqual(ColorGuardrails.isValidHexColor('#FF00'), false);
      assert.strictEqual(ColorGuardrails.isValidHexColor(null), false);
      assert.strictEqual(ColorGuardrails.isValidHexColor(123), false);
    });
  });

  describe('validatePalette', () => {
    it('should accept valid palette with 5 or fewer colors', () => {
      const palette = {
        primary: '#FF0000',
        secondary: '#00FF00',
        accent: '#0000FF',
        dark: '#000000',
        light: '#FFFFFF'
      };
      const result = ColorGuardrails.validatePalette(palette);
      assert.strictEqual(result.valid, true);
    });

    it('should only validate known color keys', () => {
      // Palette with extra unknown keys should still be valid
      // because only primary, secondary, accent, dark, light are checked
      const palette = {
        name: 'test',
        primary: '#FF0000',
        secondary: '#00FF00',
        accent: '#0000FF',
        dark: '#000000',
        light: '#FFFFFF',
        extra: '#AABBCC' // This is ignored
      };
      const result = ColorGuardrails.validatePalette(palette);
      assert.strictEqual(result.valid, true);
    });

    it('should reject invalid hex colors in palette', () => {
      const palette = {
        primary: 'red',
        secondary: '#00FF00'
      };
      const result = ColorGuardrails.validatePalette(palette);
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors[0].includes('Invalid color'));
    });

    it('should reject non-object palette', () => {
      const result = ColorGuardrails.validatePalette('mondrian');
      assert.strictEqual(result.valid, false);
    });
  });

  describe('validateBackground', () => {
    it('should accept light and dark backgrounds', () => {
      let result = ColorGuardrails.validateBackground('light');
      assert.strictEqual(result.valid, true);

      result = ColorGuardrails.validateBackground('dark');
      assert.strictEqual(result.valid, true);
    });

    it('should reject other background values', () => {
      const result = ColorGuardrails.validateBackground('gradient');
      assert.strictEqual(result.valid, false);
    });
  });

  describe('checkAdjacentColors', () => {
    it('should return empty array when no adjacent colors match', () => {
      const assignments = {
        face: '#FFFFFF',
        hand: '#000000',
        marker: '#FF0000'
      };
      const violations = ColorGuardrails.checkAdjacentColors(assignments);
      assert.deepStrictEqual(violations, []);
    });

    it('should detect adjacent elements with same color', () => {
      const assignments = {
        face: '#FFFFFF',
        hand: '#FFFFFF',
        marker: '#FF0000'
      };
      const violations = ColorGuardrails.checkAdjacentColors(assignments);
      assert.strictEqual(violations.length, 1);
      assert.ok(violations[0].includes('face'));
      assert.ok(violations[0].includes('hand'));
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// SHAPE GUARDRAILS TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe('ShapeGuardrails', () => {
  describe('snapAngle', () => {
    it('should return exact valid angles unchanged', () => {
      VALID_ANGLES.forEach(angle => {
        assert.strictEqual(ShapeGuardrails.snapAngle(angle), angle);
      });
    });

    it('should snap to nearest valid angle', () => {
      assert.strictEqual(ShapeGuardrails.snapAngle(44), 45);
      assert.strictEqual(ShapeGuardrails.snapAngle(46), 45);
      assert.strictEqual(ShapeGuardrails.snapAngle(91), 90);
      assert.strictEqual(ShapeGuardrails.snapAngle(15), 0);
      assert.strictEqual(ShapeGuardrails.snapAngle(16), 30);
    });

    it('should normalize negative angles', () => {
      // -45 → 315 → snaps to 300 (closest valid angle)
      assert.strictEqual(ShapeGuardrails.snapAngle(-45), 300);
      // -90 → 270 (exact match)
      assert.strictEqual(ShapeGuardrails.snapAngle(-90), 270);
    });

    it('should normalize angles over 360', () => {
      assert.strictEqual(ShapeGuardrails.snapAngle(405), 45);
      assert.strictEqual(ShapeGuardrails.snapAngle(720), 0);
    });
  });

  describe('validateAngle', () => {
    it('should not add correction for valid angles', () => {
      const { value, result } = ShapeGuardrails.validateAngle(90);
      assert.strictEqual(value, 90);
      assert.strictEqual(result.warnings.length, 0);
    });

    it('should add correction for snapped angles', () => {
      const { value, result } = ShapeGuardrails.validateAngle(47);
      assert.strictEqual(value, 45);
      assert.strictEqual(result.warnings.length, 1);
      assert.ok(result.corrections.angle);
    });
  });

  describe('validateRadius', () => {
    it('should keep 0 as sharp corner', () => {
      const { value } = ShapeGuardrails.validateRadius(0);
      assert.strictEqual(value, 0);
    });

    it('should keep 0.5 as circle', () => {
      const { value } = ShapeGuardrails.validateRadius(0.5);
      assert.strictEqual(value, 0.5);
    });

    it('should snap low values to 0', () => {
      const { value, result } = ShapeGuardrails.validateRadius(0.1);
      assert.strictEqual(value, 0);
      assert.ok(result.corrections.radius);
    });

    it('should snap high values to 0.5', () => {
      const { value, result } = ShapeGuardrails.validateRadius(0.3);
      assert.strictEqual(value, 0.5);
      assert.ok(result.corrections.radius);
    });
  });

  describe('validateStrokeCap', () => {
    it('should accept butt and square caps', () => {
      let { value } = ShapeGuardrails.validateStrokeCap('butt');
      assert.strictEqual(value, 'butt');

      ({ value } = ShapeGuardrails.validateStrokeCap('square'));
      assert.strictEqual(value, 'square');
    });

    it('should reject and correct round caps', () => {
      const { value, result } = ShapeGuardrails.validateStrokeCap('round');
      assert.strictEqual(value, 'butt');
      assert.ok(result.corrections.strokeCap);
      assert.ok(result.warnings[0].includes('round caps not allowed'));
    });
  });

  describe('validatePrimitive', () => {
    it('should accept valid face primitives', () => {
      const { value } = ShapeGuardrails.validatePrimitive('face', 'circle');
      assert.strictEqual(value, 'circle');
    });

    it('should accept valid marker primitives', () => {
      VALID_PRIMITIVES.markers.forEach(marker => {
        const { value, result } = ShapeGuardrails.validatePrimitive('markers', marker);
        assert.strictEqual(value, marker);
        assert.strictEqual(result.valid, true);
      });
    });

    it('should accept valid hand primitives', () => {
      VALID_PRIMITIVES.hands.forEach(hand => {
        const { value, result } = ShapeGuardrails.validatePrimitive('hands', hand);
        assert.strictEqual(value, hand);
        assert.strictEqual(result.valid, true);
      });
    });

    it('should reject invalid primitive and return default', () => {
      const { value, result } = ShapeGuardrails.validatePrimitive('face', 'hexagon');
      assert.strictEqual(value, 'circle'); // First valid option
      assert.strictEqual(result.valid, false);
    });

    it('should error on unknown category', () => {
      const { value, result } = ShapeGuardrails.validatePrimitive('unknown', 'value');
      assert.strictEqual(value, null);
      assert.strictEqual(result.valid, false);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// PROPORTION GUARDRAILS TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe('ProportionGuardrails', () => {
  describe('clamp', () => {
    it('should return value within bounds unchanged', () => {
      assert.strictEqual(ProportionGuardrails.clamp(0.5, { min: 0, max: 1 }), 0.5);
    });

    it('should clamp to min when below', () => {
      assert.strictEqual(ProportionGuardrails.clamp(-0.5, { min: 0, max: 1 }), 0);
    });

    it('should clamp to max when above', () => {
      assert.strictEqual(ProportionGuardrails.clamp(1.5, { min: 0, max: 1 }), 1);
    });
  });

  describe('validateProportion', () => {
    it('should accept valid hour hand proportion', () => {
      const { value, result } = ProportionGuardrails.validateProportion('hour_hand', 0.5);
      assert.strictEqual(value, 0.5);
      assert.strictEqual(result.warnings.length, 0);
    });

    it('should clamp hour hand below minimum', () => {
      const { value, result } = ProportionGuardrails.validateProportion('hour_hand', 0.2);
      assert.strictEqual(value, 0.4); // min is 0.4
      assert.ok(result.corrections.hour_hand);
    });

    it('should clamp hour hand above maximum', () => {
      const { value, result } = ProportionGuardrails.validateProportion('hour_hand', 0.8);
      assert.strictEqual(value, 0.6); // max is 0.6
      assert.ok(result.corrections.hour_hand);
    });

    it('should accept valid minute hand proportion', () => {
      const { value } = ProportionGuardrails.validateProportion('minute_hand', 0.8);
      assert.strictEqual(value, 0.8);
    });

    it('should accept valid second hand proportion', () => {
      const { value } = ProportionGuardrails.validateProportion('second_hand', 0.85);
      assert.strictEqual(value, 0.85);
    });

    it('should accept valid marker inset', () => {
      const { value } = ProportionGuardrails.validateProportion('marker_inset', 0.9);
      assert.strictEqual(value, 0.9);
    });

    it('should warn on unknown proportion', () => {
      const { value, result } = ProportionGuardrails.validateProportion('unknown_prop', 0.5);
      assert.strictEqual(value, 0.5); // Unchanged
      assert.ok(result.warnings[0].includes('Unknown proportion'));
    });
  });

  describe('snapToRatio', () => {
    it('should snap to nearest valid ratio', () => {
      assert.strictEqual(ProportionGuardrails.snapToRatio(1.0), 1);
      assert.strictEqual(ProportionGuardrails.snapToRatio(0.55), 0.5);
      assert.strictEqual(ProportionGuardrails.snapToRatio(0.64), 0.618);
      assert.strictEqual(ProportionGuardrails.snapToRatio(1.9), 2);
    });
  });

  describe('validateClockSize', () => {
    it('should accept sizes at or above minimum', () => {
      const { value } = ProportionGuardrails.validateClockSize(MIN_CLOCK_SIZE);
      assert.strictEqual(value, MIN_CLOCK_SIZE);

      const { value: larger } = ProportionGuardrails.validateClockSize(200);
      assert.strictEqual(larger, 200);
    });

    it('should correct sizes below minimum', () => {
      const { value, result } = ProportionGuardrails.validateClockSize(50);
      assert.strictEqual(value, MIN_CLOCK_SIZE);
      assert.ok(result.corrections.clockSize);
      assert.ok(result.warnings[0].includes('touch targets'));
    });
  });

  describe('validateWeight', () => {
    it('should accept valid weights', () => {
      ['thin', 'medium', 'bold'].forEach(weight => {
        const { value, result } = ProportionGuardrails.validateWeight(weight);
        assert.strictEqual(value, weight);
        assert.strictEqual(result.valid, true);
      });
    });

    it('should reject invalid weight and default to medium', () => {
      const { value, result } = ProportionGuardrails.validateWeight('extra-bold');
      assert.strictEqual(value, 'medium');
      assert.strictEqual(result.valid, false);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// LAYOUT GUARDRAILS TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe('LayoutGuardrails', () => {
  describe('validateColumns', () => {
    it('should accept valid column counts', () => {
      [1, 2, 3, 4, 6].forEach(cols => {
        const { value, result } = LayoutGuardrails.validateColumns(cols);
        assert.strictEqual(value, cols);
        assert.strictEqual(result.warnings.length, 0);
      });
    });

    it('should correct invalid column count to nearest valid', () => {
      const { value, result } = LayoutGuardrails.validateColumns(5);
      assert.strictEqual(value, 4); // or 6, depending on which is closer
      assert.ok(result.corrections.columns);
    });

    it('should correct 7 columns to 6', () => {
      const { value } = LayoutGuardrails.validateColumns(7);
      assert.strictEqual(value, 6);
    });
  });

  describe('validateClockCount', () => {
    it('should accept valid clock counts', () => {
      const { value } = LayoutGuardrails.validateClockCount(5);
      assert.strictEqual(value, 5);
    });

    it('should clamp to maximum', () => {
      const { value, result } = LayoutGuardrails.validateClockCount(20);
      assert.strictEqual(value, MAX_CLOCKS);
      assert.ok(result.corrections.clockCount);
    });

    it('should enforce minimum of 1', () => {
      const { value, result } = LayoutGuardrails.validateClockCount(0);
      assert.strictEqual(value, 1);
      assert.ok(result.corrections.clockCount);
    });
  });

  describe('validateHierarchy', () => {
    it('should accept valid hierarchy modes', () => {
      ['equal', 'primary', 'cascade'].forEach(mode => {
        const { value, result } = LayoutGuardrails.validateHierarchy(mode);
        assert.strictEqual(value, mode);
        assert.strictEqual(result.valid, true);
      });
    });

    it('should reject invalid hierarchy and default to equal', () => {
      const { value, result } = LayoutGuardrails.validateHierarchy('random');
      assert.strictEqual(value, 'equal');
      assert.strictEqual(result.valid, false);
    });
  });

  describe('validateLabelPosition', () => {
    it('should accept valid label positions', () => {
      ['above', 'below', 'left', 'right', 'inside'].forEach(pos => {
        const { value, result } = LayoutGuardrails.validateLabelPosition(pos);
        assert.strictEqual(value, pos);
        assert.strictEqual(result.valid, true);
      });
    });

    it('should reject invalid position and default to below', () => {
      const { value, result } = LayoutGuardrails.validateLabelPosition('floating');
      assert.strictEqual(value, 'below');
      assert.strictEqual(result.valid, false);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// FULL CONFIG VALIDATION TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe('Guardrails.validateConfig', () => {
  it('should validate a complete valid config', () => {
    const config = {
      theme: {
        palette: {
          primary: '#FF0000',
          secondary: '#0000FF',
          accent: '#FFFF00',
          dark: '#000000',
          light: '#FFFFFF'
        },
        background: 'light',
        weight: 'medium'
      },
      clock: {
        face: 'circle',
        markers: { style: 'line' },
        hands: { hour: 'triangle', minute: 'line', second: 'line' },
        numerals: 'none',
        proportions: {
          hourHand: 0.5,
          minuteHand: 0.8,
          secondHand: 0.85,
          markerInset: 0.9
        }
      },
      layout: {
        columns: 3,
        hierarchy: 'equal',
        size: 120,
        labels: { position: 'below' }
      },
      zones: ['America/New_York', 'Europe/London', 'Asia/Tokyo']
    };

    const { result, corrected } = Guardrails.validateConfig(config);
    assert.strictEqual(result.valid, true);
    assert.strictEqual(result.errors.length, 0);
    assert.deepStrictEqual(corrected, config);
  });

  it('should auto-correct proportion values', () => {
    const config = {
      clock: {
        proportions: {
          hourHand: 0.2, // Below min (0.4)
          minuteHand: 1.0 // Above max (0.9)
        }
      }
    };

    const { result, corrected } = Guardrails.validateConfig(config);
    assert.strictEqual(corrected.clock.proportions.hourHand, 0.4);
    assert.strictEqual(corrected.clock.proportions.minuteHand, 0.9);
    assert.ok(result.warnings.length >= 2);
  });

  it('should auto-correct layout values', () => {
    const config = {
      layout: {
        columns: 5, // Invalid
        size: 50    // Below minimum
      }
    };

    const { result, corrected } = Guardrails.validateConfig(config);
    assert.strictEqual(corrected.layout.columns, 4); // or 6
    assert.strictEqual(corrected.layout.size, MIN_CLOCK_SIZE);
  });

  it('should truncate zones array if too many', () => {
    const zones = Array(15).fill('America/New_York');
    const config = { zones };

    const { corrected } = Guardrails.validateConfig(config);
    assert.strictEqual(corrected.zones.length, MAX_CLOCKS);
  });

  it('should report errors for invalid primitives', () => {
    const config = {
      clock: {
        face: 'hexagon',
        hands: { hour: 'arrow' }
      }
    };

    const { result } = Guardrails.validateConfig(config);
    assert.strictEqual(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('face')));
    assert.ok(result.errors.some(e => e.includes('hands')));
  });

  it('should report error for invalid weight', () => {
    const config = {
      theme: {
        weight: 'ultra-light'
      }
    };

    const { result, corrected } = Guardrails.validateConfig(config);
    assert.strictEqual(result.valid, false);
    assert.strictEqual(corrected.theme.weight, 'medium');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// STATIC METHODS TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe('Guardrails static methods', () => {
  describe('isValid', () => {
    it('should return true for valid config', () => {
      const config = {
        theme: { weight: 'bold' },
        clock: { face: 'square' }
      };
      assert.strictEqual(Guardrails.isValid(config), true);
    });

    it('should return false for invalid config', () => {
      const config = {
        clock: { face: 'pentagon' }
      };
      assert.strictEqual(Guardrails.isValid(config), false);
    });
  });

  describe('enforce', () => {
    it('should return corrected config when valid', () => {
      const config = {
        layout: { size: 50 } // Will be corrected
      };
      const corrected = Guardrails.enforce(config);
      assert.strictEqual(corrected.layout.size, MIN_CLOCK_SIZE);
    });

    it('should throw on uncorrectable errors', () => {
      const config = {
        clock: { face: 'star' }
      };
      assert.throws(() => Guardrails.enforce(config), /Configuration errors/);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS EXPORT TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe('Exported constants', () => {
  it('should export VALID_ANGLES', () => {
    assert.ok(Array.isArray(VALID_ANGLES));
    assert.ok(VALID_ANGLES.includes(0));
    assert.ok(VALID_ANGLES.includes(90));
    assert.ok(VALID_ANGLES.includes(45));
  });

  it('should export VALID_PRIMITIVES', () => {
    assert.ok(VALID_PRIMITIVES.face);
    assert.ok(VALID_PRIMITIVES.markers);
    assert.ok(VALID_PRIMITIVES.hands);
    assert.ok(VALID_PRIMITIVES.numerals);
  });

  it('should export MIN_CLOCK_SIZE', () => {
    assert.strictEqual(MIN_CLOCK_SIZE, 80);
  });

  it('should export MAX_CLOCKS', () => {
    assert.strictEqual(MAX_CLOCKS, 12);
  });

  it('should export MAX_COLORS', () => {
    assert.strictEqual(MAX_COLORS, 5);
  });
});
