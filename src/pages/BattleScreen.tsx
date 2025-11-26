import React, { useState, useEffect, useMemo, useCallback } from 'react';
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

        // Update stats
        const newStats = {
            ...stats,
            totalXP: stats.totalXP + xpEarned,
            weakAreas: updateWeakAreas(finalQuestions, stats.weakAreas),
            campaignProgress: completeMission(currentProgress, correctCount, finalQuestions.length),
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
            setTimeout(() => setShowEscapeOverlay(true), 1500);
            // Navigate after giving time to read (or click to skip)
            setTimeout(() => {
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
                <div className="relative border-8 border-gray-300 bg-black shadow-2xl" style={{
                    boxShadow: '0 0 0 4px #1a1a2e, 0 0 0 8px #4a4a5e, 0 20px 50px rgba(0,0,0,0.8)',
                }}>
                    {/* Inner border for depth */}
                    <div className="border-4 border-gray-700">
                        {/* Game content area */}
                        <div className="relative h-[900px] flex flex-col overflow-hidden">
                            {/* Left cockpit frame bar */}
                            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-gray-800 via-gray-700 to-transparent opacity-40 pointer-events-none z-10">
                                <div className="h-full flex flex-col justify-evenly items-center py-8">
                                    <div className="w-2 h-2 bg-red-500 rounded-full opacity-60"></div>
                                    <div className="w-2 h-2 bg-yellow-500 rounded-full opacity-60"></div>
                                    <div className="w-2 h-2 bg-green-500 rounded-full opacity-60"></div>
                                </div>
                            </div>

                            {/* Right cockpit frame bar */}
                            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-gray-800 via-gray-700 to-transparent opacity-40 pointer-events-none z-10">
                                <div className="h-full flex flex-col justify-evenly items-center py-8">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full opacity-60"></div>
                                    <div className="w-2 h-2 bg-purple-500 rounded-full opacity-60"></div>
                                    <div className="w-2 h-2 bg-cyan-500 rounded-full opacity-60"></div>
                                </div>
                            </div>

                            {/* Main viewing area - Side-scrolling shooter */}
                            <div className="flex-1 relative flex items-center justify-center">
                                {/* Parallax scrolling background */}
                                <div className="absolute inset-0 z-0 overflow-hidden">
                                    {/* Base background - slowest layer */}
                                    <div
                                        className="absolute inset-0 bg-bottom animate-scrollSlow"
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

                                            // Projectile travels across (0% to 100%), hit effect at impact point (105% to reach enemy)
                                            const progressPercent = isProjectile ? (shotFrame - 1) * 25 : 105;

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

                            {/* Bottom control panel - Spaceship Console - Always visible */}
                            <div className="relative">
                                {/* Metallic frame top edge */}
                                <div className="h-2 bg-gradient-to-b from-gray-500 via-gray-600 to-gray-700" />

                                {/* Main console body */}
                                <div
                                    className="relative p-4"
                                    style={{
                                        background: 'linear-gradient(180deg, #2a2a3a 0%, #1a1a2a 50%, #0a0a1a 100%)',
                                        borderTop: '3px solid #4a4a5a',
                                    }}
                                >
                                    {/* Corner rivets */}
                                    <div className="absolute top-3 left-3 w-3 h-3 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 border border-gray-700" />
                                    <div className="absolute top-3 right-3 w-3 h-3 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 border border-gray-700" />
                                    <div className="absolute bottom-3 left-3 w-3 h-3 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 border border-gray-700" />
                                    <div className="absolute bottom-3 right-3 w-3 h-3 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 border border-gray-700" />

                                    {/* Console layout */}
                                    <div className="flex gap-4 items-stretch">
                                        {/* Left status panel */}
                                        <div className="hidden md:flex flex-col gap-2 w-24 pt-12">
                                            <div className="text-[10px] text-cyan-500 uppercase tracking-wider">Systems</div>
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${introStage === 'playing' ? 'bg-green-500 shadow-[0_0_6px_#22c55e]' : 'bg-yellow-500 shadow-[0_0_6px_#eab308] animate-pulse'}`} />
                                                <span className="text-[10px] text-gray-400">WEAPONS</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${introStage === 'playing' ? 'bg-green-500 shadow-[0_0_6px_#22c55e]' : 'bg-yellow-500 shadow-[0_0_6px_#eab308] animate-pulse'}`} />
                                                <span className="text-[10px] text-gray-400">SHIELDS</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${introStage === 'playing' ? 'bg-green-500 shadow-[0_0_6px_#22c55e]' : 'bg-yellow-500 shadow-[0_0_6px_#eab308] animate-pulse'}`} />
                                                <span className="text-[10px] text-gray-400">TARGETING</span>
                                            </div>
                                        </div>

                                        {/* Center main display */}
                                        <div className="flex-1">
                                            {/* Main screen bezel */}
                                            <div
                                                className="relative p-4 rounded"
                                                style={{
                                                    background: 'linear-gradient(135deg, #1a1a2e 0%, #0d0d1a 100%)',
                                                    border: '3px solid #3a3a4a',
                                                    boxShadow: 'inset 0 0 20px rgba(0,0,0,0.8), 0 0 10px rgba(0,200,255,0.1)',
                                                }}
                                            >
                                                {/* Scanline effect overlay */}
                                                <div
                                                    className="absolute inset-0 pointer-events-none opacity-10"
                                                    style={{
                                                        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)',
                                                    }}
                                                />

                                                {/* Screen glow */}
                                                <div className="absolute inset-0 rounded opacity-20 pointer-events-none"
                                                    style={{ boxShadow: 'inset 0 0 30px rgba(0,200,255,0.3)' }}
                                                />

                                                {introStage === 'playing' ? (
                                                    <>
                                                        {/* Target label */}
                                                        <div className="text-[10px] text-cyan-600 uppercase tracking-widest mb-2 text-center">
                                                            ◆ TARGETING COMPUTER ◆
                                                        </div>

                                                        {/* Question Display */}
                                                        <div className="text-3xl md:text-4xl font-bold flex items-center justify-center gap-3 mb-4 relative">
                                                            <span className="text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]">{currentQuestion.num1}</span>
                                                            <span className="text-gray-500">×</span>
                                                            <span className="text-purple-400 drop-shadow-[0_0_8px_rgba(192,132,252,0.8)]">{currentQuestion.num2}</span>
                                                            <span className="text-gray-500">=</span>
                                                            <span className="text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)] animate-pulse">?</span>
                                                        </div>

                                                        {/* Answer Buttons or Feedback */}
                                                        <div className="h-24 flex items-center justify-center">
                                                            {!showFeedback ? (
                                                                <div className="grid grid-cols-3 gap-2 max-w-sm mx-auto w-full">
                                                                    {answerChoices.map((opt, i) => (
                                                                        <button
                                                                            key={i}
                                                                            disabled={showFeedback}
                                                                            onClick={() => {
                                                                                setUserAnswer(opt.toString());
                                                                                // Always fire laser
                                                                                setShowLaser(true);
                                                                                playSFX('laser', { volume: 0.6 });

                                                                                if (opt === currentQuestion.answer) {
                                                                                    setIsCorrect(true);
                                                                                } else {
                                                                                    setIsCorrect(false);
                                                                                    // Randomize dodge direction for miss
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
                                                                            className="relative py-3 text-lg font-bold text-cyan-300 uppercase transition-all duration-100 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                                                            style={{
                                                                                background: 'linear-gradient(180deg, #2a3a4a 0%, #1a2a3a 50%, #0a1a2a 100%)',
                                                                                border: '2px solid #3a5a7a',
                                                                                borderRadius: '4px',
                                                                                boxShadow: '0 4px 0 #0a1a2a, 0 0 10px rgba(0,200,255,0.2), inset 0 1px 0 rgba(255,255,255,0.1)',
                                                                            }}
                                                                        >
                                                                            <span className="drop-shadow-[0_0_4px_rgba(34,211,238,0.6)]">{opt}</span>
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <div className={`text-center ${currentIndex === questions.length - 1 && isCorrect ? 'text-sm' : 'text-lg'}`}>
                                                                    {isCorrect ? (
                                                                        <span className="text-green-400 drop-shadow-[0_0_10px_rgba(74,222,128,0.8)]">
                                                                            {currentIndex === questions.length - 1 ? 'ENEMY DESTROYED!' : '◆ DIRECT HIT ◆'}
                                                                        </span>
                                                                    ) : (
                                                                        <div className="flex flex-col">
                                                                            <span className="text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]">◆ MISS ◆</span>
                                                                            <span className="text-[10px] text-gray-500 mt-2">CORRECT: {currentQuestion.answer}</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </>
                                                ) : (
                                                    /* Standby mode during intro/victory */
                                                    <div className="h-[168px] flex flex-col items-center justify-center">
                                                        <div className="text-[10px] text-yellow-600 uppercase tracking-widest mb-4 text-center">
                                                            ◆ SYSTEMS STATUS ◆
                                                        </div>
                                                        <div className="text-2xl text-yellow-500 font-bold animate-pulse drop-shadow-[0_0_10px_rgba(234,179,8,0.6)]">
                                                            {introStage === 'intro1' && 'INITIALIZING...'}
                                                            {introStage === 'heroEnter' && 'DEPLOYING...'}
                                                            {introStage === 'enemyEnter' && 'ENEMY DETECTED'}
                                                            {introStage === 'intro2' && 'BATTLE STATIONS'}
                                                            {introStage === 'victory' && 'MISSION COMPLETE'}
                                                            {introStage === 'heroExit' && 'RETURNING TO BASE'}
                                                        </div>
                                                        <div className="flex gap-2 mt-4">
                                                            <div className="w-3 h-3 rounded-full bg-yellow-500 shadow-[0_0_8px_#eab308] animate-pulse" />
                                                            <div className="w-3 h-3 rounded-full bg-yellow-500 shadow-[0_0_8px_#eab308] animate-pulse" style={{ animationDelay: '0.2s' }} />
                                                            <div className="w-3 h-3 rounded-full bg-yellow-500 shadow-[0_0_8px_#eab308] animate-pulse" style={{ animationDelay: '0.4s' }} />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Bottom status strip */}
                                            <div className="flex justify-between items-center mt-2 px-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="text-[8px] text-gray-500 uppercase">Wave</div>
                                                    <div className="text-xs text-cyan-400 font-bold">{introStage === 'playing' ? `${currentIndex + 1}/${questions.length}` : '--/--'}</div>
                                                </div>
                                                <div className="flex gap-1">
                                                    {introStage === 'playing' ? questions.map((q, i) => (
                                                        <div
                                                            key={i}
                                                            className={`w-2 h-2 rounded-full ${i < currentIndex
                                                                ? (q.correct ? 'bg-green-500 shadow-[0_0_4px_#22c55e]' : 'bg-red-500 shadow-[0_0_4px_#ef4444]')
                                                                : i === currentIndex
                                                                    ? 'bg-yellow-500 shadow-[0_0_4px_#eab308] animate-pulse'
                                                                    : 'bg-gray-600'
                                                                }`}
                                                        />
                                                    )) : (
                                                        <>
                                                            <div className="w-2 h-2 rounded-full bg-gray-600" />
                                                            <div className="w-2 h-2 rounded-full bg-gray-600" />
                                                            <div className="w-2 h-2 rounded-full bg-gray-600" />
                                                        </>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="text-[8px] text-gray-500 uppercase">Score</div>
                                                    <div className="text-xs text-green-400 font-bold">{questions.filter(q => q.correct).length * 100}</div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right status panel */}
                                        <div className="hidden md:flex flex-col gap-2 w-24 items-end pt-12">
                                            <div className="text-[10px] text-cyan-500 uppercase tracking-wider">Tactical</div>
                                            <div className="text-[10px] text-gray-500">PWR <span className="text-green-400">98%</span></div>
                                            <div className="text-[10px] text-gray-500">TEMP <span className="text-yellow-400">47°C</span></div>
                                            <div className="text-[10px] text-gray-500">AMMO <span className="text-cyan-400">∞</span></div>
                                        </div>
                                    </div>
                                </div>

                                {/* Bottom metallic edge */}
                                <div className="h-3 bg-gradient-to-b from-gray-700 via-gray-800 to-gray-900" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BattleScreen;
