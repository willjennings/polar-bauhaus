# Bauhaus World Clock Framework
## Comprehensive Development Plan

---

## Part 1: Philosophy & Principles

### The Fundamental Insight

Bauhaus is not a visual style to be imitated—it is a **constraint system** that produces coherent design through strict rational limits. The framework's job is not to offer unlimited customization, but to **make it impossible to create something ugly**.

> "The constraint system is the design."

### Non-Negotiable Principles

| Principle | Meaning | Implication |
|-----------|---------|-------------|
| Form follows function | Every visual element communicates time | No decoration without purpose |
| Geometric primitives only | Circle, square, triangle, line | No organic curves, no beziers |
| Flat, honest color | Solid fills only | No gradients, no shadows, no glows |
| Grid as skeleton | Mathematical placement | All positions derive from ratios |
| Asymmetric balance | Dynamic composition | Never static symmetry |

### What This Means for the Clock

A clock's function is to **communicate time**. Therefore:

- **Hands** communicate hour/minute/second positions → Required
- **Face** provides reference frame → Functional
- **Markers** aid time reading → Functional
- **Spinning progress arcs** → Decorative (violates principle 1)
- **Color gradients for "mood"** → Decorative (violates principle 3)

The current prototype's spinning circles are **ornamental**, not functional. They must be replaced with proper clock hands that communicate time through position.

---

## Part 2: The Atomic Design System

### Layer 1: Primitives (Immutable)

These are the **only shapes allowed**. The framework cannot render anything else.

```
┌─────────────────────────────────────────────────────────┐
│  PRIMITIVES                                             │
├─────────────────────────────────────────────────────────┤
│  circle    ○    SVG <circle>                            │
│  square    □    SVG <rect> with equal width/height      │
│  triangle  △    SVG <polygon> with 3 points             │
│  line      ─    SVG <line> or <rect> with min dimension │
├─────────────────────────────────────────────────────────┤
│  VALID ANGLES: 0° 30° 45° 60° 90° (and their rotations) │
│  VALID RADII:  0 (sharp) or 50% (perfect circle)        │
│  STROKE CAPS:  butt or square (NEVER round)             │
└─────────────────────────────────────────────────────────┘
```

### Layer 2: Design Tokens (Bounded)

These are **tweakable within strict limits**. The framework validates all inputs.

#### Color Palettes

```javascript
PALETTES = {
  mondrian: {
    primary:   '#DE0100',  // Red
    secondary: '#0000A0',  // Blue
    accent:    '#FAD201',  // Yellow
    dark:      '#000000',  // Black
    light:     '#FFFFFF',  // White
  },
  kandinsky: {
    primary:   '#E4572E',  // Warm red-orange
    secondary: '#17BEBB',  // Teal
    accent:    '#FFC914',  // Golden yellow
    dark:      '#2E282A',  // Near-black
    light:     '#EDE6E3',  // Warm white
  },
  albers: {
    primary:   '#C2883A',  // Ochre
    secondary: '#8B7355',  // Warm gray
    accent:    '#D4A84B',  // Gold
    dark:      '#3D3D3D',  // Charcoal
    light:     '#F5F0E6',  // Cream
  },
  klee: {
    primary:   '#8B4513',  // Sienna
    secondary: '#2F4F4F',  // Dark slate
    accent:    '#CD853F',  // Peru
    dark:      '#1C1C1C',  // Off-black
    light:     '#FAF0E6',  // Linen
  }
}
```

**Palette Rules:**
- Maximum 5 colors active simultaneously
- Background must be `light` or `dark` (neutral)
- `primary`, `secondary`, `accent` reserved for clock elements
- No two adjacent elements same color

#### Weight System

```javascript
WEIGHTS = {
  thin:   { stroke: 0.01, hand: 0.02 },   // Relative to clock diameter
  medium: { stroke: 0.025, hand: 0.035 },
  bold:   { stroke: 0.05, hand: 0.06 }
}
```

#### Proportion System

All proportions use **golden ratio (φ = 1.618)** or **simple fractions**.

```javascript
PROPORTIONS = {
  // Hand lengths as fraction of radius
  hand_hour:   { min: 0.4, max: 0.6, default: 0.5 },
  hand_minute: { min: 0.7, max: 0.9, default: 0.8 },
  hand_second: { min: 0.75, max: 0.95, default: 0.85 },

  // Marker position
  marker_inset: { min: 0.85, max: 0.95, default: 0.9 },

  // Valid ratios for layouts
  valid_ratios: ['1:1', '1:2', '2:3', '1:φ', '1:3']
}
```

### Layer 3: Composition Rules

#### Clock Element Options

```javascript
CLOCK_ELEMENTS = {
  face: ['circle', 'square', 'none'],

  markers: {
    style: ['line', 'dot', 'triangle', 'square', 'none'],
    count: [4, 12],  // Cardinal only or all hours
  },

  hands: {
    hour:   ['line', 'triangle', 'rectangle'],
    minute: ['line', 'triangle', 'rectangle'],
    second: ['line', 'none'],  // Optional
  },

  numerals: ['none', 'cardinal', 'all', 'indices']
}
```

#### Layout Rules

```javascript
LAYOUT = {
  hierarchy: ['equal', 'primary', 'cascade'],

  grid: {
    columns: [1, 2, 3, 4, 6],  // Factors of 12 for clock harmony
    maxClocks: 12,
    minClockSize: 80,  // px, for touch targets
  },

  labels: {
    position: ['above', 'below', 'left', 'right', 'inside'],
    font: ['Futura', 'DIN', 'Avant Garde', 'system-ui'],
    weight: ['normal', 'bold']  // No light weights
  },

  gutter: 'stroke_bold * 2'  // Derived, not arbitrary
}
```

---

## Part 3: Guardrail System

The guardrails **prevent invalid states**. They operate at validation time, not render time.

### Color Guardrails

```javascript
class ColorGuardrails {
  static validate(config) {
    const errors = [];

    // Rule: Max 5 colors
    const activeColors = this.getActiveColors(config);
    if (activeColors.length > 5) {
      errors.push('Maximum 5 active colors allowed');
    }

    // Rule: Background must be neutral
    if (!['light', 'dark'].includes(config.background)) {
      errors.push('Background must be "light" or "dark"');
    }

    // Rule: No identical adjacent colors (checked at render)

    return errors;
  }
}
```

### Shape Guardrails

```javascript
class ShapeGuardrails {
  static VALID_ANGLES = [0, 30, 45, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];

  static snapAngle(angle) {
    const normalized = ((angle % 360) + 360) % 360;
    return this.VALID_ANGLES.reduce((prev, curr) =>
      Math.abs(curr - normalized) < Math.abs(prev - normalized) ? curr : prev
    );
  }

  static validateRadius(r) {
    // Only sharp (0) or perfect circle (0.5)
    return r > 0.25 ? 0.5 : 0;
  }

  static validateStrokeCap(cap) {
    if (cap === 'round') {
      console.warn('Round stroke caps not allowed in Bauhaus. Using "butt".');
      return 'butt';
    }
    return cap;
  }
}
```

### Proportion Guardrails

```javascript
class ProportionGuardrails {
  static GOLDEN_RATIO = 1.618033988749;
  static VALID_RATIOS = [1, 0.5, 0.618, 0.667, 0.333, 2, 1.5, 3];

  static clamp(value, { min, max }) {
    return Math.max(min, Math.min(max, value));
  }

  static snapToRatio(value) {
    return this.VALID_RATIOS.reduce((prev, curr) =>
      Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev
    );
  }

  static validateClockSize(size) {
    if (size < 80) {
      console.warn('Clock size below 80px affects touch targets. Clamping.');
      return 80;
    }
    return size;
  }
}
```

---

## Part 4: Technical Architecture

### Technology Decision: SVG over Canvas

| Aspect | Canvas (Current) | SVG (Proposed) |
|--------|------------------|----------------|
| Geometric precision | Approximated | Exact |
| Scalability | Requires redraw | Native scaling |
| Accessibility | Poor | Better (DOM nodes) |
| Animation | Manual RAF loop | CSS transforms |
| Complexity | Lower | Moderate |
| Bauhaus alignment | Weak | Strong |

**Decision: Migrate to SVG** for geometric precision and scalability.

### File Structure

```
bauhaus-clock/
├── src/
│   ├── core/
│   │   ├── Guardrails.js       # Validation system
│   │   ├── ClockEngine.js      # Time calculations
│   │   ├── Config.js           # Config parsing & defaults
│   │   └── EventBus.js         # Event system
│   │
│   ├── primitives/
│   │   ├── index.js            # Export all
│   │   ├── Circle.js           # <circle> wrapper
│   │   ├── Square.js           # <rect> wrapper
│   │   ├── Triangle.js         # <polygon> wrapper
│   │   ├── Line.js             # <line>/<rect> wrapper
│   │   └── Text.js             # <text> with font constraints
│   │
│   ├── components/
│   │   ├── ClockFace.js        # Face primitive + markers
│   │   ├── Hand.js             # Hour/minute/second hand
│   │   ├── Markers.js          # 4 or 12 hour markers
│   │   ├── Numerals.js         # Optional numerals
│   │   └── Label.js            # City/timezone label
│   │
│   ├── themes/
│   │   ├── tokens.js           # Palettes, weights, proportions
│   │   ├── presets/
│   │   │   ├── mondrian.js
│   │   │   ├── kandinsky.js
│   │   │   ├── albers.js
│   │   │   └── klee.js
│   │   └── ThemeManager.js     # Theme switching
│   │
│   ├── layout/
│   │   ├── Grid.js             # Mathematical grid
│   │   ├── SingleClock.js      # One clock layout
│   │   └── WorldClock.js       # Multi-timezone layout
│   │
│   ├── widgets/
│   │   ├── SettingsPanel.js    # Optional UI controls
│   │   └── TimezoneSelect.js   # City picker
│   │
│   └── index.js                # Main export
│
├── dist/                       # Built files
├── examples/                   # Usage examples
├── docs/                       # Documentation
└── FRAMEWORK_PLAN.md           # This file
```

### Component Hierarchy

```
<WorldClock>
  ├── <Grid>
  │   ├── <SingleClock zone="local">
  │   │   ├── <ClockFace>
  │   │   │   ├── <Circle> or <Square>
  │   │   │   └── <Markers>
  │   │   │       └── <Line> × 12
  │   │   ├── <Hand type="hour">
  │   │   │   └── <Triangle> or <Line> or <Rect>
  │   │   ├── <Hand type="minute">
  │   │   ├── <Hand type="second">
  │   │   └── <Circle> (center pivot)
  │   │   └── <Label>
  │   │       └── <Text>
  │   │
  │   ├── <SingleClock zone="Europe/London">
  │   └── <SingleClock zone="Asia/Tokyo">
  │
  └── <SettingsPanel> (optional)
```

---

## Part 5: Configuration Schema

### Full Config Object

```javascript
const config = {
  // ═══════════════════════════════════════════════════════
  // ZONES
  // ═══════════════════════════════════════════════════════
  zones: [
    'local',              // Auto-detect
    'America/New_York',   // IANA timezone
    'Europe/London',
    'Asia/Tokyo'
  ],

  // ═══════════════════════════════════════════════════════
  // THEME
  // ═══════════════════════════════════════════════════════
  theme: {
    palette: 'mondrian',  // Or custom object
    weight: 'medium',     // thin | medium | bold
    background: 'light',  // light | dark
  },

  // ═══════════════════════════════════════════════════════
  // CLOCK ELEMENTS
  // ═══════════════════════════════════════════════════════
  clock: {
    face: 'circle',       // circle | square | none

    markers: {
      style: 'line',      // line | dot | triangle | square | none
      count: 12,          // 4 (cardinal) | 12 (all)
    },

    hands: {
      hour: 'triangle',   // line | triangle | rectangle
      minute: 'line',
      second: 'line',     // or 'none' to hide
    },

    numerals: 'none',     // none | cardinal | all | indices

    // Optional proportion overrides (validated against bounds)
    proportions: {
      hourHand: 0.5,
      minuteHand: 0.8,
      secondHand: 0.85,
      markerInset: 0.9,
    }
  },

  // ═══════════════════════════════════════════════════════
  // LAYOUT
  // ═══════════════════════════════════════════════════════
  layout: {
    hierarchy: 'primary', // equal | primary | cascade
    columns: 4,           // 1 | 2 | 3 | 4 | 6
    size: 120,            // Base clock diameter (px)

    labels: {
      show: true,
      position: 'below',  // above | below | left | right | inside
    }
  },

  // ═══════════════════════════════════════════════════════
  // BEHAVIOR
  // ═══════════════════════════════════════════════════════
  behavior: {
    animate: true,        // Smooth hand movement
    showDayNight: true,   // Subtle bg shift for day/night
    interactive: true,    // Click to select timezone
  }
};
```

### Minimal Config (Sensible Defaults)

```javascript
// This is all you need for a working world clock
const minimalConfig = {
  zones: ['local', 'Europe/London', 'Asia/Tokyo']
};
```

---

## Part 6: Implementation Phases

### Phase 1: Foundation (Week 1)

**Goal:** Core architecture without visual output

- [ ] 1.1 Create `Guardrails.js` with all validation rules
- [ ] 1.2 Create `Config.js` with schema validation
- [ ] 1.3 Create `ClockEngine.js` with time calculations
- [ ] 1.4 Create `tokens.js` with palettes, weights, proportions
- [ ] 1.5 Write unit tests for guardrails

**Deliverable:** Validated config system that rejects invalid inputs

### Phase 2: Primitives (Week 2)

**Goal:** SVG primitive components

- [ ] 2.1 Create `Circle.js` SVG component
- [ ] 2.2 Create `Square.js` SVG component
- [ ] 2.3 Create `Triangle.js` SVG component
- [ ] 2.4 Create `Line.js` SVG component
- [ ] 2.5 Create `Text.js` with font constraints
- [ ] 2.6 Test all primitives respect guardrails

**Deliverable:** Reusable SVG primitives that enforce Bauhaus constraints

### Phase 3: Clock Components (Week 3)

**Goal:** Composed clock elements

- [ ] 3.1 Create `Hand.js` (hour/minute/second)
- [ ] 3.2 Create `Markers.js` (12 or 4 hour markers)
- [ ] 3.3 Create `ClockFace.js` (face + markers)
- [ ] 3.4 Create `Label.js` (city/timezone)
- [ ] 3.5 Create `SingleClock.js` (complete clock)
- [ ] 3.6 Add CSS transform animation for hands

**Deliverable:** Working single analog clock

### Phase 4: Layout System (Week 4)

**Goal:** Multi-clock composition

- [ ] 4.1 Create `Grid.js` mathematical layout
- [ ] 4.2 Create `WorldClock.js` multi-timezone
- [ ] 4.3 Implement hierarchy modes (equal/primary/cascade)
- [ ] 4.4 Add responsive breakpoints
- [ ] 4.5 Test touch targets (min 80px)

**Deliverable:** Complete world clock with multiple timezones

### Phase 5: Themes & Polish (Week 5)

**Goal:** Theme system and presets

- [ ] 5.1 Create `ThemeManager.js`
- [ ] 5.2 Build Mondrian preset
- [ ] 5.3 Build Kandinsky preset
- [ ] 5.4 Build Albers preset
- [ ] 5.5 Build Klee preset
- [ ] 5.6 Add day/night background shift
- [ ] 5.7 Add settings panel (optional)

**Deliverable:** Themeable world clock with presets

### Phase 6: Distribution (Week 6)

**Goal:** Package for distribution

- [ ] 6.1 Build system (Rollup/Vite)
- [ ] 6.2 TypeScript definitions
- [ ] 6.3 NPM package
- [ ] 6.4 CDN distribution
- [ ] 6.5 Documentation site
- [ ] 6.6 Interactive playground

**Deliverable:** Published package ready for use

---

## Part 7: Migration from Current Prototype

### What to Keep

| Element | Status | Reason |
|---------|--------|--------|
| Multi-timezone support | Keep | Core functionality |
| City database | Keep | Useful data |
| Settings API pattern | Keep | Good DX |
| Touch event handling | Keep | Accessibility |

### What to Remove

| Element | Status | Reason |
|---------|--------|--------|
| Spinning progress circles | Remove | Decorative, not functional |
| Time-of-day color gradients | Remove | Color as ornament |
| Rounded stroke caps | Remove | Violates Bauhaus |
| Canvas rendering | Remove | Replace with SVG |
| Arbitrary proportions | Remove | Replace with ratios |

### What to Transform

| Current | Becomes | Reason |
|---------|---------|--------|
| Progress arcs | Clock hands | Form follows function |
| Color gradients | Day/night bg | Color as information |
| Tunable colors | Palette system | Bounded customization |
| Free positioning | Grid system | Mathematical placement |

---

## Part 8: API Design

### Basic Usage

```javascript
import { WorldClock } from 'bauhaus-clock';

const clock = new WorldClock('#container', {
  zones: ['local', 'Europe/London', 'Asia/Tokyo'],
  theme: { palette: 'mondrian' }
});
```

### Advanced Configuration

```javascript
const clock = new WorldClock('#container', {
  zones: ['local', 'America/New_York', 'Europe/Paris', 'Asia/Tokyo'],
  theme: {
    palette: {
      primary: '#DE0100',
      secondary: '#0000A0',
      accent: '#FAD201',
      dark: '#000000',
      light: '#FFFFFF'
    },
    weight: 'bold',
    background: 'light'
  },
  clock: {
    face: 'circle',
    markers: { style: 'line', count: 12 },
    hands: { hour: 'triangle', minute: 'line', second: 'line' }
  },
  layout: {
    hierarchy: 'primary',
    columns: 4,
    labels: { position: 'below' }
  }
});
```

### Events

```javascript
clock.on('tick', ({ zone, time }) => {
  console.log(`${zone}: ${time.hours}:${time.minutes}`);
});

clock.on('zoneSelect', ({ zone }) => {
  console.log(`Selected: ${zone}`);
});

clock.on('themeChange', ({ theme }) => {
  console.log(`Theme changed to: ${theme}`);
});
```

### Methods

```javascript
// Theme
clock.setTheme('kandinsky');
clock.setTheme({ palette: { primary: '#FF0000', ... } });

// Zones
clock.addZone('Australia/Sydney');
clock.removeZone('Europe/London');
clock.setZones(['local', 'Asia/Tokyo']);

// Layout
clock.setLayout({ columns: 2, hierarchy: 'equal' });

// Destroy
clock.destroy();
```

### Web Component (Future)

```html
<bauhaus-clock
  zones="local,Europe/London,Asia/Tokyo"
  theme="mondrian"
  layout-columns="3"
  layout-hierarchy="primary">
</bauhaus-clock>
```

---

## Part 9: Success Criteria

### Design Success

A user should be able to:

1. Pick any valid combination of face, markers, hands, palette
2. **Always** get something that looks intentionally designed
3. **Never** produce something that looks random or broken
4. Switch between themes and maintain visual coherence

### Technical Success

- [ ] All inputs validated against guardrails
- [ ] Invalid inputs either rejected or auto-corrected
- [ ] SVG output scales perfectly at any size
- [ ] Animations use CSS transforms (GPU accelerated)
- [ ] Touch targets meet 80px minimum
- [ ] Works in all modern browsers

### Performance Success

- [ ] Initial render < 50ms
- [ ] Animation at 60fps
- [ ] Bundle size < 20KB gzipped
- [ ] No layout thrashing

---

## Part 10: Open Questions

1. **Should we support custom primitives?**
   - Risk: Users could break Bauhaus constraints
   - Alternative: Extensive preset library instead

2. **How strict on angles?**
   - Current: Only 30° increments
   - Alternative: Allow 15° increments for more hand positions

3. **Digital readout companion?**
   - Some use cases need precise time
   - Could be optional overlay
   - Must use geometric sans font

4. **Accessibility features?**
   - Reduced motion preference
   - Screen reader support
   - High contrast mode (still within palette system)

5. **Server-side rendering?**
   - SVG can be generated on server
   - Useful for static exports / images

---

## Appendix: Reference Materials

- [Bauhaus Architecture Principles](https://www.archute.com/bauhaus-architecture/)
- [Piet Mondrian Color Studies](https://www.wikiart.org/en/piet-mondrian)
- [Josef Albers - Interaction of Color](https://yalebooks.yale.edu/book/9780300179354/interaction-of-color/)
- [Wassily Kandinsky - Point and Line to Plane](https://www.bauhaus-bookshelf.org/books/kandinsky-point-and-line-to-plane.html)
- [Paul Klee - Pedagogical Sketchbook](https://www.moma.org/collection/works/7087)
