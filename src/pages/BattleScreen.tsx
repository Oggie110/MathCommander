import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { loadPlayerStats, savePlayerStats, updateWeakAreas, calculateXP } from '@/utils/gameLogic';
import { initializeCampaignProgress, completeMission } from '@/utils/campaignLogic';
import { useSFX, audioEngine } from '@/audio';
import { speechService } from '@/audio/SpeechService';
import { useBattleInit, useBattleAnimations, type LocationState } from '@/hooks/battle';
import type { Question } from '@/types/game.ts';
import { Star, ArrowLeft } from 'lucide-react';

type IntroStage = 'intro1' | 'heroEnter' | 'enemyEnter' | 'intro2' | 'playing' | 'victory' | 'heroExit';

const BattleScreen: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const locationState = location.state as LocationState | null;
    const { play: playSFX } = useSFX();

    // Detect touch device and orientation for tablet-specific viewport height
    const [isTouch, setIsTouch] = useState(false);
    const [isPortrait, setIsPortrait] = useState(false);
    useEffect(() => {
        const checkDevice = () => {
            const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
            const portrait = window.innerHeight > window.innerWidth;
            setIsTouch(hasTouch);
            setIsPortrait(portrait);
        };
        checkDevice();
        window.addEventListener('resize', checkDevice);
        window.addEventListener('orientationchange', checkDevice);
        return () => {
            window.removeEventListener('resize', checkDevice);
            window.removeEventListener('orientationchange', checkDevice);
        };
    }, []);

    // Calculate viewport height: touch+landscape=650px, everything else=900px
    const viewportHeight = (isTouch && !isPortrait) ? 650 : 900;

    // Use shared hooks for initialization and animations
    const battleInit = useBattleInit(locationState);

    // Game state (initialized from hook, updated during gameplay)
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [, setUserAnswer] = useState('');
    const [showFeedback, setShowFeedback] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    const [showLaser, setShowLaser] = useState(false);
    const [gameEnding, setGameEnding] = useState<'explosion' | 'escape' | null>(null);
    const [introStage, setIntroStage] = useState<IntroStage>('intro1');
    const [introMessage, setIntroMessage] = useState('');
    const [victorySoundId, setVictorySoundId] = useState('');
    const [pendingNavigation, setPendingNavigation] = useState<{
        questions: Question[];
        xpEarned: number;
        passed: boolean;
        legId: string;
        waypointIndex: number;
        isReplay: boolean;
    } | null>(null);
    const [dodgeDirection, setDodgeDirection] = useState<'up' | 'down'>('up');
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [frozenChoices, setFrozenChoices] = useState<number[] | null>(null);
    const [showEscapeOverlay, setShowEscapeOverlay] = useState(false);
    const [defeatMessage, setDefeatMessage] = useState<{ message: string; encouragement: string } | null>(null);
    const [defeatSoundId, setDefeatSoundId] = useState('');
    const [shotFired, setShotFired] = useState(false);
    const [prevStarCount, setPrevStarCount] = useState(0);
    const [animatingStarIndex, setAnimatingStarIndex] = useState<number | null>(null);
    const [dialogueSlidingOut, setDialogueSlidingOut] = useState(false);

    // Use shared animation hook
    const { heroFrame, shotFrame, explosionFrame } = useBattleAnimations(showLaser, gameEnding);

    // Extract values from init hook (with defaults while loading)
    const isBossBattle = battleInit?.isBossBattle ?? false;
    const isFinalBoss = battleInit?.isFinalBoss ?? false;
    const backgroundImage = battleInit?.backgroundImage ?? '/assets/images/backgrounds/base/dark-blue-purple.png';
    const enemyImage = battleInit?.enemyImage ?? '';
    const alienSpeaker = battleInit?.alienSpeaker;
    const commanderLine = battleInit?.commanderLine ?? '';
    const commanderSoundId = battleInit?.commanderSoundId ?? '';
    const alienLine = battleInit?.alienLine ?? '';
    const alienSoundId = battleInit?.alienSoundId ?? '';
    // Pre-selected victory/defeat dialogue (must use these exact IDs since they're preloaded)
    const preselectedVictoryLine = battleInit?.victoryLine ?? '';
    const preselectedVictorySoundId = battleInit?.victorySoundId ?? '';
    const preselectedDefeatLine = battleInit?.defeatLine ?? '';
    const preselectedDefeatSoundId = battleInit?.defeatSoundId ?? '';
    const preselectedEncourageLine = battleInit?.encourageLine ?? '';

    // Refs for cleanup and stable callbacks
    const escapeNavigationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const escapeOverlayTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const dialogueSlidingOutRef = useRef(false);

    // Initialize questions from hook
    useEffect(() => {
        if (battleInit?.questions) {
            setQuestions(battleInit.questions);
        }
    }, [battleInit?.questions]);

    // Victory sequence - triggered when explosion finishes
    useEffect(() => {
        if (gameEnding === 'explosion' && explosionFrame === 0) {
            // Short delay after explosion, then show victory dialogue (waits for click)
            const timeout = setTimeout(() => {
                setIntroStage('victory');
                // Use pre-selected dialogue from useBattleInit (these sounds are preloaded)
                setIntroMessage(preselectedVictoryLine);
                setVictorySoundId(preselectedVictorySoundId);
            }, 500);

            return () => clearTimeout(timeout);
        }
    }, [gameEnding, explosionFrame, preselectedVictoryLine, preselectedVictorySoundId]);

    // Handle advancing to next question (called by click or auto-advance timer)
    const advanceToNextQuestion = useCallback(() => {
        if (!showFeedback || questions.length === 0) return;

        const isLastQuestion = currentIndex === questions.length - 1;
        if (isLastQuestion) {
            handleGameComplete(questions);
        } else {
            // Advance to next question
            setCurrentIndex(currentIndex + 1);
            setUserAnswer('');
            setShowFeedback(false);
            setSelectedAnswer(null);
            setFrozenChoices(null);
        }
    }, [showFeedback, currentIndex, questions]);

    // Auto-advance after each question (shorter wait on last question) - click anywhere to skip
    useEffect(() => {
        if (showFeedback && questions.length > 0) {
            const isLastQuestion = currentIndex === questions.length - 1;
            const timeout = setTimeout(() => {
                advanceToNextQuestion();
            }, isLastQuestion ? 1500 : 3000);

            return () => clearTimeout(timeout);
        }
    }, [showFeedback, questions.length, currentIndex, advanceToNextQuestion]);

    // Handle click to advance dialogue (also skips speech)
    const handleDialogueClick = useCallback(() => {
        // Prevent double-clicks while sliding out (use ref to avoid callback instability)
        if (dialogueSlidingOutRef.current) return;

        // Stop any playing speech when clicking to advance
        speechService.stopCurrentSpeech();

        if (introStage === 'intro1') {
            // Commander dialogue clicked - slide out, then start ship entrance sequence
            dialogueSlidingOutRef.current = true;
            setDialogueSlidingOut(true);
            setTimeout(() => {
                dialogueSlidingOutRef.current = false;
                setDialogueSlidingOut(false);
                setIntroStage('heroEnter');
                playSFX('shipSlide1', { volume: 0.5 }); // Hero ship enters
                setTimeout(() => {
                    setIntroStage('enemyEnter');
                    playSFX('shipSlide2', { volume: 0.5 }); // Enemy ship enters
                }, 1200); // Extended to let hero slide-in complete
                setTimeout(() => {
                    setIntroStage('intro2');
                    setIntroMessage(alienLine);
                }, 2400); // Extended to let enemy slide-in complete
            }, 500); // Wait for slide-out animation
        } else if (introStage === 'intro2') {
            // Enemy dialogue clicked - slide out, then start playing
            dialogueSlidingOutRef.current = true;
            setDialogueSlidingOut(true);
            setTimeout(() => {
                dialogueSlidingOutRef.current = false;
                setDialogueSlidingOut(false);
                setIntroStage('playing');
            }, 500); // Wait for slide-out animation
        } else if (introStage === 'victory') {
            // Victory dialogue clicked - slide out, then hero exits
            dialogueSlidingOutRef.current = true;
            setDialogueSlidingOut(true);
            setTimeout(() => {
                dialogueSlidingOutRef.current = false;
                setDialogueSlidingOut(false);
                setIntroStage('heroExit');
                playSFX('shipSlide3', { volume: 0.5 }); // Hero ship exits
            }, 500); // Wait for slide-out animation
        }
    }, [introStage, alienLine]);

    // Intro sequence - triggered when dialogue is ready
    useEffect(() => {
        if (!commanderLine || !alienLine) return;

        // Play intro sequence when dialogue is loaded - starts with commander dialogue
        setIntroStage('intro1');
        setIntroMessage(commanderLine);
        // Waits for click to continue...
    }, [commanderLine, alienLine]);

    // Play commander speech when intro1 starts - auto-advance when done (minimum 3s display)
    useEffect(() => {
        if (introStage === 'intro1' && commanderSoundId) {
            let cancelled = false;
            let timeoutId: ReturnType<typeof setTimeout>;
            const startTime = Date.now();
            const minDisplayTime = 3000; // Minimum 3 seconds display

            speechService.playById(commanderSoundId).then(() => {
                if (cancelled) return;
                // Ensure minimum display time before auto-advancing
                const elapsed = Date.now() - startTime;
                const remainingTime = Math.max(0, minDisplayTime - elapsed);

                timeoutId = setTimeout(() => {
                    if (!cancelled) {
                        handleDialogueClick();
                    }
                }, remainingTime);
            });

            return () => {
                cancelled = true;
                if (timeoutId) clearTimeout(timeoutId);
            };
        }
    }, [introStage, commanderSoundId, handleDialogueClick]);

    // Play alien speech when intro2 starts - auto-advance when done (minimum 3s display)
    useEffect(() => {
        if (introStage === 'intro2' && alienSoundId) {
            let cancelled = false;
            let timeoutId: ReturnType<typeof setTimeout>;
            const startTime = Date.now();
            const minDisplayTime = 3000; // Minimum 3 seconds display

            speechService.playAlienById(alienSoundId).then(() => {
                if (cancelled) return;
                // Ensure minimum display time before auto-advancing
                const elapsed = Date.now() - startTime;
                const remainingTime = Math.max(0, minDisplayTime - elapsed);

                timeoutId = setTimeout(() => {
                    if (!cancelled) {
                        handleDialogueClick();
                    }
                }, remainingTime);
            });

            return () => {
                cancelled = true;
                if (timeoutId) clearTimeout(timeoutId);
            };
        }
    }, [introStage, alienSoundId, handleDialogueClick]);

    // Play victory speech when victory dialogue appears - auto-advance when done (minimum 3s display)
    useEffect(() => {
        if (introStage === 'victory' && victorySoundId) {
            let cancelled = false;
            let timeoutId: ReturnType<typeof setTimeout>;
            const startTime = Date.now();
            const minDisplayTime = 3000; // Minimum 3 seconds display

            speechService.playById(victorySoundId).then(() => {
                if (cancelled) return;
                // Ensure minimum display time before auto-advancing
                const elapsed = Date.now() - startTime;
                const remainingTime = Math.max(0, minDisplayTime - elapsed);

                timeoutId = setTimeout(() => {
                    if (!cancelled) {
                        handleDialogueClick();
                    }
                }, remainingTime);
            });

            return () => {
                cancelled = true;
                if (timeoutId) clearTimeout(timeoutId);
            };
        }
    }, [introStage, victorySoundId, handleDialogueClick]);

    // Play defeat speech when escape overlay appears - auto-navigate when done
    useEffect(() => {
        if (showEscapeOverlay && defeatSoundId) {
            speechService.playById(defeatSoundId).then(() => {
                // Auto-navigate to result after defeat speech ends
                // The escape navigation is already handled by timeout, but this ensures
                // speech completes before navigating
            });
        }
    }, [showEscapeOverlay, defeatSoundId]);

    // Navigation after hero exit animation completes
    useEffect(() => {
        if (introStage === 'heroExit' && pendingNavigation) {
            const timeout = setTimeout(() => {
                navigate('/result', { state: pendingNavigation });
            }, 1200); // Wait for fly-out animation
            return () => clearTimeout(timeout);
        }
    }, [introStage, pendingNavigation, navigate]);

    // Cleanup timeouts on unmount (prevents navigation after retry)
    useEffect(() => {
        return () => {
            if (escapeNavigationTimeoutRef.current) {
                clearTimeout(escapeNavigationTimeoutRef.current);
            }
            if (escapeOverlayTimeoutRef.current) {
                clearTimeout(escapeOverlayTimeoutRef.current);
            }
        };
    }, []);

    // Generate answer choices once per question to prevent flickering
    // MUST be before early return to maintain hook order
    const currentQuestion = questions[currentIndex];
    const answerChoices = useMemo(() => {
        if (!currentQuestion) return [];
        return [
            currentQuestion.answer,
            currentQuestion.answer + Math.floor(Math.random() * 5) + 1,
            currentQuestion.answer - Math.floor(Math.random() * 5) - 1
        ].sort(() => Math.random() - 0.5);
    }, [currentQuestion]);

    if (questions.length === 0) return null;

    const handleGameComplete = (finalQuestions: Question[]) => {
        if (!battleInit) return;

        const stats = loadPlayerStats();
        const currentProgress = stats.campaignProgress || initializeCampaignProgress();
        const activeLegId = battleInit.activeLegId;

        const correctCount = finalQuestions.filter(q => q.correct).length;
        const scorePercentage = (correctCount / finalQuestions.length) * 100;
        const xpEarned = calculateXP(correctCount, finalQuestions.length);

        // Determine ending based on 70% threshold
        if (scorePercentage >= 70) {
            setGameEnding('explosion');
            setTimeout(() => playSFX('explosion', { volume: 0.7 }), 200);
        } else {
            setGameEnding('escape');
            playSFX('shipSlide4', { volume: 0.5 });
            // Use pre-selected dialogue from useBattleInit (these sounds are preloaded)
            setDefeatMessage({ message: preselectedDefeatLine, encouragement: preselectedEncourageLine });
            setDefeatSoundId(preselectedDefeatSoundId);
        }

        // Update stats (only advance campaign if not replaying a completed level)
        const isReplay = battleInit.isReplay;
        const playedWaypointIndex = battleInit.activeWaypointIndex;
        const newStats = {
            ...stats,
            totalXP: stats.totalXP + xpEarned,
            weakAreas: updateWeakAreas(finalQuestions, stats.weakAreas),
            campaignProgress: isReplay
                ? currentProgress
                : completeMission(currentProgress, correctCount, finalQuestions.length, activeLegId, playedWaypointIndex),
        };

        savePlayerStats(newStats);

        // Preload result screen sounds for smooth playback
        audioEngine.preloadAll([
            'resultPercentage',
            'resultStarPop',
            'resultCorrectCount',
            'resultXP',
        ]).catch(() => {});

        // Store navigation data for when player clicks through victory dialogue
        const navData = {
            questions: finalQuestions,
            xpEarned,
            passed: scorePercentage >= 70,
            legId: activeLegId,
            waypointIndex: battleInit.activeWaypointIndex,
            isReplay: battleInit.isReplay,
        };
        setPendingNavigation(navData);

        // For escape path, navigate after delay (can click to skip)
        if (scorePercentage < 70) {
            escapeOverlayTimeoutRef.current = setTimeout(() => setShowEscapeOverlay(true), 1500);
            escapeNavigationTimeoutRef.current = setTimeout(() => {
                navigate('/result', { state: navData });
            }, 7000);
        }
    };

    return (
        <div className="flex-1 flex flex-col items-center justify-center p-4">
            {/* Full-screen click overlay to skip question feedback wait */}
            {showFeedback && introStage === 'playing' && !gameEnding && (
                <div
                    className="fixed inset-0 z-50 cursor-pointer"
                    onClick={advanceToNextQuestion}
                />
            )}

            {/* Back button - positioned absolutely outside the frame */}
            <div className="absolute top-4 left-4 z-[60]">
                <button
                    onClick={() => {
                        audioEngine.stopMusic(500);
                        audioEngine.stopSpeech(0); // Immediate stop, no fade
                        setTimeout(() => audioEngine.playMusic('menuMusic', { fadeIn: 500 }), 300);
                        navigate(-1);
                    }}
                    className="flex items-center gap-1 px-3 py-2 text-xs text-white/80 active:text-white bg-gray-900/50 border-2 border-gray-700 rounded font-pixel"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>BACK</span>
                </button>
            </div>

            {/* Main interface frame - the "screen" */}
            <div className="w-full max-w-4xl">
                {/* HUD - Above the frame */}
                <div className="flex justify-center items-end mb-4 px-8 gap-8">
                    {/* Stars - show earned stars based on absolute thresholds */}
                    <div className="flex gap-2">
                        {(() => {
                            // Calculate current correct count
                            const correctCount = questions.filter(q => q.correct === true).length;
                            const totalQuestions = questions.length;

                            // Calculate thresholds based on total questions
                            const thresholdFor2Stars = Math.ceil(totalQuestions * 0.7); // 70% = 7 for 10 questions
                            const thresholdFor3Stars = Math.ceil(totalQuestions * 0.9); // 90% = 9 for 10 questions

                            // Stars earned based on reaching absolute thresholds
                            let earnedStars = 0;
                            if (correctCount >= thresholdFor3Stars) earnedStars = 3;
                            else if (correctCount >= thresholdFor2Stars) earnedStars = 2;
                            else if (correctCount > 0) earnedStars = 1;

                            // Detect if a new star was earned and trigger animation + sound
                            // Delay so it comes after the shot/hit feedback
                            if (earnedStars > prevStarCount) {
                                // Update prevStarCount immediately to prevent re-triggering
                                setPrevStarCount(earnedStars);
                                // Delay the animation and sound to come after the hit
                                setTimeout(() => {
                                    setAnimatingStarIndex(earnedStars - 1);
                                    playSFX('starEarned');
                                    // Clear animation after it completes
                                    setTimeout(() => setAnimatingStarIndex(null), 500);
                                }, 800); // 800ms delay - after laser (600ms) and hit feedback
                            }

                            return Array.from({ length: 3 }).map((_, i) => (
                                <Star
                                    key={i}
                                    className={`w-8 h-8 ${
                                        i < earnedStars
                                            ? 'text-yellow-400 fill-yellow-400'
                                            : 'text-gray-600'
                                    } ${animatingStarIndex === i ? 'animate-starPop' : ''}`}
                                />
                            ));
                        })()}
                    </div>
                    {/* Enemy Shield / Wave indicator - center */}
                    <div className="text-center">
                        <div className="text-xs text-gray-400 mb-1">ENEMY SHIELD</div>
                        <div className="flex gap-0.5">
                            {questions.map((q, i) => {
                                // Determine color: answered correctly = green, answered wrong = red, current = yellow, unanswered = gray
                                let colorClass = 'bg-gray-600'; // unanswered future questions
                                if (i < currentIndex) {
                                    // Already answered
                                    colorClass = q.correct ? 'bg-green-500' : 'bg-red-500';
                                } else if (i === currentIndex) {
                                    colorClass = 'bg-yellow-500 animate-pulse';
                                }
                                return (
                                    <div
                                        key={i}
                                        className={`h-2 w-6 ${colorClass}`}
                                        style={{
                                            borderRadius: i === 0 ? '2px 0 0 2px' : i === questions.length - 1 ? '0 2px 2px 0' : '0',
                                        }}
                                    />
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Bordered game screen frame - matching dialogue box style */}
                <div className="relative" style={{
                    background: 'linear-gradient(180deg, #6a6a7a 0%, #4a4a5a 20%, #3a3a4a 80%, #4a4a5a 100%)',
                    padding: '12px',
                    borderRadius: '8px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.15)',
                }}>
                    {/* Inner bezel */}
                    <div style={{
                        background: 'linear-gradient(180deg, #1a1a2a 0%, #0a0a15 100%)',
                        border: '3px solid #0a0a10',
                        borderRadius: '4px',
                        padding: '3px',
                    }}>
                        {/* Game content area - height adjusted for device: tablet portrait/landscape/desktop */}
                        <div
                            className="relative flex flex-col overflow-hidden"
                            style={{ height: `${viewportHeight}px` }}
                        >
                            {/* Main viewing area - Side-scrolling shooter */}
                            <div className="flex-1 relative flex items-center justify-center">
                                {/* Parallax scrolling background */}
                                <div className="absolute inset-0 z-0 overflow-hidden">
                                    {/* Base background - slowest layer */}
                                    <div
                                        className={`absolute inset-0 bg-bottom ${isBossBattle ? 'animate-scrollBoss' : 'animate-scrollSlow'}`}
                                        style={{
                                            backgroundImage: `url(${backgroundImage})`,
                                            backgroundSize: isBossBattle ? 'auto 600px' : '8000px',
                                            backgroundRepeat: isBossBattle ? 'repeat-x' : 'repeat',
                                            imageRendering: 'pixelated',
                                        }}
                                    />

                                    {/* Parallax star layer 1 - Blue stars (medium speed) */}
                                    <div
                                        className="absolute inset-0 pointer-events-none animate-parallaxMedium"
                                        style={{
                                            backgroundImage: 'url(/assets/images/backgrounds/stars/stars-blue.png)',
                                            backgroundRepeat: 'repeat',
                                            backgroundSize: '4096px',
                                            opacity: 0.4,
                                            imageRendering: 'pixelated',
                                        }}
                                    />

                                </div>

                                {/* Intro/Victory Message Overlay - CRT Monitor Style - Slides up/down from console */}
                                {(introStage === 'intro1' || introStage === 'intro2' || introStage === 'victory') && (
                                    <div
                                        className="absolute inset-0 z-20 flex items-end justify-center cursor-pointer"
                                        onClick={handleDialogueClick}
                                        style={{ paddingBottom: '12px' }} /* Sits just above the control panel border */
                                    >
                                        {/* CRT Monitor frame - slides up/down */}
                                        <div
                                            className={`relative max-w-2xl ${dialogueSlidingOut ? 'animate-slideDownToConsole' : 'animate-slideUpFromConsole'}`}
                                            style={{
                                                background: 'linear-gradient(180deg, #6a6a7a 0%, #4a4a5a 20%, #3a3a4a 80%, #4a4a5a 100%)',
                                                padding: '12px',
                                                borderRadius: '8px 8px 0 0',
                                                boxShadow: '0 -8px 32px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.15)',
                                            }}
                                        >
                                            {/* Support arms/pipes connecting to console */}
                                            <div
                                                className="absolute -bottom-8 left-[20%]"
                                                style={{
                                                    width: '12px',
                                                    height: '32px',
                                                    background: 'linear-gradient(90deg, #5a5a6a 0%, #3a3a4a 50%, #4a4a5a 100%)',
                                                    borderRadius: '0 0 4px 4px',
                                                    boxShadow: '2px 4px 8px rgba(0,0,0,0.4)',
                                                }}
                                            />
                                            <div
                                                className="absolute -bottom-8 right-[20%]"
                                                style={{
                                                    width: '12px',
                                                    height: '32px',
                                                    background: 'linear-gradient(90deg, #4a4a5a 0%, #3a3a4a 50%, #5a5a6a 100%)',
                                                    borderRadius: '0 0 4px 4px',
                                                    boxShadow: '2px 4px 8px rgba(0,0,0,0.4)',
                                                }}
                                            />
                                            {/* Inner bezel */}
                                            <div
                                                style={{
                                                    background: 'linear-gradient(180deg, #1a1a2a 0%, #0a0a15 100%)',
                                                    border: '3px solid #0a0a10',
                                                    borderRadius: '4px',
                                                    padding: '3px',
                                                }}
                                            >
                                                {/* Screen area */}
                                                <div
                                                    className="relative p-6 flex gap-4 overflow-hidden"
                                                    style={{
                                                        background: introStage === 'intro2'
                                                            ? 'linear-gradient(135deg, #1a0000 0%, #0d0000 50%, #140000 100%)'
                                                            : 'linear-gradient(135deg, #001a00 0%, #000d00 50%, #001400 100%)',
                                                        borderRadius: '2px',
                                                        minHeight: '120px',
                                                    }}
                                                >
                                                    {/* CRT Scanline effect */}
                                                    <div
                                                        className="absolute inset-0 pointer-events-none z-10"
                                                        style={{
                                                            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(0,0,0,0.4) 1px, rgba(0,0,0,0.4) 2px)',
                                                            opacity: 0.6,
                                                        }}
                                                    />
                                                    {/* Screen phosphor glow */}
                                                    <div
                                                        className="absolute inset-0 rounded pointer-events-none"
                                                        style={{
                                                            boxShadow: introStage === 'intro2'
                                                                ? 'inset 0 0 40px rgba(255,0,0,0.15)'
                                                                : 'inset 0 0 40px rgba(0,255,0,0.15)'
                                                        }}
                                                    />

                                                    {/* Commander portrait - only for commander dialogues */}
                                                    {(introStage === 'intro1' || introStage === 'victory') && (
                                                        <div className="flex-shrink-0 relative z-0">
                                                            <img
                                                                src="/assets/images/characters/commander.png"
                                                                alt="Commander"
                                                                className="w-24 h-24 object-contain"
                                                                style={{ imageRendering: 'pixelated' }}
                                                            />
                                                        </div>
                                                    )}
                                                    {/* Alien portrait - only for alien dialogues */}
                                                    {introStage === 'intro2' && (
                                                        <div className="flex-shrink-0 relative z-0">
                                                            <img
                                                                src={isFinalBoss ? '/assets/images/characters/zorath.png' : isBossBattle ? '/assets/images/characters/alien-boss.png' : '/assets/images/characters/alien-commander.png'}
                                                                alt={isFinalBoss ? 'Zorath' : isBossBattle ? 'Alien Boss' : 'Alien Commander'}
                                                                className="w-24 h-24 object-contain"
                                                                style={{ imageRendering: 'pixelated' }}
                                                            />
                                                        </div>
                                                    )}
                                                    <div className="flex-1 relative z-0">
                                                        {/* Speaker label */}
                                                        <div className={`text-xs font-bold mb-2 tracking-wider font-pixel ${introStage === 'intro2'
                                                            ? 'text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]'
                                                            : 'text-green-500 drop-shadow-[0_0_8px_rgba(34,197,94,0.8)]'
                                                            }`}>
                                                            {introStage === 'intro1' && '[COMMANDER]'}
                                                            {introStage === 'intro2' && (alienSpeaker ? `[${alienSpeaker}]` : '[ENEMY]')}
                                                            {introStage === 'victory' && '[COMMANDER]'}
                                                        </div>
                                                        <p className={`text-lg font-pixel leading-relaxed ${introStage === 'intro2'
                                                            ? 'text-red-400 drop-shadow-[0_0_6px_rgba(248,113,113,0.6)]'
                                                            : 'text-green-400 drop-shadow-[0_0_6px_rgba(74,222,128,0.6)]'
                                                            }`}>
                                                            "{introMessage}"
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Battle area with ships */}
                                <div className="relative z-10 w-full flex items-center justify-between px-16">
                                    {/* Hero Ship - Left Side */}
                                    {introStage !== 'intro1' && (
                                        <div className={`relative ${introStage === 'heroEnter' ? 'animate-slideDown' :
                                            introStage === 'heroExit' ? 'animate-flyOutRight' :
                                                'animate-hover'
                                            }`}>
                                            <img
                                                src={`/assets/helianthus/ShooterFull/Ships/1/Pattern3/Yellow/Right/${heroFrame}.png`}
                                                alt="Hero Ship"
                                                className="h-20 w-auto"
                                                style={{
                                                    imageRendering: 'pixelated',
                                                }}
                                            />
                                        </div>
                                    )}

                                    {/* Center area - Laser beam on hit */}
                                    <div className="flex-1 flex items-center justify-center relative overflow-visible">
                                        {showLaser && (() => {
                                            const isProjectile = shotFrame <= 5;
                                            const sprite = isProjectile
                                                ? `/assets/helianthus/ShooterFull/Shots/Blue/Shot${shotFrame}.png`
                                                : `/assets/helianthus/ShooterFull/Shots/Blue/ShotHit${shotFrame - 5}.png`;

                                            // Projectile travels across, hit effect at impact point
                                            // Boss ships are larger with protruding cannon, so shot needs to travel further
                                            const hitPoint = isBossBattle ? 125 : 105;
                                            const progressPercent = isProjectile ? (shotFrame - 1) * (hitPoint / 4) : hitPoint;

                                            return (
                                                <img
                                                    src={sprite}
                                                    alt="Laser Shot"
                                                    className="absolute"
                                                    style={{
                                                        imageRendering: 'pixelated',
                                                        height: isProjectile ? '24px' : '32px',
                                                        width: 'auto',
                                                        left: `${progressPercent}%`,
                                                        top: '50%',
                                                        transform: 'translate(-50%, -50%)',
                                                    }}
                                                />
                                            );
                                        })()}
                                    </div>

                                    {/* Enemy Ship - Right Side */}
                                    {introStage !== 'intro1' && introStage !== 'heroEnter' && (
                                        <div className={`relative flex items-center justify-center overflow-visible mr-8 ${introStage === 'enemyEnter' ? 'animate-slideInFromRight' :
                                            gameEnding === 'escape' ? 'animate-slideOut' :
                                                'animate-hover'
                                            }`}>
                                            {/* Ship - always rendered to maintain position, hidden during/after explosion */}
                                            <img
                                                src={enemyImage}
                                                alt="Enemy Ship"
                                                className={`
                                                    ${isBossBattle ? 'h-60' : 'h-20'} w-auto
                                                    ${showFeedback && isCorrect ? 'animate-shake' : ''}
                                                    ${showFeedback && !isCorrect ? (dodgeDirection === 'up' ? 'animate-dodgeUp' : 'animate-dodgeDown') : ''}
                                                    ${gameEnding === 'explosion' ? 'invisible' : ''}
                                                `}
                                                style={{
                                                    imageRendering: 'pixelated',
                                                }}
                                            />
                                            {/* Explosion - absolutely positioned and centered on ship */}
                                            {gameEnding === 'explosion' && explosionFrame > 0 && (
                                                <img
                                                    src={`/assets/helianthus/ShooterFull/Explosions/${isBossBattle ? 'Blue' : 'Red'}/64px/${explosionFrame}.png`}
                                                    alt="Explosion"
                                                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                                                    style={{
                                                        imageRendering: 'pixelated',
                                                        width: isBossBattle ? '280px' : '154px',
                                                        height: isBossBattle ? '280px' : '154px',
                                                        objectFit: 'contain',
                                                    }}
                                                />
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Hit/Miss feedback overlay */}
                                {showFeedback && !(currentIndex === questions.length - 1 && isCorrect && explosionFrame > 0) && introStage !== 'victory' && introStage !== 'heroExit' && !showEscapeOverlay && (
                                    <div className={`
                                        absolute inset-0 z-15 flex items-center justify-center pointer-events-none
                                        ${currentIndex === questions.length - 1 && isCorrect ? 'text-xl' : 'text-5xl'} font-bold
                                        ${isCorrect ? 'text-green-400' : 'text-red-500'}
                                    `}>
                                        {isCorrect
                                            ? (currentIndex === questions.length - 1 ? 'ENEMY DESTROYED!' : 'HIT!')
                                            : 'MISS!'}
                                    </div>
                                )}


                                {/* Game ending overlay - delayed to let escape animation play - CRT Monitor Style - Slides up */}
                                {gameEnding === 'escape' && showEscapeOverlay && defeatMessage && pendingNavigation && (
                                    <div
                                        className="absolute inset-0 z-20 flex items-end justify-center cursor-pointer"
                                        onClick={() => navigate('/result', { state: pendingNavigation })}
                                        style={{ paddingBottom: '12px' }}
                                    >
                                        {/* CRT Monitor frame - slides up */}
                                        <div
                                            className="relative max-w-2xl animate-slideUpFromConsole"
                                            style={{
                                                background: 'linear-gradient(180deg, #6a6a7a 0%, #4a4a5a 20%, #3a3a4a 80%, #4a4a5a 100%)',
                                                padding: '12px',
                                                borderRadius: '8px 8px 0 0',
                                                boxShadow: '0 -8px 32px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.15)',
                                            }}
                                        >
                                            {/* Support arms/pipes connecting to console */}
                                            <div
                                                className="absolute -bottom-8 left-[20%]"
                                                style={{
                                                    width: '12px',
                                                    height: '32px',
                                                    background: 'linear-gradient(90deg, #5a5a6a 0%, #3a3a4a 50%, #4a4a5a 100%)',
                                                    borderRadius: '0 0 4px 4px',
                                                    boxShadow: '2px 4px 8px rgba(0,0,0,0.4)',
                                                }}
                                            />
                                            <div
                                                className="absolute -bottom-8 right-[20%]"
                                                style={{
                                                    width: '12px',
                                                    height: '32px',
                                                    background: 'linear-gradient(90deg, #4a4a5a 0%, #3a3a4a 50%, #5a5a6a 100%)',
                                                    borderRadius: '0 0 4px 4px',
                                                    boxShadow: '2px 4px 8px rgba(0,0,0,0.4)',
                                                }}
                                            />
                                            {/* Inner bezel */}
                                            <div
                                                style={{
                                                    background: 'linear-gradient(180deg, #1a1a2a 0%, #0a0a15 100%)',
                                                    border: '3px solid #0a0a10',
                                                    borderRadius: '4px',
                                                    padding: '3px',
                                                }}
                                            >
                                                {/* Screen area - red tint for defeat */}
                                                <div
                                                    className="relative p-6 flex gap-4 overflow-hidden"
                                                    style={{
                                                        background: 'linear-gradient(135deg, #1a0000 0%, #0d0000 50%, #140000 100%)',
                                                        borderRadius: '2px',
                                                        minHeight: '120px',
                                                    }}
                                                >
                                                    {/* CRT Scanline effect */}
                                                    <div
                                                        className="absolute inset-0 pointer-events-none z-10"
                                                        style={{
                                                            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(0,0,0,0.4) 1px, rgba(0,0,0,0.4) 2px)',
                                                            opacity: 0.6,
                                                        }}
                                                    />
                                                    {/* Screen phosphor glow - red */}
                                                    <div
                                                        className="absolute inset-0 rounded pointer-events-none"
                                                        style={{ boxShadow: 'inset 0 0 40px rgba(255,0,0,0.15)' }}
                                                    />

                                                    {/* Commander portrait */}
                                                    <div className="flex-shrink-0 relative z-0">
                                                        <img
                                                            src="/assets/images/characters/commander.png"
                                                            alt="Commander"
                                                            className="w-24 h-24 object-contain"
                                                            style={{ imageRendering: 'pixelated' }}
                                                        />
                                                    </div>
                                                    <div className="flex-1 relative z-0">
                                                        <div className="text-xs font-bold mb-2 tracking-wider font-pixel text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]">
                                                            [COMMANDER]
                                                        </div>
                                                        <p className="text-lg font-pixel text-red-400 drop-shadow-[0_0_6px_rgba(248,113,113,0.6)] leading-relaxed">
                                                            "{defeatMessage.message}"
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Bottom control panel - Retro Computer Console - z-30 to stay above dialogue */}
                            <div className="relative z-30" style={{
                                minHeight: '280px',
                                borderTop: '12px solid',
                                borderImage: 'linear-gradient(90deg, #2a2a3a 0%, #5a5a6a 50%, #2a2a3a 100%) 1',
                            }}>
                                {/* Panel PNG overlay - on top with transparent cutouts */}
                                <div
                                    className="absolute inset-0 z-10 pointer-events-none"
                                    style={{
                                        backgroundImage: 'url(/assets/images/ui/panels/panel5.png)',
                                        backgroundSize: '100% 100%',
                                        backgroundPosition: 'top left',
                                        backgroundRepeat: 'no-repeat',
                                        imageRendering: 'pixelated',
                                        filter: 'brightness(0.8) sepia(0.2) saturate(0.4) hue-rotate(180deg)',
                                    }}
                                />
                                {/* Content layer */}
                                <div className="relative p-4">

                                    {/* Console layout - Left CRT (small), Right gauges panel */}
                                    <div className="flex gap-2 items-start h-full">
                                        {/* Left side - Small CRT Terminal for question (BEHIND panel cutout) */}
                                        {/* Portrait tablets need less left margin to center content */}
                                        <div className={`w-[314px] mt-[-2px] z-0 ${isPortrait ? 'ml-[18px]' : 'ml-[38px]'}`}>
                                            {/* CRT Screen bezel */}
                                            <div
                                                className="relative py-[60px] px-5 rounded-lg overflow-hidden"
                                                style={{
                                                    background: 'linear-gradient(135deg, #001a00 0%, #000d00 50%, #001400 100%)',
                                                    border: '3px solid #1a1a1a',
                                                    borderRadius: '8px',
                                                    boxShadow: 'inset 0 0 40px rgba(0,255,0,0.1), inset 0 0 15px rgba(0,0,0,0.8), 0 0 15px rgba(0,255,0,0.15)',
                                                }}
                                            >
                                                {/* CRT Scanline effect */}
                                                <div
                                                    className="absolute inset-0 pointer-events-none z-10"
                                                    style={{
                                                        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(0,0,0,0.4) 1px, rgba(0,0,0,0.4) 2px)',
                                                        opacity: 0.6,
                                                    }}
                                                />

                                                {/* Screen phosphor glow */}
                                                <div className="absolute inset-0 rounded-lg pointer-events-none"
                                                    style={{ boxShadow: 'inset 0 0 30px rgba(0,255,0,0.15)' }}
                                                />

                                                {introStage === 'playing' ? (
                                                    <div className="relative z-0 flex flex-col items-center justify-center">
                                                        {/* Question Display */}
                                                        <div className="text-2xl font-bold flex items-center justify-center gap-2 font-pixel mb-3">
                                                            <span className="text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.9)]">{currentQuestion.num1}</span>
                                                            <span className="text-green-600">×</span>
                                                            <span className="text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.9)]">{currentQuestion.num2}</span>
                                                            <span className="text-green-600">=</span>
                                                            {showFeedback ? (
                                                                <span className="text-green-300 drop-shadow-[0_0_10px_rgba(134,239,172,1)]">{currentQuestion.answer}</span>
                                                            ) : (
                                                                <span className="text-green-300 drop-shadow-[0_0_10px_rgba(134,239,172,1)] animate-pulse">?</span>
                                                            )}
                                                        </div>

                                                        {/* Answer Buttons */}
                                                        <div className="grid grid-cols-3 gap-1">
                                                                {(frozenChoices || answerChoices).map((opt, i) => {
                                                                    const isSelected = showFeedback && selectedAnswer === opt;
                                                                    const isCorrectAnswer = opt === currentQuestion.answer;
                                                                    const showAsWrong = isSelected && !isCorrectAnswer;
                                                                    const showAsCorrect = showFeedback && isCorrectAnswer;

                                                                    return (
                                                                        <button
                                                                            key={i}
                                                                            disabled={showFeedback}
                                                                            onClick={() => {
                                                                                setUserAnswer(opt.toString());
                                                                                setSelectedAnswer(opt);
                                                                                setFrozenChoices([...answerChoices]); // Freeze the current choices
                                                                                setShowLaser(true);
                                                                                setShotFired(true);
                                                                                setTimeout(() => setShotFired(false), 500);
                                                                                playSFX('laser', { volume: 0.6 });
                                                                                if (opt === currentQuestion.answer) {
                                                                                    setIsCorrect(true);
                                                                                } else {
                                                                                    setIsCorrect(false);
                                                                                    setDodgeDirection(Math.random() > 0.5 ? 'up' : 'down');
                                                                                }
                                                                                setShowFeedback(true);
                                                                                const updatedQuestions = [...questions];
                                                                                updatedQuestions[currentIndex] = {
                                                                                    ...currentQuestion,
                                                                                    userAnswer: opt,
                                                                                    correct: opt === currentQuestion.answer,
                                                                                };
                                                                                setQuestions(updatedQuestions);
                                                                                // Stop laser animation after a short delay
                                                                                setTimeout(() => setShowLaser(false), 600);
                                                                            }}
                                                                            className={`py-2 px-4 min-w-[60px] text-sm font-bold font-pixel transition-all ${
                                                                                showAsWrong
                                                                                    ? 'text-red-400 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]'
                                                                                    : showAsCorrect
                                                                                        ? 'text-green-300 drop-shadow-[0_0_8px_rgba(134,239,172,0.8)]'
                                                                                        : 'text-green-400 hover:text-green-300 hover:scale-105 active:scale-95'
                                                                            } disabled:cursor-default`}
                                                                            style={{
                                                                                background: showAsWrong
                                                                                    ? 'linear-gradient(180deg, #200a0a 0%, #1a0000 50%, #0d0000 100%)'
                                                                                    : showAsCorrect
                                                                                        ? 'linear-gradient(180deg, #0a300a 0%, #002a00 50%, #001a00 100%)'
                                                                                        : 'linear-gradient(180deg, #0a200a 0%, #001a00 50%, #000d00 100%)',
                                                                                border: showAsWrong
                                                                                    ? '2px solid #4a1a1a'
                                                                                    : showAsCorrect
                                                                                        ? '2px solid #1a5a1a'
                                                                                        : '2px solid #1a4a1a',
                                                                                borderRadius: '3px',
                                                                            }}
                                                                        >
                                                                            {opt}
                                                                        </button>
                                                                    );
                                                                })}
                                                        </div>

                                                        {/* Wave indicator */}
                                                        <div className="flex justify-center items-center mt-4">
                                                            <span className="text-sm text-green-600/50 font-pixel">
                                                                — — —
                                                            </span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    /* Standby mode */
                                                    <div className="h-[120px] flex flex-col items-center justify-center relative z-0">
                                                        <div className="text-lg text-green-400 font-bold font-pixel animate-pulse drop-shadow-[0_0_10px_rgba(74,222,128,0.8)]">
                                                            {introStage === 'intro1' && 'INITIALIZING'}
                                                            {introStage === 'heroEnter' && 'DEPLOYING...'}
                                                            {introStage === 'enemyEnter' && 'DETECTED'}
                                                            {introStage === 'intro2' && 'BATTLE!'}
                                                            {introStage === 'victory' && 'VICTORY'}
                                                            {introStage === 'heroExit' && 'RTB'}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Right side - Gauges layout (ON TOP of panel) */}
                                        <div className="flex-1 flex flex-col z-20">
                                            {/* Top row - Radar above disk station */}
                                            <div className="flex justify-center mt-[22px] ml-[-257px]">
                                                {/* Mini radar - positioned above disk station */}
                                                {/* Portrait: 12px narrower */}
                                                <div
                                                    className={`h-[68px] rounded relative overflow-hidden ${isPortrait ? 'w-[83px]' : 'w-[95px]'}`}
                                                    style={{
                                                        background: 'linear-gradient(145deg, #0a1a0a, #0d1a0d)',
                                                        border: '3px solid #1a2a1a',
                                                    }}
                                                >
                                                    <div className="absolute top-1/2 left-0 right-0 h-px bg-green-900" />
                                                    <div className="absolute left-1/2 top-0 bottom-0 w-px bg-green-900" />
                                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-green-500 rounded-full shadow-[0_0_6px_#22c55e]" />
                                                    <div
                                                        className="absolute top-1/2 left-1/2 w-6 h-0.5 bg-gradient-to-r from-green-500 to-transparent origin-left animate-spin"
                                                        style={{ animationDuration: '3s' }}
                                                    />
                                                    {introStage === 'playing' && (
                                                        <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full shadow-[0_0_6px_#ef4444] animate-pulse" />
                                                    )}
                                                    {/* Scanline effect */}
                                                    <div
                                                        className="absolute inset-0 pointer-events-none"
                                                        style={{
                                                            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(0,0,0,0.4) 1px, rgba(0,0,0,0.4) 2px)',
                                                            opacity: 0.6,
                                                        }}
                                                    />
                                                </div>
                                            </div>

                                            {/* Top right rectangle - Gauges */}
                                            {/* Portrait: shift right 30px and 20px narrower */}
                                            <div
                                                className={`absolute top-[35px] h-[73px] overflow-hidden ${isPortrait ? 'right-[20px] w-[230px]' : 'right-[30px] w-[250px]'}`}
                                                style={{
                                                    background: 'linear-gradient(180deg, #0a0a0a, #050505)',
                                                    border: '2px solid #1a2a1a',
                                                }}
                                            >
                                                {/* Screen phosphor glow */}
                                                <div className="absolute inset-0 pointer-events-none"
                                                    style={{ boxShadow: 'inset 0 0 35px rgba(0,255,0,0.18)' }}
                                                />
                                                {/* Scanline effect */}
                                                <div
                                                    className="absolute inset-0 pointer-events-none z-30"
                                                    style={{
                                                        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(0,0,0,0.4) 1px, rgba(0,0,0,0.4) 2px)',
                                                        opacity: 0.6,
                                                    }}
                                                />
                                            </div>
                                            {/* Portrait: shift right 10px more (content only) */}
                                            <div className={`absolute top-[45px] flex items-center gap-[22px] z-20 ${isPortrait ? 'right-[30px]' : 'right-[50px]'}`}>
                                                {/* Circular gauge - Power */}
                                                <div className="flex flex-col items-center mr-[-7px]">
                                                    <div
                                                        className="relative w-14 h-14 rounded-full flex items-center justify-center"
                                                        style={{
                                                            background: 'linear-gradient(145deg, #0d1a0d, #050d05)',
                                                            border: '3px solid #1a2a1a',
                                                            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.8), 0 0 8px rgba(0,255,0,0.1)',
                                                        }}
                                                    >
                                                        <div className="absolute inset-1 rounded-full border border-green-900" />
                                                        <div
                                                            className="absolute w-0.5 h-5 origin-bottom"
                                                            style={{
                                                                bottom: '50%',
                                                                background: 'linear-gradient(to top, #22c55e, #86efac)',
                                                                boxShadow: '0 0 6px #22c55e',
                                                                animation: shotFired
                                                                    ? 'needleShot 0.3s ease-out, needleColorShift 1s ease-out'
                                                                    : 'needleFluctuate 2.5s ease-in-out infinite',
                                                            }}
                                                        />
                                                        <div className="w-2 h-2 rounded-full bg-green-900 border border-green-700" />
                                                    </div>
                                                                                                    </div>

                                                {/* Vertical bar meters */}
                                                <div className="flex gap-1">
                                                    {['ENG', 'PWR', 'WPN', 'SHD', 'TGT'].map((label, index) => (
                                                        <div key={label} className="flex flex-col items-center">
                                                            <div
                                                                className="w-3 h-12 rounded-sm relative overflow-hidden"
                                                                style={{
                                                                    background: 'linear-gradient(180deg, #050d05, #0d1a0d)',
                                                                    border: '2px solid #1a2a1a',
                                                                }}
                                                            >
                                                                <div
                                                                    className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-green-600 to-green-400"
                                                                    style={{
                                                                        boxShadow: '0 0 6px #22c55e',
                                                                        animation: `barFluctuate${index} ${1.5 + index * 0.3}s ease-in-out infinite`,
                                                                        height: introStage === 'playing' ? '75%' : '30%',
                                                                        transition: 'height 0.7s ease',
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                                <style>{`
                                                    @keyframes barFluctuate0 { 0%, 100% { height: 75%; } 50% { height: 85%; } }
                                                    @keyframes barFluctuate1 { 0%, 100% { height: 80%; } 50% { height: 65%; } }
                                                    @keyframes barFluctuate2 { 0%, 100% { height: 70%; } 50% { height: 90%; } }
                                                    @keyframes barFluctuate3 { 0%, 100% { height: 85%; } 50% { height: 70%; } }
                                                    @keyframes barFluctuate4 { 0%, 100% { height: 65%; } 50% { height: 80%; } }
                                                    @keyframes needleFluctuate { 0%, 100% { transform: rotate(30deg); } 25% { transform: rotate(50deg); } 50% { transform: rotate(35deg); } 75% { transform: rotate(55deg); } }
                                                    @keyframes needleShot { 0% { transform: rotate(45deg); } 30% { transform: rotate(120deg); } 100% { transform: rotate(45deg); } }
                                                    @keyframes needleColorShift { 0% { background: linear-gradient(to top, #22c55e, #86efac); box-shadow: 0 0 6px #22c55e; } 10% { background: linear-gradient(to top, #f97316, #fbbf24); box-shadow: 0 0 12px #f97316; } 60% { background: linear-gradient(to top, #f97316, #fbbf24); box-shadow: 0 0 12px #f97316; } 100% { background: linear-gradient(to top, #22c55e, #86efac); box-shadow: 0 0 6px #22c55e; } }
                                                `}</style>

                                                {/* Temperature display */}
                                                <div className="flex flex-col items-center">
                                                    <div
                                                        className="w-12 h-12 rounded flex items-center justify-center"
                                                        style={{
                                                            background: 'linear-gradient(180deg, #0d1a0d, #050d05)',
                                                            border: '3px solid #1a2a1a',
                                                        }}
                                                    >
                                                        <span className="text-base text-green-400 font-bold font-pixel drop-shadow-[0_0_6px_rgba(74,222,128,0.6)]">47°</span>
                                                    </div>
                                                                                                    </div>
                                            </div>

                                            {/* Bottom right rectangle - Battlezone-style vector display */}
                                            {/* Portrait: shift right 30px and 24px narrower */}
                                            <div
                                                className={`absolute top-[140px] h-[70px] overflow-hidden ${isPortrait ? 'right-[20px] w-[226px]' : 'right-[30px] w-[250px]'}`}
                                                style={{
                                                    background: 'linear-gradient(180deg, #0a0a0a, #050505)',
                                                    border: '2px solid #1a2a1a',
                                                }}
                                            >
                                                {/* Content wrapper - shift left 7px in portrait */}
                                                <div className={`absolute inset-0 ${isPortrait ? '-translate-x-[7px]' : ''}`}>
                                                    {/* Screen phosphor glow */}
                                                    <div className="absolute inset-0 pointer-events-none"
                                                        style={{ boxShadow: 'inset 0 0 35px rgba(0,255,0,0.18)' }}
                                                    />
                                                    {/* Perspective grid floor */}
                                                    <div
                                                        className="absolute bottom-0 left-0 right-0 h-[50px]"
                                                        style={{
                                                            background: `
                                                                linear-gradient(90deg, transparent 49%, #22c55e20 49%, #22c55e20 51%, transparent 51%),
                                                                linear-gradient(0deg, #22c55e30 0%, transparent 100%)
                                                            `,
                                                            backgroundSize: '20px 100%, 100% 100%',
                                                            transform: 'perspective(100px) rotateX(60deg)',
                                                            transformOrigin: 'bottom',
                                                        }}
                                                    />
                                                    {/* Horizontal grid lines */}
                                                    <div className="absolute bottom-[8px] left-0 right-0 h-px bg-green-500/30" />
                                                    <div className="absolute bottom-[16px] left-0 right-0 h-px bg-green-500/20" />
                                                    <div className="absolute bottom-[26px] left-0 right-0 h-px bg-green-500/10" />

                                                    {/* Mountain/pyramid shapes */}
                                                    <svg className="absolute bottom-[25px] left-0 right-0 h-[40px]" viewBox="0 0 250 40" preserveAspectRatio="none">
                                                        {/* Left mountain */}
                                                        <polygon
                                                            points="15,40 40,12 65,40"
                                                            fill="none"
                                                            stroke="#22c55e"
                                                            strokeWidth="1.5"
                                                            style={{ filter: 'drop-shadow(0 0 3px #22c55e)' }}
                                                        />
                                                        {/* Center pyramid */}
                                                        <polygon
                                                            points="90,40 127,6 165,40"
                                                            fill="none"
                                                            stroke="#22c55e"
                                                            strokeWidth="1.5"
                                                            style={{ filter: 'drop-shadow(0 0 3px #22c55e)' }}
                                                        />
                                                        {/* Right mountain */}
                                                        <polygon
                                                            points="175,40 205,15 235,40"
                                                            fill="none"
                                                            stroke="#22c55e"
                                                            strokeWidth="1.5"
                                                            style={{ filter: 'drop-shadow(0 0 3px #22c55e)' }}
                                                        />
                                                    </svg>

                                                    {/* Floating object (enemy tank/UFO style) */}
                                                    <div
                                                        className="absolute top-[12px] animate-pulse"
                                                        style={{
                                                            left: introStage === 'playing' ? '70%' : '30%',
                                                            transition: 'left 2s ease-in-out'
                                                        }}
                                                    >
                                                        <svg width="24" height="16" viewBox="0 0 24 16">
                                                            {/* Simple geometric shape */}
                                                            <ellipse cx="12" cy="10" rx="10" ry="4" fill="none" stroke="#22c55e" strokeWidth="1.5" style={{ filter: 'drop-shadow(0 0 4px #22c55e)' }} />
                                                            <line x1="12" y1="6" x2="12" y2="2" stroke="#22c55e" strokeWidth="1.5" style={{ filter: 'drop-shadow(0 0 4px #22c55e)' }} />
                                                            <circle cx="12" cy="2" r="2" fill="none" stroke="#22c55e" strokeWidth="1" style={{ filter: 'drop-shadow(0 0 4px #22c55e)' }} />
                                                        </svg>
                                                    </div>

                                                    {/* Scanline effect */}
                                                    <div
                                                        className="absolute inset-0 pointer-events-none"
                                                        style={{
                                                            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(0,0,0,0.4) 1px, rgba(0,0,0,0.4) 2px)',
                                                            opacity: 0.6,
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BattleScreen;
