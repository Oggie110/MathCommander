import { useCallback } from 'react';

// Audio file paths
const AUDIO_PATHS = {
    buttonClick: '/assets/audio-assets/button-click1.wav',
    laser: '/assets/audio-assets/SFX_Scifi, Weapon, Spaceship Blaster, Star Fighter, Fire, Various Patterns, Bolts 01 SND86042.wav',
    explosion: '/assets/audio-assets/SFX_Spaceexplosion by ddragonpearl Id-463350.wav',
    ambience: '/assets/audio-assets/ambience_loop.wav',
    spaceAmbience: '/assets/audio-assets/SFX_Space_Ambiences_03.wav',
    doors: '/assets/audio-assets/doors.wav',
    // Music tracks
    menuMusic: '/assets/audio-assets/music/OF_FableFX Reel A4.mp3',
    battleMusic: '/assets/audio-assets/music/Home Coming.mp3',
};

type SoundType = keyof typeof AUDIO_PATHS;

// Sound settings stored in localStorage
const SOUND_SETTINGS_KEY = 'space-math-sound-settings';

interface SoundSettings {
    soundEnabled: boolean;
    musicEnabled: boolean;
    soundVolume: number;
    musicVolume: number;
}

const defaultSettings: SoundSettings = {
    soundEnabled: true,
    musicEnabled: true,
    soundVolume: 0.5,
    musicVolume: 0.3,
};

// ============================================
// GLOBAL STATE (outside React lifecycle)
// Use window to survive HMR reloads
// ============================================

let globalSettings: SoundSettings = defaultSettings;
let settingsLoaded = false;

// Single audio instance per sound type - prevents overlapping
// Store on window to survive HMR module reloads
declare global {
    interface Window {
        __audioState?: {
            activeAudio: Map<string, HTMLAudioElement>;
            currentAmbienceType: 'menu' | 'battle' | null;
            musicElement: HTMLAudioElement | null;
        };
    }
}

// Initialize or reuse existing audio state
if (!window.__audioState) {
    window.__audioState = {
        activeAudio: new Map(),
        currentAmbienceType: null,
        // Single reusable music element to prevent orphaned audio
        musicElement: null as HTMLAudioElement | null,
    };
}

const activeAudio = window.__audioState.activeAudio;

// Track which ambience type is currently active
export type AmbienceType = 'menu' | 'battle';
const getCurrentAmbienceType = () => window.__audioState!.currentAmbienceType;
const setCurrentAmbienceType = (type: AmbienceType | null) => {
    window.__audioState!.currentAmbienceType = type;
};

// Load settings once
const ensureSettingsLoaded = () => {
    if (settingsLoaded) return;
    try {
        const saved = localStorage.getItem(SOUND_SETTINGS_KEY);
        if (saved) {
            globalSettings = { ...defaultSettings, ...JSON.parse(saved) };
        }
    } catch {
        // Ignore parsing errors
    }
    settingsLoaded = true;
};

// Save settings
const saveSettings = () => {
    localStorage.setItem(SOUND_SETTINGS_KEY, JSON.stringify(globalSettings));
};

// ============================================
// AUDIO FUNCTIONS (global, not hooks)
// ============================================

// Play a one-shot sound effect - only one instance per sound type
export const playSound = (sound: SoundType, volumeMultiplier = 1) => {
    ensureSettingsLoaded();
    if (!globalSettings.soundEnabled) return;

    // Stop any existing instance of this sound
    const existing = activeAudio.get(sound);
    if (existing) {
        existing.pause();
        existing.currentTime = 0;
    }

    const path = AUDIO_PATHS[sound];
    const audio = new Audio(path);
    audio.volume = globalSettings.soundVolume * volumeMultiplier;

    // Track this audio instance
    activeAudio.set(sound, audio);

    // Clean up when done
    audio.onended = () => {
        if (activeAudio.get(sound) === audio) {
            activeAudio.delete(sound);
        }
    };

    audio.play().catch(() => {
        // Ignore autoplay errors
        activeAudio.delete(sound);
    });
};

// Crossfade duration in milliseconds
const CROSSFADE_DURATION = 800;

// Fade out an audio element
const fadeOut = (audio: HTMLAudioElement, duration: number): Promise<void> => {
    return new Promise((resolve) => {
        const startVolume = audio.volume;
        const steps = 20;
        const stepTime = duration / steps;
        const volumeStep = startVolume / steps;
        let currentStep = 0;

        const fade = setInterval(() => {
            currentStep++;
            audio.volume = Math.max(0, startVolume - (volumeStep * currentStep));

            if (currentStep >= steps) {
                clearInterval(fade);
                audio.pause();
                audio.currentTime = 0;
                resolve();
            }
        }, stepTime);
    });
};

// Fade in an audio element
const fadeIn = (audio: HTMLAudioElement, targetVolume: number, duration: number) => {
    audio.volume = 0;
    const steps = 20;
    const stepTime = duration / steps;
    const volumeStep = targetVolume / steps;
    let currentStep = 0;

    const fade = setInterval(() => {
        currentStep++;
        audio.volume = Math.min(targetVolume, volumeStep * currentStep);

        if (currentStep >= steps) {
            clearInterval(fade);
        }
    }, stepTime);
};

// Start background ambience (global singleton) with crossfade
// type: 'menu' for regular ambience, 'battle' for space ambience
export const startAmbience = (type: AmbienceType = 'menu') => {
    console.log('[Audio] startAmbience called with type:', type);
    ensureSettingsLoaded();
    if (!globalSettings.musicEnabled) {
        console.log('[Audio] Music disabled, not starting');
        return;
    }

    // If same type is already playing, do nothing
    const currentMusicEl = window.__audioState!.musicElement;
    if (currentMusicEl && !currentMusicEl.paused && getCurrentAmbienceType() === type) {
        console.log('[Audio] Same type already playing, skipping');
        return;
    }

    // Select the right audio file (music tracks)
    const audioPath = type === 'battle' ? AUDIO_PATHS.battleMusic : AUDIO_PATHS.menuMusic;
    console.log('[Audio] Starting music with crossfade:', audioPath);

    // Create new audio element for the new track
    const newAudio = new Audio(audioPath);
    newAudio.loop = true;

    // If there's existing music, crossfade
    if (currentMusicEl && !currentMusicEl.paused) {
        // Start fading out the old track
        fadeOut(currentMusicEl, CROSSFADE_DURATION);

        // Start the new track with fade in
        newAudio.volume = 0;
        newAudio.play().then(() => {
            fadeIn(newAudio, globalSettings.musicVolume, CROSSFADE_DURATION);
        }).catch(() => {
            console.log('[Audio] Autoplay blocked');
            setCurrentAmbienceType(null);
        });
    } else {
        // No existing music, just start with fade in
        newAudio.volume = 0;
        newAudio.play().then(() => {
            fadeIn(newAudio, globalSettings.musicVolume, CROSSFADE_DURATION);
        }).catch(() => {
            console.log('[Audio] Autoplay blocked');
            setCurrentAmbienceType(null);
        });
    }

    // Update state
    window.__audioState!.musicElement = newAudio;
    activeAudio.set('ambience', newAudio);
    setCurrentAmbienceType(type);
};

// Stop background ambience
export const stopAmbience = () => {
    console.log('[Audio] stopAmbience called');
    const musicEl = window.__audioState!.musicElement;
    if (musicEl) {
        console.log('[Audio] Stopping music element');
        musicEl.pause();
        musicEl.currentTime = 0;
    }
    activeAudio.delete('ambience');
    setCurrentAmbienceType(null);
};

// Stop ALL audio (ambience and SFX)
export const stopAll = () => {
    console.log('[Audio] stopAll called');

    // Stop the music element directly
    const musicEl = window.__audioState!.musicElement;
    if (musicEl) {
        console.log('[Audio] Stopping music element, paused:', musicEl.paused);
        musicEl.pause();
        musicEl.currentTime = 0;
    }

    // Stop any SFX
    activeAudio.forEach((audio, key) => {
        if (key !== 'ambience') { // Music already stopped above
            console.log('[Audio] Stopping SFX:', key);
            audio.pause();
            audio.currentTime = 0;
        }
    });
    activeAudio.clear();
    setCurrentAmbienceType(null);
    console.log('[Audio] All audio stopped');
};

// Update settings
export const updateSoundSettings = (newSettings: Partial<SoundSettings>) => {
    ensureSettingsLoaded();
    globalSettings = { ...globalSettings, ...newSettings };
    saveSettings();

    // Update ambience volume if playing
    const ambience = activeAudio.get('ambience');
    if (ambience && newSettings.musicVolume !== undefined) {
        ambience.volume = newSettings.musicVolume;
    }

    // Start/stop ambience based on settings
    if (newSettings.musicEnabled === false) {
        stopAmbience();
    } else if (newSettings.musicEnabled === true && !activeAudio.has('ambience') && getCurrentAmbienceType()) {
        startAmbience(getCurrentAmbienceType()!);
    }
};

// Get current settings
export const getSoundSettings = (): SoundSettings => {
    ensureSettingsLoaded();
    return { ...globalSettings };
};

// ============================================
// REACT HOOKS (thin wrappers around global functions)
// ============================================

// Main audio hook
export const useAudio = () => {
    const play = useCallback((sound: SoundType, volumeMultiplier = 1) => {
        playSound(sound, volumeMultiplier);
    }, []);

    const start = useCallback((type: AmbienceType = 'menu') => {
        startAmbience(type);
    }, []);

    const stop = useCallback(() => {
        stopAmbience();
    }, []);

    const stopAllSounds = useCallback(() => {
        stopAll();
    }, []);

    const update = useCallback((newSettings: Partial<SoundSettings>) => {
        updateSoundSettings(newSettings);
    }, []);

    return {
        playSound: play,
        startAmbience: start,
        stopAmbience: stop,
        stopAll: stopAllSounds,
        updateSettings: update,
        settings: getSoundSettings(),
    };
};

// Simpler hook for just playing sounds (used in components)
export const useSoundEffect = () => {
    const play = useCallback((sound: SoundType, volumeMultiplier = 1) => {
        playSound(sound, volumeMultiplier);
    }, []);

    return { play };
};
