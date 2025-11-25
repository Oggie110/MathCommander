import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PixelButton } from '@/components/ui/PixelButton';
import { PixelCard } from '@/components/ui/PixelCard';
import { openingNarrative } from '@/data/narrative';
import { useAudio } from '@/hooks/useAudio';
import { Rocket, Radio } from 'lucide-react';

const StartScreen: React.FC = () => {
    const navigate = useNavigate();
    const { startAmbience } = useAudio();
    const [showBriefing, setShowBriefing] = useState(false);
    const [displayedText, setDisplayedText] = useState('');
    const [isTyping, setIsTyping] = useState(false);

    // Typewriter effect for briefing
    useEffect(() => {
        if (showBriefing && !isTyping) {
            setIsTyping(true);
            setDisplayedText('');
            let index = 0;
            const text = openingNarrative.message;

            const typeInterval = setInterval(() => {
                if (index < text.length) {
                    setDisplayedText(text.slice(0, index + 1));
                    index++;
                } else {
                    clearInterval(typeInterval);
                    setIsTyping(false);
                }
            }, 30);

            return () => clearInterval(typeInterval);
        }
    }, [showBriefing]);

    const handleSkipTyping = () => {
        if (isTyping) {
            setDisplayedText(openingNarrative.message);
            setIsTyping(false);
        }
    };

    const handleStartMission = () => {
        startAmbience(); // Start background music on first interaction
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
                        <h1 className="text-4xl md:text-6xl text-star-yellow mb-4" style={{ textShadow: '4px 4px 0 #ff4d4d' }}>
                            SPACE MATH
                        </h1>
                        <h2 className="text-2xl md:text-4xl text-white" style={{ textShadow: '4px 4px 0 #4d79ff' }}>
                            COMMANDER
                        </h2>
                    </div>

                    <div className="space-y-6">
                        <PixelButton
                            onClick={handleStartMission}
                            className="text-xl px-12 py-6 animate-pulse"
                        >
                            <div className="flex items-center gap-4">
                                <Rocket className="w-8 h-8" />
                                START MISSION
                            </div>
                        </PixelButton>

                        <div className="text-gray-400 text-xs mt-8">
                            v1.0.0 - PIXEL EDITION
                        </div>
                    </div>
                </div>
            ) : (
                // Mission Briefing
                <div className="relative z-10 w-full max-w-2xl" onClick={handleSkipTyping}>
                    <PixelCard className="p-6 md:p-8 bg-gray-900/95">
                        {/* Transmission header */}
                        <div className="flex items-center gap-3 mb-6 border-b border-cyan-500/30 pb-4">
                            <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                            <Radio className="w-5 h-5 text-cyan-400" />
                            <span className="text-cyan-400 text-sm font-bold tracking-widest">
                                {openingNarrative.title}
                            </span>
                        </div>

                        {/* Speaker */}
                        <div className="text-yellow-400 text-xs font-bold mb-3 tracking-wider">
                            [{openingNarrative.speaker}]
                        </div>

                        {/* Message with typewriter effect */}
                        <div className="text-white text-left leading-relaxed mb-8 min-h-[120px]">
                            "{displayedText}"
                            {isTyping && <span className="animate-pulse">▊</span>}
                        </div>

                        {/* Continue button */}
                        {!isTyping && (
                            <PixelButton
                                onClick={handleContinue}
                                className="w-full py-4 text-lg"
                            >
                                <div className="flex items-center justify-center gap-3">
                                    <Rocket className="w-5 h-5" />
                                    BEGIN MISSION
                                </div>
                            </PixelButton>
                        )}

                        {isTyping && (
                            <div className="text-gray-500 text-xs text-center">
                                Click to skip...
                            </div>
                        )}
                    </PixelCard>
                </div>
            )}
        </div>
    );
};

export default StartScreen;
