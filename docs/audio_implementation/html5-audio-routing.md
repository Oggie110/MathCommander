# HTML5 Audio Routing Schematic (iOS)

## Entry Points

Both public methods route to the same HTML5 method:

```
playMusic(soundId)                    playMusicTransition(soundId)
      │                                        │
      ▼                                        ▼
if (useHTML5Fallback) ───────────────> if (useHTML5Fallback)
      │                                        │
      └──────────────┬─────────────────────────┘
                     │
                     ▼
          ┌─────────────────────────┐
          │   playMusicHTML5()      │
          │   (line 1142)           │
          └─────────────────────────┘
```

## Inside playMusicHTML5()

```
1. Skip if same music already playing
   if (html5MusicId === soundId && html5Music) return;

2. Get sound definition from SOUNDS[soundId]
   └── sound.src = '/assets/audio/music/mc_battle_music_phase1.wav'

3. Stop current music if playing
   if (html5Music) stopMusicHTML5(crossfadeDuration);

4. Create new Audio element
   ┌─────────────────────────────────────────────┐
   │  const audio = new Audio(sound.src);        │
   │  audio.loop = true;                         │
   └─────────────────────────────────────────────┘

5. ★ VOLUME CALCULATION (HARDCODED) ★
   ┌─────────────────────────────────────────────┐
   │  const targetVolume = 0.01;  // 1%          │  ◄── HARDCODED HERE
   │  console.log('[AudioEngine] HTML5...')      │
   └─────────────────────────────────────────────┘

6. Play with fade-in OR immediate
   ┌─────────────────────────────────────────────┐
   │  if (fadeInDuration > 0) {                  │
   │    audio.volume = 0;                        │
   │    audio.play();                            │
   │    // setInterval fade to targetVolume      │
   │  } else {                                   │
   │    audio.volume = targetVolume;  // 0.01    │  ◄── DIRECT ASSIGNMENT
   │    audio.play();                            │
   │  }                                          │
   └─────────────────────────────────────────────┘

7. Store reference
   this.html5Music = audio;
   this.html5MusicId = soundId;
```

## Audio Output

```
┌────────────────┐         ┌─────────────────┐
│ new Audio()    │────────►│ Device Speakers │
│ .volume = 0.01 │         │                 │
└────────────────┘         └─────────────────┘

NOTE: HTML5 Audio goes DIRECTLY to speakers.
      No intermediate gain nodes, no compressors, no master volume.
      Just: audio.volume → speakers
```

## Volume Chain Comparison

### Web Audio (desktop)
```
┌────────┐   ┌───────────┐   ┌───────────┐   ┌────────────┐   ┌─────────┐
│ Source │──►│ TrackGain │──►│ MusicGain │──►│ Compressor │──►│ Master  │──► 🔊
│        │   │ (0.3)     │   │ (0.3)     │   │            │   │ (1.0)   │
└────────┘   └───────────┘   └───────────┘   └────────────┘   └─────────┘
                                                             Final: ~0.09
```

### HTML5 Audio (iOS)
```
┌──────────────────┐
│ new Audio()      │──────────────────────────────────────────────────────► 🔊
│ .volume = 0.01   │   (DIRECT - no intermediate processing)
└──────────────────┘
                                                             Final: 0.01
```

## Debugging

If music is still loud at 0.01, check console for:

1. `[AudioEngine] INIT DEBUG:` - Shows user agent, platform, touch points, iOS detected
2. `[AudioEngine] Using HTML5 FALLBACK for iOS` - Confirms HTML5 path is active
3. `[AudioEngine] Using Web Audio API (not iOS)` - Web Audio is being used instead
4. `[AudioEngine] HTML5 music playing with HARDCODED volume: 0.01` - Confirms HTML5 music playing

## Possible Issues

1. **Code isn't being executed** - console.log would tell us
2. **Browser cache** - old JS bundle being served
3. **`useHTML5Fallback` is false** - Web Audio is being used instead of HTML5
