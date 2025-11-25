import { useCallback } from 'react';

// Audio file paths
const AUDIO_PATHS = {
    buttonClick: '/assets/audio-assets/button-click1.wav',
    laser: '/assets/audio-assets/SFX_Scifi, Weapon, Spaceship Blaster, Star Fighter, Fire, Various Patterns, Bolts 01 SND86042.wav',
    explosion: '/assets/audio-assets/SFX_Spaceexplosion by ddragonpearl Id-463350.wav',
    ambience: '/assets/audio-assets/ambience_loop.wav',
    spaceAmbience: '/assets/audio-assets/SFX_Space_Ambiences_03.wav',
    doors: '/assets/audio-assets/doors.wav',
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
// ============================================

let globalSettings: SoundSettings = defaultSettings;
let settingsLoaded = false;

// Single audio instance per sound type - prevents overlapping
const activeAudio: Map<string, HTMLAudioElement> = new Map();

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

// Start background ambience (global singleton)
export const startAmbience = () => {
    ensureSettingsLoaded();
    if (!globalSettings.musicEnabled) return;

    // Check if already playing
    const existing = activeAudio.get('ambience');
    if (existing && !existing.paused) {
        return; // Already playing
    }

    // Stop any existing
    if (existing) {
        existing.pause();
    }

    const audio = new Audio(AUDIO_PATHS.ambience);
    audio.loop = true;
    audio.volume = globalSettings.musicVolume;
    activeAudio.set('ambience', audio);

    audio.play().catch(() => {
        // Ignore autoplay errors
        activeAudio.delete('ambience');
    });
};

// Stop background ambience
export const stopAmbience = () => {
    const audio = activeAudio.get('ambience');
    if (audio) {
        audio.pause();
        activeAudio.delete('ambience');
    }
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
    } else if (newSettings.musicEnabled === true && !activeAudio.has('ambience')) {
        startAmbience();
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

    const start = useCallback(() => {
        startAmbience();
    }, []);

    const stop = useCallback(() => {
        stopAmbience();
    }, []);

    const update = useCallback((newSettings: Partial<SoundSettings>) => {
        updateSoundSettings(newSettings);
    }, []);

    return {
        playSound: play,
        startAmbience: start,
        stopAmbience: stop,
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
