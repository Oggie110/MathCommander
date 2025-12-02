import React, { useMemo, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PixelButton } from '@/components/ui/PixelButton';
import { PixelCard } from '@/components/ui/PixelCard';
import { CRTDialogueBox } from '@/components/ui/CRTDialogueBox';
import { isFinalBoss, victoryNarrative } from '@/data/narrative';
import { getLegById, isBossLevel } from '@/utils/campaignLogic';
import { audioEngine } from '@/audio';
import { selectVictoryLine, selectDefeatLine, selectEncourageLine, selectBossDefeatLine, type BodyId, type DialogueLine } from '@/audio/speechSounds';
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

    // Use unified selection for all dialogue (synced text + audio)
    const [_victoryDialogue, setVictoryDialogue] = useState<DialogueLine | null>(null);
    const [_defeatDialogue, setDefeatDialogue] = useState<DialogueLine | null>(null);
    const [encourageDialogue, setEncourageDialogue] = useState<DialogueLine | null>(null);
    const [bossDefeatDialogue, setBossDefeatDialogue] = useState<DialogueLine | null>(null);

    // Pre-select all dialogue lines once when battle info is known
    React.useEffect(() => {
        // Reset all dialogue states first
        setVictoryDialogue(null);
        setDefeatDialogue(null);
        setEncourageDialogue(null);
        setBossDefeatDialogue(null);

        if (passed) {
            // Victory: select victory line and boss defeat line (if boss)
            if (battleInfo.bodyId || battleInfo.isBoss) {
                setVictoryDialogue(selectVictoryLine(battleInfo.isBoss, battleInfo.isFinal));
                if (battleInfo.isBoss && !battleInfo.isFinal) {
                    setBossDefeatDialogue(selectBossDefeatLine(battleInfo.bodyId as BodyId));
                }
            }
        } else {
            // Defeat: always show encouragement
            setEncourageDialogue(selectEncourageLine());
            if (battleInfo.bodyId || battleInfo.isBoss) {
                setDefeatDialogue(selectDefeatLine(battleInfo.isBoss));
            }
        }
    }, [battleInfo.isBoss, battleInfo.isFinal, battleInfo.bodyId, passed]);

    // Switch music when entering result screen
    React.useEffect(() => {
        // Play victory music only for final boss victory, otherwise menu music
        if (battleInfo.isFinal && passed) {
            audioEngine.playMusic('victoryMusic');
        } else {
            audioEngine.playMusic('menuMusic');
        }
        // Stop space ambience and start menu ambience
        audioEngine.stopAmbience('spaceAmbience');
        audioEngine.startAmbience('menuAmbience');
    }, [battleInfo.isFinal, passed]);

    // Ref to store the stop function for radio static
    const stopStaticRef = useRef<((fadeOut?: number) => void) | null>(null);

    // Play boss defeat audio when dialogue is ready (with HEAVY radio effect + static)
    React.useEffect(() => {
        let cancelled = false;

        const playBossDefeat = async () => {
            if (!bossDefeatDialogue?.soundId) return;

            // Preload radio static first to ensure we get a stop function
            await audioEngine.preload('radioStatic');
            if (cancelled) return;

            // Play radio static alongside speech
            const stopFn = audioEngine.playSFXWithStop('radioStatic');
            if (stopFn) {
                stopStaticRef.current = stopFn;
            }

            await audioEngine.playHeavyRadioSpeech(bossDefeatDialogue.soundId);

            // Fade out static when speech ends
            if (stopStaticRef.current && !cancelled) {
                stopStaticRef.current(300);
                stopStaticRef.current = null;
            }
        };

        playBossDefeat();

        // Cleanup: stop static when leaving the screen
        return () => {
            cancelled = true;
            if (stopStaticRef.current) {
                stopStaticRef.current(100);
                stopStaticRef.current = null;
            }
        };
    }, [bossDefeatDialogue]);

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
                {/* Final victory special screen - CRT Style */}
                {battleInfo.isFinal && passed && (
                    <CRTDialogueBox variant="yellow" className="mb-6">
                        <div className="flex items-center gap-3 mb-4 border-b border-yellow-900/50 pb-3">
                            <div className="w-3 h-3 rounded-full bg-yellow-500 animate-pulse shadow-[0_0_8px_#eab308]" />
                            <Radio className="w-5 h-5 text-yellow-500 drop-shadow-[0_0_6px_rgba(234,179,8,0.8)]" />
                            <span className="text-yellow-500 text-sm font-bold tracking-widest font-mono drop-shadow-[0_0_8px_rgba(234,179,8,0.8)]">
                                VICTORY TRANSMISSION
                            </span>
                        </div>
                        <p className="text-yellow-400 text-lg leading-relaxed font-mono drop-shadow-[0_0_6px_rgba(250,204,21,0.6)]">
                            "{victoryNarrative.message}"
                        </p>
                    </CRTDialogueBox>
                )}

                {/* Boss defeat quote - CRT Style */}
                {bossDefeatDialogue && !battleInfo.isFinal && (
                    <CRTDialogueBox variant="red" className="mb-6">
                        <div className="text-red-500 text-xs font-bold mb-2 tracking-wider font-mono drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]">
                            [ENEMY TRANSMISSION - SIGNAL LOST]
                        </div>
                        <p className="text-red-400 italic font-mono drop-shadow-[0_0_6px_rgba(248,113,113,0.6)]">
                            "{bossDefeatDialogue.text}"
                        </p>
                        <div className="text-red-900 text-xs mt-2 font-mono">*static*</div>
                    </CRTDialogueBox>
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
                        {encourageDialogue && (
                            <div className="mt-4 text-sm">
                                <p className="text-green-400 font-mono drop-shadow-[0_0_6px_rgba(74,222,128,0.6)]">"{encourageDialogue.text}"</p>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="bg-space-black p-4 border-2 border-gray-700">
                            <div className="text-xs text-gray-400">CORRECT</div>
                            <div className="text-2xl text-green-400">{correctCount}/{questions.length}</div>
                        </div>
                        <div className="bg-space-black p-4 border-2 border-gray-700">
                            <div className="text-xs text-gray-400">XP EARNED</div>
                            <div className="text-2xl text-yellow-400">+{xpEarned}</div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {passed && battleInfo.isBoss ? (
                            // Beat a boss - go to map to see progress
                            <PixelButton
                                onClick={() => navigate('/map')}
                                className="w-full py-4 text-lg"
                            >
                                <div className="flex items-center justify-center gap-2">
                                    <Map className="w-5 h-5" />
                                    {battleInfo.isFinal ? 'RETURN HOME' : 'VIEW PROGRESS'}
                                </div>
                            </PixelButton>
                        ) : legId ? (
                            // Regular enemy or lost - go back to mission screen
                            <PixelButton
                                onClick={() => navigate('/mission', { state: { legId, isReplay } })}
                                className="w-full py-4 text-lg"
                            >
                                <div className="flex items-center justify-center gap-2">
                                    <ChevronLeft className="w-5 h-5" />
                                    CONTINUE
                                </div>
                            </PixelButton>
                        ) : (
                            // Fallback - go to map
                            <PixelButton
                                onClick={() => navigate('/map')}
                                className="w-full py-4 text-lg"
                            >
                                <div className="flex items-center justify-center gap-2">
                                    <Map className="w-5 h-5" />
                                    RETURN TO MAP
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
