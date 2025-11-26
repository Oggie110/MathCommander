// Audio Engine Types

export interface SoundDefinition {
    id: string;
    src: string;
    category: 'music' | 'sfx' | 'ambience';
    // For music with intro/loop/outro sections
    loop?: boolean;
    loopStart?: number;  // seconds - where loop begins
    loopEnd?: number;    // seconds - where loop ends (jumps back to loopStart)
    // For SFX variations
    pitchVariation?: number;  // e.g., 0.1 means ±10% pitch randomization
    volumeVariation?: number; // e.g., 0.1 means ±10% volume randomization
    // Default volume (0-1)
    volume?: number;
}

export interface PlayOptions {
    volume?: number;
    pitch?: number;        // playback rate (1 = normal, 2 = octave up, 0.5 = octave down)
    loop?: boolean;
    fadeIn?: number;       // fade in duration in ms
    onEnd?: () => void;
}

export interface MusicOptions {
    fadeIn?: number;
    fadeOut?: number;
    crossfade?: number;
}

export interface CategoryVolumes {
    master: number;
    music: number;
    sfx: number;
    ambience: number;
}

export interface AudioState {
    isInitialized: boolean;
    isLoading: boolean;
    loadProgress: number;
    currentMusic: string | null;
    volumes: CategoryVolumes;
}
