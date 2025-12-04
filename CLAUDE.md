# Space Math Commander - Project Guide

## Design System Architecture

### File Locations

| What | Where | Notes |
|------|-------|-------|
| **CSS Animations** | `src/index.css` | All @keyframes and `.animate-*` classes live here |
| **Tailwind Config** | `tailwind.config.ts` | Theme extensions, semantic typography classes |
| **Color Tokens** | `src/styles/tokens/colors.ts` | Space, industrial, brand, UI colors |
| **Typography Tokens** | `src/styles/tokens/typography.ts` | Font families and size scales |
| **Effects Tokens** | `src/styles/tokens/effects.ts` | Glows, shadows, borders |
| **Component Index** | `src/components/ui/index.ts` | All UI component exports |
| **Styles Index** | `src/styles/index.ts` | All token exports |

### Adding/Editing Animations

**All animations are defined in `src/index.css`** (NOT in tailwind.config.ts)

Pattern:
```css
/* Animation description */
@keyframes myAnimation {
  0% { transform: scale(0); opacity: 0; }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); opacity: 1; }
}

.animate-myAnimation {
  animation: myAnimation 0.5s ease-out forwards;
}
```

Existing animations:
- `animate-scrollSlow` / `animate-scrollBoss` - Background scrolling
- `animate-slideDown` / `animate-slideInFromRight` - Ship entrances
- `animate-hover` / `animate-hoverSmall` - Floating effect
- `animate-pulseSubtle` - Soft pulsing
- `animate-shake` - Shake effect
- `animate-slideOut` / `animate-flyOutRight` - Exit animations
- `animate-parallaxSlow/Medium/Fast` - Star parallax
- `animate-fadeIn` - Fade in
- `animate-slideUpFromConsole` / `animate-slideDownToConsole` - Console animations
- `animate-dodgeUp` / `animate-dodgeDown` - Enemy dodge
- `animate-starPop` - Star earned effect
- `animate-xpBounce` - XP display bounce

### Color System

Colors are defined in `src/styles/tokens/colors.ts` and exposed via Tailwind:

```
bg-space-black    (#050510) - Main app background
bg-space-dark     (#0B0B1E) - Darker areas
bg-space-light    (#1A1A35) - Lighter space areas

bg-industrial-dark      (#181825) - Panel backgrounds
bg-industrial-metal     (#4A4A5A) - Metallic accents
bg-industrial-blue      (#2A2A40) - Blue tinted panels
bg-industrial-highlight (#6E6E80) - Highlights

text-brand-primary   (#2563EB) - Primary blue
text-brand-secondary (#00F0FF) - Cyan accent
text-brand-accent    (#FFE500) - Yellow/gold
text-brand-hazard    (#E5C000) - Warning yellow
text-brand-danger    (#FF2A2A) - Red/error
text-brand-success   (#00FF9D) - Green/success
```

### Typography

Single font: `font-pixel` ("Press Start 2P")

Semantic classes (defined in tailwind.config.ts plugin):
- `.text-display` - Large scores (60px)
- `.text-title` - Screen titles (36px desktop, 24px mobile)
- `.text-heading` - Section heads (24px desktop, 20px mobile)
- `.text-subheading` - Minor heads (18px)
- `.text-body` / `.text-body-lg` - Body text
- `.text-label` - Form labels (12px uppercase)
- `.text-caption` - Helper text (10px)
- `.text-micro` - Tiny labels (11px)
- `.text-mono` - Numbers/equations (20px)
- `.text-dialogue` - Character speech
- `.text-speaker` - "[COMMANDER]" labels

### Reusable UI Components

Located in `src/components/ui/`:

- `Header` - Consistent header with back button, title, right content
- `PixelButton` - Main button component
- `PixelCard` - Card/panel component
- `CRTDialogueBox` - Green CRT terminal style dialogue
- `DialogueBox` - General dialogue component

### Footer Pattern

All screens use consistent footer styling:
```tsx
<div className="bg-gray-900/80 border-4 border-gray-700 p-4 max-w-xl w-full">
  {/* Content */}
</div>
```

### iOS Safe Area

CSS variables available:
```css
var(--safe-area-top)
var(--safe-area-bottom)
var(--safe-area-left)
var(--safe-area-right)
```

Use in components:
```tsx
style={{ paddingBottom: 'var(--safe-area-bottom)' }}
// or
style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
```

### Audio System

See `src/audio/` for audio engine and speech service.
iOS uses HTML5 Audio fallback (see global CLAUDE.md for details).
