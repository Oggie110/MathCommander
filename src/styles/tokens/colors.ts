/**
 * Color Design Tokens
 *
 * Single source of truth for all colors in the app.
 * These are used to generate both Tailwind classes and CSS custom properties.
 */

export const colors = {
  // === SPACE BACKGROUNDS ===
  space: {
    black: '#050510',      // Main app background
    dark: '#0B0B1E',       // Panel backgrounds
    light: '#1A1A35',      // Lighter panels, hover states
  },

  // === INDUSTRIAL UI ===
  industrial: {
    dark: '#181825',       // Card/panel backgrounds
    metal: '#4A4A5A',      // Borders, dividers
    blue: '#2A2A40',       // Input backgrounds, answer buttons
    highlight: '#6E6E80',  // Metal highlights, muted labels
  },

  // === BRAND / SEMANTIC ===
  brand: {
    primary: '#2563EB',    // Primary buttons (blue)
    secondary: '#00F0FF',  // Highlights, current selection (cyan)
    accent: '#FFE500',     // Stars, XP, important highlights (yellow)
    hazard: '#E5C000',     // Warning states, hazard stripes
    danger: '#FF2A2A',     // Enemies, errors, alerts (red)
    success: '#00FF9D',    // Completed, correct, hit (green)
  },

  // === TEXT COLORS ===
  // These map semantic meaning to actual colors
  text: {
    primary: '#FFFFFF',
    secondary: 'rgba(255, 255, 255, 0.8)',
    muted: 'rgba(255, 255, 255, 0.5)',
    disabled: 'rgba(255, 255, 255, 0.3)',
  },

  // === UI STATES ===
  // For dialogue boxes, feedback, etc.
  ui: {
    commander: {
      border: 'rgba(34, 197, 94, 0.5)',   // green-500/50
      text: '#4ADE80',                     // green-400
      textLight: '#86EFAC',                // green-300
      glow: 'rgba(74, 222, 128, 0.6)',
    },
    enemy: {
      border: 'rgba(239, 68, 68, 0.5)',   // red-500/50
      text: '#F87171',                     // red-400
      textLight: '#FCA5A5',                // red-300
      glow: 'rgba(248, 113, 113, 0.6)',
    },
    victory: {
      border: 'rgba(234, 179, 8, 0.5)',   // yellow-500/50
      text: '#FACC15',                     // yellow-400
      textLight: '#FDE047',                // yellow-300
      glow: 'rgba(250, 204, 21, 0.6)',
    },
    info: {
      border: 'rgba(34, 211, 238, 0.5)',  // cyan-500/50
      text: '#22D3EE',                     // cyan-400
      textLight: '#67E8F9',                // cyan-300
      glow: 'rgba(34, 211, 238, 0.6)',
    },
  },

  // === CRT SCREEN COLORS ===
  crt: {
    green: {
      background: 'linear-gradient(135deg, #001a00 0%, #000d00 50%, #001400 100%)',
      glow: 'rgba(0, 255, 0, 0.15)',
    },
    red: {
      background: 'linear-gradient(135deg, #1a0000 0%, #0d0000 50%, #140000 100%)',
      glow: 'rgba(255, 0, 0, 0.15)',
    },
    yellow: {
      background: 'linear-gradient(135deg, #1a1a00 0%, #0d0d00 50%, #141400 100%)',
      glow: 'rgba(255, 200, 0, 0.15)',
    },
  },

  // === CHAPTER BADGES (Map screen) ===
  chapters: {
    innerSystem: {
      border: 'rgba(59, 130, 246, 0.5)',  // blue-500/50
      bg: 'rgba(23, 37, 84, 0.7)',        // blue-950/70
      text: '#60A5FA',                     // blue-400
    },
    gasGiants: {
      border: 'rgba(168, 85, 247, 0.5)',  // purple-500/50
      bg: 'rgba(59, 7, 100, 0.7)',        // purple-950/70
      text: '#C084FC',                     // purple-400
    },
    iceGiants: {
      border: 'rgba(34, 211, 238, 0.5)',  // cyan-500/50
      bg: 'rgba(8, 51, 68, 0.7)',         // cyan-950/70
      text: '#22D3EE',                     // cyan-400
    },
    kuiperBelt: {
      border: 'rgba(249, 115, 22, 0.5)',  // orange-500/50
      bg: 'rgba(67, 20, 7, 0.7)',         // orange-950/70
      text: '#FB923C',                     // orange-400
    },
  },
} as const;

// Type for accessing colors
export type ColorToken = typeof colors;

// Helper to generate CSS custom properties from tokens
export function generateColorCSS(): string {
  const lines: string[] = [];

  // Flatten nested objects into CSS custom properties
  function flatten(obj: Record<string, unknown>, prefix = '') {
    for (const [key, value] of Object.entries(obj)) {
      const propName = prefix ? `${prefix}-${key}` : key;
      if (typeof value === 'string') {
        lines.push(`  --color-${propName}: ${value};`);
      } else if (typeof value === 'object' && value !== null) {
        flatten(value as Record<string, unknown>, propName);
      }
    }
  }

  flatten(colors);
  return `:root {\n${lines.join('\n')}\n}`;
}
