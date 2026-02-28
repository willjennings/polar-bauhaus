/**
 * Bauhaus World Clock Framework
 * TypeScript Definitions
 */

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type ThemeName = 'mondrian' | 'kandinsky' | 'albers' | 'klee' | 'bayer' | 'moholy';
export type Weight = 'thin' | 'medium' | 'bold';
export type Background = 'light' | 'dark';
export type FaceShape = 'circle' | 'square' | 'none';
export type MarkerStyle = 'line' | 'dot' | 'triangle' | 'square' | 'none';
export type HandStyle = 'line' | 'triangle' | 'rectangle';
export type NumeralStyle = 'none' | 'cardinal' | 'all' | 'indices';
export type Hierarchy = 'equal' | 'primary' | 'cascade';
export type LabelPosition = 'above' | 'below' | 'left' | 'right' | 'inside';
export type TimeOfDay = 'dawn' | 'day' | 'dusk' | 'night';

export interface Palette {
  name?: string;
  primary: string;
  secondary: string;
  accent: string;
  dark: string;
  light: string;
}

export interface ThemeConfig {
  palette?: ThemeName | Palette;
  background?: Background;
  weight?: Weight;
}

export interface MarkersConfig {
  style?: MarkerStyle;
  count?: 4 | 12;
  color?: string;
  strokeWidth?: number;
  size?: number;
}

export interface HandsConfig {
  hour?: HandStyle;
  minute?: HandStyle;
  second?: HandStyle;
  showSecond?: boolean;
}

export interface ProportionsConfig {
  hourHand?: number;
  minuteHand?: number;
  secondHand?: number;
  markerInset?: number;
}

export interface ClockConfig {
  face?: FaceShape;
  markers?: MarkersConfig;
  hands?: HandsConfig;
  numerals?: NumeralStyle;
  proportions?: ProportionsConfig;
}

export interface LabelsConfig {
  show?: boolean;
  position?: LabelPosition;
  showTime?: boolean;
  showOffset?: boolean;
}

export interface LayoutConfig {
  columns?: number;
  hierarchy?: Hierarchy;
  size?: number;
  labels?: LabelsConfig;
}

export interface BehaviorConfig {
  animate?: boolean;
  smoothSeconds?: boolean;
  updateInterval?: number;
}

export interface WorldClockConfig {
  theme?: ThemeConfig;
  clock?: ClockConfig;
  layout?: LayoutConfig;
  behavior?: BehaviorConfig;
  zones?: string[];
}

export interface TimeObject {
  hours: number;
  minutes: number;
  seconds: number;
  milliseconds: number;
  date: number;
  month: number;
  year: number;
  dayOfWeek: number;
  timestamp: number;
}

export interface HandAngles {
  hour: number;
  minute: number;
  second: number;
}

export interface TimezoneInfo {
  timezone: string;
  city: string;
  abbr: string;
  offset: number;
  offsetString: string;
}

export interface GridCell {
  index: number;
  x: number;
  y: number;
  width: number;
  height: number;
  cx: number;
  cy: number;
  radius: number;
  scale: number;
}

export interface GridLayout {
  columns: number;
  rows: number;
  cells: GridCell[];
  gap: number;
  padding: number;
  totalWidth: number;
  totalHeight: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  corrections: Record<string, { original: any; corrected: any; reason: string }>;
}

// ═══════════════════════════════════════════════════════════════════════════
// CLASSES
// ═══════════════════════════════════════════════════════════════════════════

export class WorldClock {
  constructor(container: HTMLElement | string, options?: WorldClockConfig & {
    zones?: string[];
    width?: number;
    height?: number;
  });

  start(): this;
  stop(): this;
  setTheme(theme: ThemeName | ThemeConfig): this;
  setZones(zones: string[]): this;
  addZone(zone: string): this;
  removeZone(zone: string): this;
  setLayout(layout: LayoutConfig): this;
  resize(width?: number, height?: number): this;
  on(event: string, handler: (data: any) => void): this;
  off(event: string, handler: (data: any) => void): this;
  getConfig(): WorldClockConfig;
  getTimes(): Array<{ zone: string; time: TimeObject }>;
  destroy(): void;
}

export class Config {
  constructor(userConfig?: WorldClockConfig, options?: { strict?: boolean; silent?: boolean });

  static builder(): ConfigBuilder;
  static strict(config: WorldClockConfig): Config;
  static silent(config: WorldClockConfig): Config;
  static forZones(zones: string[]): Config;
  static withTheme(theme: ThemeName, config?: WorldClockConfig): Config;
  static validate(config: WorldClockConfig): { result: ValidationResult; corrected: WorldClockConfig };
  static getDefaults(): WorldClockConfig;
  static getPaletteNames(): ThemeName[];

  get(): WorldClockConfig;
  getTheme(): ThemeConfig;
  getPalette(): Palette;
  getClock(): ClockConfig;
  getLayout(): LayoutConfig;
  getBehavior(): BehaviorConfig;
  getZones(): string[];
  isValid(): boolean;
  getErrors(): string[];
  getWarnings(): string[];
  getDimensions(diameter: number): {
    diameter: number;
    radius: number;
    strokeWidth: number;
    handWidth: number;
    hourHandLength: number;
    minuteHandLength: number;
    secondHandLength: number;
  };
  getColor(element: string): string;
}

export class ConfigBuilder {
  zones(...zones: string[]): this;
  palette(name: ThemeName): this;
  colors(palette: Palette): this;
  background(bg: Background): this;
  weight(w: Weight): this;
  face(shape: FaceShape): this;
  markers(style: MarkerStyle, count?: number): this;
  hands(config: HandsConfig): this;
  numerals(style: NumeralStyle): this;
  hierarchy(mode: Hierarchy): this;
  columns(n: number): this;
  size(px: number): this;
  labels(show: boolean, position?: LabelPosition): this;
  build(options?: { strict?: boolean; silent?: boolean }): Config;
}

export class ThemeManager {
  constructor(initialTheme?: ThemeName);

  readonly current: ThemePreset;

  static getAvailableThemes(): ThemeName[];
  static getPreset(name: ThemeName): ThemePreset | null;

  setTheme(theme: ThemeName | ThemePreset): this;
  setOverrides(overrides: Partial<ThemePreset>): this;
  setDayNightMode(enabled: boolean): this;
  getThemedConfig(timeOfDay?: TimeOfDay): ThemePreset;
  toConfig(): { theme: ThemeConfig; clock: ClockConfig };
  subscribe(callback: (event: { event: string; data: any }) => void): () => void;
}

export interface ThemePreset {
  name: string;
  description: string;
  palette: Palette;
  clock: ClockConfig;
  weight: Weight;
}

// ═══════════════════════════════════════════════════════════════════════════
// FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

// World Clock
export function createWorldClock(options: {
  zones?: string[];
  width?: number;
  height?: number;
  config?: WorldClockConfig;
}): string;

// Single Clock
export function createSingleClock(options: {
  cx: number;
  cy: number;
  radius: number;
  zone?: string;
  config?: WorldClockConfig;
}): string;

export function createStandaloneClock(options: {
  width?: number;
  height?: number;
  zone?: string;
  config?: WorldClockConfig;
}): string;

export function renderClock(
  container: HTMLElement | string,
  options?: { zone?: string; config?: WorldClockConfig; width?: number; height?: number }
): {
  stop(): void;
  start(): void;
  update(options: any): void;
  destroy(): void;
};

// Time
export function getTimeForZone(timezone?: string): TimeObject;
export function getHandAngles(time: TimeObject, smooth?: boolean): HandAngles;
export function getTimezoneInfo(timezone: string): TimezoneInfo;
export function getAvailableTimezones(): string[];
export function isDaytime(hours: number): boolean;
export function getTimeOfDay(hours: number): TimeOfDay;

// Theme
export function getThemeCSS(theme: ThemePreset): string;

// Settings Panel
export function createSettingsPanel(options: {
  config?: WorldClockConfig;
  onChange?: (path: string, value: any) => void;
}): string;

export function initSettingsPanel(
  container: HTMLElement,
  options?: { config?: WorldClockConfig; onChange?: (path: string, value: any) => void }
): { update(config: WorldClockConfig): void; destroy(): void };

export function createTimezoneSelector(options: {
  selected?: string[];
  onChange?: (zones: string[]) => void;
}): string;

// Primitives
export function createCircle(options: {
  cx: number;
  cy: number;
  r: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  id?: string;
  className?: string;
}): string;

export function createSquare(options: {
  x: number;
  y: number;
  width: number;
  height?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  rotation?: number;
  id?: string;
  className?: string;
}): string;

export function createTriangle(options: {
  cx: number;
  cy: number;
  width: number;
  height: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  rotation?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
  id?: string;
  className?: string;
}): string;

export function createLine(options: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  stroke?: string;
  strokeWidth?: number;
  strokeCap?: 'butt' | 'square';
  id?: string;
  className?: string;
}): string;

export function createText(options: {
  x: number;
  y: number;
  text: string;
  fill?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  weight?: 'light' | 'regular' | 'medium' | 'bold';
  anchor?: 'start' | 'middle' | 'end';
  id?: string;
  className?: string;
}): string;

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

export const PALETTES: Record<ThemeName, Palette>;
export const WEIGHTS: Record<Weight, { stroke: number; hand: number; marker: number }>;
export const DEFAULT_CONFIG: WorldClockConfig;
export const THEME_PRESETS: Record<ThemeName, ThemePreset>;

// ═══════════════════════════════════════════════════════════════════════════
// GUARDRAILS
// ═══════════════════════════════════════════════════════════════════════════

export const Guardrails: {
  validateConfig(config: WorldClockConfig): { result: ValidationResult; corrected: WorldClockConfig };
  isValid(config: WorldClockConfig): boolean;
  enforce(config: WorldClockConfig): WorldClockConfig;
};

export const ColorGuardrails: {
  isValidHexColor(color: string): boolean;
  validatePalette(palette: any): ValidationResult;
  validateBackground(bg: string): ValidationResult;
};

export const ShapeGuardrails: {
  snapAngle(angle: number): number;
  validateAngle(angle: number): { value: number; result: ValidationResult };
  validateRadius(radius: number): { value: number; result: ValidationResult };
  validateStrokeCap(cap: string): { value: string; result: ValidationResult };
};

export const ProportionGuardrails: {
  clamp(value: number, bounds: { min: number; max: number }): number;
  validateProportion(name: string, value: number): { value: number; result: ValidationResult };
  validateClockSize(size: number): { value: number; result: ValidationResult };
  validateWeight(weight: string): { value: string; result: ValidationResult };
};

export const LayoutGuardrails: {
  validateColumns(cols: number): { value: number; result: ValidationResult };
  validateClockCount(count: number): { value: number; result: ValidationResult };
  validateHierarchy(mode: string): { value: string; result: ValidationResult };
  validateLabelPosition(pos: string): { value: string; result: ValidationResult };
};

// Default export
export default WorldClock;
