/**
 * Design Tokens - Single Source of Truth
 *
 * This module exports all design tokens for the Space Math Commander app.
 * Use these tokens instead of hardcoded values for:
 * - Colors
 * - Typography
 * - Effects (shadows, glows, borders)
 *
 * Usage in components:
 * ```tsx
 * import { colors, typography, glows } from '@/styles/tokens';
 *
 * // Use in inline styles
 * style={{ color: colors.brand.success }}
 *
 * // Or with CSS-in-JS
 * const styles = {
 *   ...getTypographyCSS('heading'),
 *   color: colors.text.primary,
 * };
 * ```
 *
 * For Tailwind classes, use the semantic class names that map to these tokens.
 */

export { colors, generateColorCSS } from './colors';
export type { ColorToken } from './colors';

export { typography, fontFamilies, fontWeights, getTypographyCSS } from './typography';
export type { TypographyToken, TypographyStyle } from './typography';

export {
  borderWidths,
  borderRadius,
  borders,
  shadows,
  glows,
  textGlows,
  crtEffects,
  patterns,
  transitions,
} from './effects';
export type { ShadowToken, GlowToken } from './effects';

/**
 * Quick Reference
 * ===============
 *
 * COLORS:
 * - colors.space.{black, dark, light}      - Background colors
 * - colors.industrial.{dark, metal, blue}  - Panel/card colors
 * - colors.brand.{primary, secondary, ...} - Semantic colors
 * - colors.text.{primary, secondary, ...}  - Text colors
 * - colors.ui.commander/enemy/victory      - Dialogue colors
 *
 * TYPOGRAPHY (Tailwind classes):
 * - .text-display    - Large scores (60px pixel font)
 * - .text-title      - Screen titles (responsive 24px→36px)
 * - .text-heading    - Section heads (responsive 20px→24px)
 * - .text-subheading - Minor heads (18px tech, uppercase)
 * - .text-body       - Main text (14px tech)
 * - .text-body-lg    - Larger body (16px tech)
 * - .text-label      - Labels (12px tech, uppercase)
 * - .text-caption    - Helper text (10px)
 * - .text-micro      - Tiny labels (11px, like planet names)
 * - .text-mono       - Numbers (20px mono)
 * - .text-dialogue   - Character speech (responsive 12px→14px)
 * - .text-speaker    - "[COMMANDER]" (10px mono, uppercase)
 *
 * BORDERS:
 * - borders.panel / borders.panelLight     - Card borders (4px/2px)
 * - borders.box                            - Stats boxes (2px gray)
 * - borders.dialogueCommander/Enemy/Victory - Dialogue borders
 * - borders.waypointLocked/Current/Completed - Mission buttons
 * - borders.answerDefault/Correct/Wrong    - Answer buttons
 * - borders.screenFrame                    - Mobile map frame (6px)
 * - borders.button                         - Retro button (4px black)
 * - borders.chapter{Inner,Gas,Ice,Kuiper}  - Map chapter badges
 * - borders.selection{Current,Selected}    - Planet selection rings
 *
 * SHADOWS & GLOWS (Tailwind classes):
 * - .shadow-panel-inset, .shadow-panel-outer
 * - .shadow-button, .shadow-button-pressed
 * - .shadow-glow-{green,red,yellow,cyan,blue}[-soft|-strong]
 * - .drop-shadow-text-{green,red,yellow,cyan}[-soft|-strong]
 * - .drop-shadow-solid-{red,blue,black}
 *
 * CRT EFFECTS:
 * - crtEffects.scanlines           - CRT scanline pattern
 * - crtEffects.phosphor.{green,red,yellow} - Phosphor glow
 * - patterns.hazard                - Yellow/black stripes
 */
