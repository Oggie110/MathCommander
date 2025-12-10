import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { PixelButton } from '@/components/ui/PixelButton';
import { CRTDialogueBox } from '@/components/ui/CRTDialogueBox';
import { SpaceBackground } from '@/components/game';
import { openingNarrative } from '@/data/narrative';
import { audioEngine } from '@/audio';
import { Rocket, Radio } from 'lucide-react';

type Stage = 'title' | 'ready' | 'briefing' | 'cinematic';
// Flow: title -> ready (BRIEFING button) -> briefing -> cinematic
// Audio init + preload + start happens on BRIEFING tap for iOS compatibility

const StartScreen: React.FC = () => {
    const navigate = useNavigate();
    const [stage, setStage] = useState<Stage>('title');
    const [isLoading, setIsLoading] = useState(false);
    const [loadingStatus, setLoadingStatus] = useState('');
    const [displayedText, setDisplayedText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const typeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    // On mount: stop music if returning to start screen
    // NOTE: Don't start ambience here - it's already running from START MISSION tap
    useEffect(() => {
        if (audioEngine.isInitialized()) {
            // Stop any music that might be playing (e.g., returning from map)
            audioEngine.stopMusic();
        }
    }, []);

    // Typewriter effect for briefing - runs once when stage becomes 'briefing'
    const hasStartedTyping = useRef(false);

    useEffect(() => {
        if (stage === 'briefing' && !hasStartedTyping.current) {
            hasStartedTyping.current = true;
            setIsTyping(true);
            let index = 0;
            const text = openingNarrative.message;

            typeIntervalRef.current = setInterval(() => {
                if (index < text.length) {
                    setDisplayedText(text.slice(0, index + 1));
                    index++;
                } else {
                    if (typeIntervalRef.current) {
                        clearInterval(typeIntervalRef.current);
                        typeIntervalRef.current = null;
                    }
                    setIsTyping(false);
                    // Stop intro data sound with 1s fade when typing finishes
                    if (stopIntroDataRef.current) {
                        stopIntroDataRef.current(1000);
                        stopIntroDataRef.current = null;
                    }
                }
            }, 30);
        }

        return () => {
            if (typeIntervalRef.current) {
                clearInterval(typeIntervalRef.current);
                typeIntervalRef.current = null;
            }
        };
    }, [stage]);

    const handleSkipTyping = () => {
        if (isTyping) {
            // Clear the typing interval
            if (typeIntervalRef.current) {
                clearInterval(typeIntervalRef.current);
                typeIntervalRef.current = null;
            }
            setDisplayedText(openingNarrative.message);
            setIsTyping(false);
            // Stop intro data sound when skipping (same as when typing finishes)
            if (stopIntroDataRef.current) {
                stopIntroDataRef.current(500); // 0.5s fade
                stopIntroDataRef.current = null;
            }
        }
    };

    const handleStartMission = async () => {
        setIsLoading(true);
        setLoadingStatus('Initializing audio...');

        // Initialize and preload audio on first tap (iOS needs user gesture)
        try {
            await audioEngine.init();
            audioEngine.playUnlockTone();

            // Preload essential sounds
            await audioEngine.preloadAll([
                'menuAmbience',
                'spaceAmbience',
                'introData',
                'menuMusic',
                // Button clicks (3 copies for iOS overlapping)
                'buttonClick1',
                'buttonClick2',
                'buttonClick3',
                'battleMusicPhase1',
                'battleMusicPhase2',
                'battleMusicPhase3',
                // Laser shots (3 copies for iOS overlapping)
                'laser1',
                'laser2',
                'laser3',
                'explosion',
                'doors',
                'transition',
                'starEarned',
                'shipSlide1',
                'shipSlide2',
                'shipSlide3',
                'shipSlide4',
                // Result screen sounds
                'resultStarPop1',
                'resultStarPop2',
                'resultStarPop3',
                'resultPercentage',
                'resultCorrectCount',
                'resultXP',
            ], (_loaded, _total, currentId) => {
                if (currentId) {
                    setLoadingStatus(`Loading ${currentId}...`);
                }
            });
        } catch (e) {
            console.error('[StartScreen] Audio init failed:', e);
        }

        setLoadingStatus('');
        setIsLoading(false);
        setStage('ready');
    };

    // Store stop function for intro data sound
    const stopIntroDataRef = useRef<((fadeOut?: number) => void) | null>(null);

    const handleBriefing = () => {
        // Start ambience and intro data sound on briefing screen
        audioEngine.startAmbience('menuAmbience');
        // Play intro data - it will play until user clicks BEGIN MISSION
        const stopFn = audioEngine.playSFXWithStop('introData');
        if (stopFn) {
            stopIntroDataRef.current = stopFn as (fadeOut?: number) => void;
        }
        setStage('briefing');
    };

    const handleContinue = () => {
        // Stop intro data with fade when going to cinematic
        if (stopIntroDataRef.current) {
            stopIntroDataRef.current(1000); // 1 second fade out
            stopIntroDataRef.current = null;
        }
        setStage('cinematic');
    };

    const handleSkipCinematic = () => {
        // Navigate FIRST for instant response
        navigate('/map', { state: { fromCinematic: true } });
    };

    // Track if video has ended (for iOS - need user gesture to start music)
    const [videoEnded, setVideoEnded] = useState(false);

    // Handle video and voiceover for cinematic
    useEffect(() => {
        if (stage === 'cinematic' && videoRef.current) {
            const video = videoRef.current;

            video.play().catch(() => {
                // If autoplay fails, show "tap to continue" immediately
                setVideoEnded(true);
            });

            const handleEnded = () => {
                // Don't auto-navigate - show "tap to continue" for iOS audio gesture
                setVideoEnded(true);
            };
            video.addEventListener('ended', handleEnded);

            return () => {
                video.removeEventListener('ended', handleEnded);
            };
        }
    }, [stage]);

    return (
        <div className="flex-1 flex flex-col items-center justify-center p-4 text-center relative">
            {stage !== 'cinematic' && <SpaceBackground />}

            {(stage === 'title' || stage === 'ready') && (
                // Title Screen / Ready Screen
                <div className="relative z-10">
                    <div className="mb-12">
                        <h1 className="text-4xl md:text-6xl text-brand-accent mb-4 drop-shadow-[4px_4px_0_rgba(255,42,42,1)]">
                            SPACE MA<span style={{ marginLeft: '-0.3em' }}>TH</span>
                        </h1>
                        <h2 className="text-2xl md:text-4xl text-white drop-shadow-[4px_4px_0_rgba(37,99,235,1)]">
                            COMMANDER
                        </h2>
                    </div>

                    <div className="space-y-6">
                        {stage === 'title' ? (
                            <button
                                onClick={handleStartMission}
                                disabled={isLoading}
                                className={`
                                    text-xl px-12 py-6 ${isLoading ? '' : 'animate-pulse'}
                                    bg-gradient-to-b from-blue-500 to-blue-700
                                    border-4 border-blue-400
                                    text-white font-bold
                                    shadow-[0_4px_0_0_#1e40af,0_6px_0_0_#1e3a8a]
                                    hover:from-blue-400 hover:to-blue-600
                                    active:translate-y-1 active:shadow-[0_2px_0_0_#1e40af]
                                    transition-all
                                    font-pixel uppercase tracking-wider
                                    disabled:opacity-70 disabled:cursor-not-allowed
                                `}
                            >
                                <div className="flex items-center gap-4">
                                    <Rocket className={`w-8 h-8 ${isLoading ? 'animate-spin' : ''}`} />
                                    {isLoading ? 'LOADING...' : 'START MISSION'}
                                </div>
                            </button>
                        ) : (
                            <button
                                onClick={handleBriefing}
                                className={`
                                    text-xl px-12 py-6 animate-pulse
                                    bg-gradient-to-b from-green-500 to-green-700
                                    border-4 border-green-400
                                    text-white font-bold
                                    shadow-[0_4px_0_0_#166534,0_6px_0_0_#14532d]
                                    hover:from-green-400 hover:to-green-600
                                    active:translate-y-1 active:shadow-[0_2px_0_0_#166534]
                                    transition-all
                                    font-pixel uppercase tracking-wider
                                `}
                            >
                                <div className="flex items-center gap-4">
                                    <Radio className="w-8 h-8" />
                                    BRIEFING
                                </div>
                            </button>
                        )}

                        {loadingStatus && (
                            <div className="text-brand-secondary text-[8px] mt-4 font-pixel tracking-wider animate-pulse">
                                {loadingStatus}
                            </div>
                        )}

                        <div className="text-industrial-highlight text-xs mt-8 font-pixel tracking-widest">
                            v0.5.9 - INDUSTRIAL BETA
                        </div>
                    </div>
                </div>
            )}

            {stage === 'briefing' && (
                // Mission Briefing - CRT Monitor Style
                <div className="relative z-10 w-full max-w-2xl" onClick={handleSkipTyping}>
                    <CRTDialogueBox variant="green">
                        {/* Transmission header */}
                        <div className="flex items-center gap-3 mb-6 border-b border-green-900/50 pb-4">
                            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_#22c55e]" />
                            <Radio className="w-5 h-5 text-green-500 drop-shadow-[0_0_6px_rgba(34,197,94,0.8)]" />
                            <span className="text-green-500 text-sm font-bold tracking-widest uppercase font-pixel drop-shadow-[0_0_8px_rgba(34,197,94,0.8)]">
                                {openingNarrative.title}
                            </span>
                        </div>

                        {/* Speaker */}
                        <div className="text-green-500 text-xs font-bold mb-3 tracking-wider uppercase font-pixel drop-shadow-[0_0_8px_rgba(34,197,94,0.8)]">
                            [{openingNarrative.speaker}]
                        </div>

                        {/* Message with typewriter effect */}
                        <div className="text-green-400 text-left leading-relaxed mb-8 min-h-[120px] font-pixel text-[10px] md:text-xs drop-shadow-[0_0_6px_rgba(74,222,128,0.6)]">
                            "{displayedText}"
                            {isTyping && <span className="animate-pulse text-green-300">▊</span>}
                        </div>

                        {/* Continue button */}
                        {!isTyping && (
                            <PixelButton
                                onClick={handleContinue}
                                className="w-full"
                                size="lg"
                            >
                                <div className="flex items-center justify-center gap-3">
                                    <Rocket className="w-5 h-5" />
                                    BEGIN MISSION
                                </div>
                            </PixelButton>
                        )}

                        {isTyping && (
                            <div className="text-green-600/60 text-xs text-center font-pixel animate-pulse">
                                Click to skip transmission...
                            </div>
                        )}
                    </CRTDialogueBox>
                </div>
            )}

            {stage === 'cinematic' && (
                // Cinematic Video
                <div
                    className="fixed inset-0 z-50 bg-black flex items-center justify-center cursor-pointer"
                    onClick={handleSkipCinematic}
                >
                    <video
                        ref={videoRef}
                        src="/assets/video/intro-cinematic.mp4"
                        className="w-full h-full object-contain pointer-events-none"
                        playsInline
                        muted={false}
                    />
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/50 text-sm font-pixel animate-pulse">
                        {videoEnded ? 'Tap to continue' : 'Click anywhere to skip'}
                    </div>
                </div>
            )}

        </div>
    );
};

export default StartScreen;
