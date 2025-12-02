import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { PixelProgressBar } from '@/components/ui/PixelProgressBar';
import { loadPlayerStats, savePlayerStats, generateQuestions, updateWeakAreas, calculateXP } from '@/utils/gameLogic';
import { initializeCampaignProgress, generateCampaignMission, completeMission, isBossLevel, getLegById } from '@/utils/campaignLogic';
import { isFinalBoss as checkIsFinalBoss } from '@/data/narrative';
import { audioEngine, useSFX } from '@/audio';
import { getBattleMusicForChapter } from '@/audio/sounds';
import { speechService } from '@/audio/SpeechService';
import { selectWaveLine, selectAlienLine, selectVictoryLine, selectDefeatLine, type BodyId } from '@/audio/speechSounds';
import type { Question } from '@/types/game.ts';
import { Heart, ArrowLeft } from 'lucide-react';

type IntroStage = 'intro1' | 'heroEnter' | 'enemyEnter' | 'intro2' | 'playing' | 'victory' | 'heroExit';

interface LocationState {
    legId?: string;
    waypointIndex?: number;
    isReplay?: boolean;
}

const BattleScreen: React.FC = () => {
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
    const [showEscapeOverlay, setShowEscapeOverlay] = useState(false);
    const [defeatMessage, setDefeatMessage] = useState<{ message: string; encouragement: string } | null>(null);
    const [defeatSoundId, setDefeatSoundId] = useState('');
    const [shotFired, setShotFired] = useState(false);

    // Refs for cleanup
    const escapeNavigationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const escapeOverlayTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Load game state
    useEffect(() => {
        const stats = loadPlayerStats();
        const progress = stats.campaignProgress || initializeCampaignProgress();

        // Use location state if available (from MissionScreen), otherwise use saved progress
        const activeLegId = locationState?.legId || progress.currentLegId;
        const activeWaypointIndex = locationState?.waypointIndex ?? progress.currentWaypointIndex;

        const settings = generateCampaignMission(activeLegId);

        const newQuestions = generateQuestions(settings, stats);
        setQuestions(newQuestions);

        // Determine background based on mission type
        const currentLeg = getLegById(activeLegId);
        if (currentLeg) {
            const isBoss = isBossLevel(activeWaypointIndex, currentLeg.waypointsRequired);
            const isFinal = checkIsFinalBoss(currentLeg.toBodyId, isBoss);
            setIsBossBattle(isBoss);
            setIsFinalBoss(isFinal);
            setCurrentBodyId(currentLeg.toBodyId);

            // Start battle music (crossfades from menu music)
            // Final boss (Zorath) gets epic music, other bosses get boss fight music, regular enemies get chapter music
            const battleMusicId = isFinal ? 'zorathFightMusic' : (isBoss ? 'bossFightMusic' : getBattleMusicForChapter(currentLeg.chapter));
            audioEngine.playMusic(battleMusicId);
            // Stop menu ambience and start space ambience
            audioEngine.stopAmbience('menuAmbience');
            audioEngine.startAmbience('spaceAmbience');

            // Generate dialogue lines using unified selection (synced text + audio)
            const waveDialogue = selectWaveLine(currentLeg.toBodyId as BodyId, isBoss);
            setCommanderLine(waveDialogue.text);
            setCommanderSoundId(waveDialogue.soundId);

            const alienDialogue = selectAlienLine(currentLeg.toBodyId as BodyId, isBoss);
            setAlienLine(alienDialogue.text);
            setAlienSoundId(alienDialogue.soundId);
            setAlienSpeaker(alienDialogue.name);

            if (isBoss) {
                // Map planets to landscape assets
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

                const bg = planetBackgrounds[currentLeg.toBodyId] || '/assets/helianthus/Landscapes/Barren/4.png';
                setBackgroundImage(bg);
            } else {
                // Regular mission - Space background
                setBackgroundImage('/assets/helianthus/SpaceBackgrounds/Dark/blue_purple.png');
            }
        }

        // Select enemy sprite - boss gets special ship, regular enemies get random from pool
        if (currentLeg) {
            const isBoss = isBossLevel(activeWaypointIndex, currentLeg.waypointsRequired);
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

    // Hero ship animation - cycle through 6 frames for engine thrust
    useEffect(() => {
        const interval = setInterval(() => {
            setHeroFrame(prev => (prev % 6) + 1);
        }, 100); // Change frame every 100ms

        return () => clearInterval(interval);
    }, []);

    // Shot animation - play through shot frames once when laser is active
    useEffect(() => {
        if (!showLaser) {
            setShotFrame(1);
            return;
        }

        const interval = setInterval(() => {
            setShotFrame(prev => {
                // Play through Shot1-5, then ShotHit1-6 (total 11 frames) - no loop
                if (prev < 11) return prev + 1;
                return 11; // Stay on last frame instead of looping
            });
        }, 50); // Fast animation - 50ms per frame

        return () => clearInterval(interval);
    }, [showLaser]);

    // Explosion animation - cycle through 8 frames when explosion happens
    useEffect(() => {
        if (gameEnding !== 'explosion') {
            setExplosionFrame(1);
            return;
        }

        let frameCount = 1;
        const interval = setInterval(() => {
            frameCount++;
            setExplosionFrame(prev => {
                // Cycle through frames 1-8, then hide
                if (prev < 8) return prev + 1;
                return 8;
            });

            // After 8 frames (800ms), hide the explosion
            if (frameCount > 8) {
                clearInterval(interval);
                // Quick delay to show last frame, then hide
                setTimeout(() => {
                    setExplosionFrame(0); // 0 = hide explosion
                }, 50);
            }
        }, 100); // 100ms per frame

        return () => clearInterval(interval);
    }, [gameEnding]);

    // Victory sequence - triggered when explosion finishes
    useEffect(() => {
        if (gameEnding === 'explosion' && explosionFrame === 0) {
            // Short delay after explosion, then show victory dialogue (waits for click)
            const timeout = setTimeout(() => {
                setIntroStage('victory');
                // Use unified selection for synced text/audio
                const isFinal = checkIsFinalBoss(currentBodyId, isBossBattle);
                const victoryDialogue = selectVictoryLine(isBossBattle, isFinal);
                setIntroMessage(victoryDialogue.text);
                setVictorySoundId(victoryDialogue.soundId);
            }, 500);

            return () => clearTimeout(timeout);
        }
    }, [gameEnding, explosionFrame, currentBodyId, isBossBattle]);

    // Intro sequence - triggered when dialogue is ready
    useEffect(() => {
        if (!commanderLine || !alienLine) return;

        // Play intro sequence when dialogue is loaded - starts with commander dialogue
        setIntroStage('intro1');
        setIntroMessage(commanderLine);
        // Waits for click to continue...
    }, [commanderLine, alienLine]);

    // Play commander speech when intro1 starts (using pre-selected sound ID)
    useEffect(() => {
        if (introStage === 'intro1' && commanderSoundId) {
            speechService.playById(commanderSoundId);
        }
    }, [introStage, commanderSoundId]);

    // Play alien speech when intro2 starts (using pre-selected sound ID with alien EQ)
    useEffect(() => {
        if (introStage === 'intro2' && alienSoundId) {
            speechService.playAlienById(alienSoundId);
        }
    }, [introStage, alienSoundId]);

    // Play victory speech when victory dialogue appears (using pre-selected sound ID)
    useEffect(() => {
        if (introStage === 'victory' && victorySoundId) {
            speechService.playById(victorySoundId);
        }
    }, [introStage, victorySoundId]);

    // Play defeat speech when escape overlay appears (using pre-selected sound ID)
    useEffect(() => {
        if (showEscapeOverlay && defeatSoundId) {
            speechService.playById(defeatSoundId);
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

    // Handle click to advance dialogue (also skips speech)
    const handleDialogueClick = useCallback(() => {
        // Stop any playing speech when clicking to advance
        speechService.stopCurrentSpeech();

        if (introStage === 'intro1') {
            // Commander dialogue clicked - start ship entrance sequence
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
        } else if (introStage === 'intro2') {
            // Enemy dialogue clicked - start playing
            setIntroStage('playing');
        } else if (introStage === 'victory') {
            // Victory dialogue clicked - hero exits
            setIntroStage('heroExit');
            playSFX('shipSlide3', { volume: 0.5 }); // Hero ship exits
        }
    }, [introStage, alienLine]);

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

    const progress = ((currentIndex + 1) / questions.length) * 100;

    const handleGameComplete = (finalQuestions: Question[]) => {
        const stats = loadPlayerStats();
        const currentProgress = stats.campaignProgress || initializeCampaignProgress();

        // Calculate active leg ID for navigation
        const activeLegId = locationState?.legId || currentProgress.currentLegId;

        const correctCount = finalQuestions.filter(q => q.correct).length;
        const scorePercentage = (correctCount / finalQuestions.length) * 100;
        const xpEarned = calculateXP(correctCount, finalQuestions.length);

        // Determine ending based on 70% threshold
        if (scorePercentage >= 70) {
            setGameEnding('explosion');
            // Play explosion sound with slight delay to sync with animation
            setTimeout(() => playSFX('explosion', { volume: 0.7 }), 200);
        } else {
            setGameEnding('escape');
            playSFX('shipSlide4', { volume: 0.5 }); // Enemy escapes
            // Use unified selection for synced text/audio
            const defeatDialogue = selectDefeatLine(isBossBattle);
            setDefeatMessage({ message: defeatDialogue.text, encouragement: '' }); // encouragement not used on battle screen
            setDefeatSoundId(defeatDialogue.soundId);
        }

        // Update stats (only advance campaign if not replaying a completed level)
        const isReplay = locationState?.isReplay || false;
        const newStats = {
            ...stats,
            totalXP: stats.totalXP + xpEarned,
            weakAreas: updateWeakAreas(finalQuestions, stats.weakAreas),
            campaignProgress: isReplay
                ? currentProgress  // Don't advance progression on replay
                : completeMission(currentProgress, correctCount, finalQuestions.length),
        };

        savePlayerStats(newStats);

        // Store navigation data for when player clicks through victory dialogue
        const navData = {
            questions: finalQuestions,
            xpEarned,
            passed: scorePercentage >= 70,
            legId: activeLegId,
            waypointIndex: locationState?.waypointIndex ?? currentProgress.currentWaypointIndex,
            isReplay: locationState?.isReplay || false,
        };
        setPendingNavigation(navData);

        // For escape path, navigate after delay (can click to skip)
        if (scorePercentage < 70) {
            // Delay overlay to let escape animation play
            escapeOverlayTimeoutRef.current = setTimeout(() => setShowEscapeOverlay(true), 1500);
            // Navigate after giving time to read (or click to skip)
            escapeNavigationTimeoutRef.current = setTimeout(() => {
                navigate('/result', { state: navData });
            }, 7000);
        }
        // Victory path: navigation handled by heroExit useEffect after clicking victory dialogue
    };

    return (
        <div className="flex-1 flex flex-col items-center justify-center p-4">
            {/* Back button - positioned absolutely outside the frame */}
            <div className="absolute top-4 left-4">
                <button
                    onClick={() => navigate('/map')}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded border-2 border-gray-600 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                    <span className="text-sm">BACK TO MAP</span>
                </button>
            </div>

            {/* Main interface frame - the "screen" */}
            <div className="w-full max-w-4xl">
                {/* HUD - Above the frame */}
                <div className="flex justify-between items-end mb-4 px-8">
                    <div className="flex gap-2">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <Heart key={i} className="w-8 h-8 text-red-500 fill-red-500" />
                        ))}
                    </div>
                    <div className="text-right">
                        <div className="text-xs text-gray-400 mb-1">ENEMY SHIELD</div>
                        <PixelProgressBar value={100 - progress} color="bg-red-500" className="w-48" />
                    </div>
                </div>

                {/* Bordered game screen frame */}
                <div className="relative bg-black shadow-2xl" style={{
                    border: '8px solid',
                    borderImage: 'linear-gradient(180deg, #6b6b7a 0%, #3a3a4a 50%, #2a2a3a 100%) 1',
                    boxShadow: '0 0 0 4px #1a1a2e, 0 0 0 8px #3a3a4a, 0 20px 50px rgba(0,0,0,0.8)',
                }}>
                    {/* Inner border for depth */}
                    <div className="border-4 border-gray-600">
                        {/* Game content area */}
                        <div className="relative h-[900px] flex flex-col overflow-hidden">
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
                                            backgroundImage: 'url(/assets/helianthus/SpaceBackgrounds/stars_blue.png)',
                                            backgroundRepeat: 'repeat',
                                            backgroundSize: '4096px',
                                            opacity: 0.4,
                                            imageRendering: 'pixelated',
                                        }}
                                    />

                                    {/* Parallax star layer 2 - Yellow stars (slower) */}
                                    <div
                                        className="absolute inset-0 pointer-events-none animate-parallaxSlow"
                                        style={{
                                            backgroundImage: 'url(/assets/helianthus/SpaceBackgrounds/stars_yellow.png)',
                                            backgroundRepeat: 'repeat',
                                            backgroundSize: '4096px',
                                            opacity: 0.5,
                                            imageRendering: 'pixelated',
                                        }}
                                    />

                                    {/* Parallax star layer 3 - Close stars (fastest) */}
                                    <div
                                        className="absolute inset-0 pointer-events-none animate-parallaxFast"
                                        style={{
                                            backgroundImage: 'url(/assets/helianthus/SpaceBg/Backgrounds/YellowStars.png)',
                                            backgroundRepeat: 'repeat',
                                            backgroundSize: '2048px',
                                            opacity: 0.6,
                                            imageRendering: 'pixelated',
                                        }}
                                    />
                                </div>

                                {/* Intro/Victory Message Overlay */}
                                {(introStage === 'intro1' || introStage === 'intro2' || introStage === 'victory') && (
                                    <div
                                        className="absolute inset-0 z-20 flex items-start justify-center pt-16 cursor-pointer"
                                        onClick={handleDialogueClick}
                                    >
                                        <div className={`bg-gray-900/95 border-4 ${introStage === 'intro2' ? 'border-red-500' : 'border-cyan-400'
                                            } p-6 max-w-2xl animate-fadeIn shadow-lg flex gap-4`}
                                            style={{
                                                boxShadow:
                                                    introStage === 'intro2' ? '0 0 20px rgba(239, 68, 68, 0.5)' :
                                                        '0 0 20px rgba(34, 211, 238, 0.5)'
                                            }}>
                                            {/* Commander portrait - only for commander dialogues */}
                                            {(introStage === 'intro1' || introStage === 'victory') && (
                                                <div className="flex-shrink-0">
                                                    <img
                                                        src="/assets/1GameCharacters/Commander.png"
                                                        alt="Commander"
                                                        className="w-24 h-24 object-contain"
                                                        style={{ imageRendering: 'pixelated' }}
                                                    />
                                                </div>
                                            )}
                                            {/* Alien portrait - only for alien dialogues */}
                                            {introStage === 'intro2' && (
                                                <div className="flex-shrink-0">
                                                    <img
                                                        src={isFinalBoss ? '/assets/1GameCharacters/Zorath.png' : isBossBattle ? '/assets/1GameCharacters/AlienBoss.png' : '/assets/1GameCharacters/AlienCommander.png'}
                                                        alt={isFinalBoss ? 'Zorath' : isBossBattle ? 'Alien Boss' : 'Alien Commander'}
                                                        className="w-24 h-24 object-contain"
                                                        style={{ imageRendering: 'pixelated' }}
                                                    />
                                                </div>
                                            )}
                                            <div className="flex-1">
                                                {/* Speaker label */}
                                                <div className={`text-xs font-bold mb-2 tracking-wider ${introStage === 'intro2' ? 'text-red-600' : 'text-cyan-600'
                                                    }`}>
                                                    {introStage === 'intro1' && '[COMMANDER]'}
                                                    {introStage === 'intro2' && (alienSpeaker ? `[${alienSpeaker}]` : '[ENEMY]')}
                                                    {introStage === 'victory' && '[COMMANDER]'}
                                                </div>
                                                <p className={`text-lg ${introStage === 'intro2' ? 'text-red-400' : 'text-cyan-300'
                                                    } leading-relaxed`}>
                                                    "{introMessage}"
                                                </p>
                                                {/* Click to continue hint */}
                                                <div className={`text-xs mt-4 animate-pulse ${introStage === 'intro2' ? 'text-red-600/60' : 'text-cyan-600/60'
                                                    }`}>
                                                    [ Click to continue ]
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
                                                        width: '154px',
                                                        height: '154px',
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

                                {/* Game ending overlay - delayed to let escape animation play */}
                                {gameEnding === 'escape' && showEscapeOverlay && defeatMessage && pendingNavigation && (
                                    <div
                                        className="absolute inset-0 z-20 flex items-start justify-center pt-16 cursor-pointer"
                                        onClick={() => navigate('/result', { state: pendingNavigation })}
                                    >
                                        <div
                                            className="bg-gray-900/95 border-4 border-red-500 p-6 max-w-2xl animate-fadeIn shadow-lg flex gap-4"
                                            style={{ boxShadow: '0 0 20px rgba(239, 68, 68, 0.5)' }}
                                        >
                                            {/* Commander portrait */}
                                            <div className="flex-shrink-0">
                                                <img
                                                    src="/assets/1GameCharacters/Commander.png"
                                                    alt="Commander"
                                                    className="w-24 h-24 object-contain"
                                                    style={{ imageRendering: 'pixelated' }}
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <div className="text-xs font-bold mb-2 tracking-wider text-red-600">
                                                    [COMMANDER]
                                                </div>
                                                <p className="text-lg text-red-400 leading-relaxed">
                                                    "{defeatMessage.message}"
                                                </p>
                                                <div className="text-xs mt-4 text-red-600/60 animate-pulse">
                                                    [ Click to continue ]
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Bottom control panel - Retro Computer Console */}
                            <div className="relative" style={{
                                minHeight: '280px',
                                borderTop: '12px solid',
                                borderImage: 'linear-gradient(90deg, #2a2a3a 0%, #5a5a6a 50%, #2a2a3a 100%) 1',
                            }}>
                                {/* Panel PNG overlay - on top with transparent cutouts */}
                                <div
                                    className="absolute inset-0 z-10 pointer-events-none"
                                    style={{
                                        backgroundImage: 'url(/assets/1NewStuff/panel/panel5.png)',
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
                                        <div className="w-[314px] ml-[38px] mt-[-2px] z-0">
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
                                                    <div className="relative z-0">
                                                        {/* Question Display - smaller */}
                                                        <div className="text-2xl font-bold flex items-center justify-center gap-2 my-3 font-mono">
                                                            <span className="text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.9)]">{currentQuestion.num1}</span>
                                                            <span className="text-green-600">×</span>
                                                            <span className="text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.9)]">{currentQuestion.num2}</span>
                                                            <span className="text-green-600">=</span>
                                                            <span className="text-green-300 drop-shadow-[0_0_10px_rgba(134,239,172,1)] animate-pulse">?</span>
                                                        </div>

                                                        {/* Answer Buttons - smaller */}
                                                        <div className="flex items-center justify-center">
                                                            {!showFeedback ? (
                                                                <div className="grid grid-cols-3 gap-1 w-full">
                                                                    {answerChoices.map((opt, i) => (
                                                                        <button
                                                                            key={i}
                                                                            disabled={showFeedback}
                                                                            onClick={() => {
                                                                                setUserAnswer(opt.toString());
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
                                                                                setTimeout(() => {
                                                                                    setShowLaser(false);
                                                                                    if (currentIndex < questions.length - 1) {
                                                                                        setCurrentIndex(currentIndex + 1);
                                                                                        setUserAnswer('');
                                                                                        setShowFeedback(false);
                                                                                    } else {
                                                                                        handleGameComplete(updatedQuestions);
                                                                                    }
                                                                                }, 1000);
                                                                            }}
                                                                            className="py-2 text-sm font-bold font-mono text-green-400 hover:text-green-300 hover:scale-105 active:scale-95 disabled:opacity-50"
                                                                            style={{
                                                                                background: 'linear-gradient(180deg, #0a200a 0%, #001a00 50%, #000d00 100%)',
                                                                                border: '2px solid #1a4a1a',
                                                                                borderRadius: '3px',
                                                                            }}
                                                                        >
                                                                            {opt}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <div className="text-center font-mono text-sm py-2">
                                                                    {isCorrect ? (
                                                                        <span className="text-green-400 drop-shadow-[0_0_10px_rgba(74,222,128,1)]">HIT!</span>
                                                                    ) : (
                                                                        <span className="text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.9)]">MISS</span>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Wave indicator */}
                                                        <div className="flex justify-center items-center gap-1 mt-2">
                                                            <span className="text-[8px] text-green-700 font-mono">WAVE {currentIndex + 1}/{questions.length}</span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    /* Standby mode */
                                                    <div className="h-[120px] flex flex-col items-center justify-center relative z-0">
                                                        <div className="text-lg text-green-400 font-bold font-mono animate-pulse drop-shadow-[0_0_10px_rgba(74,222,128,0.8)]">
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
                                            <div className="flex justify-center ml-[-257px] mt-[22px]">
                                                {/* Mini radar - positioned above disk station */}
                                                <div
                                                    className="w-[95px] h-[68px] rounded relative overflow-hidden"
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
                                            <div
                                                className="absolute right-[30px] top-[35px] w-[250px] h-[73px] overflow-hidden"
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
                                            <div className="absolute right-[50px] top-[45px] flex items-center gap-[22px] z-20">
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
                                                        <span className="text-base text-green-400 font-bold font-mono drop-shadow-[0_0_6px_rgba(74,222,128,0.6)]">47°</span>
                                                    </div>
                                                                                                    </div>
                                            </div>

                                            {/* Bottom right rectangle - Battlezone-style vector display */}
                                            <div
                                                className="absolute right-[30px] top-[140px] w-[250px] h-[70px] overflow-hidden"
                                                style={{
                                                    background: 'linear-gradient(180deg, #0a0a0a, #050505)',
                                                    border: '2px solid #1a2a1a',
                                                }}
                                            >
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
    );
};

export default BattleScreen;
