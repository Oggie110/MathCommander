import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { PixelButton } from '@/components/ui/PixelButton';
import { PixelCard } from '@/components/ui/PixelCard';
import { openingNarrative } from '@/data/narrative';
import { audioEngine } from '@/audio';
import { Rocket, Radio } from 'lucide-react';

type StopFn = ((fadeOut?: number) => void) | null;

const StartScreen: React.FC = () => {
    const navigate = useNavigate();
    const [showBriefing, setShowBriefing] = useState(false);
    const [displayedText, setDisplayedText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isAudioLoading, setIsAudioLoading] = useState(false);
    // const [audioReady, setAudioReady] = useState(false); // Unused
    const stopIntroDataRef = useRef<StopFn>(null);
    const typeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Start ambience on mount if audio is already initialized (e.g., returning to start screen)
    useEffect(() => {
        if (audioEngine.isInitialized()) {
            audioEngine.startAmbience('menuAmbience');
            // Stop any music that might be playing
            audioEngine.stopMusic();
        }
    }, []);

    // Typewriter effect for briefing
    useEffect(() => {
        if (showBriefing && !isTyping) {
            setIsTyping(true);
            setDisplayedText('');
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
                    // Stop intro data sound when typing finishes
                    if (stopIntroDataRef.current) {
                        stopIntroDataRef.current(500);
                        stopIntroDataRef.current = null;
                    }
                }
            }, 30);

            return () => {
                if (typeIntervalRef.current) {
                    clearInterval(typeIntervalRef.current);
                    typeIntervalRef.current = null;
                }
            };
        }
    }, [showBriefing]);

    const handleSkipTyping = () => {
        if (isTyping) {
            // Clear the typing interval
            if (typeIntervalRef.current) {
                clearInterval(typeIntervalRef.current);
                typeIntervalRef.current = null;
            }
            setDisplayedText(openingNarrative.message);
            setIsTyping(false);
            // Stop intro data sound when skipping
            if (stopIntroDataRef.current) {
                stopIntroDataRef.current(300);
                stopIntroDataRef.current = null;
            }
        }
    };

    const handleStartMission = async () => {
        if (isAudioLoading) return;

        setIsAudioLoading(true);

        // Initialize audio engine (requires user interaction)
        await audioEngine.init();

        // Preload essential sounds for the start screen and beyond
        await audioEngine.preloadAll([
            'menuMusic',
            'menuAmbience',
            'buttonClick',
            'battleMusicPhase1',
            'battleMusicPhase2',
            'battleMusicPhase3',
            'spaceAmbience',
            'laser',
            'explosion',
            'doors',
            'introData',
            'transition',
        ]);

        // Start intro: play introData SFX (with stop ref) and ambience, NO music yet
        stopIntroDataRef.current = audioEngine.playSFXWithStop('introData');
        audioEngine.startAmbience('menuAmbience');

        // setAudioReady(true);
        setIsAudioLoading(false);
        setShowBriefing(true);
    };

    const handleContinue = () => {
        navigate('/map');
    };

    return (
        <div className="flex-1 flex flex-col items-center justify-center p-4 text-center relative">
            {/* Background with space theme */}
            <div className="absolute inset-0 z-0">
                <div
                    className="absolute inset-0"
                    style={{
                        backgroundImage: 'url(/assets/helianthus/SpaceBackgrounds/1.png)',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                    }}
                />
                <div
                    className="absolute inset-0 animate-parallaxSlow"
                    style={{
                        backgroundImage: 'url(/assets/helianthus/SpaceBackgrounds/stars_blue.png)',
                        backgroundRepeat: 'repeat',
                        backgroundSize: '2048px',
                        opacity: 0.5,
                        imageRendering: 'pixelated',
                    }}
                />
            </div>

            {!showBriefing ? (
                // Title Screen
                <div className="relative z-10">
                    <div className="mb-12">
                        <h1 className="text-4xl md:text-6xl text-brand-accent mb-4 drop-shadow-[4px_4px_0_rgba(255,42,42,1)]">
                            SPACE MATH
                        </h1>
                        <h2 className="text-2xl md:text-4xl text-white drop-shadow-[4px_4px_0_rgba(37,99,235,1)]">
                            COMMANDER
                        </h2>
                    </div>

                    <div className="space-y-6">
                        <PixelButton
                            onClick={handleStartMission}
                            className="text-xl px-12 py-6 animate-pulse"
                            disabled={isAudioLoading}
                            size="lg"
                        >
                            <div className="flex items-center gap-4">
                                <Rocket className={`w-8 h-8 ${isAudioLoading ? 'animate-spin' : ''}`} />
                                {isAudioLoading ? 'LOADING...' : 'START MISSION'}
                            </div>
                        </PixelButton>

                        <div className="text-industrial-highlight text-xs mt-8 font-tech tracking-widest">
                            v1.0.0 - INDUSTRIAL EDITION
                        </div>
                    </div>
                </div>
            ) : (
                // Mission Briefing
                <div className="relative z-10 w-full max-w-2xl" onClick={handleSkipTyping}>
                    <PixelCard className="p-6 md:p-8">
                        {/* Transmission header */}
                        <div className="flex items-center gap-3 mb-6 border-b-2 border-industrial-metal pb-4">
                            <div className="w-3 h-3 rounded-full bg-brand-danger animate-pulse" />
                            <Radio className="w-5 h-5 text-brand-secondary" />
                            <span className="text-brand-secondary text-sm font-bold tracking-widest uppercase">
                                {openingNarrative.title}
                            </span>
                        </div>

                        {/* Speaker */}
                        <div className="text-brand-accent text-xs font-bold mb-3 tracking-wider uppercase">
                            [{openingNarrative.speaker}]
                        </div>

                        {/* Message with typewriter effect */}
                        <div className="text-white text-left leading-relaxed mb-8 min-h-[120px] font-tech text-lg">
                            "{displayedText}"
                            {isTyping && <span className="animate-pulse text-brand-secondary">▊</span>}
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
                            <div className="text-industrial-highlight text-xs text-center font-tech animate-pulse">
                                Click to skip transmission...
                            </div>
                        )}
                    </PixelCard>
                </div>
            )}
        </div>
    );
};

export default StartScreen;
