// Web Audio API based Audio Engine
import type { PlayOptions, MusicOptions, CategoryVolumes } from './types';
import { SOUNDS } from './sounds';

const STORAGE_KEY = 'space-math-audio-settings';

class AudioEngine {
    private context: AudioContext | null = null;
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
    }

    // === INITIALIZATION ===

    /**
     * Initialize the audio context (must be called after user interaction)
     * iOS Safari requires this to be called during a user gesture (touchend/click)
     */
    async init(): Promise<void> {
        if (this._isInitialized) return;

        console.log('[AudioEngine] init called - using pure Web Audio');

        try {
            // Use webkitAudioContext for older iOS Safari
            const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
            this.context = new AudioContextClass();

            console.log('[AudioEngine] AudioContext created, initial state:', this.context.state);

            // iOS Safari requires explicit resume after user interaction
            if (this.context.state === 'suspended') {
                console.log('[AudioEngine] Context suspended, attempting resume...');
                await this.context.resume();
                console.log('[AudioEngine] After resume, state:', this.context.state);
            }

            console.log('[AudioEngine] Context ready, state:', this.context.state);

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
            console.log('[AudioEngine] Initialization complete, isInitialized:', this._isInitialized);

            // iOS Safari: Add touch/click listener to unlock audio on any subsequent interaction
            // These listeners help if the context gets suspended again (e.g., after tab switch)
            const unlockAudio = async () => {
                if (this.context?.state === 'suspended') {
                    console.log('[AudioEngine] unlockAudio triggered, resuming...');
                    await this.context.resume();

                    // Play silent buffer again to ensure unlock
                    const buffer = this.context.createBuffer(1, 1, 22050);
                    const source = this.context.createBufferSource();
                    source.buffer = buffer;
                    source.connect(this.context.destination);
                    source.start(0);

                    console.log('[AudioEngine] unlockAudio complete, state:', this.context.state);
                }
            };

            // Use multiple event types for better iOS coverage
            document.addEventListener('touchstart', unlockAudio);
            document.addEventListener('touchend', unlockAudio);
            document.addEventListener('click', unlockAudio);
        } catch (e) {
            console.error('[AudioEngine] init failed:', e);
        }
    }

    /**
     * Resume audio context (needed after tab loses focus or iOS suspensions)
     * Should be called during user gestures on iOS
     */
    async resume(): Promise<void> {
        if (!this.context) return;

        console.log('[AudioEngine] resume called, current state:', this.context.state);

        if (this.context.state === 'suspended') {
            await this.context.resume();
            console.log('[AudioEngine] After resume(), state:', this.context.state);

            // Play silent buffer to ensure iOS is fully unlocked
            const buffer = this.context.createBuffer(1, 1, 22050);
            const source = this.context.createBufferSource();
            source.buffer = buffer;
            source.connect(this.context.destination);
            source.start(0);
            console.log('[AudioEngine] Silent buffer played during resume');
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
        return this.context?.state === 'suspended';
    }

    /**
     * Get current audio context state for debugging
     */
    getDebugState(): string {
        return `initialized=${this._isInitialized}, context=${this.context?.state ?? 'null'}`;
    }

    /**
     * Play a nearly-silent oscillator tone to "unlock" iOS audio
     * Must be called immediately after init() in a user gesture handler
     */
    playUnlockTone(): void {
        if (!this.context) {
            console.warn('[AudioEngine] playUnlockTone: no context');
            return;
        }

        console.log('[AudioEngine] Playing unlock oscillator tone');
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        gain.gain.value = 0.0001; // Nearly silent
        osc.connect(gain);
        gain.connect(this.context.destination);
        osc.start();
        osc.stop(this.context.currentTime + 0.05);
    }

    /**
     * Force reinitialize the audio engine by destroying and recreating the AudioContext.
     * This is needed for iOS Safari after video playback corrupts the context.
     */
    async forceReinit(): Promise<void> {
        console.log('[AudioEngine] Force reinitializing (destroying old context)...');

        // Stop all current audio
        this.stopMusic();
        this.stopAllAmbience();

        // Stop any playing speech
        if (this.currentSpeech) {
            try { this.currentSpeech.stop(); } catch {}
            this.currentSpeech = null;
        }

        // Close old context
        if (this.context) {
            try { await this.context.close(); } catch {}
            this.context = null;
        }

        // Clear gain nodes (they're invalid after context close)
        this.masterGain = null;
        this.musicGain = null;
        this.sfxGain = null;
        this.ambienceGain = null;
        this.speechGain = null;
        this.speechCompressor = null;
        this.speechMakeupGain = null;
        this.sfxCompressor = null;
        this.sfxMakeupGain = null;
        this.musicCompressor = null;
        this.musicMakeupGain = null;

        // Clear all buffers (invalid after context close)
        this.buffers.clear();
        this._isInitialized = false;

        console.log('[AudioEngine] Old context destroyed, reinitializing fresh...');

        // Reinitialize with fresh context
        await this.init();

        console.log('[AudioEngine] Force reinit complete, new state:', this.getDebugState());
    }

    // === PRELOADING ===

    /**
     * Preload a single sound
     */
    async preload(soundId: string): Promise<void> {
        const sound = SOUNDS[soundId];
        if (!sound) return;

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
     * Play a sound effect (one-shot, can overlap)
     */
    playSFX(soundId: string, options: PlayOptions = {}): void {
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
        return this.currentSpeech !== null;
    }

    // === MUSIC PLAYBACK ===

    /**
     * Play music (only one track at a time, with crossfade)
     */
    playMusic(soundId: string, options: MusicOptions = {}): void {
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
     * IMPORTANT: Caller must ensure init() and preloadAll() are called first!
     * This function is synchronous to preserve iOS gesture context.
     */
    startAmbience(soundId: string, fadeIn = 1000): void {
        if (!this.context || !this.ambienceGain) {
            console.error('[AudioEngine] startAmbience: not initialized');
            return;
        }

        // Fail fast if context suspended - caller should have initialized properly
        if (this.context.state === 'suspended') {
            console.error('[AudioEngine] startAmbience: context suspended, call init() first');
            return;
        }

        // Skip if already playing
        if (this.ambienceLayers.has(soundId)) return;

        const sound = SOUNDS[soundId];
        if (!sound) {
            console.error('[AudioEngine] startAmbience: unknown sound', soundId);
            return;
        }

        const buffer = this.buffers.get(soundId);
        if (!buffer) {
            console.error('[AudioEngine] startAmbience: buffer not loaded, preload first', soundId);
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
        this.saveSettings();
    }

    setMusicVolume(value: number): void {
        this.volumes.music = Math.max(0, Math.min(1, value));
        if (this.musicGain) {
            this.musicGain.gain.value = this.volumes.music;
        }
        this.saveSettings();
    }

    setSFXVolume(value: number): void {
        this.volumes.sfx = Math.max(0, Math.min(1, value));
        if (this.sfxGain) {
            this.sfxGain.gain.value = this.volumes.sfx;
        }
        this.saveSettings();
    }

    setAmbienceVolume(value: number): void {
        this.volumes.ambience = Math.max(0, Math.min(1, value));
        if (this.ambienceGain) {
            this.ambienceGain.gain.value = this.volumes.ambience;
        }
        this.saveSettings();
    }

    setSpeechVolume(value: number): void {
        this.volumes.speech = Math.max(0, Math.min(1, value));
        if (this.speechGain) {
            this.speechGain.gain.value = this.volumes.speech;
        }
        this.saveSettings();
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
