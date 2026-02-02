/**
 * Bauhaus World Clock Framework
 * SettingsPanel Component
 *
 * UI for adjusting clock settings with Bauhaus-constrained options.
 */

import { ThemeManager, THEME_PRESETS, getThemeCSS } from '../themes/ThemeManager.js';
import { PALETTES } from '../themes/tokens.js';
import { TIMEZONE_DATA, searchTimezones } from '../core/ClockEngine.js';

/**
 * Create settings panel HTML
 * @param {Object} options
 * @param {Object} options.config - Current configuration
 * @param {Function} options.onChange - Change callback
 * @returns {string} HTML string
 */
export function createSettingsPanel({ config = {}, onChange = () => {} }) {
  const currentTheme = config.theme?.palette || 'mondrian';
  const currentWeight = config.theme?.weight || 'medium';
  const currentBackground = config.theme?.background || 'light';
  const currentFace = config.clock?.face || 'circle';
  const currentMarkers = config.clock?.markers?.style || 'line';
  const currentColumns = config.layout?.columns || 'auto';
  const currentHierarchy = config.layout?.hierarchy || 'equal';

  return `
<div class="bauhaus-settings-panel">
  <style>
    .bauhaus-settings-panel {
      font-family: 'Futura', 'Helvetica Neue', sans-serif;
      padding: 20px;
      background: #FFFFFF;
      border: 2px solid #000000;
      max-width: 300px;
    }
    .bauhaus-settings-section {
      margin-bottom: 20px;
    }
    .bauhaus-settings-title {
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 2px;
      text-transform: uppercase;
      margin-bottom: 10px;
      border-bottom: 2px solid #000;
      padding-bottom: 5px;
    }
    .bauhaus-settings-row {
      display: flex;
      align-items: center;
      margin-bottom: 10px;
    }
    .bauhaus-settings-label {
      font-size: 11px;
      font-weight: 500;
      width: 80px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .bauhaus-settings-control {
      flex: 1;
    }
    .bauhaus-select {
      width: 100%;
      padding: 8px;
      font-family: inherit;
      font-size: 12px;
      border: 2px solid #000;
      background: #FFF;
      cursor: pointer;
    }
    .bauhaus-select:focus {
      outline: none;
      background: #F0F0F0;
    }
    .bauhaus-color-swatches {
      display: flex;
      gap: 5px;
    }
    .bauhaus-swatch {
      width: 24px;
      height: 24px;
      border: 2px solid #000;
      cursor: pointer;
    }
    .bauhaus-swatch.active {
      outline: 2px solid #DE0100;
      outline-offset: 2px;
    }
    .bauhaus-toggle {
      display: flex;
      gap: 5px;
    }
    .bauhaus-toggle-btn {
      flex: 1;
      padding: 8px;
      font-family: inherit;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 1px;
      text-transform: uppercase;
      border: 2px solid #000;
      background: #FFF;
      cursor: pointer;
    }
    .bauhaus-toggle-btn.active {
      background: #000;
      color: #FFF;
    }
  </style>

  <div class="bauhaus-settings-section">
    <div class="bauhaus-settings-title">Theme</div>
    <div class="bauhaus-settings-row">
      <span class="bauhaus-settings-label">Palette</span>
      <div class="bauhaus-settings-control">
        <select class="bauhaus-select" data-setting="theme.palette">
          ${Object.keys(THEME_PRESETS).map(name => `
            <option value="${name}" ${name === currentTheme ? 'selected' : ''}>
              ${THEME_PRESETS[name].name}
            </option>
          `).join('')}
        </select>
      </div>
    </div>
    <div class="bauhaus-settings-row">
      <span class="bauhaus-settings-label">Weight</span>
      <div class="bauhaus-settings-control bauhaus-toggle">
        ${['thin', 'medium', 'bold'].map(w => `
          <button class="bauhaus-toggle-btn ${w === currentWeight ? 'active' : ''}"
                  data-setting="theme.weight" data-value="${w}">
            ${w}
          </button>
        `).join('')}
      </div>
    </div>
    <div class="bauhaus-settings-row">
      <span class="bauhaus-settings-label">Mode</span>
      <div class="bauhaus-settings-control bauhaus-toggle">
        ${['light', 'dark'].map(m => `
          <button class="bauhaus-toggle-btn ${m === currentBackground ? 'active' : ''}"
                  data-setting="theme.background" data-value="${m}">
            ${m}
          </button>
        `).join('')}
      </div>
    </div>
  </div>

  <div class="bauhaus-settings-section">
    <div class="bauhaus-settings-title">Clock</div>
    <div class="bauhaus-settings-row">
      <span class="bauhaus-settings-label">Face</span>
      <div class="bauhaus-settings-control bauhaus-toggle">
        ${['circle', 'square', 'none'].map(f => `
          <button class="bauhaus-toggle-btn ${f === currentFace ? 'active' : ''}"
                  data-setting="clock.face" data-value="${f}">
            ${f === 'none' ? '—' : f.charAt(0).toUpperCase()}
          </button>
        `).join('')}
      </div>
    </div>
    <div class="bauhaus-settings-row">
      <span class="bauhaus-settings-label">Markers</span>
      <div class="bauhaus-settings-control">
        <select class="bauhaus-select" data-setting="clock.markers.style">
          ${['line', 'dot', 'triangle', 'square', 'none'].map(m => `
            <option value="${m}" ${m === currentMarkers ? 'selected' : ''}>
              ${m.charAt(0).toUpperCase() + m.slice(1)}
            </option>
          `).join('')}
        </select>
      </div>
    </div>
  </div>

  <div class="bauhaus-settings-section">
    <div class="bauhaus-settings-title">Layout</div>
    <div class="bauhaus-settings-row">
      <span class="bauhaus-settings-label">Columns</span>
      <div class="bauhaus-settings-control bauhaus-toggle">
        ${['auto', '1', '2', '3', '4'].map(c => `
          <button class="bauhaus-toggle-btn ${String(currentColumns) === c || (c === 'auto' && !currentColumns) ? 'active' : ''}"
                  data-setting="layout.columns" data-value="${c}">
            ${c === 'auto' ? 'A' : c}
          </button>
        `).join('')}
      </div>
    </div>
    <div class="bauhaus-settings-row">
      <span class="bauhaus-settings-label">Hierarchy</span>
      <div class="bauhaus-settings-control">
        <select class="bauhaus-select" data-setting="layout.hierarchy">
          ${['equal', 'primary', 'cascade'].map(h => `
            <option value="${h}" ${h === currentHierarchy ? 'selected' : ''}>
              ${h.charAt(0).toUpperCase() + h.slice(1)}
            </option>
          `).join('')}
        </select>
      </div>
    </div>
  </div>
</div>
`;
}

/**
 * Initialize settings panel with event handlers
 * @param {HTMLElement} container - Container element
 * @param {Object} options - Options with config and onChange
 */
export function initSettingsPanel(container, options = {}) {
  const { config = {}, onChange = () => {} } = options;

  // Render panel
  container.innerHTML = createSettingsPanel({ config, onChange });

  // Add event listeners
  container.querySelectorAll('.bauhaus-select').forEach(select => {
    select.addEventListener('change', (e) => {
      const path = e.target.dataset.setting;
      const value = e.target.value;
      onChange(path, value);
    });
  });

  container.querySelectorAll('.bauhaus-toggle-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const path = e.target.dataset.setting;
      let value = e.target.dataset.value;

      // Convert to number if needed
      if (path === 'layout.columns' && value !== 'auto') {
        value = parseInt(value, 10);
      }

      // Update active state
      const group = e.target.parentElement;
      group.querySelectorAll('.bauhaus-toggle-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');

      onChange(path, value);
    });
  });

  return {
    update(newConfig) {
      initSettingsPanel(container, { config: newConfig, onChange });
    },
    destroy() {
      container.innerHTML = '';
    }
  };
}

/**
 * Create timezone selector
 */
export function createTimezoneSelector({ selected = [], onChange = () => {} }) {
  const availableZones = Object.entries(TIMEZONE_DATA)
    .map(([zone, data]) => ({ zone, ...data }))
    .sort((a, b) => a.city.localeCompare(b.city));

  return `
<div class="bauhaus-timezone-selector">
  <style>
    .bauhaus-timezone-selector {
      font-family: 'Futura', 'Helvetica Neue', sans-serif;
    }
    .bauhaus-timezone-search {
      width: 100%;
      padding: 10px;
      font-family: inherit;
      font-size: 12px;
      border: 2px solid #000;
      margin-bottom: 10px;
    }
    .bauhaus-timezone-list {
      max-height: 200px;
      overflow-y: auto;
      border: 2px solid #000;
    }
    .bauhaus-timezone-item {
      display: flex;
      align-items: center;
      padding: 8px 10px;
      cursor: pointer;
      border-bottom: 1px solid #EEE;
    }
    .bauhaus-timezone-item:hover {
      background: #F0F0F0;
    }
    .bauhaus-timezone-item.selected {
      background: #000;
      color: #FFF;
    }
    .bauhaus-timezone-city {
      flex: 1;
      font-weight: 500;
    }
    .bauhaus-timezone-offset {
      font-size: 10px;
      opacity: 0.7;
    }
  </style>
  <input type="text" class="bauhaus-timezone-search" placeholder="SEARCH CITIES..." data-action="search">
  <div class="bauhaus-timezone-list">
    ${availableZones.map(({ zone, city, offset }) => `
      <div class="bauhaus-timezone-item ${selected.includes(zone) ? 'selected' : ''}"
           data-zone="${zone}">
        <span class="bauhaus-timezone-city">${city}</span>
        <span class="bauhaus-timezone-offset">UTC${offset >= 0 ? '+' : ''}${offset}</span>
      </div>
    `).join('')}
  </div>
</div>
`;
}

export default createSettingsPanel;
