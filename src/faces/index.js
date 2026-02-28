/**
 * Bauhaus World Clock Framework
 * Face Registry
 *
 * Central registry for all clock face modules.
 * Each face has: meta, render(), update()
 */

// Import all faces
import * as swissRailway from './swiss-railway.js';
import * as flipClock from './flip-clock.js';
import * as wordClock from './word-clock.js';
import * as braun from './braun.js';
import * as binary from './binary.js';
import * as mondrian from './mondrian.js';
import * as sundial from './sundial.js';
import * as minimal from './minimal.js';
import * as artDeco from './art-deco.js';
import * as hourglass from './hourglass.js';
import * as astronomical from './astronomical.js';
import * as skeleton from './skeleton.js';

// Re-export base utilities
export * from './FaceBase.js';

// ═══════════════════════════════════════════════════════════════════════════
// FACE REGISTRY
// ═══════════════════════════════════════════════════════════════════════════

const FACES = {
  'swiss-railway': swissRailway,
  'flip-clock': flipClock,
  'word-clock': wordClock,
  'braun': braun,
  'binary': binary,
  'mondrian': mondrian,
  'sundial': sundial,
  'minimal': minimal,
  'art-deco': artDeco,
  'hourglass': hourglass,
  'astronomical': astronomical,
  'skeleton': skeleton
};

/**
 * Get a face module by ID
 * @param {string} faceId - Face identifier
 * @returns {Object|null} Face module or null
 */
export function getFace(faceId) {
  return FACES[faceId] || null;
}

/**
 * Get all available faces
 * @returns {Array<Object>} Array of face metadata
 */
export function getAllFaces() {
  return Object.entries(FACES).map(([id, face]) => ({
    id,
    ...face.meta
  }));
}

/**
 * Get face IDs
 * @returns {Array<string>} Array of face IDs
 */
export function getFaceIds() {
  return Object.keys(FACES);
}

/**
 * Check if a face exists
 * @param {string} faceId - Face identifier
 * @returns {boolean}
 */
export function hasFace(faceId) {
  return faceId in FACES;
}

/**
 * Render a face
 * @param {string} faceId - Face identifier
 * @param {Object} options - Render options
 * @returns {string} SVG string
 */
export function renderFace(faceId, options) {
  const face = getFace(faceId);
  if (!face) {
    console.warn(`Unknown face: ${faceId}, falling back to swiss-railway`);
    return FACES['swiss-railway'].render(options);
  }
  return face.render(options);
}

/**
 * Update a face (differential DOM update)
 * @param {string} faceId - Face identifier
 * @param {Element} clockEl - Clock DOM element
 * @param {Object} time - Current time
 * @param {Object} prevTime - Previous time
 */
export function updateFace(faceId, clockEl, time, prevTime) {
  const face = getFace(faceId);
  if (face && face.update) {
    face.update(clockEl, time, prevTime);
  }
}

/**
 * Get CSS for all faces
 * @returns {string} Combined CSS
 */
export function getAllFaceCSS() {
  return Object.values(FACES)
    .map(face => face.getCSS ? face.getCSS() : '')
    .join('\n');
}

// ═══════════════════════════════════════════════════════════════════════════
// FACE CATEGORIES
// ═══════════════════════════════════════════════════════════════════════════

export const FACE_CATEGORIES = {
  analog: ['swiss-railway', 'braun', 'mondrian', 'art-deco', 'minimal', 'sundial'],
  digital: ['flip-clock', 'word-clock', 'binary'],
  mechanical: ['skeleton', 'hourglass'],
  astronomical: ['astronomical']
};

/**
 * Get faces by category
 */
export function getFacesByCategory(category) {
  const ids = FACE_CATEGORIES[category] || [];
  return ids.map(id => ({ id, ...FACES[id].meta }));
}

// ═══════════════════════════════════════════════════════════════════════════
// DEFAULT EXPORT
// ═══════════════════════════════════════════════════════════════════════════

export default {
  getFace,
  getAllFaces,
  getFaceIds,
  hasFace,
  renderFace,
  updateFace,
  getAllFaceCSS,
  FACE_CATEGORIES,
  getFacesByCategory
};
