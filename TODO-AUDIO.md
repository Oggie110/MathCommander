# AUDIO LOADING FIXES - IMPORTANT TODO

## Problem Summary
Audio not loading properly on many occasions:
- Dialogue from battle screen missing/delayed
- Delayed "shot" sounds and button sounds
- Music starts are delayed

## Root Causes Identified

### 1. Speech Audio Never Preloaded (HIGH IMPACT)
- 166 speech files are NEVER preloaded
- Each dialogue requires fetch + decode (300-800ms delay)
- First dialogue of each type causes noticeable delay

### 2. On-Demand SFX Loading (MEDIUM IMPACT)
- First playback of any sound causes delay
- SFX not preloaded until "Start Mission" clicked

### 3. iOS SFX Pool Limited to 3 Elements (MEDIUM IMPACT)
- Can cause starvation with rapid sounds (laser spam)
- New elements created on-the-fly aren't preloaded

### 4. Audio Context Suspension (LOW IMPACT)
- Tab switches or initial load can delay playback
- Context needs resume() before playing

---

## Recommended Fixes

### Quick Wins

#### 1. ✅ DONE - Preload Battle Speech Before Entering Battle
When navigating to battle, preload the commander/alien lines for that specific location.

**Implemented:**
- Added `getBattleSpeechIds()` helper in `src/audio/speechSounds.ts`
- MissionScreen now preloads speech when entering the screen (useEffect)
- MissionScreen also preloads on "Start Mission" click (handleStartMission)

#### 2. ✅ DONE - Increase iOS SFX Pool Size
Changed from 3 to 5 copies per sound in AudioEngine.ts

**File:** `src/audio/AudioEngine.ts`
- `preloadHTML5SFX()` default poolSize changed from 3 to 5

### Medium Effort

#### 3. Add Background Preloading of Speech Files
After app starts, silently preload commonly-used sounds in the background.

**Implementation:**
- Create a preload queue that loads speech files during idle time
- Prioritize: encouragement lines, common alien taunts, boss defeat lines
- Use `requestIdleCallback` or setTimeout to avoid blocking UI

#### 4. Preload Core SFX Earlier
Move critical sounds (laser, explosion, buttons) to preload on app init, not just on "Start Mission" click.

**File:** `src/pages/StartScreen.tsx` or create an audio init hook

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `/src/audio/AudioEngine.ts` | Core Web Audio implementation |
| `/src/audio/sounds.ts` | Sound registry |
| `/src/audio/speechSounds.ts` | 166 speech definitions |
| `/src/pages/StartScreen.tsx` | App initialization, current preload |
| `/src/pages/BattleScreenMobile.tsx` | Battle UI, dialogue sequences |
| `/src/pages/MissionScreen.tsx` | Mission selection, good place to preload |

---

## Implementation Priority

1. **First**: Preload battle-specific speech when entering mission/battle
2. **Second**: Increase iOS SFX pool size from 3 to 5
3. **Third**: Add progressive background preloading after app starts
4. **Fourth**: Earlier preloading of core SFX on app init
