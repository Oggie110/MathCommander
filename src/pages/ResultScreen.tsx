import React, { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PixelButton } from '@/components/ui/PixelButton';
import { PixelCard } from '@/components/ui/PixelCard';
import { getDefeatMessage, getBossDefeatLine, isFinalBoss, victoryNarrative } from '@/data/narrative';
import { getLegById, isBossLevel } from '@/utils/campaignLogic';
import type { Question } from '@/types/game.ts';
import { Star, RotateCcw, Map, ChevronLeft, Radio } from 'lucide-react';

interface LocationState {
    questions: Question[];
    xpEarned: number;
    passed: boolean;
    legId?: string;
    waypointIndex?: number;
    isReplay?: boolean;
}

const ResultScreen: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { questions, xpEarned, passed, legId, waypointIndex, isReplay } = location.state as LocationState;

    const correctCount = questions.filter(q => q.correct).length;
    const percentage = Math.round((correctCount / questions.length) * 100);

    // Determine if this was a boss battle and get the body ID
    const battleInfo = useMemo(() => {
        if (!legId) return { isBoss: false, bodyId: '', isFinal: false };
        const leg = getLegById(legId);
        if (!leg) return { isBoss: false, bodyId: '', isFinal: false };

        const isBoss = isBossLevel(waypointIndex ?? 0, leg.waypointsRequired);
        const isFinal = isFinalBoss(leg.toBodyId, isBoss);
        return { isBoss, bodyId: leg.toBodyId, isFinal };
    }, [legId, waypointIndex]);

    // Get narrative messages
    const defeatInfo = useMemo(() => {
        if (passed) return null;
        return getDefeatMessage(battleInfo.isBoss);
    }, [passed, battleInfo.isBoss]);

    const bossDefeatLine = useMemo(() => {
        if (!passed || !battleInfo.isBoss) return null;
        return getBossDefeatLine(battleInfo.bodyId);
    }, [passed, battleInfo.isBoss, battleInfo.bodyId]);

    return (
        <div className="flex-1 flex flex-col items-center justify-center p-4">
            {/* Background */}
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
                    className="absolute inset-0"
                    style={{
                        backgroundImage: 'url(/assets/helianthus/SpaceBackgrounds/stars_blue.png)',
                        backgroundRepeat: 'repeat',
                        backgroundSize: '2048px',
                        opacity: 0.5,
                        imageRendering: 'pixelated',
                    }}
                />
            </div>

            <div className="relative z-10 w-full max-w-lg">
                {/* Final victory special screen */}
                {battleInfo.isFinal && passed && (
                    <PixelCard className="mb-6 p-6 border-yellow-500 bg-gray-900/95">
                        <div className="flex items-center gap-3 mb-4 border-b border-yellow-500/30 pb-3">
                            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                            <Radio className="w-5 h-5 text-yellow-400" />
                            <span className="text-yellow-400 text-sm font-bold tracking-widest">
                                VICTORY TRANSMISSION
                            </span>
                        </div>
                        <p className="text-yellow-300 text-lg leading-relaxed">
                            "{victoryNarrative.message}"
                        </p>
                    </PixelCard>
                )}

                {/* Boss defeat quote */}
                {bossDefeatLine && !battleInfo.isFinal && (
                    <PixelCard className="mb-6 p-4 border-red-500/50 bg-gray-900/95">
                        <div className="text-red-600 text-xs font-bold mb-2 tracking-wider">
                            [ENEMY TRANSMISSION - SIGNAL LOST]
                        </div>
                        <p className="text-red-400 italic">
                            "{bossDefeatLine}"
                        </p>
                        <div className="text-gray-600 text-xs mt-2">*static*</div>
                    </PixelCard>
                )}

                <PixelCard className="w-full text-center p-8">
                    <div className="mb-8">
                        <h2 className={`text-2xl md:text-3xl mb-2 ${passed ? 'text-green-400' : 'text-red-500'}`}>
                            {battleInfo.isFinal && passed ? 'HUMANITY SAVED' : passed ? 'MISSION ACCOMPLISHED' : 'MISSION FAILED'}
                        </h2>
                        <div className="text-6xl font-bold mb-4 text-white">
                            {percentage}%
                        </div>
                        <div className="flex justify-center gap-2 mb-4">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <Star
                                    key={i}
                                    className={`w-8 h-8 ${i < (percentage >= 90 ? 3 : percentage >= 70 ? 2 : percentage >= 50 ? 1 : 0)
                                        ? 'text-yellow-400 fill-yellow-400'
                                        : 'text-gray-600'
                                        }`}
                                />
                            ))}
                        </div>

                        {/* Defeat encouragement message */}
                        {defeatInfo && (
                            <div className="mt-4 text-sm">
                                <p className="text-gray-400 mb-1">{defeatInfo.message}</p>
                                <p className="text-cyan-400">{defeatInfo.encouragement}</p>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="bg-space-black p-4 border-2 border-gray-700">
                            <div className="text-xs text-gray-400">CORRECT</div>
                            <div className="text-2xl text-green-400">{correctCount}</div>
                        </div>
                        <div className="bg-space-black p-4 border-2 border-gray-700">
                            <div className="text-xs text-gray-400">XP EARNED</div>
                            <div className="text-2xl text-yellow-400">+{xpEarned}</div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {isReplay && legId ? (
                            // Replay mode - go back to mission screen
                            <PixelButton
                                onClick={() => navigate('/mission', { state: { legId, isReplay: true } })}
                                className="w-full py-4 text-lg"
                            >
                                <div className="flex items-center justify-center gap-2">
                                    <ChevronLeft className="w-5 h-5" />
                                    BACK TO MISSIONS
                                </div>
                            </PixelButton>
                        ) : (
                            // Normal mode - go to map
                            <PixelButton
                                onClick={() => navigate('/map')}
                                className="w-full py-4 text-lg"
                            >
                                <div className="flex items-center justify-center gap-2">
                                    <Map className="w-5 h-5" />
                                    {battleInfo.isFinal && passed ? 'RETURN HOME' : 'RETURN TO MAP'}
                                </div>
                            </PixelButton>
                        )}

                        {!passed && (
                            <PixelButton
                                onClick={() => navigate('/battle', {
                                    state: legId ? { legId, waypointIndex, isReplay } : undefined
                                })}
                                variant="secondary"
                                className="w-full"
                            >
                                <div className="flex items-center justify-center gap-2">
                                    <RotateCcw className="w-4 h-4" />
                                    RETRY MISSION
                                </div>
                            </PixelButton>
                        )}
                    </div>
                </PixelCard>
            </div>
        </div>
    );
};

export default ResultScreen;
