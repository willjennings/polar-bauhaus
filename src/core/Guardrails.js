/**
 * Bauhaus World Clock Framework
 * Guardrails - Validation system that enforces Bauhaus design constraints
 *
 * "The constraint system is the design."
 * These guardrails make it impossible to create something ugly.
 */

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS - Immutable Bauhaus constraints
// ═══════════════════════════════════════════════════════════════════════════

const VALID_ANGLES = [0, 30, 45, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];
const VALID_RADII = [0, 0.5]; // Sharp corners (0) or perfect circle (50%)
const VALID_STROKE_CAPS = ['butt', 'square']; // Never 'round'
const VALID_COLUMNS = [1, 2, 3, 4, 6]; // Factors of 12 for clock harmony
const MAX_COLORS = 5;
const MIN_CLOCK_SIZE = 80; // px, for touch targets
const MAX_CLOCKS = 12;

const VALID_PRIMITIVES = {
  face: ['circle', 'square', 'none'],
  markers: ['line', 'dot', 'triangle', 'square', 'none'],
  hands: ['line', 'triangle', 'rectangle'],
  numerals: ['none', 'cardinal', 'all', 'indices']
};

const VALID_LAYOUT = {
  hierarchy: ['equal', 'primary', 'cascade'],
  labelPosition: ['above', 'below', 'left', 'right', 'inside']
};

const PROPORTION_BOUNDS = {
  hour_hand: { min: 0.4, max: 0.6 },
  minute_hand: { min: 0.7, max: 0.9 },
  second_hand: { min: 0.75, max: 0.95 },
  marker_inset: { min: 0.85, max: 0.95 }
};

const WEIGHT_BOUNDS = {
  thin: { stroke: 0.01, hand: 0.02 },
  medium: { stroke: 0.025, hand: 0.035 },
  bold: { stroke: 0.05, hand: 0.06 }
};

// ═══════════════════════════════════════════════════════════════════════════
// VALIDATION RESULT CLASS
// ═══════════════════════════════════════════════════════════════════════════

class ValidationResult {
  constructor() {
    this.valid = true;
    this.errors = [];
    this.warnings = [];
    this.corrections = {};
  }

  addError(message) {
    this.valid = false;
    this.errors.push(message);
  }

  addWarning(message) {
    this.warnings.push(message);
  }

  addCorrection(field, original, corrected, reason) {
    this.warnings.push(`${field}: ${original} → ${corrected} (${reason})`);
    this.corrections[field] = { original, corrected, reason };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// COLOR GUARDRAILS
// ═══════════════════════════════════════════════════════════════════════════

const ColorGuardrails = {
  /**
   * Validate a color palette
   * Rules:
   * - Maximum 5 colors
   * - Must be valid hex colors
   * - No gradients (enforced by only accepting hex strings)
   */
  validatePalette(palette, result = new ValidationResult()) {
    if (!palette || typeof palette !== 'object') {
      result.addError('Palette must be an object');
      return result;
    }

    // Filter to only color entries (exclude 'name' and other metadata)
    const colorKeys = ['primary', 'secondary', 'accent', 'dark', 'light'];
    const colors = colorKeys
      .filter(key => palette[key] !== undefined)
      .map(key => ({ key, value: palette[key] }));

    if (colors.length > MAX_COLORS) {
      result.addError(`Maximum ${MAX_COLORS} colors allowed, got ${colors.length}`);
    }

    colors.forEach(({ key, value }) => {
      if (!this.isValidHexColor(value)) {
        result.addError(`Invalid color for "${key}": "${value}". Must be hex format (#RGB or #RRGGBB)`);
      }
    });

    return result;
  },

  /**
   * Check if a string is a valid hex color
   */
  isValidHexColor(color) {
    if (typeof color !== 'string') return false;
    return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(color);
  },

  /**
   * Validate background color
   * Must be 'light' or 'dark' (neutral backgrounds only)
   */
  validateBackground(background, result = new ValidationResult()) {
    if (!['light', 'dark'].includes(background)) {
      result.addError(`Background must be "light" or "dark", got "${background}"`);
    }
    return result;
  },

  /**
   * Check that no two adjacent elements have the same color
   * Returns array of violations
   */
  checkAdjacentColors(colorAssignments) {
    const violations = [];
    const entries = Object.entries(colorAssignments);

    for (let i = 0; i < entries.length - 1; i++) {
      const [keyA, colorA] = entries[i];
      const [keyB, colorB] = entries[i + 1];
      if (colorA === colorB) {
        violations.push(`Adjacent elements "${keyA}" and "${keyB}" have same color`);
      }
    }

    return violations;
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// SHAPE GUARDRAILS
// ═══════════════════════════════════════════════════════════════════════════

const ShapeGuardrails = {
  /**
   * Snap an angle to the nearest valid Bauhaus angle
   * Valid: 0°, 30°, 45°, 60°, 90° (and their rotations)
   */
  snapAngle(angle) {
    const normalized = ((angle % 360) + 360) % 360;
    return VALID_ANGLES.reduce((prev, curr) =>
      Math.abs(curr - normalized) < Math.abs(prev - normalized) ? curr : prev
    );
  },

  /**
   * Validate and correct an angle
   */
  validateAngle(angle, result = new ValidationResult()) {
    const snapped = this.snapAngle(angle);
    if (snapped !== angle) {
      result.addCorrection('angle', angle, snapped, 'snapped to valid Bauhaus angle');
    }
    return { value: snapped, result };
  },

  /**
   * Validate border radius
   * Only 0 (sharp) or 0.5 (perfect circle) allowed
   */
  validateRadius(radius, result = new ValidationResult()) {
    const corrected = radius > 0.25 ? 0.5 : 0;
    if (corrected !== radius) {
      result.addCorrection('radius', radius, corrected, 'only sharp (0) or circle (0.5) allowed');
    }
    return { value: corrected, result };
  },

  /**
   * Validate stroke cap
   * Never 'round' - only 'butt' or 'square'
   */
  validateStrokeCap(cap, result = new ValidationResult()) {
    if (!VALID_STROKE_CAPS.includes(cap)) {
      const corrected = 'butt';
      result.addCorrection('strokeCap', cap, corrected, 'round caps not allowed in Bauhaus');
      return { value: corrected, result };
    }
    return { value: cap, result };
  },

  /**
   * Validate a primitive type
   */
  validatePrimitive(category, value, result = new ValidationResult()) {
    const validValues = VALID_PRIMITIVES[category];
    if (!validValues) {
      result.addError(`Unknown primitive category: "${category}"`);
      return { value: null, result };
    }

    if (!validValues.includes(value)) {
      result.addError(`Invalid ${category}: "${value}". Must be one of: ${validValues.join(', ')}`);
      return { value: validValues[0], result }; // Default to first valid option
    }

    return { value, result };
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// PROPORTION GUARDRAILS
// ═══════════════════════════════════════════════════════════════════════════

const ProportionGuardrails = {
  GOLDEN_RATIO: 1.618033988749,
  VALID_RATIOS: [1, 0.5, 0.618, 0.667, 0.333, 2, 1.5, 3],

  /**
   * Clamp a value to bounds
   */
  clamp(value, { min, max }) {
    return Math.max(min, Math.min(max, value));
  },

  /**
   * Validate and clamp a proportion
   */
  validateProportion(name, value, result = new ValidationResult()) {
    const bounds = PROPORTION_BOUNDS[name];
    if (!bounds) {
      result.addWarning(`Unknown proportion "${name}", using value as-is`);
      return { value, result };
    }

    const clamped = this.clamp(value, bounds);
    if (clamped !== value) {
      result.addCorrection(name, value, clamped,
        `clamped to bounds [${bounds.min}, ${bounds.max}]`);
    }
    return { value: clamped, result };
  },

  /**
   * Snap a ratio to the nearest valid ratio
   */
  snapToRatio(value) {
    return this.VALID_RATIOS.reduce((prev, curr) =>
      Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev
    );
  },

  /**
   * Validate clock size (minimum for touch targets)
   */
  validateClockSize(size, result = new ValidationResult()) {
    if (size < MIN_CLOCK_SIZE) {
      result.addCorrection('clockSize', size, MIN_CLOCK_SIZE,
        `minimum ${MIN_CLOCK_SIZE}px for touch targets`);
      return { value: MIN_CLOCK_SIZE, result };
    }
    return { value: size, result };
  },

  /**
   * Validate weight setting
   */
  validateWeight(weight, result = new ValidationResult()) {
    if (!WEIGHT_BOUNDS[weight]) {
      result.addError(`Invalid weight "${weight}". Must be: thin, medium, or bold`);
      return { value: 'medium', result };
    }
    return { value: weight, result };
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// LAYOUT GUARDRAILS
// ═══════════════════════════════════════════════════════════════════════════

const LayoutGuardrails = {
  /**
   * Validate column count
   */
  validateColumns(columns, result = new ValidationResult()) {
    if (!VALID_COLUMNS.includes(columns)) {
      const closest = VALID_COLUMNS.reduce((prev, curr) =>
        Math.abs(curr - columns) < Math.abs(prev - columns) ? curr : prev
      );
      result.addCorrection('columns', columns, closest,
        `must be factor of 12: ${VALID_COLUMNS.join(', ')}`);
      return { value: closest, result };
    }
    return { value: columns, result };
  },

  /**
   * Validate number of clocks
   */
  validateClockCount(count, result = new ValidationResult()) {
    if (count > MAX_CLOCKS) {
      result.addCorrection('clockCount', count, MAX_CLOCKS,
        `maximum ${MAX_CLOCKS} clocks allowed`);
      return { value: MAX_CLOCKS, result };
    }
    if (count < 1) {
      result.addCorrection('clockCount', count, 1, 'minimum 1 clock required');
      return { value: 1, result };
    }
    return { value: count, result };
  },

  /**
   * Validate hierarchy mode
   */
  validateHierarchy(hierarchy, result = new ValidationResult()) {
    if (!VALID_LAYOUT.hierarchy.includes(hierarchy)) {
      result.addError(`Invalid hierarchy "${hierarchy}". Must be: ${VALID_LAYOUT.hierarchy.join(', ')}`);
      return { value: 'equal', result };
    }
    return { value: hierarchy, result };
  },

  /**
   * Validate label position
   */
  validateLabelPosition(position, result = new ValidationResult()) {
    if (!VALID_LAYOUT.labelPosition.includes(position)) {
      result.addError(`Invalid label position "${position}". Must be: ${VALID_LAYOUT.labelPosition.join(', ')}`);
      return { value: 'below', result };
    }
    return { value: position, result };
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN GUARDRAILS CLASS
// ═══════════════════════════════════════════════════════════════════════════

class Guardrails {
  static Color = ColorGuardrails;
  static Shape = ShapeGuardrails;
  static Proportion = ProportionGuardrails;
  static Layout = LayoutGuardrails;

  /**
   * Validate a complete configuration object
   * Returns ValidationResult with errors, warnings, and auto-corrections
   */
  static validateConfig(config) {
    const result = new ValidationResult();
    const corrected = JSON.parse(JSON.stringify(config)); // Deep clone

    // Validate theme
    if (config.theme) {
      if (config.theme.palette && typeof config.theme.palette === 'object') {
        this.Color.validatePalette(config.theme.palette, result);
      }
      if (config.theme.background) {
        this.Color.validateBackground(config.theme.background, result);
      }
      if (config.theme.weight) {
        const weightResult = this.Proportion.validateWeight(config.theme.weight, result);
        corrected.theme.weight = weightResult.value;
      }
    }

    // Validate clock elements
    if (config.clock) {
      if (config.clock.face) {
        const faceResult = this.Shape.validatePrimitive('face', config.clock.face, result);
        corrected.clock.face = faceResult.value;
      }
      if (config.clock.markers?.style) {
        const markerResult = this.Shape.validatePrimitive('markers', config.clock.markers.style, result);
        corrected.clock.markers.style = markerResult.value;
      }
      if (config.clock.hands) {
        ['hour', 'minute', 'second'].forEach(hand => {
          if (config.clock.hands[hand] && config.clock.hands[hand] !== 'none') {
            const handResult = this.Shape.validatePrimitive('hands', config.clock.hands[hand], result);
            corrected.clock.hands[hand] = handResult.value;
          }
        });
      }
      if (config.clock.numerals) {
        const numeralResult = this.Shape.validatePrimitive('numerals', config.clock.numerals, result);
        corrected.clock.numerals = numeralResult.value;
      }

      // Validate proportions
      if (config.clock.proportions) {
        Object.entries(config.clock.proportions).forEach(([key, value]) => {
          const propKey = key.replace(/([A-Z])/g, '_$1').toLowerCase(); // camelCase to snake_case
          const propResult = this.Proportion.validateProportion(propKey, value, result);
          corrected.clock.proportions[key] = propResult.value;
        });
      }
    }

    // Validate layout
    if (config.layout) {
      if (config.layout.columns) {
        const colResult = this.Layout.validateColumns(config.layout.columns, result);
        corrected.layout.columns = colResult.value;
      }
      if (config.layout.hierarchy) {
        const hierResult = this.Layout.validateHierarchy(config.layout.hierarchy, result);
        corrected.layout.hierarchy = hierResult.value;
      }
      if (config.layout.size) {
        const sizeResult = this.Proportion.validateClockSize(config.layout.size, result);
        corrected.layout.size = sizeResult.value;
      }
      if (config.layout.labels?.position) {
        const labelResult = this.Layout.validateLabelPosition(config.layout.labels.position, result);
        corrected.layout.labels.position = labelResult.value;
      }
    }

    // Validate zones count
    if (config.zones) {
      const countResult = this.Layout.validateClockCount(config.zones.length, result);
      if (countResult.value < config.zones.length) {
        corrected.zones = config.zones.slice(0, countResult.value);
      }
    }

    return { result, corrected };
  }

  /**
   * Quick validation - returns true/false
   */
  static isValid(config) {
    return this.validateConfig(config).result.valid;
  }

  /**
   * Validate and auto-correct, returning corrected config
   * Throws if there are uncorrectable errors
   */
  static enforce(config) {
    const { result, corrected } = this.validateConfig(config);

    if (!result.valid) {
      const errorMsg = `Configuration errors:\n${result.errors.join('\n')}`;
      throw new Error(errorMsg);
    }

    if (result.warnings.length > 0) {
      console.warn('Bauhaus Guardrails corrections:', result.warnings);
    }

    return corrected;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export {
  Guardrails,
  ValidationResult,
  ColorGuardrails,
  ShapeGuardrails,
  ProportionGuardrails,
  LayoutGuardrails,
  // Constants for external use
  VALID_ANGLES,
  VALID_PRIMITIVES,
  VALID_LAYOUT,
  PROPORTION_BOUNDS,
  WEIGHT_BOUNDS,
  MIN_CLOCK_SIZE,
  MAX_CLOCKS,
  MAX_COLORS
};

export default Guardrails;
