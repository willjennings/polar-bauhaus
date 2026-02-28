/**
 * Bauhaus World Clock Framework
 * Config Unit Tests
 *
 * Tests the configuration system including deep merge,
 * validation integration, and builder pattern.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

import { Config, ConfigBuilder, deepMerge } from '../src/core/Config.js';
import { PALETTES, DEFAULT_CONFIG } from '../src/themes/tokens.js';

// ═══════════════════════════════════════════════════════════════════════════
// DEEP MERGE TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe('deepMerge', () => {
  it('should merge flat objects', () => {
    const target = { a: 1, b: 2 };
    const source = { b: 3, c: 4 };
    const result = deepMerge(target, source);
    assert.deepStrictEqual(result, { a: 1, b: 3, c: 4 });
  });

  it('should merge nested objects', () => {
    const target = { a: { x: 1, y: 2 }, b: 3 };
    const source = { a: { y: 20, z: 30 } };
    const result = deepMerge(target, source);
    assert.deepStrictEqual(result, { a: { x: 1, y: 20, z: 30 }, b: 3 });
  });

  it('should replace arrays, not merge them', () => {
    const target = { arr: [1, 2, 3] };
    const source = { arr: [4, 5] };
    const result = deepMerge(target, source);
    assert.deepStrictEqual(result, { arr: [4, 5] });
  });

  it('should handle null source', () => {
    const target = { a: 1 };
    const result = deepMerge(target, null);
    assert.deepStrictEqual(result, { a: 1 });
  });

  it('should handle null target', () => {
    const source = { a: 1 };
    const result = deepMerge(null, source);
    assert.deepStrictEqual(result, { a: 1 });
  });

  it('should not mutate original objects', () => {
    const target = { a: { x: 1 } };
    const source = { a: { y: 2 } };
    deepMerge(target, source);
    assert.deepStrictEqual(target, { a: { x: 1 } });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// CONFIG CLASS TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe('Config', () => {
  describe('constructor', () => {
    it('should create config with defaults when no options', () => {
      const config = new Config();
      assert.ok(config.data);
      assert.strictEqual(config.data.theme.weight, 'medium');
    });

    it('should merge user config with defaults', () => {
      const config = new Config({
        theme: { weight: 'bold' }
      });
      assert.strictEqual(config.data.theme.weight, 'bold');
      // Other defaults should remain
      assert.strictEqual(config.data.clock.face, 'circle');
    });

    it('should resolve string palette to object', () => {
      const config = new Config({
        theme: { palette: 'kandinsky' }
      });
      assert.strictEqual(config.data.theme.palette.name, 'kandinsky');
      assert.ok(config.data.theme.palette.primary);
    });

    it('should freeze the config data', () => {
      const config = new Config();
      assert.ok(Object.isFrozen(config.data));
    });
  });

  describe('validation', () => {
    it('should be valid for correct config', () => {
      const config = new Config({
        theme: { weight: 'thin' },
        clock: { face: 'square' }
      });
      assert.strictEqual(config.isValid(), true);
      assert.strictEqual(config.getErrors().length, 0);
    });

    it('should auto-correct invalid values', () => {
      const config = new Config({
        layout: { size: 50 } // Below minimum
      }, { silent: true });
      assert.strictEqual(config.data.layout.size, 80);
      assert.ok(config.getWarnings().length > 0);
    });

    it('should throw in strict mode on errors', () => {
      assert.throws(() => {
        new Config({ clock: { face: 'hexagon' } }, { strict: true });
      }, /Configuration errors/);
    });

    it('should suppress warnings in silent mode', () => {
      // Just verify it doesn't throw
      const config = new Config({ layout: { size: 50 } }, { silent: true });
      assert.ok(config);
    });
  });

  describe('accessors', () => {
    it('should get full config', () => {
      const config = new Config();
      const data = config.get();
      assert.ok(data.theme);
      assert.ok(data.clock);
      assert.ok(data.layout);
    });

    it('should get theme', () => {
      const config = new Config({ theme: { weight: 'bold' } });
      assert.strictEqual(config.getTheme().weight, 'bold');
    });

    it('should get palette', () => {
      const config = new Config({ theme: { palette: 'albers' } });
      assert.strictEqual(config.getPalette().name, 'albers');
    });

    it('should get clock config', () => {
      const config = new Config({ clock: { face: 'square' } });
      assert.strictEqual(config.getClock().face, 'square');
    });

    it('should get layout', () => {
      const config = new Config({ layout: { columns: 4 } });
      assert.strictEqual(config.getLayout().columns, 4);
    });

    it('should get behavior', () => {
      const config = new Config({ behavior: { animate: false } });
      assert.strictEqual(config.getBehavior().animate, false);
    });

    it('should get zones with default', () => {
      const config = new Config();
      assert.deepStrictEqual(config.getZones(), ['local']);
    });

    it('should get custom zones', () => {
      const zones = ['America/New_York', 'Europe/London'];
      const config = new Config({ zones });
      assert.deepStrictEqual(config.getZones(), zones);
    });
  });

  describe('computed values', () => {
    it('should compute dimensions for given diameter', () => {
      const config = new Config({ theme: { weight: 'medium' } });
      const dims = config.getDimensions(200);

      assert.strictEqual(dims.diameter, 200);
      assert.strictEqual(dims.radius, 100);
      assert.strictEqual(dims.strokeWidth, 200 * 0.025);
      assert.strictEqual(dims.handWidth, 200 * 0.035);
    });

    it('should compute correct proportions for hands', () => {
      const config = new Config({
        clock: {
          proportions: {
            hourHand: 0.5,
            minuteHand: 0.8,
            secondHand: 0.85
          }
        }
      });
      const dims = config.getDimensions(200);

      assert.strictEqual(dims.hourHandLength, 100 * 0.5);
      assert.strictEqual(dims.minuteHandLength, 100 * 0.8);
      assert.strictEqual(dims.secondHandLength, 100 * 0.85);
    });

    it('should get colors for elements', () => {
      const config = new Config({ theme: { palette: 'mondrian' } });

      assert.strictEqual(config.getColor('face'), '#FFFFFF');
      assert.strictEqual(config.getColor('hourHand'), '#000000');
      assert.strictEqual(config.getColor('secondHand'), '#DE0100');
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// STATIC FACTORY METHODS TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe('Config static methods', () => {
  describe('Config.strict', () => {
    it('should create strict config', () => {
      const config = Config.strict({ theme: { weight: 'bold' } });
      assert.strictEqual(config.data.theme.weight, 'bold');
    });

    it('should throw on invalid config', () => {
      assert.throws(() => {
        Config.strict({ clock: { face: 'star' } });
      });
    });
  });

  describe('Config.silent', () => {
    it('should create silent config', () => {
      const config = Config.silent({ layout: { size: 50 } });
      assert.strictEqual(config.data.layout.size, 80);
    });
  });

  describe('Config.forZones', () => {
    it('should create config with zones', () => {
      const config = Config.forZones(['America/New_York', 'Europe/Paris']);
      assert.deepStrictEqual(config.getZones(), ['America/New_York', 'Europe/Paris']);
    });
  });

  describe('Config.withTheme', () => {
    it('should create config with theme', () => {
      const config = Config.withTheme('kandinsky');
      assert.strictEqual(config.getPalette().name, 'kandinsky');
    });

    it('should merge additional config', () => {
      const config = Config.withTheme('bayer', { layout: { columns: 2 } });
      assert.strictEqual(config.getPalette().name, 'bayer');
      assert.strictEqual(config.getLayout().columns, 2);
    });
  });

  describe('Config.validate', () => {
    it('should validate without creating instance', () => {
      const { result } = Config.validate({ theme: { weight: 'bold' } });
      assert.strictEqual(result.valid, true);
    });

    it('should return errors for invalid config', () => {
      const { result } = Config.validate({ clock: { face: 'pentagon' } });
      assert.strictEqual(result.valid, false);
    });
  });

  describe('Config.getDefaults', () => {
    it('should return default config', () => {
      const defaults = Config.getDefaults();
      assert.deepStrictEqual(defaults, DEFAULT_CONFIG);
    });
  });

  describe('Config.getPaletteNames', () => {
    it('should return all palette names', () => {
      const names = Config.getPaletteNames();
      assert.ok(names.includes('mondrian'));
      assert.ok(names.includes('kandinsky'));
      assert.ok(names.includes('albers'));
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// CONFIG BUILDER TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe('ConfigBuilder', () => {
  it('should build config with fluent API', () => {
    const config = Config.builder()
      .zones('America/New_York', 'Europe/London')
      .palette('kandinsky')
      .weight('bold')
      .build();

    assert.deepStrictEqual(config.getZones(), ['America/New_York', 'Europe/London']);
    assert.strictEqual(config.getPalette().name, 'kandinsky');
    assert.strictEqual(config.getTheme().weight, 'bold');
  });

  it('should set custom colors', () => {
    const config = Config.builder()
      .colors({
        primary: '#FF0000',
        secondary: '#00FF00',
        accent: '#0000FF',
        dark: '#000000',
        light: '#FFFFFF'
      })
      .build();

    assert.strictEqual(config.getPalette().primary, '#FF0000');
  });

  it('should set background', () => {
    const config = Config.builder()
      .background('dark')
      .build();

    assert.strictEqual(config.getTheme().background, 'dark');
  });

  it('should set face style', () => {
    const config = Config.builder()
      .face('square')
      .build();

    assert.strictEqual(config.getClock().face, 'square');
  });

  it('should set markers', () => {
    const config = Config.builder()
      .markers('dot', 4)
      .build();

    assert.strictEqual(config.getClock().markers.style, 'dot');
    assert.strictEqual(config.getClock().markers.count, 4);
  });

  it('should set hands', () => {
    const config = Config.builder()
      .hands({ hour: 'triangle', minute: 'rectangle', second: 'line' })
      .build();

    const hands = config.getClock().hands;
    assert.strictEqual(hands.hour, 'triangle');
    assert.strictEqual(hands.minute, 'rectangle');
    assert.strictEqual(hands.second, 'line');
  });

  it('should set numerals', () => {
    const config = Config.builder()
      .numerals('cardinal')
      .build();

    assert.strictEqual(config.getClock().numerals, 'cardinal');
  });

  it('should set hierarchy', () => {
    const config = Config.builder()
      .hierarchy('cascade')
      .build();

    assert.strictEqual(config.getLayout().hierarchy, 'cascade');
  });

  it('should set columns', () => {
    const config = Config.builder()
      .columns(4)
      .build();

    assert.strictEqual(config.getLayout().columns, 4);
  });

  it('should set size', () => {
    const config = Config.builder()
      .size(150)
      .build();

    assert.strictEqual(config.getLayout().size, 150);
  });

  it('should set labels', () => {
    const config = Config.builder()
      .labels(true, 'above')
      .build();

    const labels = config.getLayout().labels;
    assert.strictEqual(labels.show, true);
    assert.strictEqual(labels.position, 'above');
  });

  it('should chain multiple methods', () => {
    const config = Config.builder()
      .zones('America/Los_Angeles')
      .palette('moholy')
      .weight('thin')
      .face('circle')
      .markers('triangle')
      .hierarchy('primary')
      .columns(2)
      .size(200)
      .build({ silent: true });

    assert.ok(config.isValid());
    assert.strictEqual(config.getZones()[0], 'America/Los_Angeles');
    assert.strictEqual(config.getPalette().name, 'moholy');
    assert.strictEqual(config.getTheme().weight, 'thin');
  });
});
