// Sound Registry - Define all game sounds here
import type { SoundDefinition } from './types';
import type { Leg } from '@/data/campaignRoute';

export const SOUNDS: Record<string, SoundDefinition> = {
    // === MUSIC ===
    menuMusic: {
        id: 'menuMusic',
        src: '/assets/audio-assets/music/mc_menu_music1.wav',
        category: 'music',
        loop: true,
        volume: 0.3,
    },
    // Battle music phases - mapped to campaign chapters
    battleMusicPhase1: {
        id: 'battleMusicPhase1',
        src: '/assets/audio-assets/music/mc_battle_music_phase1.wav',
        category: 'music',
        loop: true,
        volume: 0.3,
    },
    battleMusicPhase2: {
        id: 'battleMusicPhase2',
        src: '/assets/audio-assets/music/mc_battle_music_phase2.wav',
        category: 'music',
        loop: true,
        volume: 0.3,
    },
    battleMusicPhase3: {
        id: 'battleMusicPhase3',
        src: '/assets/audio-assets/music/mc_battle_music_phase3.wav',
        category: 'music',
        loop: true,
        volume: 0.3,
    },
    victoryMusic: {
        id: 'victoryMusic',
        src: '/assets/audio-assets/music/mc_victory_music1.wav',
        category: 'music',
        loop: false,
        volume: 0.3,
    },

    // === AMBIENCE ===
    spaceAmbience: {
        id: 'spaceAmbience',
        src: '/assets/audio-assets/sfx/ambience/mc_space_ambiences_03.wav',
        category: 'ambience',
        loop: true,
        volume: 0.2,
    },
    menuAmbience: {
        id: 'menuAmbience',
        src: '/assets/audio-assets/sfx/ambience/mc_ambience_loop.wav',
        category: 'ambience',
        loop: true,
        volume: 0.52,
    },
    introData: {
        id: 'introData',
        src: '/assets/audio-assets/sfx/ambience/mc_intro_data.wav',
        category: 'sfx',
        loop: false,
        volume: 0.15,
    },

    // === SFX ===
    buttonClick: {
        id: 'buttonClick',
        src: '/assets/audio-assets/sfx/sfx/mc_button_click1.wav',
        category: 'sfx',
        volume: 0.5,
        pitchVariation: 0.05,
    },
    laser: {
        id: 'laser',
        src: '/assets/audio-assets/sfx/sfx/mc_laser_shot.wav',
        category: 'sfx',
        volume: 0.6,
        pitchVariation: 0.1,
    },
    explosion: {
        id: 'explosion',
        src: '/assets/audio-assets/sfx/sfx/mc_explosion1.wav',
        category: 'sfx',
        volume: 0.3,
        pitchVariation: 0.05,
    },
    doors: {
        id: 'doors',
        src: '/assets/audio-assets/sfx/sfx/mc_doors.wav',
        category: 'sfx',
        volume: 0.5,
    },
    transition: {
        id: 'transition',
        src: '/assets/audio-assets/sfx/sfx/mc_transition1.wav',
        category: 'sfx',
        volume: 0.5,
    },
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
