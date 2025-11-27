# Space Math Commander

A retro-styled space shooter math game where players defend humanity against an alien invasion by solving math problems.

## About

Travel across the solar system from Earth to the distant Kuiper Belt, battling alien forces at each planetary waypoint. Answer math questions correctly to fire your weapons and defeat enemy ships. Face off against powerful boss aliens at each destination as you push back the invasion.

## Features

- **Campaign Mode**: Journey through 14 celestial bodies from the Moon to Arrokoth
- **Adaptive Difficulty**: Math problems scale based on player performance
- **Boss Battles**: Unique alien commanders at each planetary destination
- **Full Voice Acting**: Commander briefings and alien taunts with radio effects
- **Retro Pixel Art**: Classic arcade-style visuals
- **Dynamic Soundtrack**: Battle music that intensifies as you progress deeper into space

## Tech Stack

- React + TypeScript + Vite
- Tailwind CSS
- Web Audio API for spatial audio and effects

## Audio System

The game uses a custom Web Audio API engine (`src/audio/AudioEngine.ts`) with per-channel dynamics processing for consistent volume levels:

| Channel | Threshold | Ratio | Attack | Release | Makeup Gain |
|---------|-----------|-------|--------|---------|-------------|
| Music   | -18dB     | 3:1   | 10ms   | 200ms   | 0.7         |
| SFX     | -24dB     | 4:1   | 3ms    | 250ms   | 0.5         |
| Speech  | -24dB     | 6:1   | 3ms    | 250ms   | 0.5         |

Speech audio also includes radio transmission effects (bandpass filtering, subtle reverb) with a heavier "damaged transmission" variant for defeated bosses.

## Development

```bash
npm install
npm run dev
```

## License

All rights reserved.
