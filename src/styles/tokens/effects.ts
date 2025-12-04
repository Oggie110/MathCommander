/**
 * Effect Design Tokens
 *
 * Shadows, glows, borders, and other visual effects.
 * Centralized for consistency across the app.
 */

import { colors } from './colors';

// === BORDER WIDTHS ===
export const borderWidths = {
  none: '0',
  thin: '1px',
  default: '2px',
  thick: '4px',
  heavy: '6px',
} as const;

// === BORDER RADIUS ===
export const borderRadius = {
  none: '0',
  sm: '2px',
  md: '4px',
  lg: '8px',
  xl: '12px',
  full: '9999px',
} as const;

// === SEMANTIC BORDER STYLES ===
// Complete border definitions (width + color) for common use cases
export const borders = {
  // Panel/Card borders
  panel: {
    width: borderWidths.thick,        // 4px
    color: '#4A4A5A',                 // industrial-metal
    style: 'solid',
  },
  panelLight: {
    width: borderWidths.default,      // 2px
    color: '#4A4A5A',
    style: 'solid',
  },

  // Stats boxes, info containers
  box: {
    width: borderWidths.default,      // 2px
    color: '#374151',                 // gray-700
    style: 'solid',
  },

  // Dialogue box borders
  dialogueCommander: {
    width: borderWidths.default,
    color: 'rgba(34, 197, 94, 0.5)',  // green-500/50
    style: 'solid',
  },
  dialogueEnemy: {
    width: borderWidths.default,
    color: 'rgba(239, 68, 68, 0.5)',  // red-500/50
    style: 'solid',
  },
  dialogueVictory: {
    width: borderWidths.default,
    color: 'rgba(234, 179, 8, 0.5)',  // yellow-500/50
    style: 'solid',
  },

  // Waypoint/Mission buttons
  waypointLocked: {
    width: borderWidths.thick,
    color: '#7F1D1D',                 // red-900
    style: 'solid',
  },
  waypointCurrent: {
    width: borderWidths.thick,
    color: '#EF4444',                 // red-500
    style: 'solid',
  },
  waypointCompleted: {
    width: borderWidths.thick,
    color: '#22C55E',                 // green-500
    style: 'solid',
  },

  // Screen frame (mobile map)
  screenFrame: {
    width: borderWidths.heavy,        // 6px
    color: '#4A4A5A',
    style: 'solid',
  },

  // Retro button border
  button: {
    width: borderWidths.thick,        // 4px
    color: '#000000',
    style: 'solid',
  },

  // Answer buttons
  answerDefault: {
    width: borderWidths.default,
    color: '#4A4A5A',                 // industrial-metal
    style: 'solid',
  },
  answerCorrect: {
    width: borderWidths.default,
    color: '#22C55E',                 // green-500
    style: 'solid',
  },
  answerWrong: {
    width: borderWidths.default,
    color: '#EF4444',                 // red-500
    style: 'solid',
  },

  // Chapter badges (map)
  chapterInner: {
    width: borderWidths.thin,
    color: 'rgba(59, 130, 246, 0.5)', // blue-500/50
    style: 'solid',
  },
  chapterGas: {
    width: borderWidths.thin,
    color: 'rgba(168, 85, 247, 0.5)', // purple-500/50
    style: 'solid',
  },
  chapterIce: {
    width: borderWidths.thin,
    color: 'rgba(34, 211, 238, 0.5)', // cyan-500/50
    style: 'solid',
  },
  chapterKuiper: {
    width: borderWidths.thin,
    color: 'rgba(249, 115, 22, 0.5)', // orange-500/50
    style: 'solid',
  },

  // Selection rings
  selectionCurrent: {
    width: '3px',
    color: '#00F0FF',                 // brand-secondary (cyan)
    style: 'solid',
  },
  selectionSelected: {
    width: '3px',
    color: '#FFE500',                 // brand-accent (yellow)
    style: 'solid',
  },
} as const;

// === BOX SHADOWS ===
export const shadows = {
  // Panel/Card shadows (industrial look)
  panel: {
    inset: 'inset 2px 2px 0px 0px rgba(255, 255, 255, 0.1), inset -2px -2px 0px 0px rgba(0, 0, 0, 0.5)',
    outer: '0 4px 10px rgba(0, 0, 0, 0.5)',
  },

  // Button shadows (3D retro effect)
  button: {
    default: 'inset -4px -4px 0px 0px rgba(0, 0, 0, 0.5), inset 4px 4px 0px 0px rgba(255, 255, 255, 0.5)',
    pressed: 'inset 2px 2px 0px 0px rgba(0, 0, 0, 0.5)',
  },

  // CRT bezel shadow
  crt: {
    outer: '0 8px 32px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
    inner: 'inset 0 0 30px rgba(0, 255, 0, 0.4)',
  },

  // Elevation shadows
  elevation: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.5)',
    md: '0 4px 6px rgba(0, 0, 0, 0.5)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.5)',
    xl: '0 20px 25px rgba(0, 0, 0, 0.5)',
  },
} as const;

// === GLOW EFFECTS ===
// Box-shadow based glows for elements
export const glows = {
  // Success/Commander (green)
  green: {
    soft: `0 0 4px ${colors.brand.success}`,
    medium: `0 0 8px ${colors.brand.success}`,
    strong: `0 0 12px ${colors.brand.success}, 0 0 20px ${colors.brand.success}40`,
  },

  // Danger/Enemy (red)
  red: {
    soft: `0 0 4px ${colors.brand.danger}`,
    medium: `0 0 8px ${colors.brand.danger}`,
    strong: `0 0 12px ${colors.brand.danger}, 0 0 20px ${colors.brand.danger}40`,
  },

  // Accent/Victory (yellow)
  yellow: {
    soft: `0 0 4px ${colors.brand.accent}`,
    medium: `0 0 8px ${colors.brand.accent}`,
    strong: `0 0 12px ${colors.brand.accent}, 0 0 20px ${colors.brand.accent}40`,
  },

  // Secondary/Info (cyan)
  cyan: {
    soft: `0 0 4px ${colors.brand.secondary}`,
    medium: `0 0 8px ${colors.brand.secondary}`,
    strong: `0 0 12px ${colors.brand.secondary}, 0 0 20px ${colors.brand.secondary}40`,
  },

  // Primary (blue)
  blue: {
    soft: `0 0 4px ${colors.brand.primary}`,
    medium: `0 0 8px ${colors.brand.primary}`,
    strong: `0 0 12px ${colors.brand.primary}, 0 0 20px ${colors.brand.primary}40`,
  },
} as const;

// === TEXT GLOWS ===
// Drop-shadow based glows for text
export const textGlows = {
  green: {
    soft: 'drop-shadow(0 0 4px rgba(74, 222, 128, 0.4))',
    medium: 'drop-shadow(0 0 6px rgba(74, 222, 128, 0.6))',
    strong: 'drop-shadow(0 0 8px rgba(74, 222, 128, 0.8))',
  },
  red: {
    soft: 'drop-shadow(0 0 4px rgba(248, 113, 113, 0.4))',
    medium: 'drop-shadow(0 0 6px rgba(248, 113, 113, 0.6))',
    strong: 'drop-shadow(0 0 8px rgba(248, 113, 113, 0.8))',
  },
  yellow: {
    soft: 'drop-shadow(0 0 4px rgba(250, 204, 21, 0.4))',
    medium: 'drop-shadow(0 0 6px rgba(250, 204, 21, 0.6))',
    strong: 'drop-shadow(0 0 8px rgba(250, 204, 21, 0.8))',
  },
  cyan: {
    soft: 'drop-shadow(0 0 4px rgba(34, 211, 238, 0.4))',
    medium: 'drop-shadow(0 0 6px rgba(34, 211, 238, 0.6))',
    strong: 'drop-shadow(0 0 8px rgba(34, 211, 238, 0.8))',
  },
  // Solid drop shadows (for titles)
  solid: {
    red: 'drop-shadow(4px 4px 0 rgba(255, 42, 42, 1))',
    blue: 'drop-shadow(4px 4px 0 rgba(37, 99, 235, 1))',
    black: 'drop-shadow(2px 2px 0 rgba(0, 0, 0, 1))',
  },
} as const;

// === CRT / SCANLINE EFFECTS ===
export const crtEffects = {
  // Scanline overlay
  scanlines: {
    pattern: 'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(0, 0, 0, 0.4) 1px, rgba(0, 0, 0, 0.4) 2px)',
    opacity: '0.6',
  },

  // Button scanlines (wider)
  buttonScanlines: {
    pattern: 'linear-gradient(transparent 50%, rgba(0, 0, 0, 0.2) 50%)',
    size: '100% 2px',
  },

  // Phosphor glow colors
  phosphor: {
    green: 'radial-gradient(ellipse at center, rgba(0, 255, 0, 0.15) 0%, transparent 70%)',
    red: 'radial-gradient(ellipse at center, rgba(255, 0, 0, 0.15) 0%, transparent 70%)',
    yellow: 'radial-gradient(ellipse at center, rgba(255, 200, 0, 0.15) 0%, transparent 70%)',
  },
} as const;

// === HAZARD STRIPE PATTERN ===
export const patterns = {
  hazard: `repeating-linear-gradient(
    45deg,
    ${colors.brand.hazard},
    ${colors.brand.hazard} 10px,
    #000000 10px,
    #000000 20px
  )`,
} as const;

// === TRANSITIONS ===
export const transitions = {
  fast: '150ms ease-out',
  default: '300ms ease-out',
  slow: '500ms ease-out',
  // Specific transitions
  transform: 'transform 300ms ease-out',
  opacity: 'opacity 300ms ease-out',
  colors: 'color 300ms ease-out, background-color 300ms ease-out, border-color 300ms ease-out',
} as const;

export type ShadowToken = typeof shadows;
export type GlowToken = typeof glows;
