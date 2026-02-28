/**
 * Bauhaus World Clock Framework
 * Design Tokens - Palettes, weights, and proportions
 *
 * These tokens define the bounded design space within which
 * all clock configurations must operate.
 */

// ═══════════════════════════════════════════════════════════════════════════
// COLOR PALETTES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Piet Mondrian inspired palette
 * Primary colors with stark black and white
 * Reference: Composition with Red, Blue, and Yellow (1930)
 */
const PALETTE_MONDRIAN = {
  name: 'mondrian',
  primary: '#DE0100',   // Pure red
  secondary: '#0000A0', // Deep blue
  accent: '#FAD201',    // Yellow
  dark: '#000000',      // Black
  light: '#FFFFFF'      // White
};

/**
 * Wassily Kandinsky inspired palette
 * Warm, expressive colors with teal accent
 * Reference: Several Circles (1926)
 */
const PALETTE_KANDINSKY = {
  name: 'kandinsky',
  primary: '#E4572E',   // Warm red-orange
  secondary: '#17BEBB', // Teal
  accent: '#FFC914',    // Golden yellow
  dark: '#2E282A',      // Near-black brown
  light: '#EDE6E3'      // Warm white
};

/**
 * Josef Albers inspired palette
 * Earth tones and muted warmth
 * Reference: Homage to the Square series
 */
const PALETTE_ALBERS = {
  name: 'albers',
  primary: '#C2883A',   // Ochre
  secondary: '#8B7355', // Warm gray-brown
  accent: '#D4A84B',    // Gold
  dark: '#3D3D3D',      // Charcoal
  light: '#F5F0E6'      // Cream
};

/**
 * Paul Klee inspired palette
 * Earthy, organic-feeling but still geometric
 * Reference: Castle and Sun (1928)
 */
const PALETTE_KLEE = {
  name: 'klee',
  primary: '#8B4513',   // Sienna
  secondary: '#2F4F4F', // Dark slate
  accent: '#CD853F',    // Peru/tan
  dark: '#1C1C1C',      // Off-black
  light: '#FAF0E6'      // Linen
};

/**
 * Herbert Bayer inspired palette
 * Bold, graphic, high contrast
 * Reference: Bauhaus typography and posters
 */
const PALETTE_BAYER = {
  name: 'bayer',
  primary: '#FF3B30',   // Vibrant red
  secondary: '#007AFF', // Electric blue
  accent: '#FFCC00',    // Bright yellow
  dark: '#1C1C1E',      // iOS dark
  light: '#F2F2F7'      // iOS light
};

/**
 * László Moholy-Nagy inspired palette
 * Industrial, photographic, metallic feel
 * Reference: Light-Space Modulator
 */
const PALETTE_MOHOLY = {
  name: 'moholy',
  primary: '#B8860B',   // Dark goldenrod
  secondary: '#708090', // Slate gray
  accent: '#C0C0C0',    // Silver
  dark: '#2C2C2C',      // Dark gray
  light: '#DCDCDC'      // Gainsboro
};

// All palettes collection
const PALETTES = {
  mondrian: PALETTE_MONDRIAN,
  kandinsky: PALETTE_KANDINSKY,
  albers: PALETTE_ALBERS,
  klee: PALETTE_KLEE,
  bayer: PALETTE_BAYER,
  moholy: PALETTE_MOHOLY
};

// ═══════════════════════════════════════════════════════════════════════════
// WEIGHT SYSTEM
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Weights are relative to clock diameter
 * This ensures consistent visual weight at any size
 */
const WEIGHTS = {
  thin: {
    stroke: 0.01,    // 1% of diameter for strokes
    hand: 0.02,      // 2% for hand width
    marker: 0.008    // 0.8% for markers
  },
  medium: {
    stroke: 0.025,   // 2.5% of diameter
    hand: 0.035,     // 3.5% for hand width
    marker: 0.015    // 1.5% for markers
  },
  bold: {
    stroke: 0.05,    // 5% of diameter
    hand: 0.06,      // 6% for hand width
    marker: 0.025    // 2.5% for markers
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// PROPORTION SYSTEM
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Golden ratio and simple fractions
 * All proportions derive from mathematical relationships
 */
const GOLDEN_RATIO = 1.618033988749;
const GOLDEN_RATIO_INVERSE = 0.618033988749;

/**
 * Hand proportions as fraction of radius
 */
const HAND_PROPORTIONS = {
  hour: {
    length: { min: 0.4, max: 0.6, default: 0.5 },
    width: { min: 0.03, max: 0.08, default: 0.05 }
  },
  minute: {
    length: { min: 0.7, max: 0.9, default: 0.8 },
    width: { min: 0.02, max: 0.05, default: 0.035 }
  },
  second: {
    length: { min: 0.75, max: 0.95, default: 0.85 },
    width: { min: 0.01, max: 0.025, default: 0.015 }
  }
};

/**
 * Marker proportions
 */
const MARKER_PROPORTIONS = {
  inset: { min: 0.85, max: 0.95, default: 0.9 },  // Distance from center
  length: { min: 0.05, max: 0.12, default: 0.08 }, // Length of marker
  cardinalScale: 1.5  // Cardinal markers 1.5x longer
};

/**
 * Face proportions
 */
const FACE_PROPORTIONS = {
  padding: 0.05,        // 5% padding inside face
  centerDot: 0.04,      // Center pivot dot radius
  numeralInset: 0.75    // Where numerals sit (fraction of radius)
};

/**
 * Valid aspect ratios (for layouts)
 */
const VALID_RATIOS = {
  '1:1': 1,
  '1:2': 0.5,
  '2:1': 2,
  '2:3': 0.667,
  '3:2': 1.5,
  '1:3': 0.333,
  '3:1': 3,
  'golden': GOLDEN_RATIO,
  'golden_inv': GOLDEN_RATIO_INVERSE
};

// ═══════════════════════════════════════════════════════════════════════════
// LAYOUT TOKENS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Grid system tokens
 */
const GRID = {
  columns: [1, 2, 3, 4, 6],      // Valid column counts (factors of 12)
  gutterMultiplier: 2,           // Gutter = stroke_bold × this
  minClockSize: 80,              // Minimum for touch targets (px)
  maxClocks: 12                  // Maximum clocks visible
};

/**
 * Hierarchy scaling
 */
const HIERARCHY = {
  equal: {
    primary: 1,
    secondary: 1
  },
  primary: {
    primary: 1.5,      // Primary clock 1.5x size
    secondary: 1
  },
  cascade: {
    scales: [1.5, 1.25, 1, 0.85, 0.75, 0.65]  // Decreasing sizes
  }
};

/**
 * Label positioning offsets (fraction of clock diameter)
 */
const LABEL_OFFSETS = {
  above: { x: 0, y: -0.15 },
  below: { x: 0, y: 0.15 },
  left: { x: -0.2, y: 0 },
  right: { x: 0.2, y: 0 },
  inside: { x: 0, y: 0.35 }  // Inside bottom of clock
};

// ═══════════════════════════════════════════════════════════════════════════
// TYPOGRAPHY TOKENS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Allowed fonts (geometric sans only)
 */
const FONTS = {
  primary: ['Futura', 'Century Gothic', 'Avant Garde', 'system-ui', 'sans-serif'],
  fallback: 'system-ui, -apple-system, sans-serif'
};

/**
 * Font sizes relative to clock diameter
 */
const FONT_SIZES = {
  label: 0.12,      // City/timezone label
  numeral: 0.1,     // Clock numerals
  digital: 0.25     // Digital readout (if shown)
};

// ═══════════════════════════════════════════════════════════════════════════
// ANIMATION TOKENS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Animation timings
 */
const ANIMATION = {
  handTransition: 'transform 0.1s linear',  // Smooth hand movement
  themeTransition: 'all 0.3s ease-out',     // Theme changes
  hoverTransition: 'all 0.15s ease-out'     // Hover states
};

// ═══════════════════════════════════════════════════════════════════════════
// DEFAULT CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const DEFAULT_CONFIG = {
  theme: {
    palette: 'mondrian',
    weight: 'medium',
    background: 'light'
  },
  clock: {
    face: 'circle',
    markers: {
      style: 'line',
      count: 12
    },
    hands: {
      hour: 'triangle',
      minute: 'line',
      second: 'line'
    },
    numerals: 'none',
    proportions: {
      hourHand: HAND_PROPORTIONS.hour.length.default,
      minuteHand: HAND_PROPORTIONS.minute.length.default,
      secondHand: HAND_PROPORTIONS.second.length.default,
      markerInset: MARKER_PROPORTIONS.inset.default
    }
  },
  layout: {
    hierarchy: 'equal',
    columns: 3,
    size: 120,
    labels: {
      show: true,
      position: 'below'
    }
  },
  behavior: {
    animate: true,
    showDayNight: false,
    interactive: true
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get a palette by name
 */
function getPalette(name) {
  return PALETTES[name] || PALETTES.mondrian;
}

/**
 * Get weight values by name
 */
function getWeight(name) {
  return WEIGHTS[name] || WEIGHTS.medium;
}

/**
 * Calculate actual pixel values from relative proportions
 */
function calculateDimensions(diameter, weight = 'medium') {
  const w = getWeight(weight);
  return {
    strokeWidth: diameter * w.stroke,
    handWidth: diameter * w.hand,
    markerWidth: diameter * w.marker,
    centerDot: diameter * FACE_PROPORTIONS.centerDot,
    padding: diameter * FACE_PROPORTIONS.padding
  };
}

/**
 * Get hierarchy scale for a clock at given index
 */
function getHierarchyScale(hierarchy, index, total) {
  switch (hierarchy) {
    case 'primary':
      return index === 0 ? HIERARCHY.primary.primary : HIERARCHY.primary.secondary;
    case 'cascade':
      return HIERARCHY.cascade.scales[Math.min(index, HIERARCHY.cascade.scales.length - 1)];
    case 'equal':
    default:
      return 1;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export {
  // Palettes
  PALETTES,
  PALETTE_MONDRIAN,
  PALETTE_KANDINSKY,
  PALETTE_ALBERS,
  PALETTE_KLEE,
  PALETTE_BAYER,
  PALETTE_MOHOLY,

  // Weights
  WEIGHTS,

  // Proportions
  GOLDEN_RATIO,
  GOLDEN_RATIO_INVERSE,
  HAND_PROPORTIONS,
  MARKER_PROPORTIONS,
  FACE_PROPORTIONS,
  VALID_RATIOS,

  // Layout
  GRID,
  HIERARCHY,
  LABEL_OFFSETS,

  // Typography
  FONTS,
  FONT_SIZES,

  // Animation
  ANIMATION,

  // Defaults
  DEFAULT_CONFIG,

  // Helpers
  getPalette,
  getWeight,
  calculateDimensions,
  getHierarchyScale
};

export default {
  PALETTES,
  WEIGHTS,
  GRID,
  DEFAULT_CONFIG,
  getPalette,
  getWeight,
  calculateDimensions,
  getHierarchyScale
};
