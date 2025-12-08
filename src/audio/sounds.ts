// Sound Registry - Define all game sounds here
import type { SoundDefinition } from './types';
import type { Leg } from '@/data/campaignRoute';
import { SPEECH_SOUNDS } from './speechSounds';

// Core game sounds (music, sfx, ambience)
const CORE_SOUNDS: Record<string, SoundDefinition> = {
    // === MUSIC ===
    menuMusic: {
        id: 'menuMusic',
        src: '/assets/audio/music/mc_menu_music1.wav',
        category: 'music',
        loop: true,
        volume: 0.3,
    },
    // Battle music phases - mapped to campaign chapters
    battleMusicPhase1: {
        id: 'battleMusicPhase1',
        src: '/assets/audio/music/mc_battle_music_phase1.wav',
        category: 'music',
        loop: true,
        volume: 0.3,
    },
    battleMusicPhase2: {
        id: 'battleMusicPhase2',
        src: '/assets/audio/music/mc_battle_music_phase2.wav',
        category: 'music',
        loop: true,
        volume: 0.3,
    },
    battleMusicPhase3: {
        id: 'battleMusicPhase3',
        src: '/assets/audio/music/mc_battle_music_phase3.wav',
        category: 'music',
        loop: true,
        volume: 0.5,
    },
    victoryMusic: {
        id: 'victoryMusic',
        src: '/assets/audio/music/mc_victory_music1.wav',
        category: 'music',
        loop: false,
        volume: 0.3,
    },
    bossFightMusic: {
        id: 'bossFightMusic',
        src: '/assets/audio/music/mc_bossfight_music.wav',
        category: 'music',
        loop: true,
        volume: 0.5,
    },
    zorathFightMusic: {
        id: 'zorathFightMusic',
        src: '/assets/audio/music/mc_zorathfight_music.wav',
        category: 'music',
        loop: true,
        volume: 0.5,
    },

    // === AMBIENCE ===
    spaceAmbience: {
        id: 'spaceAmbience',
        src: '/assets/audio/sfx/ambience/mc_space_ambiences_03.wav',
        category: 'ambience',
        loop: true,
        volume: 0.2,
    },
    menuAmbience: {
        id: 'menuAmbience',
        src: '/assets/audio/sfx/ambience/mc_ambience_loop.wav',
        category: 'ambience',
        loop: true,
        volume: 0.52,
    },
    introData: {
        id: 'introData',
        src: '/assets/audio/sfx/ambience/mc_intro_data.wav',
        category: 'sfx',
        loop: false, // Plays once, fades out when briefing typing finishes
        volume: 0.15,
    },

    // === SFX ===
    // 3 copies each to allow overlapping playback on iOS (HTML5 Audio reuse limitation)
    buttonClick1: {
        id: 'buttonClick1',
        src: '/assets/audio/sfx/sfx/button_1.wav',
        category: 'sfx',
        volume: 0.5,
        pitchVariation: 0.05,
    },
    buttonClick2: {
        id: 'buttonClick2',
        src: '/assets/audio/sfx/sfx/button_2.wav',
        category: 'sfx',
        volume: 0.5,
        pitchVariation: 0.05,
    },
    buttonClick3: {
        id: 'buttonClick3',
        src: '/assets/audio/sfx/sfx/button_3.wav',
        category: 'sfx',
        volume: 0.5,
        pitchVariation: 0.05,
    },
    laser1: {
        id: 'laser1',
        src: '/assets/audio/sfx/sfx/laser_1.wav',
        category: 'sfx',
        volume: 0.6,
        pitchVariation: 0.1,
    },
    laser2: {
        id: 'laser2',
        src: '/assets/audio/sfx/sfx/laser_2.wav',
        category: 'sfx',
        volume: 0.6,
        pitchVariation: 0.1,
    },
    laser3: {
        id: 'laser3',
        src: '/assets/audio/sfx/sfx/laser_3.wav',
        category: 'sfx',
        volume: 0.6,
        pitchVariation: 0.1,
    },
    explosion: {
        id: 'explosion',
        src: '/assets/audio/sfx/sfx/mc_explosion1.wav',
        category: 'sfx',
        volume: 0.3,
        pitchVariation: 0.05,
    },
    doors: {
        id: 'doors',
        src: '/assets/audio/sfx/sfx/mc_doors.wav',
        category: 'sfx',
        volume: 0.5,
    },
    transition: {
        id: 'transition',
        src: '/assets/audio/sfx/sfx/mc_transition1.wav',
        category: 'sfx',
        volume: 0.5,
    },
    // Ship slide whoosh sounds
    shipSlide1: {
        id: 'shipSlide1',
        src: '/assets/audio/sfx/sfx/ship_slide/SFX_Whoosh_Pass_By_PSEF179 1.wav',
        category: 'sfx',
        volume: 0.5,
    },
    shipSlide2: {
        id: 'shipSlide2',
        src: '/assets/audio/sfx/sfx/ship_slide/SFX_Whoosh_Pass_By_PSEF180.wav',
        category: 'sfx',
        volume: 0.5,
    },
    shipSlide3: {
        id: 'shipSlide3',
        src: '/assets/audio/sfx/sfx/ship_slide/SFX_Whoosh_Pass_By_PSEF182 1SHORT.wav',
        category: 'sfx',
        volume: 0.5,
    },
    shipSlide4: {
        id: 'shipSlide4',
        src: '/assets/audio/sfx/sfx/ship_slide/SFX_Whoosh_Pass_By_PSEF185.wav',
        category: 'sfx',
        volume: 0.5,
    },
    // Radio static for boss defeat transmission
    radioStatic: {
        id: 'radioStatic',
        src: '/assets/audio/sfx/radio/radio_static.wav',
        category: 'sfx',
        volume: 0.7,
    },
    // Star earned sound (battle screen)
    starEarned: {
        id: 'starEarned',
        src: '/assets/audio/sfx/sfx/sparkling_star.wav',
        category: 'sfx',
        volume: 0.02,
        html5Volume: 0.0001, // Near-zero for iOS test
    },
    // Result screen animation sounds
    resultPercentage: {
        id: 'resultPercentage',
        src: '/assets/audio/sfx/sfx/mission_complete/SFX_Dsgnsynth Synth Bubble Rising Echo Funky Audio Fass by Funky_Audio Id-698820.wav',
        category: 'sfx',
        volume: 0.5,
    },
    resultCorrectCount: {
        id: 'resultCorrectCount',
        src: '/assets/audio/sfx/sfx/mission_complete/SFX_User Interface, Alert, Game, Points, Single SND5583 1.wav',
        category: 'sfx',
        volume: 0.6,
    },
    // 3 copies to allow overlapping playback on iOS (HTML5 Audio reuse limitation)
    resultStarPop1: {
        id: 'resultStarPop1',
        src: '/assets/audio/sfx/sfx/mission_complete/star_pop_1.wav',
        category: 'sfx',
        volume: 0.8,
        pitchVariation: 0.1,
    },
    resultStarPop2: {
        id: 'resultStarPop2',
        src: '/assets/audio/sfx/sfx/mission_complete/star_pop_2.wav',
        category: 'sfx',
        volume: 0.8,
        pitchVariation: 0.1,
    },
    resultStarPop3: {
        id: 'resultStarPop3',
        src: '/assets/audio/sfx/sfx/mission_complete/star_pop_3.wav',
        category: 'sfx',
        volume: 0.8,
        pitchVariation: 0.1,
    },
    resultXP: {
        id: 'resultXP',
        src: '/assets/audio/sfx/sfx/mission_complete/SFX_User Interface, Alert, Game, Points, Single SND5583 copy 2.wav',
        category: 'sfx',
        volume: 0.6,
    },
};

// Combined sounds registry (core + speech)
export const SOUNDS: Record<string, SoundDefinition> = {
    ...CORE_SOUNDS,
    ...SPEECH_SOUNDS,
};

// Helper to get all sounds by category
export const getSoundsByCategory = (category: SoundDefinition['category']) => {
    return Object.values(SOUNDS).filter(s => s.category === category);
};

// Get all sound IDs for preloading
export const getAllSoundIds = () => Object.keys(SOUNDS);

// ============================================
// BATTLE MUSIC PHASE MAPPING
// ============================================
// Phase 1: Inner System (chapter: 'inner')     - Earth → Moon → Mars → Ceres
// Phase 2: Gas Giants   (chapter: 'giants')    - Ceres → Jupiter → Europa → Saturn → Titan
// Phase 3: Deep Space   (chapters: 'outer' + 'kuiper') - Titan → Uranus → Neptune → ... → Arrokoth

export type MusicPhase = 1 | 2 | 3;

export const chapterToMusicPhase: Record<Leg['chapter'], MusicPhase> = {
    inner: 1,
    giants: 2,
    outer: 3,
    kuiper: 3,
};

export const musicPhaseToSoundId: Record<MusicPhase, string> = {
    1: 'battleMusicPhase1',
    2: 'battleMusicPhase2',
    3: 'battleMusicPhase3',
};

/**
 * Get the battle music sound ID for a given campaign chapter
 */
export const getBattleMusicForChapter = (chapter: Leg['chapter']): string => {
    const phase = chapterToMusicPhase[chapter];
    return musicPhaseToSoundId[phase];
};
