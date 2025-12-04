import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { loadPlayerStats, savePlayerStats, generateQuestions, updateWeakAreas, calculateXP } from '@/utils/gameLogic';
import { initializeCampaignProgress, generateCampaignMission, completeMission, isBossLevel, getLegById } from '@/utils/campaignLogic';
import { isFinalBoss as checkIsFinalBoss } from '@/data/narrative';
import { audioEngine, useSFX } from '@/audio';
import { getBattleMusicForChapter } from '@/audio/sounds';
import { speechService } from '@/audio/SpeechService';
import { selectWaveLine, selectAlienLine, selectVictoryLine, selectDefeatLine, type BodyId } from '@/audio/speechSounds';
import type { Question } from '@/types/game.ts';
import { Star, ArrowLeft } from 'lucide-react';

type IntroStage = 'intro1' | 'heroEnter' | 'enemyEnter' | 'intro2' | 'playing' | 'victory' | 'heroExit';

interface LocationState {
    legId?: string;
    waypointIndex?: number;
    isReplay?: boolean;
}

const BattleScreenMobile: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const locationState = location.state as LocationState | null;
    const { play: playSFX } = useSFX();

    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [, setUserAnswer] = useState('');
    const [showFeedback, setShowFeedback] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    const [enemyImage, setEnemyImage] = useState('');
    const [showLaser, setShowLaser] = useState(false);
    const [shotFrame, setShotFrame] = useState(1);
    const [heroFrame, setHeroFrame] = useState(1);
    const [gameEnding, setGameEnding] = useState<'explosion' | 'escape' | null>(null);
    const [explosionFrame, setExplosionFrame] = useState(1);
    const [isBossBattle, setIsBossBattle] = useState(false);
    const [isFinalBoss, setIsFinalBoss] = useState(false);
    const [backgroundImage, setBackgroundImage] = useState('/assets/helianthus/SpaceBackgrounds/Dark/blue_purple.png');
    const [introStage, setIntroStage] = useState<IntroStage>('intro1');
    const [introMessage, setIntroMessage] = useState('');
    const [alienSpeaker, setAlienSpeaker] = useState<string | undefined>(undefined);
    const [currentBodyId, setCurrentBodyId] = useState('moon');
    const [commanderLine, setCommanderLine] = useState('');
    const [commanderSoundId, setCommanderSoundId] = useState('');
    const [alienLine, setAlienLine] = useState('');
    const [alienSoundId, setAlienSoundId] = useState('');
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
    const [_shotFired, setShotFired] = useState(false);
    const [prevStarCount, setPrevStarCount] = useState(0);
    const [animatingStarIndex, setAnimatingStarIndex] = useState<number | null>(null);
    const [dialogueSlidingOut, setDialogueSlidingOut] = useState(false);

    // Refs for cleanup and stable callbacks
    const escapeNavigationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const escapeOverlayTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const dialogueSlidingOutRef = useRef(false);

    // Load game state
    useEffect(() => {
        const stats = loadPlayerStats();
        const progress = stats.campaignProgress || initializeCampaignProgress();

        const activeLegId = locationState?.legId || progress.currentLegId;
        const activeWaypointIndex = locationState?.waypointIndex ?? progress.currentWaypointIndex;

        const currentLeg = getLegById(activeLegId);
        const isBoss = currentLeg ? isBossLevel(activeWaypointIndex, currentLeg.waypointsRequired) : false;

        const settings = generateCampaignMission(activeLegId, isBoss);
        const newQuestions = generateQuestions(settings, stats);
        setQuestions(newQuestions);

        if (currentLeg) {
            const isFinal = checkIsFinalBoss(currentLeg.toBodyId, isBoss);
            setIsBossBattle(isBoss);
            setIsFinalBoss(isFinal);
            setCurrentBodyId(currentLeg.toBodyId);

            const battleMusicId = isFinal ? 'zorathFightMusic' : (isBoss ? 'bossFightMusic' : getBattleMusicForChapter(currentLeg.chapter));
            audioEngine.playMusic(battleMusicId);
            audioEngine.stopAmbience('menuAmbience');
            audioEngine.startAmbience('spaceAmbience');

            const waveDialogue = selectWaveLine(currentLeg.toBodyId as BodyId, isBoss);
            setCommanderLine(waveDialogue.text);
            setCommanderSoundId(waveDialogue.soundId);

            const alienDialogue = selectAlienLine(currentLeg.toBodyId as BodyId, isBoss);
            setAlienLine(alienDialogue.text);
            setAlienSoundId(alienDialogue.soundId);
            setAlienSpeaker(alienDialogue.name);

            if (isBoss) {
                const planetBackgrounds: Record<string, string> = {
                    moon: '/assets/helianthus/Landscapes/Barren/1.png',
                    mars: '/assets/helianthus/Landscapes/Desert/1.png',
                    ceres: '/assets/helianthus/Landscapes/Barren/2.png',
                    jupiter: '/assets/helianthus/Landscapes/Gas_giant_rings/1.png',
                    europa: '/assets/helianthus/Landscapes/Arctic/1.png',
                    saturn: '/assets/helianthus/Landscapes/Gas_giant_rings/2.png',
                    titan: '/assets/helianthus/Landscapes/Terran/1.png',
                    uranus: '/assets/helianthus/Landscapes/Gas_giant_rings/3.png',
                    neptune: '/assets/helianthus/Landscapes/Gas_giant_rings/4.png',
                    pluto: '/assets/helianthus/Landscapes/Tundra/1.png',
                    haumea: '/assets/helianthus/Landscapes/Arctic/1.png',
                    makemake: '/assets/helianthus/Landscapes/Lava/1.png',
                    eris: '/assets/helianthus/Landscapes/Tundra/1.png',
                    arrokoth: '/assets/helianthus/Landscapes/Barren/3.png',
                };
                setBackgroundImage(planetBackgrounds[currentLeg.toBodyId] || '/assets/helianthus/Landscapes/Barren/4.png');
            } else {
                setBackgroundImage('/assets/helianthus/SpaceBackgrounds/Dark/blue_purple.png');
            }
        }

        if (currentLeg) {
            if (isBoss) {
                setEnemyImage('/assets/1Ships/BossShip1Small.png');
            } else {
                const enemyShips = [
                    '/assets/helianthus/ShooterFull/Ships/2/Pattern1/Red/Left/1.png',
                    '/assets/helianthus/ShooterFull/Ships/2/Pattern2/Blue/Left/1.png',
                    '/assets/helianthus/ShooterFull/Ships/3/Pattern1/Green/Left/1.png',
                    '/assets/helianthus/ShooterFull/Ships/3/Pattern2/Red/Left/1.png',
                    '/assets/helianthus/ShooterFull/Ships/4/Pattern1/Blue/Left/1.png',
                    '/assets/helianthus/ShooterFull/Ships/4/Pattern2/Green/Left/1.png',
                    '/assets/helianthus/ShooterFull/Ships/5/Pattern1/Red/Left/1.png',
                    '/assets/helianthus/ShooterFull/Ships/5/Pattern2/Blue/Left/1.png',
                    '/assets/helianthus/ShooterFull/Ships/6/Pattern1/Green/Left/1.png',
                    '/assets/helianthus/ShooterFull/Ships/6/Pattern2/Red/Left/1.png',
                ];
                setEnemyImage(enemyShips[Math.floor(Math.random() * enemyShips.length)]);
            }
        }
    }, [locationState]);

    // Hero ship animation
    useEffect(() => {
        const interval = setInterval(() => {
            setHeroFrame(prev => (prev % 6) + 1);
        }, 100);
        return () => clearInterval(interval);
    }, []);

    // Preload explosion assets
    useEffect(() => {
        audioEngine.preload('explosion');
        const explosionColors = ['Red', 'Blue'];
        explosionColors.forEach(color => {
            for (let frame = 1; frame <= 8; frame++) {
                const img = new Image();
                img.src = `/assets/helianthus/ShooterFull/Explosions/${color}/64px/${frame}.png`;
            }
        });
    }, []);

    // Shot animation
    useEffect(() => {
        if (!showLaser) {
            setShotFrame(1);
            return;
        }
        const interval = setInterval(() => {
            setShotFrame(prev => {
                if (prev < 11) return prev + 1;
                return 11;
            });
        }, 50);
        return () => clearInterval(interval);
    }, [showLaser]);

    // Explosion animation
    useEffect(() => {
        if (gameEnding !== 'explosion') {
            setExplosionFrame(1);
            return;
        }
        let frameCount = 1;
        const interval = setInterval(() => {
            frameCount++;
            setExplosionFrame(prev => {
                if (prev < 8) return prev + 1;
                return 8;
            });
            if (frameCount > 8) {
                clearInterval(interval);
                setTimeout(() => setExplosionFrame(0), 50);
            }
        }, 100);
        return () => clearInterval(interval);
    }, [gameEnding]);

    // Victory sequence
    useEffect(() => {
        if (gameEnding === 'explosion' && explosionFrame === 0) {
            const timeout = setTimeout(() => {
                setIntroStage('victory');
                const isFinal = checkIsFinalBoss(currentBodyId, isBossBattle);
                const victoryDialogue = selectVictoryLine(isBossBattle, isFinal);
                setIntroMessage(victoryDialogue.text);
                setVictorySoundId(victoryDialogue.soundId);
            }, 500);
            return () => clearTimeout(timeout);
        }
    }, [gameEnding, explosionFrame, currentBodyId, isBossBattle]);

    const advanceToNextQuestion = useCallback(() => {
        if (!showFeedback || questions.length === 0) return;
        const isLastQuestion = currentIndex === questions.length - 1;
        if (isLastQuestion) {
            handleGameComplete(questions);
        } else {
            setCurrentIndex(currentIndex + 1);
            setUserAnswer('');
            setShowFeedback(false);
            setSelectedAnswer(null);
            setFrozenChoices(null);
        }
    }, [showFeedback, currentIndex, questions]);

    // Auto-advance after each question (shorter wait on last question)
    useEffect(() => {
        if (showFeedback && questions.length > 0) {
            const isLastQuestion = currentIndex === questions.length - 1;
            const timeout = setTimeout(() => {
                advanceToNextQuestion();
            }, isLastQuestion ? 1500 : 3000);
            return () => clearTimeout(timeout);
        }
    }, [showFeedback, questions.length, currentIndex, advanceToNextQuestion]);

    // Handle click to advance dialogue
    const handleDialogueClick = useCallback(() => {
        if (dialogueSlidingOutRef.current) return;
        speechService.stopCurrentSpeech();

        if (introStage === 'intro1') {
            dialogueSlidingOutRef.current = true;
            setDialogueSlidingOut(true);
            setTimeout(() => {
                dialogueSlidingOutRef.current = false;
                setDialogueSlidingOut(false);
                setIntroStage('heroEnter');
                playSFX('shipSlide1', { volume: 0.5 });
                setTimeout(() => {
                    setIntroStage('enemyEnter');
                    playSFX('shipSlide2', { volume: 0.5 });
                }, 1200);
                setTimeout(() => {
                    setIntroStage('intro2');
                    setIntroMessage(alienLine);
                }, 2400);
            }, 500);
        } else if (introStage === 'intro2') {
            dialogueSlidingOutRef.current = true;
            setDialogueSlidingOut(true);
            setTimeout(() => {
                dialogueSlidingOutRef.current = false;
                setDialogueSlidingOut(false);
                setIntroStage('playing');
            }, 500);
        } else if (introStage === 'victory') {
            dialogueSlidingOutRef.current = true;
            setDialogueSlidingOut(true);
            setTimeout(() => {
                dialogueSlidingOutRef.current = false;
                setDialogueSlidingOut(false);
                setIntroStage('heroExit');
                playSFX('shipSlide3', { volume: 0.5 });
            }, 500);
        }
    }, [introStage, alienLine]);

    // Intro sequence
    useEffect(() => {
        if (!commanderLine || !alienLine) return;
        setIntroStage('intro1');
        setIntroMessage(commanderLine);
    }, [commanderLine, alienLine]);

    // Play commander speech
    useEffect(() => {
        if (introStage === 'intro1' && commanderSoundId) {
            let cancelled = false;
            let timeoutId: ReturnType<typeof setTimeout>;
            const startTime = Date.now();
            const minDisplayTime = 3000;

            speechService.playById(commanderSoundId).then(() => {
                if (cancelled) return;
                const elapsed = Date.now() - startTime;
                const remainingTime = Math.max(0, minDisplayTime - elapsed);
                timeoutId = setTimeout(() => {
                    if (!cancelled) handleDialogueClick();
                }, remainingTime);
            });

            return () => {
                cancelled = true;
                if (timeoutId) clearTimeout(timeoutId);
            };
        }
    }, [introStage, commanderSoundId, handleDialogueClick]);

    // Play alien speech
    useEffect(() => {
        if (introStage === 'intro2' && alienSoundId) {
            let cancelled = false;
            let timeoutId: ReturnType<typeof setTimeout>;
            const startTime = Date.now();
            const minDisplayTime = 3000;

            speechService.playAlienById(alienSoundId).then(() => {
                if (cancelled) return;
                const elapsed = Date.now() - startTime;
                const remainingTime = Math.max(0, minDisplayTime - elapsed);
                timeoutId = setTimeout(() => {
                    if (!cancelled) handleDialogueClick();
                }, remainingTime);
            });

            return () => {
                cancelled = true;
                if (timeoutId) clearTimeout(timeoutId);
            };
        }
    }, [introStage, alienSoundId, handleDialogueClick]);

    // Play victory speech
    useEffect(() => {
        if (introStage === 'victory' && victorySoundId) {
            let cancelled = false;
            let timeoutId: ReturnType<typeof setTimeout>;
            const startTime = Date.now();
            const minDisplayTime = 3000;

            speechService.playById(victorySoundId).then(() => {
                if (cancelled) return;
                const elapsed = Date.now() - startTime;
                const remainingTime = Math.max(0, minDisplayTime - elapsed);
                timeoutId = setTimeout(() => {
                    if (!cancelled) handleDialogueClick();
                }, remainingTime);
            });

            return () => {
                cancelled = true;
                if (timeoutId) clearTimeout(timeoutId);
            };
        }
    }, [introStage, victorySoundId, handleDialogueClick]);

    // Play defeat speech
    useEffect(() => {
        if (showEscapeOverlay && defeatSoundId) {
            speechService.playById(defeatSoundId);
        }
    }, [showEscapeOverlay, defeatSoundId]);

    // Navigation after hero exit
    useEffect(() => {
        if (introStage === 'heroExit' && pendingNavigation) {
            const timeout = setTimeout(() => {
                navigate('/result', { state: pendingNavigation });
            }, 1200);
            return () => clearTimeout(timeout);
        }
    }, [introStage, pendingNavigation, navigate]);

    // Cleanup timeouts on unmount
    useEffect(() => {
        return () => {
            if (escapeNavigationTimeoutRef.current) clearTimeout(escapeNavigationTimeoutRef.current);
            if (escapeOverlayTimeoutRef.current) clearTimeout(escapeOverlayTimeoutRef.current);
        };
    }, []);

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
        const stats = loadPlayerStats();
        const currentProgress = stats.campaignProgress || initializeCampaignProgress();
        const activeLegId = locationState?.legId || currentProgress.currentLegId;

        const correctCount = finalQuestions.filter(q => q.correct).length;
        const scorePercentage = (correctCount / finalQuestions.length) * 100;
        const xpEarned = calculateXP(correctCount, finalQuestions.length);

        if (scorePercentage >= 70) {
            setGameEnding('explosion');
            setTimeout(() => playSFX('explosion', { volume: 0.7 }), 200);
        } else {
            setGameEnding('escape');
            playSFX('shipSlide4', { volume: 0.5 });
            const defeatDialogue = selectDefeatLine(isBossBattle);
            setDefeatMessage({ message: defeatDialogue.text, encouragement: '' });
            setDefeatSoundId(defeatDialogue.soundId);
        }

        const isReplay = locationState?.isReplay || false;
        const playedWaypointIndex = locationState?.waypointIndex ?? currentProgress.currentWaypointIndex;
        const newStats = {
            ...stats,
            totalXP: stats.totalXP + xpEarned,
            weakAreas: updateWeakAreas(finalQuestions, stats.weakAreas),
            campaignProgress: isReplay
                ? currentProgress
                : completeMission(currentProgress, correctCount, finalQuestions.length, activeLegId, playedWaypointIndex),
        };
        savePlayerStats(newStats);

        const navData = {
            questions: finalQuestions,
            xpEarned,
            passed: scorePercentage >= 70,
            legId: activeLegId,
            waypointIndex: locationState?.waypointIndex ?? currentProgress.currentWaypointIndex,
            isReplay: locationState?.isReplay || false,
        };
        setPendingNavigation(navData);

        if (scorePercentage < 70) {
            escapeOverlayTimeoutRef.current = setTimeout(() => setShowEscapeOverlay(true), 1500);
            escapeNavigationTimeoutRef.current = setTimeout(() => {
                navigate('/result', { state: navData });
            }, 7000);
        }
    };

    return (
        <div className="fixed inset-0 flex flex-col bg-space-black overflow-hidden">
            {/* Full-screen click overlay to skip question feedback wait */}
            {showFeedback && introStage === 'playing' && !gameEnding && (
                <div
                    className="fixed inset-0 z-50 cursor-pointer"
                    onClick={advanceToNextQuestion}
                />
            )}

            {/* Top HUD - Back button and stars */}
            <div className="flex-shrink-0 flex items-center justify-between px-3 py-2 bg-industrial-dark/90 border-b border-industrial-metal/30 z-10">
                <button
                    onClick={() => navigate('/map')}
                    className="flex items-center gap-1 px-2 py-1 text-xs text-white/80 active:text-white"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>MAP</span>
                </button>

                {/* Stars */}
                <div className="flex gap-1">
                    {(() => {
                        const correctCount = questions.filter(q => q.correct === true).length;
                        const totalQuestions = questions.length;
                        const thresholdFor2Stars = Math.ceil(totalQuestions * 0.7);
                        const thresholdFor3Stars = Math.ceil(totalQuestions * 0.9);

                        let earnedStars = 0;
                        if (correctCount >= thresholdFor3Stars) earnedStars = 3;
                        else if (correctCount >= thresholdFor2Stars) earnedStars = 2;
                        else if (correctCount > 0) earnedStars = 1;

                        if (earnedStars > prevStarCount) {
                            setPrevStarCount(earnedStars);
                            setTimeout(() => {
                                setAnimatingStarIndex(earnedStars - 1);
                                playSFX('starEarned');
                                setTimeout(() => setAnimatingStarIndex(null), 500);
                            }, 800);
                        }

                        return Array.from({ length: 3 }).map((_, i) => (
                            <Star
                                key={i}
                                className={`w-5 h-5 ${
                                    i < earnedStars
                                        ? 'text-yellow-400 fill-yellow-400'
                                        : 'text-gray-600'
                                } ${animatingStarIndex === i ? 'animate-starPop' : ''}`}
                            />
                        ));
                    })()}
                </div>
            </div>

            {/* Enemy Shield Progress */}
            <div className="flex-shrink-0 px-3 py-1.5 bg-industrial-dark/50">
                <div className="flex gap-0.5 justify-center">
                    {questions.map((q, i) => {
                        let colorClass = 'bg-gray-600';
                        if (i < currentIndex) {
                            colorClass = q.correct ? 'bg-green-500' : 'bg-red-500';
                        } else if (i === currentIndex) {
                            colorClass = 'bg-yellow-500 animate-pulse';
                        }
                        return (
                            <div
                                key={i}
                                className={`h-1.5 flex-1 max-w-6 ${colorClass}`}
                                style={{
                                    borderRadius: i === 0 ? '2px 0 0 2px' : i === questions.length - 1 ? '0 2px 2px 0' : '0',
                                }}
                            />
                        );
                    })}
                </div>
            </div>

            {/* Battle Area - Takes remaining space */}
            <div className="flex-1 relative overflow-hidden">
                {/* Parallax Background */}
                <div className="absolute inset-0 z-0">
                    <div
                        className={`absolute inset-0 bg-bottom ${isBossBattle ? 'animate-scrollBoss' : 'animate-scrollSlow'}`}
                        style={{
                            backgroundImage: `url(${backgroundImage})`,
                            backgroundSize: isBossBattle ? 'auto 300px' : '4000px',
                            backgroundRepeat: isBossBattle ? 'repeat-x' : 'repeat',
                            imageRendering: 'pixelated',
                        }}
                    />
                    <div
                        className="absolute inset-0 pointer-events-none animate-parallaxMedium"
                        style={{
                            backgroundImage: 'url(/assets/helianthus/SpaceBackgrounds/stars_blue.png)',
                            backgroundRepeat: 'repeat',
                            backgroundSize: '2048px',
                            opacity: 0.4,
                            imageRendering: 'pixelated',
                        }}
                    />
                    <div
                        className="absolute inset-0 pointer-events-none animate-parallaxSlow"
                        style={{
                            backgroundImage: 'url(/assets/helianthus/SpaceBackgrounds/stars_yellow.png)',
                            backgroundRepeat: 'repeat',
                            backgroundSize: '2048px',
                            opacity: 0.5,
                            imageRendering: 'pixelated',
                        }}
                    />
                </div>

                {/* Ships - Horizontal layout (left-to-right) */}
                <div className="absolute inset-0 z-10 flex items-center justify-between px-4">
                    {/* Hero Ship - Left */}
                    {introStage !== 'intro1' && (
                        <div className={`relative ${
                            introStage === 'heroEnter' ? 'animate-slideDown' :
                            introStage === 'heroExit' ? 'animate-flyOutRight' :
                            'animate-hoverSmall'
                        }`}>
                            <img
                                src={`/assets/helianthus/ShooterFull/Ships/1/Pattern3/Yellow/Right/${heroFrame}.png`}
                                alt="Hero Ship"
                                className="h-12 w-auto"
                                style={{ imageRendering: 'pixelated' }}
                            />
                        </div>
                    )}

                    {/* Laser beam */}
                    <div className="flex-1 flex items-center justify-center relative overflow-visible">
                        {showLaser && (() => {
                            const isProjectile = shotFrame <= 5;
                            const sprite = isProjectile
                                ? `/assets/helianthus/ShooterFull/Shots/Blue/Shot${shotFrame}.png`
                                : `/assets/helianthus/ShooterFull/Shots/Blue/ShotHit${shotFrame - 5}.png`;
                            const hitPoint = isBossBattle ? 125 : 105;
                            const progressPercent = isProjectile ? (shotFrame - 1) * (hitPoint / 4) : hitPoint;

                            return (
                                <img
                                    src={sprite}
                                    alt="Laser Shot"
                                    className="absolute"
                                    style={{
                                        imageRendering: 'pixelated',
                                        height: isProjectile ? '16px' : '24px',
                                        width: 'auto',
                                        left: `${progressPercent}%`,
                                        top: '50%',
                                        transform: 'translate(-50%, -50%)',
                                    }}
                                />
                            );
                        })()}
                    </div>

                    {/* Enemy Ship - Right */}
                    {introStage !== 'intro1' && introStage !== 'heroEnter' && (
                        <div className={`relative ${
                            introStage === 'enemyEnter' ? 'animate-slideInFromRight' :
                            gameEnding === 'escape' ? 'animate-slideOut' :
                            'animate-hoverSmall'
                        }`}>
                            <img
                                src={enemyImage}
                                alt="Enemy Ship"
                                className={`
                                    ${isBossBattle ? 'h-32' : 'h-12'} w-auto
                                    ${showFeedback && isCorrect ? 'animate-shake' : ''}
                                    ${showFeedback && !isCorrect ? (dodgeDirection === 'up' ? 'animate-dodgeUp' : 'animate-dodgeDown') : ''}
                                    ${gameEnding === 'explosion' ? 'invisible' : ''}
                                `}
                                style={{ imageRendering: 'pixelated' }}
                            />
                            {gameEnding === 'explosion' && explosionFrame > 0 && (
                                <img
                                    src={`/assets/helianthus/ShooterFull/Explosions/${isBossBattle ? 'Blue' : 'Red'}/64px/${explosionFrame}.png`}
                                    alt="Explosion"
                                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20"
                                    style={{ imageRendering: 'pixelated' }}
                                />
                            )}
                        </div>
                    )}
                </div>

                {/* Hit/Miss feedback */}
                {showFeedback && !(currentIndex === questions.length - 1 && isCorrect && explosionFrame > 0) && introStage !== 'victory' && introStage !== 'heroExit' && !showEscapeOverlay && (
                    <div className={`absolute inset-x-0 top-1/4 z-15 flex justify-center pointer-events-none
                        text-xl font-bold text-center ${isCorrect ? 'text-green-400' : 'text-red-500'}`}>
                        {isCorrect
                            ? (currentIndex === questions.length - 1 ? 'DESTROYED!' : 'HIT!')
                            : 'MISS!'}
                    </div>
                )}

                {/* Dialogue overlays */}
                {(introStage === 'intro1' || introStage === 'intro2' || introStage === 'victory') && (
                    <div
                        className="absolute inset-x-0 bottom-0 z-20 p-3"
                        onClick={handleDialogueClick}
                    >
                        <div className={`bg-black/90 border-2 rounded-lg p-3 ${
                            dialogueSlidingOut ? 'animate-slideDownToConsole' : 'animate-slideUpFromConsole'
                        } ${introStage === 'intro2' ? 'border-red-500/50' : 'border-green-500/50'}`}>
                            <div className="flex gap-3">
                                {/* Portrait */}
                                <div className="flex-shrink-0">
                                    <img
                                        src={introStage === 'intro2'
                                            ? (isFinalBoss ? '/assets/1GameCharacters/Zorath.png' : isBossBattle ? '/assets/1GameCharacters/AlienBoss.png' : '/assets/1GameCharacters/AlienCommander.png')
                                            : '/assets/1GameCharacters/Commander.png'}
                                        alt={introStage === 'intro2' ? 'Alien' : 'Commander'}
                                        className="w-12 h-12 object-contain"
                                        style={{ imageRendering: 'pixelated' }}
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className={`text-[10px] font-bold mb-1 tracking-wider ${
                                        introStage === 'intro2' ? 'text-red-500' : 'text-green-500'
                                    }`}>
                                        {introStage === 'intro1' && '[COMMANDER]'}
                                        {introStage === 'intro2' && (alienSpeaker ? `[${alienSpeaker}]` : '[ENEMY]')}
                                        {introStage === 'victory' && '[COMMANDER]'}
                                    </div>
                                    <p className={`text-xs leading-relaxed ${
                                        introStage === 'intro2' ? 'text-red-300' : 'text-green-300'
                                    }`}>
                                        "{introMessage}"
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Escape/Defeat overlay */}
                {gameEnding === 'escape' && showEscapeOverlay && defeatMessage && pendingNavigation && (
                    <div
                        className="absolute inset-x-0 bottom-0 z-20 p-3"
                        onClick={() => navigate('/result', { state: pendingNavigation })}
                    >
                        <div className="bg-black/90 border-2 border-red-500/50 rounded-lg p-3 animate-slideUpFromConsole">
                            <div className="flex gap-3">
                                <div className="flex-shrink-0">
                                    <img
                                        src="/assets/1GameCharacters/Commander.png"
                                        alt="Commander"
                                        className="w-12 h-12 object-contain"
                                        style={{ imageRendering: 'pixelated' }}
                                    />
                                </div>
                                <div className="flex-1">
                                    <div className="text-[10px] font-bold mb-1 tracking-wider text-red-500">
                                        [COMMANDER]
                                    </div>
                                    <p className="text-xs text-red-300 leading-relaxed">
                                        "{defeatMessage.message}"
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Question Panel - Fixed at bottom */}
            <div className="flex-shrink-0 bg-industrial-dark border-t-4 border-industrial-metal">
                {introStage === 'playing' ? (
                    <div className="p-3">
                        {/* Question */}
                        <div className="text-xl font-bold flex items-center justify-center gap-2 font-mono mb-3">
                            <span className="text-green-400">{currentQuestion.num1}</span>
                            <span className="text-green-600">×</span>
                            <span className="text-green-400">{currentQuestion.num2}</span>
                            <span className="text-green-600">=</span>
                            {showFeedback ? (
                                <span className="text-green-300">{currentQuestion.answer}</span>
                            ) : (
                                <span className="text-green-300 animate-pulse">?</span>
                            )}
                        </div>

                        {/* Answer Buttons */}
                        <div className="grid grid-cols-3 gap-2">
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
                                            setFrozenChoices([...answerChoices]);
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
                                            setTimeout(() => setShowLaser(false), 600);
                                        }}
                                        className={`py-3 text-lg font-bold font-mono rounded-lg transition-all ${
                                            showAsWrong
                                                ? 'bg-red-900/50 text-red-400 border-2 border-red-500'
                                                : showAsCorrect
                                                    ? 'bg-green-900/50 text-green-300 border-2 border-green-500'
                                                    : 'bg-industrial-blue text-green-400 border-2 border-industrial-metal active:scale-95'
                                        } disabled:cursor-default`}
                                    >
                                        {opt}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    /* Standby mode */
                    <div className="h-24 flex items-center justify-center">
                        <div className="text-lg text-green-400 font-bold font-mono animate-pulse">
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

            {/* Safe area padding at bottom */}
            <div className="flex-shrink-0 bg-industrial-dark" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }} />
        </div>
    );
};

export default BattleScreenMobile;
