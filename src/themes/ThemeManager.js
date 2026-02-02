/**
 * Bauhaus World Clock Framework
 * ThemeManager
 *
 * Manages theme switching, presets, and day/night adaptation.
 */

import { PALETTES, DEFAULT_CONFIG } from './tokens.js';
import { ColorGuardrails } from '../core/Guardrails.js';

/**
 * Theme presets with complete configurations
 */
export const THEME_PRESETS = {
  mondrian: {
    name: 'Mondrian',
    description: 'Bold primary colors with black grid lines',
    palette: PALETTES.mondrian,
    clock: {
      face: 'square',
      markers: { style: 'line', count: 4 },
      hands: { hour: 'rectangle', minute: 'rectangle', second: 'line' }
    },
    weight: 'bold'
  },

  kandinsky: {
    name: 'Kandinsky',
    description: 'Expressive warm colors with geometric forms',
    palette: PALETTES.kandinsky,
    clock: {
      face: 'circle',
      markers: { style: 'dot', count: 12 },
      hands: { hour: 'triangle', minute: 'line', second: 'line' }
    },
    weight: 'medium'
  },

  albers: {
    name: 'Albers',
    description: 'Subtle color interactions and nested squares',
    palette: PALETTES.albers,
    clock: {
      face: 'square',
      markers: { style: 'square', count: 4 },
      hands: { hour: 'rectangle', minute: 'rectangle', second: 'line' }
    },
    weight: 'thin'
  },

  klee: {
    name: 'Klee',
    description: 'Playful earth tones with organic geometry',
    palette: PALETTES.klee,
    clock: {
      face: 'circle',
      markers: { style: 'triangle', count: 12 },
      hands: { hour: 'triangle', minute: 'triangle', second: 'line' }
    },
    weight: 'medium'
  },

  bayer: {
    name: 'Bayer',
    description: 'Industrial modernism with high contrast',
    palette: PALETTES.bayer,
    clock: {
      face: 'circle',
      markers: { style: 'line', count: 12 },
      hands: { hour: 'line', minute: 'line', second: 'line' }
    },
    weight: 'bold'
  },

  moholy: {
    name: 'Moholy-Nagy',
    description: 'Light and shadow with transparency effects',
    palette: PALETTES.moholy,
    clock: {
      face: 'circle',
      markers: { style: 'dot', count: 4 },
      hands: { hour: 'line', minute: 'line', second: 'line' }
    },
    weight: 'thin'
  }
};

/**
 * Day/night color adjustments
 */
const DAY_NIGHT_SHIFTS = {
  dawn: {
    backgroundShift: 0.95, // Slightly warmer
    accentBoost: 1.1
  },
  day: {
    backgroundShift: 1.0, // Normal
    accentBoost: 1.0
  },
  dusk: {
    backgroundShift: 0.9, // Warmer, dimmer
    accentBoost: 1.2
  },
  night: {
    backgroundShift: 0.7, // Darker
    accentBoost: 0.8
  }
};

/**
 * ThemeManager class
 */
export class ThemeManager {
  constructor(initialTheme = 'mondrian') {
    this._currentTheme = null;
    this._customOverrides = {};
    this._dayNightEnabled = false;
    this._listeners = [];

    this.setTheme(initialTheme);
  }

  /**
   * Get current theme
   */
  get current() {
    return this._currentTheme;
  }

  /**
   * Get all available theme names
   */
  static getAvailableThemes() {
    return Object.keys(THEME_PRESETS);
  }

  /**
   * Get theme preset by name
   */
  static getPreset(name) {
    return THEME_PRESETS[name] || null;
  }

  /**
   * Set theme by name or custom config
   * @param {string|Object} theme - Theme name or custom theme object
   */
  setTheme(theme) {
    if (typeof theme === 'string') {
      const preset = THEME_PRESETS[theme];
      if (!preset) {
        console.warn(`ThemeManager: Unknown theme "${theme}", using mondrian`);
        this._currentTheme = { ...THEME_PRESETS.mondrian };
      } else {
        this._currentTheme = { ...preset };
      }
    } else if (typeof theme === 'object') {
      // Custom theme - validate and merge
      this._currentTheme = this._validateCustomTheme(theme);
    }

    // Apply custom overrides
    this._currentTheme = this._applyOverrides(this._currentTheme);

    this._notify('themeChange', this._currentTheme);
    return this;
  }

  /**
   * Apply custom overrides
   */
  setOverrides(overrides) {
    this._customOverrides = overrides;
    this._currentTheme = this._applyOverrides(this._currentTheme);
    this._notify('themeChange', this._currentTheme);
    return this;
  }

  /**
   * Enable/disable day/night color adaptation
   */
  setDayNightMode(enabled) {
    this._dayNightEnabled = enabled;
    this._notify('dayNightModeChange', enabled);
    return this;
  }

  /**
   * Get adjusted theme for time of day
   */
  getThemedConfig(timeOfDay = 'day') {
    const theme = { ...this._currentTheme };

    if (this._dayNightEnabled && DAY_NIGHT_SHIFTS[timeOfDay]) {
      const shift = DAY_NIGHT_SHIFTS[timeOfDay];

      // In a real implementation, we'd adjust colors here
      // For now, just track the mode
      theme._timeOfDay = timeOfDay;
      theme._shift = shift;
    }

    return theme;
  }

  /**
   * Get configuration object for WorldClock
   */
  toConfig() {
    return {
      theme: {
        palette: this._currentTheme.palette,
        background: this._currentTheme.background || 'light',
        weight: this._currentTheme.weight || 'medium'
      },
      clock: this._currentTheme.clock || {}
    };
  }

  /**
   * Subscribe to theme changes
   */
  subscribe(callback) {
    this._listeners.push(callback);
    return () => {
      const index = this._listeners.indexOf(callback);
      if (index > -1) this._listeners.splice(index, 1);
    };
  }

  /**
   * Validate custom theme
   */
  _validateCustomTheme(theme) {
    const validated = {
      name: theme.name || 'Custom',
      description: theme.description || '',
      palette: theme.palette || PALETTES.mondrian,
      clock: theme.clock || {},
      weight: theme.weight || 'medium'
    };

    // Validate palette colors
    if (typeof validated.palette === 'object') {
      const result = ColorGuardrails.validatePalette(validated.palette);
      if (!result.valid) {
        console.warn('ThemeManager: Invalid palette, using default');
        validated.palette = PALETTES.mondrian;
      }
    }

    return validated;
  }

  /**
   * Apply custom overrides to theme
   */
  _applyOverrides(theme) {
    if (!this._customOverrides || Object.keys(this._customOverrides).length === 0) {
      return theme;
    }

    return {
      ...theme,
      ...this._customOverrides,
      palette: {
        ...theme.palette,
        ...(this._customOverrides.palette || {})
      },
      clock: {
        ...theme.clock,
        ...(this._customOverrides.clock || {})
      }
    };
  }

  /**
   * Notify listeners
   */
  _notify(event, data) {
    this._listeners.forEach(callback => {
      try {
        callback({ event, data });
      } catch (e) {
        console.error('ThemeManager listener error:', e);
      }
    });
  }
}

/**
 * Get CSS custom properties for a theme
 */
export function getThemeCSS(theme) {
  const palette = theme.palette || PALETTES.mondrian;

  return `
:root {
  --bauhaus-primary: ${palette.primary};
  --bauhaus-secondary: ${palette.secondary};
  --bauhaus-accent: ${palette.accent};
  --bauhaus-dark: ${palette.dark};
  --bauhaus-light: ${palette.light};
  --bauhaus-weight: ${theme.weight || 'medium'};
}

.bauhaus-theme-${(theme.name || 'custom').toLowerCase().replace(/\s+/g, '-')} {
  --bauhaus-primary: ${palette.primary};
  --bauhaus-secondary: ${palette.secondary};
  --bauhaus-accent: ${palette.accent};
  --bauhaus-dark: ${palette.dark};
  --bauhaus-light: ${palette.light};
}
`;
}

export default ThemeManager;
