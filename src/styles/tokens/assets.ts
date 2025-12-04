/**
 * Centralized Asset Paths
 *
 * Single source of truth for all asset paths in the application.
 * Import from here instead of hardcoding paths in components.
 */

export const assets = {
  backgrounds: {
    // Base space backgrounds
    spaceDark: '/assets/images/backgrounds/base/dark-blue-purple.png',
    spaceBright: '/assets/images/backgrounds/base/bright-blue.png',

    // Star overlay layers for parallax effects
    starsBlue: '/assets/images/backgrounds/stars/stars-blue.png',
    starsYellow: '/assets/images/backgrounds/stars/stars-yellow.png',
    yellowStarsAlt: '/assets/images/backgrounds/stars/yellow-stars-alt.png',
  },

  planets: {
    animated: {
      earth: { folder: '/assets/images/planets/animated/terran-clouds', frames: 60 },
      moon: { folder: '/assets/images/planets/animated/barren-1', frames: 60 },
      mars: { folder: '/assets/images/planets/animated/desert-1', frames: 60 },
      ceres: { folder: '/assets/images/planets/animated/barren-2', frames: 60 },
      jupiter: { folder: '/assets/images/planets/animated/gas-giant-1', frames: 60 },
      europa: { folder: '/assets/images/planets/animated/ice', frames: 60 },
      saturn: { folder: '/assets/images/planets/animated/gas-giant-2', frames: 60 },
      titan: { folder: '/assets/images/planets/animated/desert-2', frames: 60 },
      uranus: { folder: '/assets/images/planets/animated/gas-giant-3', frames: 60 },
      neptune: { folder: '/assets/images/planets/animated/gas-giant-4', frames: 60 },
      pluto: { folder: '/assets/images/planets/animated/barren-3', frames: 60 },
      haumea: { folder: '/assets/images/planets/animated/barren-4', frames: 60 },
      makemake: { folder: '/assets/images/planets/animated/ice', frames: 60 },
      eris: { folder: '/assets/images/planets/animated/ice', frames: 60 },
      arrokoth: { folder: '/assets/images/planets/animated/barren-1', frames: 60 },
    },
    static: {
      earth: '/assets/images/planets/static/ocean-1.png',
      moon: '/assets/images/planets/static/barren-1.png',
      mars: '/assets/images/planets/static/desert-1.png',
      ceres: '/assets/images/planets/static/asteroids-1.png',
      jupiter: '/assets/images/planets/static/gas-giant-1.png',
      europa: '/assets/images/planets/static/ice-1.png',
      saturn: '/assets/images/planets/static/gas-giant-2.png',
      titan: '/assets/images/planets/static/desert-2.png',
      uranus: '/assets/images/planets/static/gas-giant-3.png',
      neptune: '/assets/images/planets/static/gas-giant-4.png',
      pluto: '/assets/images/planets/static/barren-3.png',
      haumea: '/assets/images/planets/static/barren-4.png',
      makemake: '/assets/images/planets/static/ice-2.png',
      eris: '/assets/images/planets/static/ice-3.png',
      arrokoth: '/assets/images/planets/static/barren-5.png',
    },
  },

  characters: {
    commander: '/assets/images/characters/commander.png',
    alienBoss: '/assets/images/characters/alien-boss.png',
    alienCommander: '/assets/images/characters/alien-commander.png',
    zorath: '/assets/images/characters/zorath.png',
  },

  ships: {
    bossShip: '/assets/images/ships/boss-ship.png',
  },

  ui: {
    badges: {
      cadet: '/assets/images/ui/badges/rank-cadet.png',
      captain: '/assets/images/ui/badges/rank-captain.png',
      commander: '/assets/images/ui/badges/rank-commander.png',
      fleetAdmiral: '/assets/images/ui/badges/rank-fleet-admiral.png',
      starMarshal: '/assets/images/ui/badges/rank-star-marshal.png',
      cosmicGuardian: '/assets/images/ui/badges/rank-cosmic-guardian.png',
      galacticLegend: '/assets/images/ui/badges/rank-galactic-legend.png',
    },
  },

  video: {
    introCinematic: '/assets/video/intro-cinematic.mp4',
  },

  audio: {
    basePath: '/assets/audio',
    music: '/assets/audio/music',
    sfx: '/assets/audio/sfx',
    speech: '/assets/audio/speech',
  },
} as const;

// Type helpers for autocomplete
export type PlanetId = keyof typeof assets.planets.animated;
export type CharacterId = keyof typeof assets.characters;
export type BadgeId = keyof typeof assets.ui.badges;
