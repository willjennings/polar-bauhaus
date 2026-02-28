/**
 * Bauhaus World Clock Framework
 *
 * A constraint-based clock widget framework inspired by Bauhaus design principles.
 * "The constraint system is the design."
 *
 * @version 0.1.0
 * @license MIT
 */

// ═══════════════════════════════════════════════════════════════════════════
// MAIN EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

// The main class for creating world clocks
export { WorldClock, createWorldClock } from './components/WorldClock.js';

// Single clock for simpler use cases
export { createSingleClock, createStandaloneClock, renderClock } from './components/SingleClock.js';

// Theme management
export { ThemeManager, THEME_PRESETS, getThemeCSS } from './themes/ThemeManager.js';

// Configuration
export { Config, ConfigBuilder } from './core/Config.js';

// ═══════════════════════════════════════════════════════════════════════════
// SECONDARY EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

// Guardrails for validation
export {
  Guardrails,
  ColorGuardrails,
  ShapeGuardrails,
  ProportionGuardrails,
  LayoutGuardrails
} from './core/Guardrails.js';

// Time engine
export {
  getTimeForZone,
  getHandAngles,
  getTimezoneInfo,
  getAvailableTimezones,
  isDaytime,
  getTimeOfDay
} from './core/ClockEngine.js';

// Design tokens
export { PALETTES, WEIGHTS, DEFAULT_CONFIG } from './themes/tokens.js';

// ═══════════════════════════════════════════════════════════════════════════
// UI COMPONENTS (optional)
// ═══════════════════════════════════════════════════════════════════════════

export {
  createSettingsPanel,
  initSettingsPanel,
  createTimezoneSelector
} from './components/SettingsPanel.js';

// ═══════════════════════════════════════════════════════════════════════════
// PRIMITIVES (for advanced customization)
// ═══════════════════════════════════════════════════════════════════════════

export {
  createCircle,
  createSquare,
  createTriangle,
  createLine,
  createText
} from './primitives/index.js';

// ═══════════════════════════════════════════════════════════════════════════
// DEFAULT EXPORT
// ═══════════════════════════════════════════════════════════════════════════

import { WorldClock } from './components/WorldClock.js';
export default WorldClock;
