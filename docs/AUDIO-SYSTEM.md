# Audio System Documentation

## Quick Reference - Common Tasks

| Task | File | Line | Example |
|------|------|------|---------|
| Change individual sound volume | `src/audio/sounds.ts` | varies | `starEarned: { volume: 0.02 }` |
| Change ALL music volume | `src/audio/AudioEngine.ts` | 66 | `music: 0.3` |
| Change ALL SFX volume | `src/audio/AudioEngine.ts` | 67 | `sfx: 0.5` |
| Change ALL ambience volume | `src/audio/AudioEngine.ts` | 68 | `ambience: 0.2` |
| Change ALL speech volume | `src/audio/AudioEngine.ts` | 69 | `speech: 0.4` |
| Change HTML5/iOS music boost | `src/audio/AudioEngine.ts` | 1237 | `html5MusicBoost = 2.5` |

## Sound Definitions - Where to Change Volume

### Music (7 sounds) - `src/audio/sounds.ts`
| Sound ID | Volume | Loop | Used For |
|----------|--------|------|----------|
| menuMusic | 0.3 | yes | Menu screens |
| battleMusicPhase1 | 0.3 | yes | Inner system battles |
| battleMusicPhase2 | 0.3 | yes | Gas giant battles |
| battleMusicPhase3 | 0.5 | yes | Deep space battles |
| victoryMusic | 0.3 | no | Final boss victory |
| bossFightMusic | 0.5 | yes | Boss battles |
| zorathFightMusic | 0.5 | yes | Final boss (Arrokoth) |

### Ambience (3 sounds) - `src/audio/sounds.ts`
| Sound ID | Volume | Loop | Used For |
|----------|--------|------|----------|
| spaceAmbience | 0.2 | yes | Battle screen |
| menuAmbience | 0.52 | yes | Menu/map screens |
| introData | 0.15 | no | Briefing typing |

### SFX (21 sounds) - `src/audio/sounds.ts`
| Sound ID | Volume | Notes |
|----------|--------|-------|
| buttonClick1/2/3 | 0.5 | iOS rotating (3 copies) |
| laser1/2/3 | 0.6 | iOS rotating (3 copies) |
| explosion | 0.3 | Battle win |
| doors | 0.5 | - |
| transition | 0.5 | - |
| shipSlide1/2/3/4 | 0.5 | Ship enter/exit |
| radioStatic | 0.7 | Boss defeat transmission |
| starEarned | 0.02 | Battle screen star |
| resultPercentage | 0.5 | Result animation |
| resultCorrectCount | 0.6 | Result animation |
| resultStarPop1/2/3 | 0.8 | iOS rotating (3 copies) |
| resultXP | 0.6 | Result animation |

### Speech (166 sounds) - `src/audio/speechSounds.ts`
| Category | Count | Default Volume |
|----------|-------|----------------|
| Alien taunts (generic) | 14 | 0.5 |
| Alien taunts (sector) | 42 | 0.5 |
| Alien boss intros | 14 | 0.5 |
| Alien boss defeats | 14 | 0.5 |
| Commander victory | 8 | 0.8 |
| Commander defeat | 5 | 0.5 |
| Commander encourage | 3 | 0.8 |
| Commander milestone | 2 | 0.8 |
| Wave intros (generic) | 8 | 0.8 |
| Wave intros (sector) | 42 | 0.8 |
| Boss encounters | 14 | 0.5 |

## Where Sounds Are Played

### Battle Screen SFX
| Sound | File | Line |
|-------|------|------|
| shipSlide1 | `src/pages/BattleScreen.tsx` | 143 |
| shipSlide2 | `src/pages/BattleScreen.tsx` | 146 |
| shipSlide3 | `src/pages/BattleScreen.tsx` | 170 |
| shipSlide4 | `src/pages/BattleScreen.tsx` | 333 |
| explosion | `src/pages/BattleScreen.tsx` | 330 |
| starEarned | `src/pages/BattleScreenMobile.tsx` | 380 |

### Result Screen SFX
| Sound | File | Line |
|-------|------|------|
| resultPercentage | `src/pages/ResultScreen.tsx` | 66 |
| resultStarPop1/2/3 | `src/pages/ResultScreen.tsx` | 100 |
| resultCorrectCount | `src/pages/ResultScreen.tsx` | 114 |
| resultXP | `src/pages/ResultScreen.tsx` | 142 |

### UI SFX
| Sound | File | Line |
|-------|------|------|
| buttonClick | `src/components/ui/PixelButton.tsx` | 22 |

### Music Playback
| Sound | File | Line |
|-------|------|------|
| menuMusic | `src/pages/SolarSystemMap.tsx` | 206 |
| menuMusic | `src/pages/ResultScreen.tsx` | 186 |
| victoryMusic | `src/pages/ResultScreen.tsx` | 184 |
| battle music | `src/hooks/battle/useBattleInit.ts` | 112 |

### Speech Playback
| Type | File | Line |
|------|------|------|
| Commander wave intro | `src/pages/BattleScreen.tsx` | 193 |
| Alien taunt | `src/pages/BattleScreen.tsx` | 221 |
| Victory line | `src/pages/BattleScreen.tsx` | 249 |
| Defeat line | `src/pages/BattleScreen.tsx` | 272 |
| Boss defeat (heavy radio) | `src/pages/ResultScreen.tsx` | 210 |

### Ambience Playback
| Sound | File | Line |
|-------|------|------|
| menuAmbience | `src/pages/StartScreen.tsx` | 135 |
| introData | `src/pages/StartScreen.tsx` | 137 |
| spaceAmbience | `src/hooks/battle/useBattleInit.ts` | 114 |

## Architecture

### Dual-Path System
- **Non-iOS**: Web Audio API with gain nodes + compressors
- **iOS**: HTML5 Audio fallback with hybrid Web Audio for music volume

### iOS Detection (`src/audio/AudioEngine.ts:8-13`)
```typescript
const isIOS = (): boolean => {
    return /iPad|iPhone|iPod/.test(ua) ||
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};
```

### Volume Chain - Web Audio (Non-iOS)

**SFX Path:**
```
sound.volume (sounds.ts)
  × volumeVariation (±10% random)
  × options.volume (override)
  → sfxGain (category: 0.5)
  → sfxCompressor (threshold -24dB, ratio 4:1)
  → sfxMakeupGain (0.5)
  → masterGain (1.0)
```

**Music Path:**
```
sound.volume (sounds.ts)
  → musicGain (category: 0.3)
  → musicCompressor (threshold -18dB, ratio 3:1)
  → musicMakeupGain (0.7)
  → masterGain (1.0)
```

**Speech Path:**
```
sound.volume (speechSounds.ts)
  → [optional EQ filters for alien speech]
  → speechGain (category: 0.4)
  → speechCompressor (threshold -24dB, ratio 6:1)
  → speechMakeupGain (0.5)
  → masterGain (1.0)
```

**Ambience Path:**
```
sound.volume (sounds.ts)
  → lowShelf filter (-4dB at 200Hz)
  → ambienceGain (category: 0.2)
  → masterGain (1.0)
```

### Volume Chain - HTML5 (iOS)

**SFX:**
```
audio.volume = sound.volume × sfxCategory (0.5) × master (1.0)
```

**Music (hybrid with Web Audio gain):**
```
gainNode.value = sound.volume × musicCategory (0.3) × master (1.0) × 1.5 (boost)
```

**Speech:**
```
audio.volume = sound.volume × speechCategory (0.4) × master (1.0)
```

**Ambience:**
```
audio.volume = sound.volume × ambienceCategory (0.2) × master (1.0)
```

## Key Code Locations

### AudioEngine.ts Line Reference
| Lines | What |
|-------|------|
| 8-13 | iOS detection |
| 58-61 | Rotating sounds definition (laser, buttonClick) |
| 64-70 | Default category volumes |
| 177-183 | Music compressor settings |
| 187 | Music makeup gain (0.7) |
| 197-202 | SFX compressor settings |
| 206 | SFX makeup gain (0.5) |
| 220-225 | Speech compressor settings |
| 229 | Speech makeup gain (0.5) |
| 387-420 | preload() with iOS unlock |
| 470-540 | playSFX() Web Audio |
| 546-584 | playSFXHTML5() |
| 648-712 | playSFXWithStop() |
| 721-830 | playHeavyRadioSpeech() (boss defeat) |
| 836-938 | playAlienSpeech() (alien taunts) |
| 944-1023 | playSpeech() (commander) |
| 1135-1205 | playMusic() Web Audio |
| 1210-1267 | playMusicHTML5() |
| 1234-1237 | HTML5 music boost (2.5×) |
| 1441-1500 | startAmbience() Web Audio |
| 1505-1551 | startAmbienceHTML5() |

### Other Key Files
| File | Purpose |
|------|---------|
| `src/audio/sounds.ts` | Core sound definitions (31 sounds) |
| `src/audio/speechSounds.ts` | Speech definitions (166 sounds) |
| `src/audio/SpeechService.ts` | High-level speech API |
| `src/audio/types.ts` | TypeScript interfaces |
| `src/audio/useGameAudio.ts` | React hook wrapper |
| `src/pages/StartScreen.tsx:86-116` | Sound preload list |

## iOS-Specific Features

### Rotating Sounds (for overlapping playback)
HTML5 Audio can't play the same file simultaneously, so we use multiple copies:
- `buttonClick` → buttonClick1, buttonClick2, buttonClick3
- `laser` → laser1, laser2, laser3
- `resultStarPop` → resultStarPop1, resultStarPop2, resultStarPop3

### iOS Preload Strategy (Critical!)

**Key principle**: Sounds must be preloaded AND the same sound IDs must be used when playing.

**Victory/Defeat Dialogue Pattern**:
1. `useBattleInit` pre-selects random dialogue AND preloads those specific sound IDs
2. `BattleScreen` MUST use those exact pre-selected sounds (not re-select)
3. Re-selecting would pick different random sounds that aren't preloaded → fails on iOS

**Result Screen Pattern**:
- Call `audioEngine.resume()` before playing sounds (context may be suspended)
- Sounds are preloaded at StartScreen, but context needs resume on ResultScreen

### Context Resume for Delayed Sounds
When playing sounds via setTimeout (not during user gesture), call `audioEngine.resume()` first:
```typescript
setTimeout(async () => {
    await audioEngine.resume();
    audioEngine.playSFX('resultStarPop1');
}, 1000);
```

## Adding a New Sound

1. Add audio file to `public/assets/audio/sfx/` (or appropriate subfolder)

2. Add definition to `src/audio/sounds.ts`:
```typescript
newSound: {
    id: 'newSound',
    src: '/assets/audio/sfx/new_sound.wav',
    category: 'sfx',  // or 'music', 'ambience', 'speech'
    volume: 0.5,
    loop: false,      // optional
    pitchVariation: 0.1,  // optional, ±10%
},
```

3. Add to preload list in `src/pages/StartScreen.tsx:86-116`:
```typescript
await audioEngine.preloadAll([
    // ... existing sounds
    'newSound',
]);
```

4. Play the sound:
```typescript
audioEngine.playSFX('newSound');
// or with options:
audioEngine.playSFX('newSound', { volume: 0.8 });
```

## Troubleshooting

### Sound doesn't play on iOS
1. Check if sound is in preload list (`StartScreen.tsx:86-116`)
2. Ensure preload happens during user gesture
3. For delayed sounds, call `audioEngine.resume()` first

### Sound too quiet/loud
1. Check individual sound volume in `sounds.ts`
2. Check category volume in `AudioEngine.ts:64-70`
3. For HTML5 music, check boost factor at line 1236

### Overlapping sounds cut off on iOS
Add rotating copies (see buttonClick/laser pattern in `sounds.ts`)

## Future Refactoring

The `AudioEngine.ts` file is ~1725 lines. If significant changes are needed in the future, consider splitting into:

```
src/audio/
├── AudioEngine.ts      (main class, init, routing, volume control)
├── SFXPlayer.ts        (playSFX, playSFXWithStop)
├── MusicPlayer.ts      (playMusic, transitions, crossfade)
├── SpeechPlayer.ts     (playSpeech, playAlienSpeech, playHeavyRadioSpeech)
├── AmbiencePlayer.ts   (startAmbience, layers)
├── HTML5Fallback.ts    (all iOS-specific code)
└── index.ts
```

**Note:** Don't refactor unless necessary - the dual-path iOS compatibility is fragile and the current single-file approach makes debugging easier.
