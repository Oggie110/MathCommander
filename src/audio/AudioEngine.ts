// Web Audio API based Audio Engine
import type { PlayOptions, MusicOptions, CategoryVolumes } from './types';
import { SOUNDS } from './sounds';

const STORAGE_KEY = 'space-math-audio-settings';

class AudioEngine {
    private context: AudioContext | null = null;
    private useHTML5Fallback = false; // Will be set to true on iOS if Web Audio fails
    private html5Music: HTMLAudioElement | null = null; // Current music element for iOS
    private html5MusicSource: MediaElementAudioSourceNode | null = null; // For routing HTML5 through Web Audio
    private html5MusicGain: GainNode | null = null; // Gain node for HTML5 music volume control
    private html5MusicId: string | null = null;
    private html5MusicBaseVolume: number = 1; // Base volume for current music track (before user volume applied)
    private html5Ambience: Map<string, { audio: HTMLAudioElement; source: MediaElementAudioSourceNode; gain: GainNode }> = new Map(); // Ambience elements for iOS with Web Audio routing
    private html5AmbienceBaseVolumes: Map<string, number> = new Map(); // Base volumes for ambience tracks
    private html5Speech: HTMLAudioElement | null = null; // Current speech element for iOS
    private html5SpeechSource: MediaElementAudioSourceNode | null = null; // For routing HTML5 speech through Web Audio
    private html5SpeechGain: GainNode | null = null; // Gain node for HTML5 speech volume control
    private html5SFXPool: Map<string, HTMLAudioElement[]> = new Map(); // Pool of preloaded SFX for iOS
    private html5SFXConnected: WeakSet<HTMLAudioElement> = new WeakSet(); // Track which SFX elements are already connected to Web Audio
    private html5SFXGains: WeakMap<HTMLAudioElement, GainNode> = new WeakMap(); // GainNodes for connected SFX elements
    private html5SpeechPool: Map<string, HTMLAudioElement> = new Map(); // Preloaded speech elements for iOS
    private html5MusicPool: Map<string, HTMLAudioElement> = new Map(); // Preloaded music elements for iOS
    private html5MusicConnected: WeakSet<HTMLAudioElement> = new WeakSet(); // Track which music elements are already connected to Web Audio
    private html5MusicGains: WeakMap<HTMLAudioElement, { source: MediaElementAudioSourceNode; gain: GainNode }> = new WeakMap(); // Web Audio nodes for connected music elements
    private masterGain: GainNode | null = null;
    private musicGain: GainNode | null = null;
    private sfxGain: GainNode | null = null;
    private ambienceGain: GainNode | null = null;
    private speechGain: GainNode | null = null;
    private speechCompressor: DynamicsCompressorNode | null = null;
    private speechMakeupGain: GainNode | null = null;
    private sfxCompressor: DynamicsCompressorNode | null = null;
    private sfxMakeupGain: GainNode | null = null;
    private musicCompressor: DynamicsCompressorNode | null = null;
    private musicMakeupGain: GainNode | null = null;

    // Currently playing speech (only one at a time)
    private currentSpeech: AudioBufferSourceNode | null = null;
    private currentSpeechGain: GainNode | null = null;
    private currentSpeechResolve: (() => void) | null = null;

    // Audio buffers (preloaded)
    private buffers: Map<string, AudioBuffer> = new Map();

    // Currently playing sources
    private currentMusic: AudioBufferSourceNode | null = null;
    private currentMusicId: string | null = null;
    private currentMusicGain: GainNode | null = null;

    // Ambience layers (can have multiple)
    private ambienceLayers: Map<string, { source: AudioBufferSourceNode; gain: GainNode }> = new Map();

    // Volume settings
    private volumes: CategoryVolumes = {
        master: 1.0,
        music: 0.3,
        sfx: 0.5,
        ambience: 0.2,
        speech: 0.4,
    };

    private _isInitialized = false;
    private _isPaused = false; // Track if audio is paused due to visibility

    constructor() {
        this.loadSettings();
        this.setupVisibilityHandling();
    }

    /**
     * Set up page visibility change handling to pause/resume audio
     */
    private setupVisibilityHandling(): void {
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseAll();
            } else {
                this.resumeAll();
            }
        });
    }

    /**
     * Pause all audio when page is hidden
     */
    private pauseAll(): void {
        this._isPaused = true;

        // Pause Web Audio context
        if (this.context && this.context.state === 'running') {
            this.context.suspend();
        }

        // Pause HTML5 audio elements
        if (this.html5Music) {
            this.html5Music.pause();
        }
        for (const entry of this.html5Ambience.values()) {
            entry.audio.pause();
        }
        if (this.html5Speech) {
            this.html5Speech.pause();
        }
    }

    /**
     * Resume all audio when page is visible again
     */
    private resumeAll(): void {
        if (!this._isPaused) return;
        this._isPaused = false;

        // Resume Web Audio context
        if (this.context && this.context.state === 'suspended') {
            this.context.resume();
        }

        // Resume HTML5 audio elements - small delay helps iOS
        setTimeout(() => {
            if (this.html5Music && this.html5Music.paused) {
                this.html5Music.play().catch(() => { /* ignore autoplay restrictions */ });
            }
            for (const entry of this.html5Ambience.values()) {
                if (entry.audio.paused) {
                    entry.audio.play().catch(() => { /* ignore */ });
                }
            }
        }, 100);
        // Don't auto-resume speech - it's usually one-shot dialogue
    }

    // === INITIALIZATION ===

    /**
     * Initialize the audio context (must be called after user interaction)
     */
    async init(): Promise<void> {
        if (this._isInitialized) return;

        console.log('[AudioEngine] init called - using pure Web Audio');

        try {
            // Use webkitAudioContext for older iOS Safari
            const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
            this.context = new AudioContextClass();

            // iOS Safari requires explicit resume after user interaction
            if (this.context.state === 'suspended') {
                await this.context.resume();
            }

            // iOS unlock trick: play a silent buffer to fully unlock audio
            const silentBuffer = this.context.createBuffer(1, 1, 22050);
            const silentSource = this.context.createBufferSource();
            silentSource.buffer = silentBuffer;
            silentSource.connect(this.context.destination);
            silentSource.start(0);

            console.log('[AudioEngine] Web Audio context created, state:', this.context.state);

            // Create gain nodes for each category
            this.masterGain = this.context.createGain();
            this.masterGain.connect(this.context.destination);
            this.masterGain.gain.value = this.volumes.master;

            // Music compressor for consistent volume levels (gentle, preserves dynamics)
            this.musicCompressor = this.context.createDynamicsCompressor();
            this.musicCompressor.threshold.value = -18;
            this.musicCompressor.knee.value = 10;
            this.musicCompressor.ratio.value = 3;
            this.musicCompressor.attack.value = 0.01;
            this.musicCompressor.release.value = 0.2;

            // Makeup gain after music compressor
            this.musicMakeupGain = this.context.createGain();
            this.musicMakeupGain.gain.value = 0.7;
            this.musicMakeupGain.connect(this.masterGain);

            this.musicCompressor.connect(this.musicMakeupGain);

            this.musicGain = this.context.createGain();
            this.musicGain.connect(this.musicCompressor);
            this.musicGain.gain.value = this.volumes.music;

            // SFX compressor for consistent volume levels
            this.sfxCompressor = this.context.createDynamicsCompressor();
            this.sfxCompressor.threshold.value = -24;
            this.sfxCompressor.knee.value = 6;
            this.sfxCompressor.ratio.value = 4;
            this.sfxCompressor.attack.value = 0.003;
            this.sfxCompressor.release.value = 0.25;

            // Makeup gain after SFX compressor
            this.sfxMakeupGain = this.context.createGain();
            this.sfxMakeupGain.gain.value = 0.5;
            this.sfxMakeupGain.connect(this.masterGain);

            this.sfxCompressor.connect(this.sfxMakeupGain);

            this.sfxGain = this.context.createGain();
            this.sfxGain.connect(this.sfxCompressor);
            this.sfxGain.gain.value = this.volumes.sfx;

            this.ambienceGain = this.context.createGain();
            this.ambienceGain.connect(this.masterGain);
            this.ambienceGain.gain.value = this.volumes.ambience;

            // Speech compressor for consistent volume levels
            this.speechCompressor = this.context.createDynamicsCompressor();
            this.speechCompressor.threshold.value = -24;
            this.speechCompressor.knee.value = 6;
            this.speechCompressor.ratio.value = 6;
            this.speechCompressor.attack.value = 0.003;
            this.speechCompressor.release.value = 0.25;

            // Makeup gain after compressor to reduce overall level
            this.speechMakeupGain = this.context.createGain();
            this.speechMakeupGain.gain.value = 0.5;
            this.speechMakeupGain.connect(this.masterGain);

            this.speechCompressor.connect(this.speechMakeupGain);

            this.speechGain = this.context.createGain();
            this.speechGain.connect(this.speechCompressor);
            this.speechGain.gain.value = this.volumes.speech;

            this._isInitialized = true;

            // iOS Safari: Add touch/click listener to unlock audio on any subsequent interaction
            const unlockAudio = async () => {
                if (this.context?.state === 'suspended') {
                    await this.context.resume();
                }
            };
            document.addEventListener('touchstart', unlockAudio, { once: true });
            document.addEventListener('touchend', unlockAudio, { once: true });
            document.addEventListener('click', unlockAudio, { once: true });
        } catch {
            // Failed to initialize
        }
    }

    /**
     * Resume audio context (needed after tab loses focus in some browsers)
     */
    async resume(): Promise<void> {
        if (this.context?.state === 'suspended') {
            await this.context.resume();
        }
    }

    /**
     * Check if audio engine is initialized
     */
    isInitialized(): boolean {
        return this._isInitialized;
    }

    /**
     * Check if audio context is suspended (iOS Safari issue)
     */
    isSuspended(): boolean {
        // HTML5 fallback doesn't use AudioContext, so never suspended
        if (this.useHTML5Fallback) {
            return false;
        }
        return this.context?.state === 'suspended';
    }

    /**
     * Get current audio context state for debugging
     */
    getDebugState(): string {
        if (this.useHTML5Fallback) {
            return `initialized=${this._isInitialized}, mode=HTML5`;
        }
        return `initialized=${this._isInitialized}, context=${this.context?.state ?? 'null'}`;
    }

    // === PRELOADING ===

    /**
     * Preload a single sound
     */
    async preload(soundId: string): Promise<void> {
        const sound = SOUNDS[soundId];
        if (!sound) return;

        // On iOS with HTML5 fallback, preload into appropriate pools
        if (this.useHTML5Fallback) {
            if (sound.category === 'sfx') {
                if (!this.html5SFXPool.has(soundId)) {
                    await this.preloadHTML5SFX(soundId);
                }
                return;
            }
            if (sound.category === 'speech') {
                if (!this.html5SpeechPool.has(soundId)) {
                    await this.preloadHTML5Speech(soundId);
                }
                return;
            }
            if (sound.category === 'music') {
                if (!this.html5MusicPool.has(soundId)) {
                    await this.preloadHTML5Music(soundId);
                }
                return;
            }
            // Ambience - just skip for now, it's created on demand
            return;
        }

        if (this.buffers.has(soundId)) return; // Already loaded

        try {
            const response = await fetch(sound.src);
            const arrayBuffer = await response.arrayBuffer();

            if (!this.context) await this.init();

            // iOS Safari: decodeAudioData needs callback style on older versions
            const audioBuffer = await new Promise<AudioBuffer>((resolve, reject) => {
                this.context!.decodeAudioData(
                    arrayBuffer,
                    (buffer) => resolve(buffer),
                    (error) => reject(error)
                );
            });
            this.buffers.set(soundId, audioBuffer);
        } catch {
            // Failed to preload
        }
    }

    /**
     * Preload speech into HTML5 audio element for instant playback on iOS
     */
    private async preloadHTML5Speech(soundId: string): Promise<void> {
        const sound = SOUNDS[soundId];
        if (!sound) return;

        return new Promise((resolve) => {
            const audio = new Audio(sound.src);
            audio.preload = 'auto';

            audio.oncanplaythrough = () => {
                this.html5SpeechPool.set(soundId, audio);
                resolve();
            };
            audio.onerror = () => {
                resolve(); // Don't block on error
            };
            // Timeout fallback
            setTimeout(() => {
                this.html5SpeechPool.set(soundId, audio);
                resolve();
            }, 5000);

            audio.load();
        });
    }

    /**
     * Preload music into HTML5 audio element for instant playback on iOS
     */
    private async preloadHTML5Music(soundId: string): Promise<void> {
        const sound = SOUNDS[soundId];
        if (!sound) return;

        return new Promise((resolve) => {
            const audio = new Audio(sound.src);
            audio.preload = 'auto';
            audio.loop = sound.loop ?? true;

            audio.oncanplaythrough = () => {
                this.html5MusicPool.set(soundId, audio);
                resolve();
            };
            audio.onerror = () => {
                resolve(); // Don't block on error
            };
            // Timeout fallback
            setTimeout(() => {
                this.html5MusicPool.set(soundId, audio);
                resolve();
            }, 5000);

            audio.load();
        });
    }

    /**
     * Preload multiple sounds with progress callback
     */
    async preloadAll(
        soundIds: string[],
        onProgress?: (loaded: number, total: number) => void
    ): Promise<void> {
        let loaded = 0;
        const total = soundIds.length;

        for (const id of soundIds) {
            await this.preload(id);
            loaded++;
            onProgress?.(loaded, total);
        }
    }

    // === SFX PLAYBACK ===

    /**
     * Preload SFX into HTML5 audio pool for instant playback on iOS
     */
    private async preloadHTML5SFX(soundId: string, poolSize: number = 5): Promise<void> {
        const sound = SOUNDS[soundId];
        if (!sound) return;

        const pool: HTMLAudioElement[] = [];
        const loadPromises: Promise<void>[] = [];

        for (let i = 0; i < poolSize; i++) {
            const audio = new Audio(sound.src);
            audio.preload = 'auto';

            // Wait for the audio to be loaded enough to play
            const loadPromise = new Promise<void>((resolve) => {
                audio.oncanplaythrough = () => resolve();
                audio.onerror = () => resolve(); // Resolve anyway to not block
                // Timeout fallback in case events don't fire
                setTimeout(resolve, 3000);
            });

            loadPromises.push(loadPromise);
            audio.load(); // Force preload
            pool.push(audio);
        }

        this.html5SFXPool.set(soundId, pool);

        // Wait for at least the first audio element to load
        await Promise.race(loadPromises);
    }

    /**
     * Get an available audio element from the pool (or create new one)
     * Returns { audio, isPreloaded } to track if this was from pool or on-demand
     */
    private getHTML5SFXFromPool(soundId: string): { audio: HTMLAudioElement; isPreloaded: boolean } | null {
        const sound = SOUNDS[soundId];
        if (!sound) return null;

        const pool = this.html5SFXPool.get(soundId);
        if (pool && pool.length > 0) {
            // Find one that's not playing
            for (const audio of pool) {
                if (audio.paused || audio.ended) {
                    audio.currentTime = 0;
                    return { audio, isPreloaded: true };
                }
            }
            // All busy, create a new one and add to pool (still counts as "from pool")
            const audio = new Audio(sound.src);
            pool.push(audio);
            return { audio, isPreloaded: false }; // New element, will have latency
        }

        // No pool at all - create new audio element on demand (will have latency!)
        return { audio: new Audio(sound.src), isPreloaded: false };
    }

    /**
     * Play a sound effect using HTML5 Audio (iOS fallback)
     * Routes through Web Audio GainNode for volume control on iOS
     * Uses preloaded pool if available for instant playback
     */
    private playHTML5SFX(soundId: string, options: PlayOptions = {}): void {
        const sound = SOUNDS[soundId];
        if (!sound) return;

        try {
            const result = this.getHTML5SFXFromPool(soundId);
            if (!result) {
                console.log('[AudioEngine] playHTML5SFX: sound not found:', soundId);
                return;
            }

            const { audio, isPreloaded } = result;

            if (!isPreloaded) {
                console.log('[AudioEngine] playHTML5SFX: NOT PRELOADED, loading on demand (will have latency):', soundId);
            }

            audio.playbackRate = options.pitch ?? 1;

            const baseVolume = options.volume ?? sound.volume ?? 1;

            // Route through Web Audio for volume control (iOS ignores audio.volume)
            if (this.context && this.masterGain) {
                // Check if this audio element is already connected to Web Audio
                if (this.html5SFXConnected.has(audio)) {
                    // Already connected - just update the gain and play
                    const gainNode = this.html5SFXGains.get(audio);
                    if (gainNode) {
                        const volume = baseVolume * this.volumes.sfx;
                        gainNode.gain.value = Math.min(1, Math.max(0, volume));
                    }
                    audio.play().catch((e) => {
                        console.log('[AudioEngine] playHTML5SFX replay error:', soundId, e);
                    });
                } else {
                    // First time - create MediaElementSource and connect
                    try {
                        const source = this.context.createMediaElementSource(audio);
                        const gainNode = this.context.createGain();
                        const volume = baseVolume * this.volumes.sfx;
                        gainNode.gain.value = Math.min(1, Math.max(0, volume));

                        source.connect(gainNode);
                        gainNode.connect(this.masterGain);

                        // Track this element as connected
                        this.html5SFXConnected.add(audio);
                        this.html5SFXGains.set(audio, gainNode);

                        audio.play().catch((e) => {
                            console.log('[AudioEngine] playHTML5SFX play error:', soundId, e);
                        });
                    } catch (e) {
                        // Fallback if connection fails
                        console.warn('[AudioEngine] playHTML5SFX: Web Audio connection failed:', e);
                        const volume = baseVolume * this.volumes.sfx * this.volumes.master;
                        audio.volume = Math.min(1, Math.max(0, volume));
                        audio.play().catch((err) => {
                            console.log('[AudioEngine] playHTML5SFX fallback play error:', soundId, err);
                        });
                    }
                }
            } else {
                // No Web Audio context - use direct HTML5 (volume won't work on iOS)
                const volume = baseVolume * this.volumes.sfx * this.volumes.master;
                audio.volume = Math.min(1, Math.max(0, volume));
                audio.play().catch((e) => {
                    console.log('[AudioEngine] playHTML5SFX direct play error:', soundId, e);
                });
            }
        } catch (e) {
            console.log('[AudioEngine] playHTML5SFX exception:', soundId, e);
        }
    }

    /**
     * Play music using HTML5 Audio (iOS fallback)
     * Routes through Web Audio GainNode for volume control (iOS ignores HTMLAudioElement.volume)
     * Uses preloaded audio if available for instant start
     */
    private playHTML5Music(soundId: string, options: MusicOptions = {}): void {
        const sound = SOUNDS[soundId];
        if (!sound) {
            console.log('[AudioEngine] playHTML5Music: sound not found:', soundId);
            return;
        }

        // Skip if same music already playing
        if (this.html5MusicId === soundId && this.html5Music) {
            console.log('[AudioEngine] playHTML5Music: same music already playing:', soundId);
            return;
        }

        // Stop current music with fade
        if (this.html5Music) {
            this.stopHTML5Music(options.crossfade ?? 800);
        }

        console.log('[AudioEngine] playHTML5Music: starting', soundId, 'pool has:', this.html5MusicPool.has(soundId));

        try {
            // Check if we have preloaded audio available
            const preloadedAudio = this.html5MusicPool.get(soundId);
            let audio: HTMLAudioElement;

            // Use preloaded audio only if it has a valid src (not cleared)
            if (preloadedAudio && preloadedAudio.src && preloadedAudio.src.length > 0) {
                // Use preloaded audio - DON'T remove from pool, we'll need it again
                // Instead, just reset it for replay
                audio = preloadedAudio;
                console.log('[AudioEngine] playHTML5Music: using preloaded audio');
            } else {
                // Not preloaded or preloaded element was invalidated - create fresh
                console.log('[AudioEngine] playHTML5Music: creating fresh audio element (NOT preloaded):', soundId);
                audio = new Audio(sound.src);
            }

            audio.loop = sound.loop ?? true;
            audio.currentTime = 0;
            const baseVolume = sound.volume ?? 1;
            this.html5MusicBaseVolume = baseVolume;

            // Route through Web Audio for volume control (iOS ignores audio.volume)
            if (this.context && this.masterGain) {
                // Check if this audio element is already connected to Web Audio
                if (this.html5MusicConnected.has(audio)) {
                    // Already connected - reuse the existing nodes
                    const nodes = this.html5MusicGains.get(audio);
                    if (nodes) {
                        console.log('[AudioEngine] playHTML5Music: reusing existing Web Audio connection');
                        this.html5MusicSource = nodes.source;
                        this.html5MusicGain = nodes.gain;
                        nodes.gain.gain.value = 0; // Start at 0 for fade in

                        audio.play().then(() => {
                            // Fade in using GainNode
                            const fadeIn = options.fadeIn ?? options.crossfade ?? 800;
                            const steps = 20;
                            const stepTime = fadeIn / steps;
                            let step = 0;
                            const fadeInterval = setInterval(() => {
                                step++;
                                const targetVolume = this.html5MusicBaseVolume * this.volumes.music;
                                if (this.html5MusicGain) {
                                    this.html5MusicGain.gain.value = Math.min(1, Math.max(0, (step / steps) * targetVolume));
                                }
                                if (step >= steps) {
                                    clearInterval(fadeInterval);
                                }
                            }, stepTime);
                        }).catch((e) => {
                            console.log('[AudioEngine] playHTML5Music replay error:', soundId, e);
                        });
                    }
                } else {
                    // First time - create MediaElementSource and connect
                    try {
                        // Create MediaElementSource to route HTML5 Audio through Web Audio
                        const source = this.context.createMediaElementSource(audio);
                        const gainNode = this.context.createGain();
                        gainNode.gain.value = 0; // Start at 0 for fade in

                        source.connect(gainNode);
                        gainNode.connect(this.masterGain);

                        // Track this element as connected
                        this.html5MusicConnected.add(audio);
                        this.html5MusicGains.set(audio, { source, gain: gainNode });

                        this.html5MusicSource = source;
                        this.html5MusicGain = gainNode;

                        audio.play().then(() => {
                            // Fade in using GainNode
                            const fadeIn = options.fadeIn ?? options.crossfade ?? 800;
                            const steps = 20;
                            const stepTime = fadeIn / steps;
                            let step = 0;
                            const fadeInterval = setInterval(() => {
                                step++;
                                const targetVolume = this.html5MusicBaseVolume * this.volumes.music;
                                if (this.html5MusicGain) {
                                    this.html5MusicGain.gain.value = Math.min(1, Math.max(0, (step / steps) * targetVolume));
                                }
                                if (step >= steps) {
                                    clearInterval(fadeInterval);
                                }
                            }, stepTime);
                        }).catch((e) => {
                            console.log('[AudioEngine] playHTML5Music play error:', soundId, e);
                        });

                        console.log('[AudioEngine] playHTML5Music: routed through Web Audio GainNode');
                    } catch (e) {
                        console.warn('[AudioEngine] playHTML5Music: Web Audio routing failed, falling back to direct:', e);
                        // Fallback to direct HTML5 (volume won't work on iOS but at least sound plays)
                        this.playHTML5MusicDirect(audio, options, baseVolume);
                    }
                }
            } else {
                // No Web Audio context available, use direct playback
                this.playHTML5MusicDirect(audio, options, baseVolume);
            }

            this.html5Music = audio;
            this.html5MusicId = soundId;
        } catch {
            // Failed to play
        }
    }

    /**
     * Play HTML5 music directly without Web Audio routing (fallback when Web Audio unavailable)
     */
    private playHTML5MusicDirect(audio: HTMLAudioElement, options: MusicOptions, baseVolume: number): void {
        audio.volume = 0; // Start at 0 for fade in (won't work on iOS but doesn't hurt)

        audio.play().then(() => {
            // Fade in - use current user volume settings with HTML5 multiplier
            const fadeIn = options.fadeIn ?? options.crossfade ?? 800;
            const steps = 20;
            const stepTime = fadeIn / steps;
            let step = 0;
            const fadeInterval = setInterval(() => {
                step++;
                const targetVolume = baseVolume * this.volumes.music * this.volumes.master;
                audio.volume = Math.min(1, Math.max(0, (step / steps) * targetVolume));
                if (step >= steps) {
                    clearInterval(fadeInterval);
                }
            }, stepTime);
        }).catch((e) => {
            console.log('[AudioEngine] playHTML5MusicDirect play error:', e);
        });
    }

    /**
     * Stop HTML5 music with fade out
     */
    private stopHTML5Music(fadeOut = 500): void {
        if (!this.html5Music) return;

        const audio = this.html5Music;
        const gainNode = this.html5MusicGain;
        const source = this.html5MusicSource;

        // Fade out using GainNode if available (proper volume control on iOS)
        if (gainNode && this.context) {
            const startVolume = gainNode.gain.value;
            const steps = 20;
            const stepTime = fadeOut / steps;
            let step = 0;

            const fadeInterval = setInterval(() => {
                step++;
                gainNode.gain.value = Math.max(0, startVolume * (1 - step / steps));
                if (step >= steps) {
                    clearInterval(fadeInterval);
                    audio.pause();
                    // Disconnect source to allow reuse
                    try {
                        source?.disconnect();
                    } catch { /* ignore */ }
                }
            }, stepTime);
        } else {
            // Fallback to HTML5 volume fade (won't work on iOS)
            const startVolume = audio.volume;
            const steps = 20;
            const stepTime = fadeOut / steps;
            let step = 0;

            const fadeInterval = setInterval(() => {
                step++;
                audio.volume = Math.max(0, startVolume * (1 - step / steps));
                if (step >= steps) {
                    clearInterval(fadeInterval);
                    audio.pause();
                    audio.src = ''; // Release resource
                }
            }, stepTime);
        }

        this.html5Music = null;
        this.html5MusicId = null;
        this.html5MusicGain = null;
        this.html5MusicSource = null;
    }

    /**
     * Start ambience using HTML5 Audio (iOS fallback)
     * Routes through Web Audio GainNode for volume control
     */
    private startHTML5Ambience(soundId: string, fadeIn = 1000): void {
        const sound = SOUNDS[soundId];
        if (!sound) return;

        // Skip if already playing
        if (this.html5Ambience.has(soundId)) return;

        try {
            const audio = new Audio(sound.src);
            audio.loop = true;
            const baseVolume = sound.volume ?? 0.2;
            this.html5AmbienceBaseVolumes.set(soundId, baseVolume);

            // Route through Web Audio for volume control (iOS ignores audio.volume)
            if (this.context && this.masterGain) {
                try {
                    const source = this.context.createMediaElementSource(audio);
                    const gainNode = this.context.createGain();
                    gainNode.gain.value = 0; // Start at 0 for fade in

                    source.connect(gainNode);
                    gainNode.connect(this.masterGain);

                    audio.play().then(() => {
                        // Fade in using GainNode
                        const steps = 20;
                        const stepTime = fadeIn / steps;
                        let step = 0;
                        const fadeInterval = setInterval(() => {
                            step++;
                            const targetVolume = baseVolume * this.volumes.ambience;
                            gainNode.gain.value = Math.min(1, Math.max(0, (step / steps) * targetVolume));
                            if (step >= steps) {
                                clearInterval(fadeInterval);
                            }
                        }, stepTime);
                    }).catch(() => { /* ignore */ });

                    this.html5Ambience.set(soundId, { audio, source, gain: gainNode });
                    console.log('[AudioEngine] startHTML5Ambience: routed through Web Audio GainNode');
                } catch (e) {
                    console.warn('[AudioEngine] startHTML5Ambience: Web Audio routing failed:', e);
                    // Fallback - won't have volume control on iOS
                    audio.volume = 0;
                    audio.play().then(() => {
                        const steps = 20;
                        const stepTime = fadeIn / steps;
                        let step = 0;
                        const fadeInterval = setInterval(() => {
                            step++;
                            const targetVolume = baseVolume * this.volumes.ambience * this.volumes.master;
                            audio.volume = Math.min(1, Math.max(0, (step / steps) * targetVolume));
                            if (step >= steps) {
                                clearInterval(fadeInterval);
                            }
                        }, stepTime);
                    }).catch(() => { /* ignore */ });
                    this.html5Ambience.set(soundId, { audio, source: null as unknown as MediaElementAudioSourceNode, gain: null as unknown as GainNode });
                }
            } else {
                // No Web Audio context - use direct HTML5 (volume won't work on iOS)
                audio.volume = 0;
                audio.play().then(() => {
                    const steps = 20;
                    const stepTime = fadeIn / steps;
                    let step = 0;
                    const fadeInterval = setInterval(() => {
                        step++;
                        const targetVolume = baseVolume * this.volumes.ambience * this.volumes.master;
                        audio.volume = Math.min(1, Math.max(0, (step / steps) * targetVolume));
                        if (step >= steps) {
                            clearInterval(fadeInterval);
                        }
                    }, stepTime);
                }).catch(() => { /* ignore */ });
                this.html5Ambience.set(soundId, { audio, source: null as unknown as MediaElementAudioSourceNode, gain: null as unknown as GainNode });
            }
        } catch {
            // Failed to play
        }
    }

    /**
     * Stop HTML5 ambience with fade out
     */
    private stopHTML5Ambience(soundId: string, fadeOut = 1000): void {
        const entry = this.html5Ambience.get(soundId);
        if (!entry) return;

        const { audio, source, gain } = entry;

        // Fade out using GainNode if available
        if (gain && this.context) {
            const startVolume = gain.gain.value;
            const steps = 20;
            const stepTime = fadeOut / steps;
            let step = 0;

            const fadeInterval = setInterval(() => {
                step++;
                gain.gain.value = Math.max(0, startVolume * (1 - step / steps));
                if (step >= steps) {
                    clearInterval(fadeInterval);
                    audio.pause();
                    try {
                        source?.disconnect();
                    } catch { /* ignore */ }
                }
            }, stepTime);
        } else {
            // Fallback to HTML5 volume fade
            const startVolume = audio.volume;
            const steps = 20;
            const stepTime = fadeOut / steps;
            let step = 0;

            const fadeInterval = setInterval(() => {
                step++;
                audio.volume = Math.max(0, startVolume * (1 - step / steps));
                if (step >= steps) {
                    clearInterval(fadeInterval);
                    audio.pause();
                    audio.src = ''; // Release resource
                }
            }, stepTime);
        }

        this.html5Ambience.delete(soundId);
        this.html5AmbienceBaseVolumes.delete(soundId);
    }

    /**
     * Play speech using HTML5 Audio (iOS fallback)
     * Routes through Web Audio GainNode for volume control
     * Uses preloaded audio if available, otherwise loads on demand
     */
    private playHTML5Speech(soundId: string, options: PlayOptions = {}): Promise<void> {
        return new Promise((resolve) => {
            const sound = SOUNDS[soundId];
            if (!sound) {
                resolve();
                return;
            }

            // Stop any current speech
            if (this.html5Speech) {
                this.html5Speech.pause();
                this.html5Speech.currentTime = 0;
                // Disconnect old source if exists
                try {
                    this.html5SpeechSource?.disconnect();
                } catch { /* ignore */ }
                this.html5SpeechSource = null;
                this.html5SpeechGain = null;
            }

            try {
                // Use preloaded audio if available, otherwise create new
                let audio = this.html5SpeechPool.get(soundId);
                const isPreloaded = !!audio;

                if (!audio) {
                    // Not preloaded - create on demand (will have latency)
                    console.log('[AudioEngine] playHTML5Speech: not preloaded, loading on demand:', soundId);
                    audio = new Audio(sound.src);
                }

                audio.currentTime = 0;
                const baseVolume = options.volume ?? sound.volume ?? 0.8;

                // Route through Web Audio for volume control (iOS ignores audio.volume)
                if (this.context && this.masterGain) {
                    try {
                        const source = this.context.createMediaElementSource(audio);
                        const gainNode = this.context.createGain();
                        const volume = baseVolume * this.volumes.speech;
                        gainNode.gain.value = Math.min(1, Math.max(0, volume));

                        source.connect(gainNode);
                        gainNode.connect(this.masterGain);

                        this.html5SpeechSource = source;
                        this.html5SpeechGain = gainNode;

                        audio.onended = () => {
                            this.html5Speech = null;
                            this.html5SpeechSource = null;
                            this.html5SpeechGain = null;
                            options.onEnd?.();
                            resolve();
                        };

                        audio.onerror = () => {
                            this.html5Speech = null;
                            this.html5SpeechSource = null;
                            this.html5SpeechGain = null;
                            if (isPreloaded) {
                                this.html5SpeechPool.delete(soundId);
                            }
                            resolve();
                        };

                        audio.play().catch((e) => {
                            console.log('[AudioEngine] playHTML5Speech play error:', soundId, e);
                            resolve();
                        });

                        this.html5Speech = audio;
                        console.log('[AudioEngine] playHTML5Speech: routed through Web Audio GainNode');
                    } catch (e) {
                        console.warn('[AudioEngine] playHTML5Speech: Web Audio routing failed:', e);
                        // Fallback to direct HTML5
                        this.playHTML5SpeechDirect(audio, options, baseVolume, isPreloaded, soundId, resolve);
                    }
                } else {
                    // No Web Audio context - use direct HTML5 (volume won't work on iOS)
                    this.playHTML5SpeechDirect(audio, options, baseVolume, isPreloaded, soundId, resolve);
                }
            } catch {
                resolve();
            }
        });
    }

    /**
     * Play HTML5 speech directly without Web Audio routing (fallback)
     */
    private playHTML5SpeechDirect(
        audio: HTMLAudioElement,
        options: PlayOptions,
        baseVolume: number,
        isPreloaded: boolean,
        soundId: string,
        resolve: () => void
    ): void {
        const volume = baseVolume * this.volumes.speech * this.volumes.master;
        audio.volume = Math.min(1, Math.max(0, volume));

        audio.onended = () => {
            this.html5Speech = null;
            options.onEnd?.();
            resolve();
        };

        audio.onerror = () => {
            this.html5Speech = null;
            if (isPreloaded) {
                this.html5SpeechPool.delete(soundId);
            }
            resolve();
        };

        audio.play().catch((e) => {
            console.log('[AudioEngine] playHTML5SpeechDirect play error:', soundId, e);
            resolve();
        });

        this.html5Speech = audio;
    }

    /**
     * Play a sound effect (one-shot, can overlap)
     */
    playSFX(soundId: string, options: PlayOptions = {}): void {
        // iOS HTML5 fallback
        if (this.useHTML5Fallback) {
            this.playHTML5SFX(soundId, options);
            return;
        }

        if (!this.context || !this.sfxGain) return;

        // If context is suspended, wait for resume then retry
        if (this.context.state === 'suspended') {
            this.context.resume().then(() => {
                this.playSFX(soundId, options);
            });
            return;
        }

        const sound = SOUNDS[soundId];
        if (!sound) return;

        // Load on demand if not preloaded
        const buffer = this.buffers.get(soundId);
        if (!buffer) {
            this.preload(soundId).then(() => this.playSFX(soundId, options));
            return;
        }

        // Create source
        const source = this.context.createBufferSource();
        source.buffer = buffer;

        // Apply pitch variation
        let pitch = options.pitch ?? 1;
        if (sound.pitchVariation) {
            const variation = (Math.random() * 2 - 1) * sound.pitchVariation;
            pitch += variation;
        }
        source.playbackRate.value = pitch;

        // Create gain for this instance
        const gainNode = this.context.createGain();
        let volume = options.volume ?? sound.volume ?? 1;
        if (sound.volumeVariation) {
            const variation = (Math.random() * 2 - 1) * sound.volumeVariation;
            volume *= (1 + variation);
        }
        gainNode.gain.value = volume;

        // Connect: source -> gain -> sfxGain -> master
        source.connect(gainNode);
        gainNode.connect(this.sfxGain);

        // Handle fade in
        if (options.fadeIn) {
            gainNode.gain.value = 0;
            gainNode.gain.linearRampToValueAtTime(
                volume,
                this.context.currentTime + options.fadeIn / 1000
            );
        }

        // Callback when finished
        if (options.onEnd) {
            source.onended = options.onEnd;
        }

        source.start();
    }

    /**
     * Play a sound effect and return a stop function (for sounds that need to be cut short)
     */
    playSFXWithStop(soundId: string, options: PlayOptions = {}): (() => void) | null {
        // iOS HTML5 fallback - route through Web Audio for volume control
        if (this.useHTML5Fallback) {
            const sound = SOUNDS[soundId];
            if (!sound) return null;
            try {
                // Use pool if available, otherwise create new (same as playHTML5SFX)
                const result = this.getHTML5SFXFromPool(soundId);
                if (!result) {
                    console.log('[AudioEngine] playSFXWithStop: sound not found in pool:', soundId);
                    return null;
                }
                const { audio, isPreloaded } = result;
                if (!isPreloaded) {
                    console.log('[AudioEngine] playSFXWithStop: NOT PRELOADED, loading on demand:', soundId);
                }
                audio.currentTime = 0;
                const baseVolume = (options.volume ?? sound.volume ?? 1);

                // Route through Web Audio for volume control (iOS ignores audio.volume)
                if (this.context && this.masterGain) {
                    // Check if this audio element is already connected to Web Audio
                    if (this.html5SFXConnected.has(audio)) {
                        // Already connected - reuse the existing GainNode
                        const gainNode = this.html5SFXGains.get(audio);
                        if (gainNode) {
                            const volume = baseVolume * this.volumes.sfx;
                            gainNode.gain.value = Math.min(1, Math.max(0, volume));

                            audio.play().catch((e) => {
                                console.log('[AudioEngine] playSFXWithStop replay error:', soundId, e);
                            });

                            // Return stop function that uses GainNode for fade
                            return (fadeOut = 300) => {
                                const startVol = gainNode.gain.value;
                                const steps = 10;
                                const stepTime = fadeOut / steps;
                                let step = 0;
                                const interval = setInterval(() => {
                                    step++;
                                    gainNode.gain.value = Math.max(0, startVol * (1 - step / steps));
                                    if (step >= steps) {
                                        clearInterval(interval);
                                        audio.pause();
                                        audio.currentTime = 0;
                                    }
                                }, stepTime);
                            };
                        }
                    }

                    // First time - create MediaElementSource and connect
                    try {
                        const source = this.context.createMediaElementSource(audio);
                        const gainNode = this.context.createGain();
                        const volume = baseVolume * this.volumes.sfx;
                        gainNode.gain.value = Math.min(1, Math.max(0, volume));

                        source.connect(gainNode);
                        gainNode.connect(this.masterGain);

                        // Track this element as connected
                        this.html5SFXConnected.add(audio);
                        this.html5SFXGains.set(audio, gainNode);

                        audio.play().catch((e) => {
                            console.log('[AudioEngine] playSFXWithStop HTML5+WebAudio play error:', soundId, e);
                        });

                        // Return stop function that uses GainNode for fade
                        return (fadeOut = 300) => {
                            const startVol = gainNode.gain.value;
                            const steps = 10;
                            const stepTime = fadeOut / steps;
                            let step = 0;
                            const interval = setInterval(() => {
                                step++;
                                gainNode.gain.value = Math.max(0, startVol * (1 - step / steps));
                                if (step >= steps) {
                                    clearInterval(interval);
                                    audio.pause();
                                    audio.currentTime = 0;
                                }
                            }, stepTime);
                        };
                    } catch (e) {
                        console.warn('[AudioEngine] playSFXWithStop: Web Audio routing failed:', e);
                        // Fallback to direct HTML5 (volume won't work on iOS)
                    }
                }

                // Fallback: direct HTML5 (volume won't work on iOS but sound will play)
                const volume = baseVolume * this.volumes.sfx * this.volumes.master;
                audio.volume = Math.min(1, Math.max(0, volume));
                audio.play().catch(() => { /* ignore */ });
                return (fadeOut = 300) => {
                    const startVol = audio.volume;
                    const steps = 10;
                    const stepTime = fadeOut / steps;
                    let step = 0;
                    const interval = setInterval(() => {
                        step++;
                        audio.volume = Math.max(0, startVol * (1 - step / steps));
                        if (step >= steps) {
                            clearInterval(interval);
                            audio.pause();
                        }
                    }, stepTime);
                };
            } catch {
                return null;
            }
        }

        if (!this.context || !this.sfxGain) return null;

        const sound = SOUNDS[soundId];
        if (!sound) return null;

        const buffer = this.buffers.get(soundId);
        if (!buffer) {
            this.preload(soundId).then(() => this.playSFXWithStop(soundId, options));
            return null;
        }

        const source = this.context.createBufferSource();
        source.buffer = buffer;

        let pitch = options.pitch ?? 1;
        if (sound.pitchVariation) {
            const variation = (Math.random() * 2 - 1) * sound.pitchVariation;
            pitch += variation;
        }
        source.playbackRate.value = pitch;

        const gainNode = this.context.createGain();
        let volume = options.volume ?? sound.volume ?? 1;
        if (sound.volumeVariation) {
            const variation = (Math.random() * 2 - 1) * sound.volumeVariation;
            volume *= (1 + variation);
        }
        gainNode.gain.value = volume;

        source.connect(gainNode);
        gainNode.connect(this.sfxGain);

        if (options.fadeIn) {
            gainNode.gain.value = 0;
            gainNode.gain.linearRampToValueAtTime(
                volume,
                this.context.currentTime + options.fadeIn / 1000
            );
        }

        if (options.onEnd) {
            source.onended = options.onEnd;
        }

        source.start();

        // Return a stop function with fade out
        return (fadeOut = 300) => {
            if (!this.context) return;
            gainNode.gain.linearRampToValueAtTime(0, this.context.currentTime + fadeOut / 1000);
            setTimeout(() => {
                try {
                    source.stop();
                } catch {
                    // Already stopped
                }
            }, fadeOut);
        };
    }

    // === SPEECH PLAYBACK ===

    /**
     * Play boss defeat speech with HEAVY radio distortion effect
     * Used for defeated boss transmissions on result screen (simulates dying/breaking radio)
     * Returns a Promise that resolves when speech ends or is stopped
     */
    playHeavyRadioSpeech(soundId: string, options: PlayOptions = {}): Promise<void> {
        // iOS HTML5 fallback (no EQ effects, but still plays)
        if (this.useHTML5Fallback) {
            return this.playHTML5Speech(soundId, options);
        }

        return new Promise((resolve) => {
            if (!this.context || !this.speechGain) {
                resolve();
                return;
            }

            if (this.context.state === 'suspended') {
                this.context.resume().then(() => {
                    this.playHeavyRadioSpeech(soundId, options).then(resolve);
                });
                return;
            }

            const sound = SOUNDS[soundId];
            if (!sound) {
                resolve();
                return;
            }

            this.stopSpeech();

            const buffer = this.buffers.get(soundId);
            if (!buffer) {
                this.preload(soundId).then(() => {
                    this.playHeavyRadioSpeech(soundId, options).then(resolve);
                });
                return;
            }

            // Create source
            const source = this.context.createBufferSource();
            source.buffer = buffer;

            // Create gain for this speech
            const gainNode = this.context.createGain();
            const volume = options.volume ?? sound.volume ?? 0.8;
            gainNode.gain.value = volume;

            // === HEAVY RADIO/DISTORTED TRANSMISSION EQ CHAIN ===
            const highpass = this.context.createBiquadFilter();
            highpass.type = 'highpass';
            highpass.frequency.value = 550;
            highpass.Q.value = 1.0;

            const lowpass = this.context.createBiquadFilter();
            lowpass.type = 'lowpass';
            lowpass.frequency.value = 3200;
            lowpass.Q.value = 1.0;

            const resonance = this.context.createBiquadFilter();
            resonance.type = 'peaking';
            resonance.frequency.value = 1800;
            resonance.Q.value = 2.0;
            resonance.gain.value = 4;

            const delay = this.context.createDelay();
            delay.delayTime.value = 0.045;
            const feedback = this.context.createGain();
            feedback.gain.value = 0.3;
            const wetGain = this.context.createGain();
            wetGain.gain.value = 0.25;
            const dryGain = this.context.createGain();
            dryGain.gain.value = 0.8;

            source.connect(highpass);
            highpass.connect(lowpass);
            lowpass.connect(resonance);

            resonance.connect(dryGain);
            dryGain.connect(gainNode);

            resonance.connect(delay);
            delay.connect(feedback);
            feedback.connect(delay);
            delay.connect(wetGain);
            wetGain.connect(gainNode);

            gainNode.connect(this.speechGain);

            this.currentSpeechResolve = resolve;

            source.onended = () => {
                if (this.currentSpeech === source) {
                    this.currentSpeech = null;
                    this.currentSpeechGain = null;
                    this.currentSpeechResolve = null;
                }
                resolve();
            };

            if (options.onEnd) {
                const originalOnEnd = source.onended;
                source.onended = (event) => {
                    if (originalOnEnd) originalOnEnd.call(source, event);
                    options.onEnd?.();
                };
            }

            this.currentSpeech = source;
            this.currentSpeechGain = gainNode;

            source.start();
        });
    }

    /**
     * Play alien speech with EQ effects (boosted bass, radio-like transmission)
     * Returns a Promise that resolves when speech ends or is stopped
     */
    playAlienSpeech(soundId: string, options: PlayOptions = {}): Promise<void> {
        // iOS HTML5 fallback (no EQ effects, but still plays)
        if (this.useHTML5Fallback) {
            return this.playHTML5Speech(soundId, options);
        }

        return new Promise((resolve) => {
            if (!this.context || !this.speechGain) {
                resolve();
                return;
            }

            if (this.context.state === 'suspended') {
                this.context.resume().then(() => {
                    this.playAlienSpeech(soundId, options).then(resolve);
                });
                return;
            }

            const sound = SOUNDS[soundId];
            if (!sound) {
                resolve();
                return;
            }

            this.stopSpeech();

            const buffer = this.buffers.get(soundId);
            if (!buffer) {
                this.preload(soundId).then(() => {
                    this.playAlienSpeech(soundId, options).then(resolve);
                });
                return;
            }

            // Create source
            const source = this.context.createBufferSource();
            source.buffer = buffer;

            // Create gain for this speech
            const gainNode = this.context.createGain();
            const volume = options.volume ?? sound.volume ?? 0.8;
            gainNode.gain.value = volume;

            // === SUBTLE RADIO/TRANSMISSION EQ CHAIN ===
            const highpass = this.context.createBiquadFilter();
            highpass.type = 'highpass';
            highpass.frequency.value = 350;
            highpass.Q.value = 0.7;

            const lowpass = this.context.createBiquadFilter();
            lowpass.type = 'lowpass';
            lowpass.frequency.value = 4500;
            lowpass.Q.value = 0.7;

            const delay = this.context.createDelay();
            delay.delayTime.value = 0.03;
            const feedback = this.context.createGain();
            feedback.gain.value = 0.15;
            const wetGain = this.context.createGain();
            wetGain.gain.value = 0.12;
            const dryGain = this.context.createGain();
            dryGain.gain.value = 0.9;

            source.connect(highpass);
            highpass.connect(lowpass);

            lowpass.connect(dryGain);
            dryGain.connect(gainNode);

            lowpass.connect(delay);
            delay.connect(feedback);
            feedback.connect(delay);
            delay.connect(wetGain);
            wetGain.connect(gainNode);

            gainNode.connect(this.speechGain);

            this.currentSpeechResolve = resolve;

            source.onended = () => {
                if (this.currentSpeech === source) {
                    this.currentSpeech = null;
                    this.currentSpeechGain = null;
                    this.currentSpeechResolve = null;
                }
                resolve();
            };

            if (options.onEnd) {
                const originalOnEnd = source.onended;
                source.onended = (event) => {
                    if (originalOnEnd) originalOnEnd.call(source, event);
                    options.onEnd?.();
                };
            }

            this.currentSpeech = source;
            this.currentSpeechGain = gainNode;

            source.start();
        });
    }

    /**
     * Play speech audio (only one at a time, interruptible)
     * Returns a Promise that resolves when speech ends or is stopped
     */
    playSpeech(soundId: string, options: PlayOptions = {}): Promise<void> {
        // iOS HTML5 fallback
        if (this.useHTML5Fallback) {
            return this.playHTML5Speech(soundId, options);
        }

        return new Promise((resolve) => {
            if (!this.context || !this.speechGain) {
                resolve();
                return;
            }

            // If context is suspended, wait for resume then retry
            if (this.context.state === 'suspended') {
                this.context.resume().then(() => {
                    this.playSpeech(soundId, options).then(resolve);
                });
                return;
            }

            const sound = SOUNDS[soundId];
            if (!sound) {
                resolve();
                return;
            }

            // Stop any currently playing speech
            this.stopSpeech();

            const buffer = this.buffers.get(soundId);
            if (!buffer) {
                // Load on demand then play
                this.preload(soundId).then(() => {
                    this.playSpeech(soundId, options).then(resolve);
                });
                return;
            }

            // Create source
            const source = this.context.createBufferSource();
            source.buffer = buffer;

            // Create gain for this speech
            const gainNode = this.context.createGain();
            const volume = options.volume ?? sound.volume ?? 0.8;
            gainNode.gain.value = volume;

            // Connect: source -> gain -> speechGain -> master
            source.connect(gainNode);
            gainNode.connect(this.speechGain);

            // Store resolve function so stopSpeech can call it
            this.currentSpeechResolve = resolve;

            // Handle natural end of speech
            source.onended = () => {
                if (this.currentSpeech === source) {
                    this.currentSpeech = null;
                    this.currentSpeechGain = null;
                    this.currentSpeechResolve = null;
                }
                resolve();
            };

            // Callback when finished (if provided)
            if (options.onEnd) {
                const originalOnEnd = source.onended;
                source.onended = (event) => {
                    if (originalOnEnd) originalOnEnd.call(source, event);
                    options.onEnd?.();
                };
            }

            // Store references
            this.currentSpeech = source;
            this.currentSpeechGain = gainNode;

            source.start();
        });
    }

    /**
     * Stop currently playing speech with optional fade out
     */
    stopSpeech(fadeOut = 100): void {
        // iOS HTML5 fallback
        if (this.useHTML5Fallback) {
            if (this.html5Speech) {
                this.html5Speech.pause();
                // Disconnect Web Audio source if exists
                try {
                    this.html5SpeechSource?.disconnect();
                } catch { /* ignore */ }
                this.html5Speech = null;
                this.html5SpeechSource = null;
                this.html5SpeechGain = null;
            }
            return;
        }

        if (!this.context || !this.currentSpeech || !this.currentSpeechGain) {
            return;
        }

        const source = this.currentSpeech;
        const gain = this.currentSpeechGain;
        const resolveFunc = this.currentSpeechResolve;

        // Clear references immediately
        this.currentSpeech = null;
        this.currentSpeechGain = null;
        this.currentSpeechResolve = null;

        // Fade out and stop
        gain.gain.linearRampToValueAtTime(0, this.context.currentTime + fadeOut / 1000);
        setTimeout(() => {
            try {
                source.stop();
            } catch {
                // Already stopped
            }
            // Resolve the promise
            resolveFunc?.();
        }, fadeOut);
    }

    /**
     * Check if speech is currently playing
     */
    isSpeechPlaying(): boolean {
        if (this.useHTML5Fallback) {
            return this.html5Speech !== null && !this.html5Speech.paused;
        }
        return this.currentSpeech !== null;
    }

    // === MUSIC PLAYBACK ===

    /**
     * Play music (only one track at a time, with crossfade)
     */
    playMusic(soundId: string, options: MusicOptions = {}): void {
        // iOS HTML5 fallback
        if (this.useHTML5Fallback) {
            this.playHTML5Music(soundId, options);
            return;
        }

        if (!this.context || !this.musicGain) return;

        // If context is suspended, wait for resume then retry
        if (this.context.state === 'suspended') {
            this.context.resume().then(() => {
                this.playMusic(soundId, options);
            });
            return;
        }

        // Skip if same music already playing
        if (this.currentMusicId === soundId && this.currentMusic) {
            return;
        }

        const sound = SOUNDS[soundId];
        if (!sound || sound.category !== 'music') return;

        const buffer = this.buffers.get(soundId);
        if (!buffer) {
            this.preload(soundId).then(() => this.playMusic(soundId, options));
            return;
        }

        const crossfadeDuration = options.crossfade ?? 800;
        const fadeInDuration = options.fadeIn ?? crossfadeDuration;

        // Fade out current music if playing
        if (this.currentMusic && this.currentMusicGain) {
            this.fadeOutMusic(crossfadeDuration);
        }

        // Create new source
        const source = this.context.createBufferSource();
        source.buffer = buffer;
        source.loop = sound.loop ?? true;

        // Set loop points if defined
        if (sound.loopStart !== undefined) {
            source.loopStart = sound.loopStart;
        }
        if (sound.loopEnd !== undefined) {
            source.loopEnd = sound.loopEnd;
        }

        // Create gain for crossfading
        const gainNode = this.context.createGain();
        gainNode.gain.value = 0;
        gainNode.connect(this.musicGain);

        source.connect(gainNode);
        source.start();

        // Fade in
        gainNode.gain.linearRampToValueAtTime(
            sound.volume ?? 1,
            this.context.currentTime + fadeInDuration / 1000
        );

        // Store references
        this.currentMusic = source;
        this.currentMusicId = soundId;
        this.currentMusicGain = gainNode;
    }

    /**
     * Stop current music with fade out
     */
    stopMusic(fadeOut = 500): void {
        // iOS HTML5 fallback
        if (this.useHTML5Fallback) {
            this.stopHTML5Music(fadeOut);
            return;
        }

        this.fadeOutMusic(fadeOut);
        this.currentMusicId = null;
    }

    /**
     * Play a music transition with overlap (for musical blends like "rise into loop")
     * The new track starts immediately while the current track continues playing,
     * then the current track fades out after the overlap duration.
     */
    playMusicTransition(
        soundId: string,
        options: {
            overlapDuration?: number;
            fadeOutCurrent?: number;
            fadeInNew?: number;
            newTrackVolume?: number;
        } = {}
    ): void {
        // iOS HTML5 fallback - just use simple transition
        if (this.useHTML5Fallback) {
            this.playHTML5Music(soundId, { fadeIn: options.fadeInNew ?? 0, crossfade: options.fadeOutCurrent ?? 1000 });
            return;
        }

        if (!this.context || !this.musicGain) return;

        const {
            overlapDuration = 2000,
            fadeOutCurrent = 1000,
            fadeInNew = 0,
            newTrackVolume,
        } = options;

        const sound = SOUNDS[soundId];
        if (!sound || sound.category !== 'music') return;

        const buffer = this.buffers.get(soundId);
        if (!buffer) {
            this.preload(soundId).then(() => this.playMusicTransition(soundId, options));
            return;
        }

        // Store reference to old music for delayed fade out
        const oldMusic = this.currentMusic;
        const oldMusicGain = this.currentMusicGain;

        // Create new source
        const source = this.context.createBufferSource();
        source.buffer = buffer;
        source.loop = sound.loop ?? true;

        if (sound.loopStart !== undefined) {
            source.loopStart = sound.loopStart;
        }
        if (sound.loopEnd !== undefined) {
            source.loopEnd = sound.loopEnd;
        }

        // Create gain for the new track
        const gainNode = this.context.createGain();
        const targetVolume = newTrackVolume ?? sound.volume ?? 1;

        if (fadeInNew > 0) {
            gainNode.gain.value = 0;
            gainNode.gain.linearRampToValueAtTime(
                targetVolume,
                this.context.currentTime + fadeInNew / 1000
            );
        } else {
            gainNode.gain.value = targetVolume;
        }

        gainNode.connect(this.musicGain);
        source.connect(gainNode);
        source.start();

        // Update current music references immediately
        this.currentMusic = source;
        this.currentMusicId = soundId;
        this.currentMusicGain = gainNode;

        // Schedule fade out of old music after overlap duration
        if (oldMusic && oldMusicGain) {
            setTimeout(() => {
                if (!this.context) return;

                // Fade out old track
                oldMusicGain.gain.linearRampToValueAtTime(
                    0,
                    this.context.currentTime + fadeOutCurrent / 1000
                );

                // Stop old track after fade completes
                setTimeout(() => {
                    try {
                        oldMusic.stop();
                    } catch {
                        // Already stopped
                    }
                }, fadeOutCurrent);
            }, overlapDuration);
        }
    }

    private fadeOutMusic(duration: number): void {
        if (!this.context || !this.currentMusic || !this.currentMusicGain) return;

        const gain = this.currentMusicGain;
        const source = this.currentMusic;

        // Fade out
        gain.gain.linearRampToValueAtTime(0, this.context.currentTime + duration / 1000);

        // Stop after fade
        setTimeout(() => {
            try {
                source.stop();
            } catch {
                // Already stopped
            }
        }, duration);

        this.currentMusic = null;
        this.currentMusicGain = null;
    }

    // === AMBIENCE ===

    /**
     * Start an ambience layer (can have multiple)
     */
    startAmbience(soundId: string, fadeIn = 1000): void {
        // iOS HTML5 fallback
        if (this.useHTML5Fallback) {
            this.startHTML5Ambience(soundId, fadeIn);
            return;
        }

        if (!this.context || !this.ambienceGain) return;

        // If context is suspended, wait for resume then retry
        if (this.context.state === 'suspended') {
            this.context.resume().then(() => {
                this.startAmbience(soundId, fadeIn);
            });
            return;
        }

        // Skip if already playing
        if (this.ambienceLayers.has(soundId)) return;

        const sound = SOUNDS[soundId];
        if (!sound) return;

        const buffer = this.buffers.get(soundId);
        if (!buffer) {
            this.preload(soundId).then(() => this.startAmbience(soundId, fadeIn));
            return;
        }

        const source = this.context.createBufferSource();
        source.buffer = buffer;
        source.loop = true;

        // Low shelf filter to reduce bass (-4dB at 200Hz)
        const lowShelf = this.context.createBiquadFilter();
        lowShelf.type = 'lowshelf';
        lowShelf.frequency.value = 200;
        lowShelf.gain.value = -4;

        const gainNode = this.context.createGain();
        gainNode.gain.value = 0;
        gainNode.connect(this.ambienceGain);

        // Chain: source -> lowShelf -> gain -> ambienceGain
        source.connect(lowShelf);
        lowShelf.connect(gainNode);
        source.start();

        // Fade in
        gainNode.gain.linearRampToValueAtTime(
            sound.volume ?? 0.2,
            this.context.currentTime + fadeIn / 1000
        );

        this.ambienceLayers.set(soundId, { source, gain: gainNode });
    }

    /**
     * Stop an ambience layer
     */
    stopAmbience(soundId: string, fadeOut = 1000): void {
        // iOS HTML5 fallback
        if (this.useHTML5Fallback) {
            this.stopHTML5Ambience(soundId, fadeOut);
            return;
        }

        const layer = this.ambienceLayers.get(soundId);
        if (!layer || !this.context) return;

        const { source, gain } = layer;

        // Fade out
        gain.gain.linearRampToValueAtTime(0, this.context.currentTime + fadeOut / 1000);

        // Stop after fade
        setTimeout(() => {
            try {
                source.stop();
            } catch {
                // Already stopped
            }
            this.ambienceLayers.delete(soundId);
        }, fadeOut);
    }

    /**
     * Stop all ambience layers
     */
    stopAllAmbience(fadeOut = 1000): void {
        // iOS HTML5 fallback
        if (this.useHTML5Fallback) {
            for (const soundId of this.html5Ambience.keys()) {
                this.stopHTML5Ambience(soundId, fadeOut);
            }
            return;
        }

        for (const soundId of this.ambienceLayers.keys()) {
            this.stopAmbience(soundId, fadeOut);
        }
    }

    // === VOLUME CONTROL ===

    setMasterVolume(value: number): void {
        this.volumes.master = Math.max(0, Math.min(1, value));
        if (this.masterGain) {
            this.masterGain.gain.value = this.volumes.master;
        }
        // Update HTML5 audio elements on iOS
        this.updateHTML5Volumes();
        this.saveSettings();
    }

    setMusicVolume(value: number): void {
        this.volumes.music = Math.max(0, Math.min(1, value));
        if (this.musicGain) {
            this.musicGain.gain.value = this.volumes.music;
        }
        // Update HTML5 music volume on iOS via GainNode (audio.volume is read-only on iOS)
        if (this.html5MusicGain) {
            const volume = this.html5MusicBaseVolume * this.volumes.music;
            this.html5MusicGain.gain.value = Math.min(1, Math.max(0, volume));
            console.log('[AudioEngine] setMusicVolume iOS GainNode:', { value, baseVol: this.html5MusicBaseVolume, finalVol: volume });
        } else if (this.html5Music) {
            // Fallback: try setting audio.volume (won't work on iOS but works on other browsers)
            const volume = this.html5MusicBaseVolume * this.volumes.music * this.volumes.master;
            this.html5Music.volume = Math.min(1, Math.max(0, volume));
            console.log('[AudioEngine] setMusicVolume HTML5 fallback:', { value, finalVol: volume });
        }
        this.saveSettings();
    }

    setSFXVolume(value: number): void {
        this.volumes.sfx = Math.max(0, Math.min(1, value));
        if (this.sfxGain) {
            this.sfxGain.gain.value = this.volumes.sfx;
        }
        // SFX are short-lived, volume will apply to next play
        this.saveSettings();
    }

    setAmbienceVolume(value: number): void {
        this.volumes.ambience = Math.max(0, Math.min(1, value));
        if (this.ambienceGain) {
            this.ambienceGain.gain.value = this.volumes.ambience;
        }
        // Update HTML5 ambience volumes on iOS via GainNodes
        for (const [soundId, entry] of this.html5Ambience.entries()) {
            const baseVolume = this.html5AmbienceBaseVolumes.get(soundId) ?? 0.2;
            if (entry.gain) {
                // Use GainNode for iOS
                const volume = baseVolume * this.volumes.ambience;
                entry.gain.gain.value = Math.min(1, Math.max(0, volume));
            } else {
                // Fallback to audio.volume (won't work on iOS)
                const volume = baseVolume * this.volumes.ambience * this.volumes.master;
                entry.audio.volume = Math.min(1, Math.max(0, volume));
            }
        }
        this.saveSettings();
    }

    setSpeechVolume(value: number): void {
        this.volumes.speech = Math.max(0, Math.min(1, value));
        if (this.speechGain) {
            this.speechGain.gain.value = this.volumes.speech;
        }
        // Update HTML5 speech volume on iOS via GainNode
        if (this.html5SpeechGain) {
            // Use GainNode for iOS
            this.html5SpeechGain.gain.value = Math.min(1, Math.max(0, this.volumes.speech));
            console.log('[AudioEngine] setSpeechVolume iOS GainNode:', { value, finalVol: this.volumes.speech });
        } else if (this.html5Speech) {
            // Fallback to audio.volume (won't work on iOS)
            this.html5Speech.volume = this.volumes.speech * this.volumes.master;
        }
        this.saveSettings();
    }

    /**
     * Update all HTML5 audio element volumes (called when master volume changes)
     * Uses GainNodes on iOS (since audio.volume is read-only on iOS)
     */
    private updateHTML5Volumes(): void {
        // Master volume is applied via masterGain on iOS (all audio routed through it)
        // Individual category volumes are applied via their respective GainNodes
        // So we don't need to update individual elements when master changes -
        // the masterGain handles it automatically
        console.log('[AudioEngine] updateHTML5Volumes: master volume applied via masterGain');
    }

    getVolumes(): CategoryVolumes {
        return { ...this.volumes };
    }

    // === UTILITY ===

    /**
     * Stop all audio
     */
    stopAll(): void {
        this.stopMusic(0);
        this.stopAllAmbience(0);
        // SFX will finish naturally
    }

    /**
     * Get current state
     */
    getState() {
        return {
            isInitialized: this._isInitialized,
            currentMusic: this.currentMusicId,
            ambienceLayers: Array.from(this.ambienceLayers.keys()),
            volumes: this.getVolumes(),
        };
    }

    // === PERSISTENCE ===

    private loadSettings(): void {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                this.volumes = { ...this.volumes, ...parsed };
            }
        } catch {
            // Ignore
        }
    }

    private saveSettings(): void {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.volumes));
        } catch {
            // Ignore
        }
    }
}

// Export singleton instance
export const audioEngine = new AudioEngine();

// Export for direct access if needed
export { AudioEngine };
