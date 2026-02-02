/**
 * Bauhaus World Clock Framework
 * Grid Component
 *
 * Mathematical grid layout for multiple clocks.
 * Enforces Bauhaus principles of mathematical placement.
 */

/**
 * Calculate grid layout for clocks
 * @param {Object} options
 * @param {number} options.count - Number of clocks
 * @param {number} options.width - Container width
 * @param {number} options.height - Container height
 * @param {number} [options.columns] - Number of columns (auto if not specified)
 * @param {string} [options.hierarchy] - 'equal', 'primary', or 'cascade'
 * @param {number} [options.gap] - Gap between clocks
 * @param {number} [options.padding] - Container padding
 * @returns {Object} Grid layout info
 */
export function calculateGrid({
  count,
  width,
  height,
  columns,
  hierarchy = 'equal',
  gap = 20,
  padding = 20
}) {
  // Auto-calculate columns if not specified
  if (!columns) {
    if (count === 1) columns = 1;
    else if (count === 2) columns = 2;
    else if (count <= 4) columns = 2;
    else if (count <= 6) columns = 3;
    else columns = 4;
  }

  const rows = Math.ceil(count / columns);
  const availableWidth = width - padding * 2 - gap * (columns - 1);
  const availableHeight = height - padding * 2 - gap * (rows - 1);

  // Calculate base cell size
  const cellWidth = availableWidth / columns;
  const cellHeight = availableHeight / rows;
  const baseSize = Math.min(cellWidth, cellHeight);

  // Calculate positions based on hierarchy
  const cells = [];

  switch (hierarchy) {
    case 'primary':
      // First clock is larger, others share remaining space
      cells.push(...calculatePrimaryLayout(count, width, height, gap, padding));
      break;

    case 'cascade':
      // Clocks decrease in size from first to last
      cells.push(...calculateCascadeLayout(count, width, height, gap, padding));
      break;

    case 'equal':
    default:
      // All clocks same size
      cells.push(...calculateEqualLayout(count, columns, width, height, gap, padding));
      break;
  }

  return {
    columns,
    rows,
    cells,
    gap,
    padding,
    totalWidth: width,
    totalHeight: height
  };
}

/**
 * Calculate equal-sized grid layout
 */
function calculateEqualLayout(count, columns, width, height, gap, padding) {
  const rows = Math.ceil(count / columns);
  const availableWidth = width - padding * 2;
  const availableHeight = height - padding * 2;

  const cellWidth = (availableWidth - gap * (columns - 1)) / columns;
  const cellHeight = (availableHeight - gap * (rows - 1)) / rows;

  // Clock size with room for label
  const labelSpace = 30;
  const clockSize = Math.min(cellWidth, cellHeight - labelSpace) * 0.85;
  const radius = clockSize / 2;

  const cells = [];

  for (let i = 0; i < count; i++) {
    const col = i % columns;
    const row = Math.floor(i / columns);

    const cellX = padding + col * (cellWidth + gap);
    const cellY = padding + row * (cellHeight + gap);

    // Center clock within cell
    const cx = cellX + cellWidth / 2;
    const cy = cellY + (cellHeight - labelSpace) / 2;

    cells.push({
      index: i,
      x: cellX,
      y: cellY,
      width: cellWidth,
      height: cellHeight,
      cx,
      cy,
      radius,
      scale: 1
    });
  }

  return cells;
}

/**
 * Calculate primary hierarchy layout (first clock larger)
 */
function calculatePrimaryLayout(count, width, height, gap, padding) {
  const cells = [];
  const labelSpace = 30;

  if (count === 1) {
    const size = Math.min(width, height - labelSpace) - padding * 2;
    cells.push({
      index: 0,
      x: padding,
      y: padding,
      width: size,
      height: size + labelSpace,
      cx: width / 2,
      cy: padding + size / 2,
      radius: size / 2 * 0.85,
      scale: 1.5
    });
    return cells;
  }

  // Primary clock takes left 60% for 2-4 clocks, or top row for more
  const primaryRatio = 0.6;
  const secondaryRatio = 1 - primaryRatio;

  if (count <= 4) {
    // Primary on left, others stacked on right
    const primaryWidth = (width - padding * 2 - gap) * primaryRatio;
    const primarySize = Math.min(primaryWidth, height - padding * 2 - labelSpace) * 0.85;

    cells.push({
      index: 0,
      x: padding,
      y: padding,
      width: primaryWidth,
      height: height - padding * 2,
      cx: padding + primaryWidth / 2,
      cy: padding + (height - padding * 2 - labelSpace) / 2,
      radius: primarySize / 2,
      scale: 1.5
    });

    // Secondary clocks
    const secondaryWidth = (width - padding * 2 - gap) * secondaryRatio;
    const secondaryCount = count - 1;
    const secondaryHeight = (height - padding * 2 - gap * (secondaryCount - 1)) / secondaryCount;
    const secondarySize = Math.min(secondaryWidth, secondaryHeight - labelSpace) * 0.85;

    for (let i = 1; i < count; i++) {
      const idx = i - 1;
      const x = padding + primaryWidth + gap;
      const y = padding + idx * (secondaryHeight + gap);

      cells.push({
        index: i,
        x,
        y,
        width: secondaryWidth,
        height: secondaryHeight,
        cx: x + secondaryWidth / 2,
        cy: y + (secondaryHeight - labelSpace) / 2,
        radius: secondarySize / 2,
        scale: 1
      });
    }
  } else {
    // Primary in top row center, others below
    const primaryHeight = (height - padding * 2 - gap) * primaryRatio;
    const primarySize = Math.min(width - padding * 2, primaryHeight - labelSpace) * 0.6;

    cells.push({
      index: 0,
      x: padding,
      y: padding,
      width: width - padding * 2,
      height: primaryHeight,
      cx: width / 2,
      cy: padding + (primaryHeight - labelSpace) / 2,
      radius: primarySize / 2,
      scale: 1.5
    });

    // Secondary clocks in grid below
    const secondaryHeight = (height - padding * 2 - gap) * secondaryRatio;
    const secondaryCount = count - 1;
    const cols = Math.min(secondaryCount, 4);
    const secondaryCells = calculateEqualLayout(
      secondaryCount,
      cols,
      width - padding * 2,
      secondaryHeight,
      gap,
      0
    );

    secondaryCells.forEach((cell, i) => {
      cell.index = i + 1;
      cell.y += padding + primaryHeight + gap;
      cell.cy += padding + primaryHeight + gap;
      cells.push(cell);
    });
  }

  return cells;
}

/**
 * Calculate cascade layout (sizes decrease)
 */
function calculateCascadeLayout(count, width, height, gap, padding) {
  const cells = [];
  const labelSpace = 30;

  // Calculate sizes with golden ratio decrease
  const phi = 1.618;
  const scales = [];
  let scale = 1;
  for (let i = 0; i < count; i++) {
    scales.push(scale);
    scale /= phi;
  }

  // Normalize scales
  const maxScale = Math.max(...scales);
  const normalizedScales = scales.map(s => s / maxScale);

  // Simple horizontal cascade
  const totalUnits = normalizedScales.reduce((sum, s) => sum + s, 0);
  const availableWidth = width - padding * 2 - gap * (count - 1);
  const unitWidth = availableWidth / totalUnits;

  let x = padding;
  for (let i = 0; i < count; i++) {
    const cellScale = normalizedScales[i];
    const cellWidth = unitWidth * cellScale;
    const cellSize = Math.min(cellWidth, height - padding * 2 - labelSpace) * 0.85;

    cells.push({
      index: i,
      x,
      y: padding,
      width: cellWidth,
      height: height - padding * 2,
      cx: x + cellWidth / 2,
      cy: padding + (height - padding * 2 - labelSpace) / 2,
      radius: cellSize / 2,
      scale: cellScale
    });

    x += cellWidth + gap;
  }

  return cells;
}

/**
 * Calculate responsive columns based on width
 */
export function getResponsiveColumns(width, count) {
  if (count === 1) return 1;
  if (count === 2) return width < 400 ? 1 : 2;
  if (count <= 4) return width < 400 ? 1 : width < 600 ? 2 : 2;
  if (count <= 6) return width < 400 ? 1 : width < 600 ? 2 : 3;
  return width < 400 ? 1 : width < 600 ? 2 : width < 900 ? 3 : 4;
}

/**
 * Ensure minimum touch target size
 */
export function enforceMinimumSize(cells, minSize = 80) {
  return cells.map(cell => ({
    ...cell,
    radius: Math.max(cell.radius, minSize / 2)
  }));
}

export default calculateGrid;
