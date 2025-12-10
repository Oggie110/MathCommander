import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PixelButton } from '@/components/ui/PixelButton';
import { PixelCard } from '@/components/ui/PixelCard';
import { CRTDialogueBox } from '@/components/ui/CRTDialogueBox';
import { SpaceBackground } from '@/components/game';
import { isFinalBoss, victoryNarrative } from '@/data/narrative';
import { getLegById, isBossLevel } from '@/utils/campaignLogic';
import { audioEngine } from '@/audio';
import { selectVictoryLine, selectDefeatLine, selectEncourageLine, selectBossDefeatLine, type BodyId, type DialogueLine } from '@/audio/speechSounds';
import type { Question } from '@/types/game.ts';
import { Star, RotateCcw, Map, ChevronLeft, Radio, ClipboardList, ArrowLeft } from 'lucide-react';

// Animation timing constants (in ms)
const PERCENTAGE_DURATION = 1000;
const STARS_START_DELAY = 1100;
const STAR_INTERVAL = 300;
const CORRECT_START_DELAY = 2000;
const CORRECT_DURATION = 600;
const XP_START_DELAY = 2700;

// All result screen sounds that need to be preloaded
const RESULT_SOUNDS = [
    'resultPercentage',
    'resultStarPop1',
    'resultStarPop2',
    'resultStarPop3',
    'resultCorrectCount',
    'resultXP',
];

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

    // State for showing answers view
    const [showAnswers, setShowAnswers] = useState(false);

    // iOS requires user gesture to play audio - show "tap to continue" first
    const [animationsStarted, setAnimationsStarted] = useState(false);

    // Animation states
    const [animatedPercentage, setAnimatedPercentage] = useState(0);
    const [visibleStars, setVisibleStars] = useState(0);
    const [animatedCorrectCount, setAnimatedCorrectCount] = useState(0);
    const [showXP, setShowXP] = useState(false);

    // Calculate how many stars earned (matches BattleScreen logic)
    // 1 star for any correct answers, 2 stars at 70%, 3 stars at 90%
    const starsEarned = percentage >= 90 ? 3 : percentage >= 70 ? 2 : correctCount > 0 ? 1 : 0;

    // Helper to play sound with preload fallback (ensures sound is ready on iOS)
    const playSoundReliably = async (soundId: string) => {
        // Ensure this specific sound is preloaded (fast if already done)
        await audioEngine.preload(soundId);
        // Resume context if suspended
        await audioEngine.resume();
        // Now play
        audioEngine.playSFX(soundId);
    };

    // Preload result sounds on mount
    useEffect(() => {
        audioEngine.preloadAll(RESULT_SOUNDS);
    }, []);

    // Handler to start animations (called on user tap for iOS audio unlock)
    const handleStartAnimations = async () => {
        if (animationsStarted) return;
        // Prime sounds on this user gesture (iOS needs this)
        await audioEngine.primeHTML5Sounds(RESULT_SOUNDS);
        setAnimationsStarted(true);
    };

    // Animate percentage from 0 to final value (only after user tap on iOS)
    useEffect(() => {
        if (!animationsStarted) return;

        // Play percentage sound (with preload fallback for iOS)
        playSoundReliably('resultPercentage');

        const startTime = performance.now();
        let animationFrame: number;

        const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / PERCENTAGE_DURATION, 1);
            // Ease out curve for smoother finish
            const easedProgress = 1 - Math.pow(1 - progress, 3);
            setAnimatedPercentage(Math.round(easedProgress * percentage));

            if (progress < 1) {
                animationFrame = requestAnimationFrame(animate);
            }
        };

        animationFrame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationFrame);
    }, [percentage, animationsStarted]);

    // Animate stars appearing one by one
    // Use 3 separate sound files to allow overlapping playback on iOS
    useEffect(() => {
        if (!animationsStarted) return;
        if (starsEarned === 0) return;

        const starPopSounds = ['resultStarPop1', 'resultStarPop2', 'resultStarPop3'];
        const timers: ReturnType<typeof setTimeout>[] = [];
        for (let i = 1; i <= starsEarned; i++) {
            const timer = setTimeout(async () => {
                setVisibleStars(i);
                // Play pop sound for each star (cycling through 3 copies)
                await playSoundReliably(starPopSounds[(i - 1) % 3]);
            }, STARS_START_DELAY + (i - 1) * STAR_INTERVAL);
            timers.push(timer);
        }

        return () => timers.forEach(t => clearTimeout(t));
    }, [starsEarned, animationsStarted]);

    // Animate correct count from 0 to final value
    useEffect(() => {
        if (!animationsStarted) return;

        const timer = setTimeout(async () => {
            // Play correct count sound
            await playSoundReliably('resultCorrectCount');

            const startTime = performance.now();

            const animate = (currentTime: number) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / CORRECT_DURATION, 1);
                const easedProgress = 1 - Math.pow(1 - progress, 2);
                setAnimatedCorrectCount(Math.round(easedProgress * correctCount));

                if (progress < 1) {
                    requestAnimationFrame(animate);
                }
            };

            requestAnimationFrame(animate);
        }, CORRECT_START_DELAY);

        return () => clearTimeout(timer);
    }, [correctCount, animationsStarted]);

    // Show XP with bounce
    useEffect(() => {
        if (!animationsStarted) return;

        const timer = setTimeout(async () => {
            setShowXP(true);
            // Play XP sound
            await playSoundReliably('resultXP');
        }, XP_START_DELAY);

        return () => clearTimeout(timer);
    }, [animationsStarted]);

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
    // NOTE: Ambience is already running from StartScreen - never stop it
    React.useEffect(() => {
        // Play victory music only for final boss victory, otherwise menu music
        if (battleInfo.isFinal && passed) {
            audioEngine.playMusic('victoryMusic');
        } else {
            audioEngine.playMusic('menuMusic');
        }
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
            <SpaceBackground />

            {/* Tap to continue overlay - required for iOS audio */}
            {!animationsStarted && (
                <div
                    className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 cursor-pointer"
                    onClick={handleStartAnimations}
                >
                    <div className="text-center">
                        <div className="text-2xl font-pixel text-white mb-4">
                            {passed ? 'MISSION COMPLETE' : 'MISSION FAILED'}
                        </div>
                        <div className="text-sm font-pixel text-gray-400 animate-pulse">
                            TAP TO CONTINUE
                        </div>
                    </div>
                </div>
            )}

            <div className="relative z-10 w-full max-w-lg">
                {/* Final victory special screen - CRT Style */}
                {battleInfo.isFinal && passed && (
                    <CRTDialogueBox variant="yellow" className="mb-6">
                        <div className="flex items-center gap-3 mb-4 border-b border-yellow-900/50 pb-3">
                            <div className="w-3 h-3 rounded-full bg-yellow-500 animate-pulse shadow-[0_0_8px_#eab308]" />
                            <Radio className="w-5 h-5 text-yellow-500 drop-shadow-[0_0_6px_rgba(234,179,8,0.8)]" />
                            <span className="text-yellow-500 text-sm font-bold tracking-widest font-pixel drop-shadow-[0_0_8px_rgba(234,179,8,0.8)]">
                                VICTORY TRANSMISSION
                            </span>
                        </div>
                        <p className="text-yellow-400 text-lg leading-relaxed font-pixel drop-shadow-[0_0_6px_rgba(250,204,21,0.6)]">
                            "{victoryNarrative.message}"
                        </p>
                    </CRTDialogueBox>
                )}

                {/* Boss defeat quote - CRT Style */}
                {bossDefeatDialogue && !battleInfo.isFinal && (
                    <CRTDialogueBox variant="red" className="mb-6">
                        <div className="text-red-500 text-xs font-bold mb-2 tracking-wider font-pixel drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]">
                            [ENEMY TRANSMISSION - SIGNAL LOST]
                        </div>
                        <p className="text-red-400 italic font-pixel drop-shadow-[0_0_6px_rgba(248,113,113,0.6)]">
                            "{bossDefeatDialogue.text}"
                        </p>
                        <div className="text-red-900 text-xs mt-2 font-pixel">*static*</div>
                    </CRTDialogueBox>
                )}

                <PixelCard className="w-full text-center p-8">
                    <div className="mb-8">
                        <h2 className={`text-2xl md:text-3xl mb-2 ${passed ? 'text-green-400' : 'text-red-500'}`}>
                            {battleInfo.isFinal && passed ? 'HUMANITY SAVED' : passed ? 'MISSION ACCOMPLISHED' : 'MISSION FAILED'}
                        </h2>
                        <div className="text-6xl font-bold mb-4 text-white">
                            {animatedPercentage}%
                        </div>
                        <div className="flex justify-center gap-2 mb-4">
                            {Array.from({ length: 3 }).map((_, i) => {
                                const isEarned = i < starsEarned;
                                const isVisible = i < visibleStars;
                                return (
                                    <Star
                                        key={i}
                                        className={`w-8 h-8 transition-all duration-300 ${
                                            isEarned && isVisible
                                                ? 'text-yellow-400 fill-yellow-400 scale-100 opacity-100'
                                                : isEarned && !isVisible
                                                    ? 'text-yellow-400 fill-yellow-400 scale-0 opacity-0'
                                                    : 'text-gray-600 scale-100 opacity-100'
                                        }`}
                                        style={{
                                            transform: isEarned && isVisible ? 'scale(1)' : isEarned ? 'scale(0)' : 'scale(1)',
                                            animation: isEarned && isVisible ? 'starPop 0.4s ease-out' : 'none',
                                        }}
                                    />
                                );
                            })}
                        </div>

                        {/* Defeat encouragement message */}
                        {encourageDialogue && (
                            <div className="mt-4 text-sm">
                                <p className="text-green-400 font-pixel drop-shadow-[0_0_6px_rgba(74,222,128,0.6)]">"{encourageDialogue.text}"</p>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="bg-space-black p-4 border-2 border-gray-700">
                            <div className="text-xs text-gray-400">CORRECT</div>
                            <div className="text-2xl text-green-400">{animatedCorrectCount}/{questions.length}</div>
                        </div>
                        <div className="bg-space-black p-4 border-2 border-gray-700">
                            <div className="text-xs text-gray-400">XP EARNED</div>
                            <div
                                className={`text-2xl text-yellow-400 ${showXP ? 'animate-xpBounce' : 'scale-0 opacity-0'}`}
                            >
                                +{xpEarned}
                            </div>
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

                        <PixelButton
                            onClick={() => setShowAnswers(true)}
                            variant="secondary"
                            className="w-full"
                        >
                            <div className="flex items-center justify-center gap-2">
                                <ClipboardList className="w-4 h-4" />
                                VIEW ALL ANSWERS
                            </div>
                        </PixelButton>
                    </div>
                </PixelCard>

                {/* Answers View Modal */}
                {showAnswers && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 bg-black/80">
                        <PixelCard className="w-full max-w-md max-h-[90vh] flex flex-col">
                            <div className="flex-shrink-0 flex items-center justify-between p-2 border-b-2 border-gray-700">
                                <h3 className="text-sm text-green-400">MISSION ANSWERS</h3>
                                <PixelButton
                                    onClick={() => setShowAnswers(false)}
                                    variant="secondary"
                                    size="sm"
                                >
                                    <div className="flex items-center gap-1">
                                        <ArrowLeft className="w-3 h-3" />
                                        BACK
                                    </div>
                                </PixelButton>
                            </div>
                            <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-1">
                                {questions.map((q, i) => (
                                    <div
                                        key={i}
                                        className={`p-1.5 border-2 ${q.correct
                                            ? 'border-green-600 bg-green-900/20'
                                            : 'border-red-600 bg-red-900/20'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] text-gray-400">Q{i + 1}</span>
                                                <span className="text-xs text-white">
                                                    {q.num1} × {q.num2} = <span className="text-green-400 font-bold">{q.num1 * q.num2}</span>
                                                </span>
                                            </div>
                                            <span className={`text-xs font-bold ${q.correct ? 'text-green-400' : 'text-red-400'}`}>
                                                {q.correct ? '✓' : '✗'}
                                                {!q.correct && q.userAnswer !== undefined && (
                                                    <span className="text-red-400 ml-1">({q.userAnswer})</span>
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex-shrink-0 p-2 border-t-2 border-gray-700">
                                <div className="text-center text-xs text-gray-400">
                                    {correctCount} of {questions.length} correct ({percentage}%)
                                </div>
                            </div>
                        </PixelCard>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ResultScreen;
