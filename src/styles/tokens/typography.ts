/**
 * Typography Design Tokens
 *
 * Semantic typography system for consistent text styling.
 * Each style maps to a specific use case, not just a size.
 */

// Font families - using only Press Start 2P for consistent retro aesthetic
export const fontFamilies = {
  pixel: '"Press Start 2P", cursive',     // All text in the game
} as const;

// Font weights
export const fontWeights = {
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

/**
 * Semantic Typography Scale
 *
 * Instead of arbitrary sizes, we use semantic names that describe
 * the PURPOSE of the text. This makes it easy to maintain consistency
 * and change sizes globally.
 *
 * Mobile-first with responsive breakpoints where needed.
 */
export const typography = {
  // === DISPLAY ===
  // Large, prominent numbers/text (scores, percentages)
  display: {
    fontFamily: fontFamilies.pixel,
    fontSize: '3.75rem',      // 60px / text-6xl
    fontWeight: fontWeights.bold,
    lineHeight: '1',
    letterSpacing: '0.025em',
  },

  // === TITLES ===
  // Screen titles, major headings
  title: {
    fontFamily: fontFamilies.pixel,
    fontSize: '2.25rem',      // 36px / text-4xl
    fontWeight: fontWeights.bold,
    lineHeight: '1.1',
    letterSpacing: '0.05em',
    // Responsive: smaller on mobile
    mobile: {
      fontSize: '1.5rem',     // 24px / text-2xl
    },
  },

  // === HEADINGS ===
  // Section headings, card titles
  heading: {
    fontFamily: fontFamilies.pixel,
    fontSize: '1.5rem',       // 24px / text-2xl
    fontWeight: fontWeights.bold,
    lineHeight: '1.2',
    letterSpacing: '0.05em',
    mobile: {
      fontSize: '1.25rem',    // 20px / text-xl
    },
  },

  // === SUBHEADINGS ===
  // Minor headings, emphasized labels
  subheading: {
    fontFamily: fontFamilies.pixel,
    fontSize: '1.125rem',     // 18px / text-lg
    fontWeight: fontWeights.bold,
    lineHeight: '1.3',
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
  },

  // === BODY ===
  // Main content text
  body: {
    fontFamily: fontFamilies.pixel,
    fontSize: '0.875rem',     // 14px / text-sm
    fontWeight: fontWeights.normal,
    lineHeight: '1.5',
    letterSpacing: '0.025em',
  },

  // === BODY LARGE ===
  // Dialogue text, important paragraphs
  bodyLarge: {
    fontFamily: fontFamilies.pixel,
    fontSize: '1rem',         // 16px / text-base
    fontWeight: fontWeights.normal,
    lineHeight: '1.6',
    letterSpacing: '0.025em',
  },

  // === LABEL ===
  // Form labels, stat labels, small UI text
  label: {
    fontFamily: fontFamilies.pixel,
    fontSize: '0.75rem',      // 12px / text-xs
    fontWeight: fontWeights.bold,
    lineHeight: '1.4',
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
  },

  // === CAPTION ===
  // Helper text, secondary info
  caption: {
    fontFamily: fontFamilies.pixel,
    fontSize: '0.625rem',     // 10px
    fontWeight: fontWeights.normal,
    lineHeight: '1.4',
    letterSpacing: '0.05em',
  },

  // === MICRO ===
  // Tiny annotations, planet labels on map
  micro: {
    fontFamily: fontFamilies.pixel,
    fontSize: '0.6875rem',    // 11px
    fontWeight: fontWeights.bold,
    lineHeight: '1.3',
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
  },

  // === BUTTON ===
  // Button text (all sizes use same base, scaled by component)
  button: {
    fontFamily: fontFamilies.pixel,
    fontWeight: fontWeights.normal,
    lineHeight: '1',
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
    // Size variants applied by component
    sizes: {
      sm: { fontSize: '0.75rem' },   // 12px / text-xs
      md: { fontSize: '0.875rem' },  // 14px / text-sm
      lg: { fontSize: '1rem' },      // 16px / text-base
    },
  },

  // === MONO ===
  // Numbers, math equations, technical data
  mono: {
    fontFamily: fontFamilies.pixel,
    fontSize: '1.25rem',      // 20px / text-xl
    fontWeight: fontWeights.bold,
    lineHeight: '1.2',
    letterSpacing: '0',
  },

  // === DIALOGUE ===
  // Character speech in dialogue boxes
  dialogue: {
    fontFamily: fontFamilies.pixel,
    fontSize: '0.75rem',      // 12px / text-xs (mobile)
    fontWeight: fontWeights.normal,
    lineHeight: '1.5',
    letterSpacing: '0',
    mobile: {
      fontSize: '0.75rem',    // 12px
    },
    desktop: {
      fontSize: '0.875rem',   // 14px
    },
  },

  // === SPEAKER ===
  // "[COMMANDER]" labels in dialogue
  speaker: {
    fontFamily: fontFamilies.pixel,
    fontSize: '0.625rem',     // 10px
    fontWeight: fontWeights.bold,
    lineHeight: '1',
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
  },
} as const;

export type TypographyToken = typeof typography;
export type TypographyStyle = keyof typeof typography;

/**
 * Helper to get typography CSS properties
 */
export function getTypographyCSS(style: TypographyStyle): Record<string, string> {
  const t = typography[style];
  const css: Record<string, string> = {
    'font-family': t.fontFamily,
    'font-weight': t.fontWeight,
    'line-height': t.lineHeight,
  };

  // fontSize may not exist on all styles (e.g., button uses sizes variants)
  if ('fontSize' in t && t.fontSize) {
    css['font-size'] = t.fontSize;
  }

  if ('letterSpacing' in t && t.letterSpacing) {
    css['letter-spacing'] = t.letterSpacing;
  }
  if ('textTransform' in t && t.textTransform) {
    css['text-transform'] = t.textTransform;
  }

  return css;
}
