// React hook for the Audio Engine
import { useCallback, useEffect, useState } from 'react';
import { audioEngine } from './AudioEngine';
import { getAllSoundIds } from './sounds';
import type { PlayOptions, MusicOptions, CategoryVolumes } from './types';

interface UseGameAudioReturn {
    // State
    isReady: boolean;
    isLoading: boolean;
    loadProgress: number;
    currentMusic: string | null;
    volumes: CategoryVolumes;

    // Actions
    init: () => Promise<void>;
    preloadAll: () => Promise<void>;

    // Playback
    playSFX: (soundId: string, options?: PlayOptions) => void;
    playMusic: (soundId: string, options?: MusicOptions) => void;
    stopMusic: (fadeOut?: number) => void;
    startAmbience: (soundId: string, fadeIn?: number) => void;
    stopAmbience: (soundId: string, fadeOut?: number) => void;
    stopAllAmbience: (fadeOut?: number) => void;
    stopAll: () => void;

    // Volume
    setMasterVolume: (value: number) => void;
    setMusicVolume: (value: number) => void;
    setSFXVolume: (value: number) => void;
    setAmbienceVolume: (value: number) => void;
}

export const useGameAudio = (): UseGameAudioReturn => {
    const [isReady, setIsReady] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [loadProgress, setLoadProgress] = useState(0);
    const [currentMusic, setCurrentMusic] = useState<string | null>(null);
    const [volumes, setVolumes] = useState<CategoryVolumes>(audioEngine.getVolumes());

    // Initialize audio context (call after user interaction)
    const init = useCallback(async () => {
        await audioEngine.init();
        setVolumes(audioEngine.getVolumes());
    }, []);

    // Preload all sounds
    const preloadAll = useCallback(async () => {
        setIsLoading(true);
        setLoadProgress(0);

        const soundIds = getAllSoundIds();
        await audioEngine.preloadAll(soundIds, (loaded, total) => {
            setLoadProgress(loaded / total);
        });

        setIsLoading(false);
        setIsReady(true);
    }, []);

    // SFX
    const playSFX = useCallback((soundId: string, options?: PlayOptions) => {
        audioEngine.playSFX(soundId, options);
    }, []);

    // Music
    const playMusic = useCallback((soundId: string, options?: MusicOptions) => {
        audioEngine.playMusic(soundId, options);
        setCurrentMusic(soundId);
    }, []);

    const stopMusic = useCallback((fadeOut?: number) => {
        audioEngine.stopMusic(fadeOut);
        setCurrentMusic(null);
    }, []);

    // Ambience
    const startAmbience = useCallback((soundId: string, fadeIn?: number) => {
        audioEngine.startAmbience(soundId, fadeIn);
    }, []);

    const stopAmbience = useCallback((soundId: string, fadeOut?: number) => {
        audioEngine.stopAmbience(soundId, fadeOut);
    }, []);

    const stopAllAmbience = useCallback((fadeOut?: number) => {
        audioEngine.stopAllAmbience(fadeOut);
    }, []);

    const stopAll = useCallback(() => {
        audioEngine.stopAll();
        setCurrentMusic(null);
    }, []);

    // Volume controls
    const setMasterVolume = useCallback((value: number) => {
        audioEngine.setMasterVolume(value);
        setVolumes(audioEngine.getVolumes());
    }, []);

    const setMusicVolume = useCallback((value: number) => {
        audioEngine.setMusicVolume(value);
        setVolumes(audioEngine.getVolumes());
    }, []);

    const setSFXVolume = useCallback((value: number) => {
        audioEngine.setSFXVolume(value);
        setVolumes(audioEngine.getVolumes());
    }, []);

    const setAmbienceVolume = useCallback((value: number) => {
        audioEngine.setAmbienceVolume(value);
        setVolumes(audioEngine.getVolumes());
    }, []);

    return {
        isReady,
        isLoading,
        loadProgress,
        currentMusic,
        volumes,
        init,
        preloadAll,
        playSFX,
        playMusic,
        stopMusic,
        startAmbience,
        stopAmbience,
        stopAllAmbience,
        stopAll,
        setMasterVolume,
        setMusicVolume,
        setSFXVolume,
        setAmbienceVolume,
    };
};

// Simple hook for just playing SFX (for components like buttons)
export const useSFX = () => {
    const play = useCallback((soundId: string, options?: PlayOptions) => {
        audioEngine.playSFX(soundId, options);
    }, []);

    return { play };
};

// Hook for music control
export const useMusic = () => {
    const [currentMusic, setCurrentMusic] = useState<string | null>(null);

    const play = useCallback((soundId: string, options?: MusicOptions) => {
        audioEngine.playMusic(soundId, options);
        setCurrentMusic(soundId);
    }, []);

    const stop = useCallback((fadeOut?: number) => {
        audioEngine.stopMusic(fadeOut);
        setCurrentMusic(null);
    }, []);

    return { currentMusic, play, stop };
};
