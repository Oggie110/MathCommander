import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { PixelButton } from '@/components/ui/PixelButton';
import { CRTDialogueBox } from '@/components/ui/CRTDialogueBox';
import { SpaceBackground } from '@/components/game';
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

        // iOS CRITICAL: Initialize audio engine SYNCHRONOUSLY during user gesture
        // The init() creates AudioContext and plays silent buffer - must happen immediately
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
            'starEarned',
            'shipSlide1',
            'shipSlide2',
            'shipSlide3',
            'shipSlide4',
        ]);

        // Ensure context is running before playing audio
        await audioEngine.resume();

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
            <SpaceBackground />

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
                        {/* Custom button without PixelButton's auto-sound - this first tap unlocks iOS audio */}
                        <button
                            onClick={handleStartMission}
                            disabled={isAudioLoading}
                            className={`
                                text-xl px-12 py-6 animate-pulse
                                bg-gradient-to-b from-blue-500 to-blue-700
                                border-4 border-blue-400
                                text-white font-bold
                                shadow-[0_4px_0_0_#1e40af,0_6px_0_0_#1e3a8a]
                                hover:from-blue-400 hover:to-blue-600
                                active:translate-y-1 active:shadow-[0_2px_0_0_#1e40af]
                                disabled:opacity-50 disabled:cursor-not-allowed
                                transition-all
                                font-pixel uppercase tracking-wider
                            `}
                        >
                            <div className="flex items-center gap-4">
                                <Rocket className={`w-8 h-8 ${isAudioLoading ? 'animate-spin' : ''}`} />
                                {isAudioLoading ? 'LOADING...' : 'START MISSION'}
                            </div>
                        </button>

                        <div className="text-industrial-highlight text-xs mt-8 font-tech tracking-widest">
                            v1.0.0 - INDUSTRIAL EDITION
                        </div>
                    </div>
                </div>
            ) : (
                // Mission Briefing - CRT Monitor Style
                <div className="relative z-10 w-full max-w-2xl" onClick={handleSkipTyping}>
                    <CRTDialogueBox variant="green">
                        {/* Transmission header */}
                        <div className="flex items-center gap-3 mb-6 border-b border-green-900/50 pb-4">
                            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_#22c55e]" />
                            <Radio className="w-5 h-5 text-green-500 drop-shadow-[0_0_6px_rgba(34,197,94,0.8)]" />
                            <span className="text-green-500 text-sm font-bold tracking-widest uppercase font-mono drop-shadow-[0_0_8px_rgba(34,197,94,0.8)]">
                                {openingNarrative.title}
                            </span>
                        </div>

                        {/* Speaker */}
                        <div className="text-green-500 text-xs font-bold mb-3 tracking-wider uppercase font-mono drop-shadow-[0_0_8px_rgba(34,197,94,0.8)]">
                            [{openingNarrative.speaker}]
                        </div>

                        {/* Message with typewriter effect */}
                        <div className="text-green-400 text-left leading-relaxed mb-8 min-h-[120px] font-mono text-lg drop-shadow-[0_0_6px_rgba(74,222,128,0.6)]">
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
                            <div className="text-green-600/60 text-xs text-center font-mono animate-pulse">
                                Click to skip transmission...
                            </div>
                        )}
                    </CRTDialogueBox>
                </div>
            )}
        </div>
    );
};

export default StartScreen;
