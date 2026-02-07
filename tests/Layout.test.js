/**
 * Bauhaus World Clock Framework
 * Layout System Unit Tests
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

import {
  calculateGrid,
  getResponsiveColumns,
  enforceMinimumSize,
  createWorldClock
} from '../src/components/index.js';

// ═══════════════════════════════════════════════════════════════════════════
// GRID TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe('Grid layout', () => {
  describe('calculateGrid', () => {
    it('should calculate grid for single clock', () => {
      const grid = calculateGrid({
        count: 1,
        width: 400,
        height: 300
      });
      assert.strictEqual(grid.cells.length, 1);
      assert.strictEqual(grid.columns, 1);
    });

    it('should calculate grid for multiple clocks', () => {
      const grid = calculateGrid({
        count: 4,
        width: 800,
        height: 400
      });
      assert.strictEqual(grid.cells.length, 4);
      assert.ok(grid.columns >= 1);
    });

    it('should respect column count', () => {
      const grid = calculateGrid({
        count: 6,
        width: 900,
        height: 400,
        columns: 3
      });
      assert.strictEqual(grid.columns, 3);
      assert.strictEqual(grid.rows, 2);
    });

    it('should position cells correctly', () => {
      const grid = calculateGrid({
        count: 4,
        width: 400,
        height: 400,
        columns: 2,
        padding: 20,
        gap: 20
      });

      // First cell should be in top-left
      assert.ok(grid.cells[0].cx < 200);
      assert.ok(grid.cells[0].cy < 200);

      // Last cell should be in bottom-right
      assert.ok(grid.cells[3].cx > 200);
      assert.ok(grid.cells[3].cy > 200);
    });

    it('should handle primary hierarchy', () => {
      const grid = calculateGrid({
        count: 3,
        width: 600,
        height: 400,
        hierarchy: 'primary'
      });

      // Primary clock should be larger
      assert.ok(grid.cells[0].radius > grid.cells[1].radius);
    });

    it('should handle cascade hierarchy', () => {
      const grid = calculateGrid({
        count: 3,
        width: 600,
        height: 200,
        hierarchy: 'cascade'
      });

      // Each subsequent clock should be smaller
      assert.ok(grid.cells[0].radius >= grid.cells[1].radius);
      assert.ok(grid.cells[1].radius >= grid.cells[2].radius);
    });
  });

  describe('getResponsiveColumns', () => {
    it('should return 1 column for single clock', () => {
      assert.strictEqual(getResponsiveColumns(800, 1), 1);
    });

    it('should return 1 column for narrow width', () => {
      assert.strictEqual(getResponsiveColumns(350, 4), 1);
    });

    it('should return 2 columns for medium width', () => {
      assert.strictEqual(getResponsiveColumns(500, 4), 2);
    });

    it('should return more columns for wide width', () => {
      const cols = getResponsiveColumns(1000, 8);
      assert.ok(cols >= 3);
    });
  });

  describe('enforceMinimumSize', () => {
    it('should enforce minimum radius', () => {
      const cells = [
        { radius: 30 },
        { radius: 50 },
        { radius: 20 }
      ];

      const enforced = enforceMinimumSize(cells, 80);

      assert.strictEqual(enforced[0].radius, 40); // 80/2
      assert.strictEqual(enforced[1].radius, 50); // Already larger
      assert.strictEqual(enforced[2].radius, 40); // Enforced
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// WORLD CLOCK TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe('WorldClock', () => {
  describe('createWorldClock', () => {
    it('should create SVG for single zone', () => {
      const svg = createWorldClock({
        zones: ['local'],
        width: 200,
        height: 200
      });

      assert.ok(svg.includes('<svg'));
      assert.ok(svg.includes('bauhaus-world-clock'));
      assert.ok(svg.includes('bauhaus-single-clock'));
    });

    it('should create SVG for multiple zones', () => {
      const svg = createWorldClock({
        zones: ['America/New_York', 'Europe/London', 'Asia/Tokyo'],
        width: 600,
        height: 300
      });

      assert.ok(svg.includes('America/New_York'));
      assert.ok(svg.includes('Europe/London'));
      assert.ok(svg.includes('Asia/Tokyo'));
    });

    it('should include styles', () => {
      const svg = createWorldClock({
        zones: ['local'],
        width: 200,
        height: 200
      });

      assert.ok(svg.includes('<style>'));
      assert.ok(svg.includes('.bauhaus-clock-hand'));
    });

    it('should set viewBox correctly', () => {
      const svg = createWorldClock({
        zones: ['local'],
        width: 400,
        height: 300
      });

      assert.ok(svg.includes('viewBox="0 0 400 300"'));
    });

    it('should include accessibility attributes', () => {
      const svg = createWorldClock({
        zones: ['local', 'UTC'],
        width: 400,
        height: 200
      });

      assert.ok(svg.includes('role="img"'));
      assert.ok(svg.includes('aria-label'));
      assert.ok(svg.includes('2 timezones'));
    });

    it('should apply configuration', () => {
      const svg = createWorldClock({
        zones: ['local'],
        width: 200,
        height: 200,
        config: {
          theme: { background: 'dark' },
          layout: { hierarchy: 'equal' }
        }
      });

      assert.ok(svg.includes('bauhaus-world-clock'));
    });
  });
});
