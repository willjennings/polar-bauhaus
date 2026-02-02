/**
 * Bauhaus World Clock Framework
 * Config - Configuration parsing, validation, and defaults
 *
 * Handles merging user configuration with defaults,
 * validating through guardrails, and providing a clean API.
 */

import Guardrails from './Guardrails.js';
import { DEFAULT_CONFIG, PALETTES, getPalette } from '../themes/tokens.js';

// ═══════════════════════════════════════════════════════════════════════════
// DEEP MERGE UTILITY
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Deep merge two objects
 * Arrays are replaced, not merged
 */
function deepMerge(target, source) {
  if (!source) return target;
  if (!target) return source;

  const result = { ...target };

  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      if (
        source[key] &&
        typeof source[key] === 'object' &&
        !Array.isArray(source[key]) &&
        target[key] &&
        typeof target[key] === 'object' &&
        !Array.isArray(target[key])
      ) {
        result[key] = deepMerge(target[key], source[key]);
      } else {
        result[key] = source[key];
      }
    }
  }

  return result;
}

// ═══════════════════════════════════════════════════════════════════════════
// CONFIG CLASS
// ═══════════════════════════════════════════════════════════════════════════

class Config {
  /**
   * Create a new configuration
   * @param {Object} userConfig - User-provided configuration
   * @param {Object} options - Options for config creation
   * @param {boolean} options.strict - Throw on validation errors (default: false)
   * @param {boolean} options.silent - Suppress console warnings (default: false)
   */
  constructor(userConfig = {}, options = {}) {
    this.options = {
      strict: false,
      silent: false,
      ...options
    };

    // Merge with defaults
    this.raw = deepMerge(DEFAULT_CONFIG, userConfig);

    // Resolve palette if string
    this.raw = this._resolvePalette(this.raw);

    // Validate and correct through guardrails
    const { result, corrected } = Guardrails.validateConfig(this.raw);

    // Store validation result
    this.validation = result;

    // Handle errors
    if (!result.valid) {
      if (this.options.strict) {
        throw new Error(`Configuration errors:\n${result.errors.join('\n')}`);
      } else if (!this.options.silent) {
        console.error('Bauhaus Config errors:', result.errors);
      }
    }

    // Handle warnings
    if (result.warnings.length > 0 && !this.options.silent) {
      console.warn('Bauhaus Config corrections:', result.warnings);
    }

    // Store corrected config
    this.data = corrected;

    // Freeze to prevent modification
    Object.freeze(this.data);
  }

  /**
   * Resolve palette string to object
   */
  _resolvePalette(config) {
    if (config.theme?.palette && typeof config.theme.palette === 'string') {
      const paletteName = config.theme.palette;
      const palette = getPalette(paletteName);
      return {
        ...config,
        theme: {
          ...config.theme,
          palette: { ...palette }
        }
      };
    }
    return config;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ACCESSORS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get the full configuration
   */
  get() {
    return this.data;
  }

  /**
   * Get theme configuration
   */
  getTheme() {
    return this.data.theme;
  }

  /**
   * Get palette colors
   */
  getPalette() {
    return this.data.theme.palette;
  }

  /**
   * Get clock element configuration
   */
  getClock() {
    return this.data.clock;
  }

  /**
   * Get layout configuration
   */
  getLayout() {
    return this.data.layout;
  }

  /**
   * Get behavior configuration
   */
  getBehavior() {
    return this.data.behavior;
  }

  /**
   * Get zones array
   */
  getZones() {
    return this.data.zones || ['local'];
  }

  /**
   * Check if configuration is valid
   */
  isValid() {
    return this.validation.valid;
  }

  /**
   * Get validation errors
   */
  getErrors() {
    return this.validation.errors;
  }

  /**
   * Get validation warnings (corrections made)
   */
  getWarnings() {
    return this.validation.warnings;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // COMPUTED VALUES
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get computed dimensions for a given clock size
   */
  getDimensions(diameter) {
    const weight = this.data.theme.weight;
    const weightValues = {
      thin: { stroke: 0.01, hand: 0.02, marker: 0.008 },
      medium: { stroke: 0.025, hand: 0.035, marker: 0.015 },
      bold: { stroke: 0.05, hand: 0.06, marker: 0.025 }
    }[weight];

    const proportions = this.data.clock.proportions;
    const radius = diameter / 2;

    return {
      diameter,
      radius,
      strokeWidth: diameter * weightValues.stroke,
      handWidth: diameter * weightValues.hand,
      markerWidth: diameter * weightValues.marker,
      centerDot: diameter * 0.04,
      hourHandLength: radius * proportions.hourHand,
      minuteHandLength: radius * proportions.minuteHand,
      secondHandLength: radius * proportions.secondHand,
      markerInset: radius * proportions.markerInset
    };
  }

  /**
   * Get color for a specific element
   */
  getColor(element) {
    const palette = this.getPalette();
    const mapping = {
      face: palette.light,
      faceStroke: palette.dark,
      hourHand: palette.dark,
      minuteHand: palette.dark,
      secondHand: palette.primary,
      marker: palette.dark,
      cardinalMarker: palette.dark,
      centerDot: palette.dark,
      label: palette.dark,
      background: this.data.theme.background === 'light' ? palette.light : palette.dark
    };
    return mapping[element] || palette.dark;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STATIC FACTORY METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Create config with strict validation (throws on errors)
   */
  static strict(userConfig) {
    return new Config(userConfig, { strict: true });
  }

  /**
   * Create config silently (no console output)
   */
  static silent(userConfig) {
    return new Config(userConfig, { silent: true });
  }

  /**
   * Create minimal config with just zones
   */
  static forZones(zones) {
    return new Config({ zones });
  }

  /**
   * Create config with a preset theme
   */
  static withTheme(themeName, userConfig = {}) {
    return new Config({
      ...userConfig,
      theme: {
        palette: themeName,
        ...userConfig.theme
      }
    });
  }

  /**
   * Validate a config object without creating a Config instance
   */
  static validate(userConfig) {
    const merged = deepMerge(DEFAULT_CONFIG, userConfig);
    return Guardrails.validateConfig(merged);
  }

  /**
   * Get the default configuration
   */
  static getDefaults() {
    return { ...DEFAULT_CONFIG };
  }

  /**
   * Get available palette names
   */
  static getPaletteNames() {
    return Object.keys(PALETTES);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// CONFIG BUILDER (FLUENT API)
// ═══════════════════════════════════════════════════════════════════════════

class ConfigBuilder {
  constructor() {
    this.config = {};
  }

  /**
   * Set timezone zones
   */
  zones(...zones) {
    this.config.zones = zones.flat();
    return this;
  }

  /**
   * Set theme palette
   */
  palette(name) {
    this.config.theme = this.config.theme || {};
    this.config.theme.palette = name;
    return this;
  }

  /**
   * Set custom palette colors
   */
  colors({ primary, secondary, accent, dark, light }) {
    this.config.theme = this.config.theme || {};
    this.config.theme.palette = { primary, secondary, accent, dark, light };
    return this;
  }

  /**
   * Set weight
   */
  weight(weight) {
    this.config.theme = this.config.theme || {};
    this.config.theme.weight = weight;
    return this;
  }

  /**
   * Set background
   */
  background(bg) {
    this.config.theme = this.config.theme || {};
    this.config.theme.background = bg;
    return this;
  }

  /**
   * Set clock face style
   */
  face(style) {
    this.config.clock = this.config.clock || {};
    this.config.clock.face = style;
    return this;
  }

  /**
   * Set marker style
   */
  markers(style, count = 12) {
    this.config.clock = this.config.clock || {};
    this.config.clock.markers = { style, count };
    return this;
  }

  /**
   * Set hand styles
   */
  hands({ hour, minute, second }) {
    this.config.clock = this.config.clock || {};
    this.config.clock.hands = { hour, minute, second };
    return this;
  }

  /**
   * Set numeral style
   */
  numerals(style) {
    this.config.clock = this.config.clock || {};
    this.config.clock.numerals = style;
    return this;
  }

  /**
   * Set layout hierarchy
   */
  hierarchy(mode) {
    this.config.layout = this.config.layout || {};
    this.config.layout.hierarchy = mode;
    return this;
  }

  /**
   * Set layout columns
   */
  columns(count) {
    this.config.layout = this.config.layout || {};
    this.config.layout.columns = count;
    return this;
  }

  /**
   * Set clock size
   */
  size(px) {
    this.config.layout = this.config.layout || {};
    this.config.layout.size = px;
    return this;
  }

  /**
   * Set label configuration
   */
  labels(show, position = 'below') {
    this.config.layout = this.config.layout || {};
    this.config.layout.labels = { show, position };
    return this;
  }

  /**
   * Build the configuration
   */
  build(options = {}) {
    return new Config(this.config, options);
  }
}

/**
 * Start building a configuration
 */
Config.builder = function() {
  return new ConfigBuilder();
};

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export { Config, ConfigBuilder, deepMerge };
export default Config;
