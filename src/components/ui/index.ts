/**
 * UI Components - Space Math Commander Design System
 * ==================================================
 *
 * This module exports all reusable UI components for the game.
 * Import from '@/components/ui' for cleaner imports.
 *
 * Usage:
 * ```tsx
 * import { PixelButton, Header, ScreenFrame } from '@/components/ui';
 * ```
 *
 * Components are organized into categories:
 * - Layout: ScreenFrame, Header
 * - Feedback: PixelProgressBar, CRTDialogueBox
 * - Interactive: PixelButton, PixelCard
 * - System: AudioUnlockPrompt
 */

// ============================================================================
// LAYOUT COMPONENTS
// ============================================================================

/**
 * ScreenFrame - Full-screen container with CRT effects
 *
 * Wraps entire screens with:
 * - CRT scanline overlay
 * - Vignette effect
 * - Space black background
 * - Proper z-index layering
 *
 * @example
 * <ScreenFrame>
 *   <Header backTo="/map" />
 *   <main>Content</main>
 * </ScreenFrame>
 */
export { ScreenFrame } from './ScreenFrame';

/**
 * Header - Consistent navigation header for all screens
 *
 * Features:
 * - Gradient background (black/80 to transparent)
 * - Back button with configurable destination and label
 * - Optional centered title
 * - Optional right content slot
 * - iOS safe area support when fixed
 *
 * @example
 * // Simple back navigation
 * <Header backTo="/map" />
 *
 * // With centered title
 * <Header backTo="/homebase" title="Mission Map" />
 *
 * // With right content
 * <Header backTo="/map" rightContent={<StarsDisplay />} />
 *
 * // Fixed with safe area padding
 * <Header backTo="/homebase" title="Mission Map" fixed />
 */
export { Header } from './Header';

// ============================================================================
// FEEDBACK COMPONENTS
// ============================================================================

/**
 * PixelProgressBar - Retro-styled progress indicator
 *
 * Features:
 * - Configurable value/max
 * - Optional label with percentage
 * - Customizable fill color
 * - Grid lines for retro feel
 *
 * @example
 * <PixelProgressBar
 *   value={75}
 *   max={100}
 *   label="Shield"
 *   color="bg-cyan-500"
 * />
 */
export { PixelProgressBar } from './PixelProgressBar';

/**
 * CRTDialogueBox - Vintage CRT monitor-styled dialogue container
 *
 * Features:
 * - Outer bezel with metallic gradient
 * - Inner screen with phosphor glow
 * - CRT scanline overlay
 * - Three color variants: green, red, yellow
 *
 * @example
 * <CRTDialogueBox variant="green">
 *   <p className="text-green-400">[COMMANDER]</p>
 *   <p>Mission briefing text...</p>
 * </CRTDialogueBox>
 */
export { CRTDialogueBox } from './CRTDialogueBox';

// ============================================================================
// INTERACTIVE COMPONENTS
// ============================================================================

/**
 * PixelButton - Primary action button with retro styling
 *
 * Features:
 * - Four variants: primary, secondary, danger, warning
 * - Three sizes: sm, md, lg
 * - Built-in click sound (can be silenced)
 * - Scanline overlay for tech feel
 *
 * @example
 * <PixelButton variant="primary" size="lg" onClick={handleStart}>
 *   START MISSION
 * </PixelButton>
 *
 * // Silent button (no click sound)
 * <PixelButton variant="secondary" silent>
 *   Settings
 * </PixelButton>
 */
export { PixelButton } from './PixelButton';

/**
 * PixelCard - Container card with industrial styling
 *
 * Features:
 * - Industrial panel background
 * - Corner rivets for mechanical feel
 * - Optional floating title badge
 * - Danger variant for alerts
 *
 * @example
 * <PixelCard title="MISSION STATUS">
 *   <p>Mission content here...</p>
 * </PixelCard>
 *
 * <PixelCard variant="danger" title="WARNING">
 *   <p>Critical alert!</p>
 * </PixelCard>
 */
export { PixelCard } from './PixelCard';

// ============================================================================
// SYSTEM COMPONENTS
// ============================================================================

/**
 * AudioUnlockPrompt - iOS Safari audio unlock button
 *
 * Automatically shows when AudioContext is suspended (iOS requirement).
 * Place once at app root level.
 *
 * Features:
 * - Auto-detects when audio needs unlocking
 * - Pulses to draw attention
 * - Dismisses after successful unlock
 *
 * @example
 * // In App.tsx or layout
 * function App() {
 *   return (
 *     <>
 *       <AudioUnlockPrompt />
 *       <RouterProvider router={router} />
 *     </>
 *   );
 * }
 */
export { AudioUnlockPrompt } from './AudioUnlockPrompt';

// ============================================================================
// TYPE EXPORTS
// ============================================================================

// Re-export component prop types for consumers who need them
export type { } from './Header';  // HeaderProps if needed externally
export type { } from './PixelButton';  // PixelButtonProps if needed externally

/**
 * Quick Reference
 * ===============
 *
 * LAYOUT:
 * - ScreenFrame     - Full-screen wrapper with CRT effects
 * - Header          - Navigation header (gradient/solid variants)
 *
 * FEEDBACK:
 * - PixelProgressBar - Progress indicator with retro grid
 * - CRTDialogueBox   - Dialogue container with CRT screen effect
 *
 * INTERACTIVE:
 * - PixelButton      - Action button (primary/secondary/danger/warning)
 * - PixelCard        - Content card with industrial styling
 *
 * SYSTEM:
 * - AudioUnlockPrompt - iOS audio unlock (place at app root)
 *
 * DESIGN TOKENS:
 * For colors, typography, and effects, import from '@/styles/tokens':
 * ```tsx
 * import { colors, typography, glows, borders } from '@/styles/tokens';
 * ```
 */
