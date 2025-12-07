# Design System Architecture

This repo now centralizes all design system concerns in three places:

1. **Tokens** (`src/styles/tokens/*`)
   - Authoritative source for colors, typography, and effects (borders, glows, shadows, transitions, patterns).
   - `typography.ts` now tracks both the pixel face and the technical sans (`Rajdhani`) used by semantic text styles.

2. **Theme Runtime** (`src/styles/theme/index.ts`)
   - Aggregates tokens into `designTokens` and exports helpers:
     - `buildCssVariableMap()` flattens tokens into `:root` CSS variables so CSS and JS share the same values.
     - `createTailwindExtend()` produces the Tailwind `theme.extend` block (colors, fonts, borders, shadows, animations, etc.).
   - The same values power CSS variables, Tailwind utilities, and component styles to prevent drift.

3. **Tailwind Plugin** (`src/styles/plugins/designSystem.ts`)
   - Adds the token-driven base layer (CSS variables + body/headings typography), semantic typography classes, and bespoke utilities (`pixel-border`, `panel-industrial`, `bg-hazard`, `btn-retro`).
   - Exposes `tailwindExtend` for `tailwind.config.ts` so Tailwind consumes the token set directly.

## How it hooks into the app
- `tailwind.config.ts` imports `tailwindExtend` and the plugin, wiring tokens into Tailwind and generating utility classes at build time.
- `src/index.css` is intentionally minimal: font imports, safe-area guards, and a base layer that leans on the Tailwind theme.

## Adding or changing tokens
1. Update the relevant token file in `src/styles/tokens/`.
2. If you add a new token category, extend the flattening logic in `src/styles/theme/index.ts` so it becomes a CSS variable and is available to Tailwind.
3. If new semantic utilities are needed, register them in `src/styles/plugins/designSystem.ts` using the tokens instead of hard-coded values.

## Component guidance
- Prefer consuming semantic text classes (`text-title`, `text-body`, etc.) and utility classes (`panel-industrial`, `btn-retro`) over ad-hoc styling.
- For custom styling, pull values from `designTokens` to remain consistent with the theme.
