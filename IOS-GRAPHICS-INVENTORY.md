# iOS GRAPHICS STYLE INVENTORY

## SCREENS

| Screen | File | Purpose |
|--------|------|---------|
| **StartScreen** | `StartScreen.tsx` | Title + Mission Briefing + Cinematic |
| **SolarSystemMapMobile** | `SolarSystemMapMobile.tsx` | Vertical scrolling planet map |
| **MissionScreen** | `MissionScreen.tsx` | Waypoint selection before battle |
| **BattleScreenMobile** | `BattleScreenMobile.tsx` | Gameplay - shooting + math |
| **ResultScreen** | `ResultScreen.tsx` | Post-battle stats |
| **HomeBaseScreen** | `HomeBaseScreen.tsx` | Settings + Player Stats |

---

## FONTS

| Font | CSS Variable | Usage |
|------|--------------|-------|
| **Press Start 2P** | `font-pixel` | Headings, buttons, titles, ALL body text (base) |
| **Rajdhani** | `font-tech` | Labels, stats, tracking-wider text |
| **System Mono** | `font-mono` | Dialogue text, math equations, numbers |

### Font Sizes Used (Tailwind)

| Size | Class | Where Used |
|------|-------|------------|
| 6xl | `text-6xl` | ResultScreen percentage |
| 4xl | `text-4xl` | StartScreen main title |
| 3xl | `text-3xl` | ResultScreen heading (md) |
| 2xl | `text-2xl` | StartScreen subtitle, ResultScreen heading |
| xl | `text-xl` | BattleMobile question, HomeBase section title |
| lg | `text-lg` | Dialogue text, section headings |
| base | `text-base` | Button lg, body text |
| sm | `text-sm` | Buttons md, labels |
| xs | `text-xs` | Labels, helper text |
| `text-[11px]` | custom | Planet names (mobile map) |
| `text-[10px]` | custom | Dialogue speaker labels, XP text |
| `text-[9px]` | custom | "(Home Base)" label |

---

## COLORS

### Brand Colors
| Name | Hex | CSS Variable | Usage |
|------|-----|--------------|-------|
| Primary (Blue) | `#2563EB` | `brand-primary` | Buttons primary |
| Secondary (Cyan) | `#00F0FF` | `brand-secondary` | Current planet, highlights, XP bar |
| Accent (Yellow) | `#FFE500` | `brand-accent` | Stars, XP, titles |
| Hazard | `#E5C000` | `brand-hazard` | Warning buttons |
| Danger (Red) | `#FF2A2A` | `brand-danger` | Enemies, alerts, miss feedback |
| Success (Green) | `#00FF9D` | `brand-success` | Completed, correct, hit feedback |

### Space Colors
| Name | Hex | CSS Variable | Usage |
|------|-----|--------------|-------|
| Black | `#050510` | `space-black` | Main background |
| Dark | `#0B0B1E` | `space-dark` | Panel background |
| Light | `#1A1A35` | `space-light` | Lighter panel/hover |

### Industrial Colors
| Name | Hex | CSS Variable | Usage |
|------|-----|--------------|-------|
| Dark | `#181825` | `industrial-dark` | Panels, cards |
| Metal | `#4A4A5A` | `industrial-metal` | Borders, dividers |
| Blue | `#2A2A40` | `industrial-blue` | Answer buttons |
| Highlight | `#6E6E80` | `industrial-highlight` | Metal highlights, labels |

### Text Colors Used
| Tailwind Class | Where |
|----------------|-------|
| `text-white` | Primary text |
| `text-white/80`, `text-white/50` | Muted text |
| `text-green-400`, `text-green-300`, `text-green-500` | Commander dialogue, math, success |
| `text-red-400`, `text-red-300`, `text-red-500` | Enemy dialogue, miss, errors |
| `text-yellow-400`, `text-yellow-500` | Stars, XP, victory |
| `text-cyan-400`, `text-cyan-300` | Rank, destination labels |
| `text-gray-400`, `text-gray-600` | Muted labels, disabled stars |

---

## BORDERS & EFFECTS

### Border Styles
| Pattern | Usage |
|---------|-------|
| `border-4 border-industrial-metal` | PixelCard panel |
| `border-2 border-gray-700` | Stats boxes |
| `border-2 border-green-500/50` | Commander dialogue box |
| `border-2 border-red-500/50` | Enemy dialogue box |
| `border-4 border-blue-400` | Start button |
| `border-4 border-industrial-metal` | Answer buttons |
| `6px solid #4a4a5a` | Screen frame (mobile map) |

### Shadow Effects
| Pattern | Usage |
|---------|-------|
| `shadow-[0_4px_0_0_#1e40af,0_6px_0_0_#1e3a8a]` | Start button 3D effect |
| `inset 2px 2px 0px rgba(255,255,255,0.1), inset -2px -2px 0px rgba(0,0,0,0.5)` | Panel industrial |
| `inset -4px -4px 0px rgba(0,0,0,0.5), inset 4px 4px 0px rgba(255,255,255,0.5)` | btn-retro |
| `shadow-[0_0_8px_#22c55e]` | Green pulse indicator |
| `boxShadow: '0 8px 32px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.15)'` | CRT outer bezel |

### Glow/Drop-Shadow Effects
| Pattern | Where |
|---------|-------|
| `drop-shadow-[4px_4px_0_rgba(255,42,42,1)]` | Title "SPACE MATH" |
| `drop-shadow-[4px_4px_0_rgba(37,99,235,1)]` | Title "COMMANDER" |
| `drop-shadow-[0_0_8px_rgba(34,197,94,0.8)]` | Green CRT text glow |
| `drop-shadow-[0_0_6px_rgba(74,222,128,0.6)]` | Dialogue text glow |
| `shadow-[0_0_4px_var(--color-brand-success)]` | Completed waypoint dots |

### CRT/Scanline Effects
| Effect | Implementation |
|--------|----------------|
| Scanlines | `backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(0,0,0,0.4) 1px, rgba(0,0,0,0.4) 2px)'` |
| Phosphor glow | `boxShadow: 'inset 0 0 30px rgba(0,255,0,0.4)'` + radial gradient |
| Button scanlines | `backgroundImage: 'linear-gradient(transparent 50%, rgba(0,0,0,0.2) 50%)'` |

---

## COMPONENT-SPECIFIC STYLES

### PixelButton
- Base: `font-pixel uppercase tracking-wider`
- Border: `4px solid #000`
- Shadow: inset bevels for 3D effect
- Variants: primary (blue), secondary (gray), danger (red), warning (yellow)
- Sizes: sm (`px-3 py-2 text-xs`), md (`px-6 py-3 text-sm`), lg (`px-8 py-4 text-base`)

### PixelCard
- Background: `bg-industrial-dark`
- Border: `border-4 border-industrial-metal`
- Corner rivets: `w-2 h-2 bg-industrial-highlight rounded-full`
- Inner shadows for depth

### CRTDialogueBox
- Outer bezel: Gray gradient (`#6a6a7a` → `#4a4a5a` → `#3a3a4a`)
- Inner bezel: Dark gradient (`#1a1a2a` → `#0a0a15`)
- Screen: Variant-colored gradient (green/red/yellow)
- Effects: Scanlines + phosphor glow

---

## INCONSISTENCIES / ISSUES NOTED

1. **Mixed font usage**: Some places use `font-tech` (Rajdhani), others use `font-mono`, others inherit `font-pixel`
2. **Text size inconsistency**: Custom pixel sizes (`text-[11px]`, `text-[10px]`, `text-[9px]`) mixed with Tailwind sizes
3. **Border thickness varies**: 2px, 4px, 6px borders used inconsistently
4. **Glow colors**: Different rgba values for similar green glows
5. **No unified button style for mobile header back buttons** - some use PixelButton, others use custom styled buttons
6. **Dialogue text styling** varies between screens (some use `font-mono`, some don't)

---

## PLAN: PROGRAMMATIC ORGANIZATION

### Phase 1: Create Design Tokens System
Create a centralized design system with typed tokens:

```
src/styles/
├── tokens/
│   ├── colors.ts       # All color definitions
│   ├── typography.ts   # Font families, sizes, weights
│   ├── spacing.ts      # Consistent spacing scale
│   ├── borders.ts      # Border widths, radii, styles
│   ├── shadows.ts      # Box shadows, drop shadows, glows
│   └── index.ts        # Export all tokens
├── components.css      # Component-level styles (btn-retro, panel-industrial)
└── utilities.css       # Utility classes (glows, scanlines)
```

### Phase 2: Typography System
- Define a strict type scale (e.g., `text-title`, `text-heading`, `text-body`, `text-label`, `text-caption`)
- Map each to specific font-family + size + weight + tracking
- Remove arbitrary `text-[Npx]` values

### Phase 3: Component Variants
- Consolidate button styles into PixelButton variants
- Create consistent header/nav component
- Standardize dialogue box styling

### Phase 4: Glow/Effect Utilities
- Create reusable glow classes: `glow-green`, `glow-red`, `glow-yellow`, `glow-cyan`
- Standardize drop-shadow patterns

### Phase 5: Apply & Test on iOS
- Test each screen on iOS Safari
- Verify text rendering, glow effects, animations
- Document any iOS-specific overrides needed
