import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { PixelButton } from '@/components/ui/PixelButton';
import { loadPlayerStats, savePlayerStats, getRankForXP, getXPProgress } from '@/utils/gameLogic';
import { RANKS } from '@/types/game';
import { initializeCampaignProgress, getLegById, getLegIndex, checkForMilestone, markMilestoneSeen } from '@/utils/campaignLogic';
import { celestialBodies, campaignLegs, getChapterName } from '@/data/campaignRoute';
import type { CelestialBody, Leg } from '@/data/campaignRoute';
import { ArrowLeft, Lock, Star, Radio, Home } from 'lucide-react';
import { audioEngine } from '@/audio';
import { speechService } from '@/audio/SpeechService';
import { MILESTONE_TEXT } from '@/audio/speechSounds';
import { PixelCard } from '@/components/ui/PixelCard';

// Static planet images
const planetImages: Record<string, string> = {
    earth: '/assets/helianthus/PlanetsFull/Ocean/1.png',
    moon: '/assets/helianthus/PlanetsFull/Barren_or_Moon/1.png',
    mars: '/assets/helianthus/PlanetsFull/Desert_or_Martian/1.png',
    ceres: '/assets/helianthus/PlanetsFull/Asteroids/1.png',
    jupiter: '/assets/helianthus/PlanetsFull/Gas_Giant_or_Toxic/1.png',
    europa: '/assets/helianthus/PlanetsFull/Ice_or_Snow/1.png',
    saturn: '/assets/helianthus/PlanetsFull/Gas_Giant_or_Toxic/5.png',
    titan: '/assets/helianthus/PlanetsFull/Desert_or_Martian/3.png',
    uranus: '/assets/helianthus/PlanetsFull/Gas_Giant_or_Toxic/9.png',
    neptune: '/assets/helianthus/PlanetsFull/Ocean/3.png',
    pluto: '/assets/helianthus/PlanetsFull/Ice_or_Snow/3.png',
    haumea: '/assets/helianthus/PlanetsFull/Barren_or_Moon/3.png',
    makemake: '/assets/helianthus/PlanetsFull/Rocky/1.png',
    eris: '/assets/helianthus/PlanetsFull/Ice_or_Snow/4.png',
    arrokoth: '/assets/helianthus/PlanetsFull/Asteroids/5.png',
};

// Animated planet for selected/current planet
const animatedPlanets: Record<string, { folder: string; frames: number }> = {
    earth: { folder: '/assets/helianthus/AnimatedPlanetsFull/Terran_with_clouds/1', frames: 60 },
    moon: { folder: '/assets/helianthus/AnimatedPlanetsFull/Barren_or_Moon/1', frames: 60 },
    mars: { folder: '/assets/helianthus/AnimatedPlanetsFull/Desert/1', frames: 60 },
    ceres: { folder: '/assets/helianthus/AnimatedPlanetsFull/Barren_or_Moon/2', frames: 60 },
    jupiter: { folder: '/assets/helianthus/AnimatedPlanetsFull/Gas_giant_or_Toxic/1', frames: 60 },
    europa: { folder: '/assets/helianthus/AnimatedPlanetsFull/Ice', frames: 60 },
    saturn: { folder: '/assets/helianthus/AnimatedPlanetsFull/Gas_giant_or_Toxic/2', frames: 60 },
    titan: { folder: '/assets/helianthus/AnimatedPlanetsFull/Desert/2', frames: 60 },
    uranus: { folder: '/assets/helianthus/AnimatedPlanetsFull/Gas_giant_or_Toxic/3', frames: 60 },
    neptune: { folder: '/assets/helianthus/AnimatedPlanetsFull/Gas_giant_or_Toxic/4', frames: 60 },
    pluto: { folder: '/assets/helianthus/AnimatedPlanetsFull/Barren_or_Moon/3', frames: 60 },
    haumea: { folder: '/assets/helianthus/AnimatedPlanetsFull/Barren_or_Moon/4', frames: 60 },
    makemake: { folder: '/assets/helianthus/AnimatedPlanetsFull/Ice', frames: 60 },
    eris: { folder: '/assets/helianthus/AnimatedPlanetsFull/Ice', frames: 60 },
    arrokoth: { folder: '/assets/helianthus/AnimatedPlanetsFull/Barren_or_Moon/1', frames: 60 },
};

// Planet sizes for the vertical map (similar to desktop but scaled for mobile)
const planetSizes: Record<string, number> = {
    earth: 72,
    moon: 48,
    mars: 60,
    ceres: 40,
    jupiter: 88,
    europa: 44,
    saturn: 84,
    titan: 48,
    uranus: 68,
    neptune: 68,
    pluto: 44,
    haumea: 38,
    makemake: 44,
    eris: 48,
    arrokoth: 32,
};

// Animated Planet Component
const AnimatedPlanet: React.FC<{
    planetId: string;
    size: number;
    isLocked?: boolean;
}> = ({ planetId, size, isLocked = false }) => {
    const [frame, setFrame] = useState(1);
    const planetData = animatedPlanets[planetId];

    useEffect(() => {
        if (!planetData || isLocked) return;

        const interval = setInterval(() => {
            setFrame(prev => (prev % planetData.frames) + 1);
        }, 100);

        return () => clearInterval(interval);
    }, [planetData, isLocked]);

    if (!planetData) {
        return (
            <img
                src={planetImages[planetId]}
                alt={planetId}
                style={{
                    width: size,
                    height: size,
                    imageRendering: 'pixelated',
                    filter: isLocked ? 'brightness(0.3) grayscale(1)' : 'none',
                }}
            />
        );
    }

    return (
        <img
            src={`${planetData.folder}/${frame}.png`}
            alt={planetId}
            style={{
                width: size,
                height: size,
                imageRendering: 'pixelated',
                filter: isLocked ? 'brightness(0.3) grayscale(1)' : 'none',
            }}
        />
    );
};

// Waypoint Node for vertical map
interface WaypointNodeProps {
    body: CelestialBody;
    leg: Leg | null;
    isCompleted: boolean;
    isCurrent: boolean;
    isLocked: boolean;
    onClick: () => void;
    waypointProgress?: { current: number; total: number };
    starsEarned?: number;
}

const WaypointNode: React.FC<WaypointNodeProps> = ({
    body,
    isCompleted,
    isCurrent,
    isLocked,
    onClick,
    waypointProgress,
    starsEarned = 0,
}) => {
    const size = planetSizes[body.id] || 56;
    const canClick = !isLocked;

    return (
        <div
            className={`relative flex flex-col items-center cursor-pointer transition-all duration-300 ${
                canClick ? 'active:scale-95' : 'cursor-not-allowed'
            }`}
            onClick={canClick ? onClick : undefined}
            style={{ marginBottom: '20px' }}
        >
            {/* Planet image */}
            <div className="relative">
                {/* Selection ring for current (pulsing) - positioned relative to planet */}
                {isCurrent && (
                    <div
                        className="absolute rounded-full animate-ping pointer-events-none"
                        style={{
                            width: size + 8,
                            height: size + 8,
                            left: -4,
                            top: -4,
                            border: '2px solid var(--color-brand-secondary)',
                            opacity: 0.5,
                        }}
                    />
                )}

                <AnimatedPlanet
                    planetId={body.id}
                    size={size}
                    isLocked={isLocked}
                />

                {/* Lock icon */}
                {isLocked && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Lock className="w-6 h-6 text-industrial-highlight" />
                    </div>
                )}
            </div>

            {/* Planet name label */}
            <div
                className={`text-[11px] font-bold uppercase tracking-wider whitespace-nowrap mt-1 font-tech ${
                    isLocked ? 'text-industrial-metal' :
                    isCurrent ? 'text-brand-secondary' :
                    isCompleted ? 'text-brand-success' : 'text-industrial-highlight'
                }`}
            >
                {body.name}
            </div>

            {/* Star ratings for completed planets */}
            {isCompleted && body.id !== 'earth' && (
                <div className="flex gap-0.5 mt-0.5">
                    {[1, 2, 3].map((starIndex) => (
                        <Star
                            key={starIndex}
                            className={`w-3 h-3 ${
                                starIndex <= starsEarned
                                    ? 'text-brand-accent fill-brand-accent'
                                    : 'text-industrial-metal fill-none'
                            }`}
                        />
                    ))}
                </div>
            )}

            {/* Waypoint progress dots for current planet */}
            {isCurrent && waypointProgress && (
                <div className="flex gap-1 mt-0.5">
                    {Array.from({ length: waypointProgress.total }).map((_, i) => (
                        <div
                            key={i}
                            className={`w-2 h-2 rounded-full ${
                                i < waypointProgress.current
                                    ? 'bg-brand-success shadow-[0_0_4px_var(--color-brand-success)]'
                                    : i === waypointProgress.current
                                        ? 'bg-brand-accent shadow-[0_0_4px_var(--color-brand-accent)] animate-pulse'
                                        : 'bg-industrial-metal'
                            }`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

const SolarSystemMapMobile: React.FC = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState(() => loadPlayerStats());
    const progress = stats.campaignProgress || initializeCampaignProgress();
    const scrollRef = useRef<HTMLDivElement>(null);


    // Milestone modal state
    const [activeMilestone, setActiveMilestone] = useState<'inner' | 'kuiper' | null>(null);

    // Rank-up modal state
    const [rankUpModal, setRankUpModal] = useState<{ show: boolean; rank: typeof RANKS[0] | null }>({ show: false, rank: null });

    // Start menu music
    useEffect(() => {
        audioEngine.playMusic('menuMusic');
        audioEngine.stopAmbience('spaceAmbience');
        audioEngine.startAmbience('menuAmbience');
    }, []);

    // Check for milestone
    useEffect(() => {
        const milestone = checkForMilestone(progress);
        if (milestone) {
            const timer = setTimeout(() => {
                setActiveMilestone(milestone);
                speechService.playMilestone(milestone);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [progress.currentLegId, progress.currentWaypointIndex]);

    // Check for rank-up
    useEffect(() => {
        const currentRank = getRankForXP(stats.totalXP);
        const lastSeenRankId = stats.lastSeenRankId || 'cadet';
        const lastSeenRankIndex = RANKS.findIndex(r => r.id === lastSeenRankId);
        const currentRankIndex = RANKS.findIndex(r => r.id === currentRank.id);

        if (currentRankIndex > lastSeenRankIndex) {
            const timer = setTimeout(() => {
                setRankUpModal({ show: true, rank: currentRank });
            }, activeMilestone ? 3000 : 500);
            return () => clearTimeout(timer);
        }
    }, [stats.totalXP, activeMilestone]);

    // Ref for the current planet element
    const currentPlanetRef = useRef<HTMLDivElement>(null);

    // Scroll to current planet on mount
    useLayoutEffect(() => {
        requestAnimationFrame(() => {
            if (currentPlanetRef.current) {
                currentPlanetRef.current.scrollIntoView({ behavior: 'instant', block: 'center' });
            }
        });
    }, []);

    // Additional scroll attempts for reliability
    useEffect(() => {
        const scrollToCurrent = () => {
            if (currentPlanetRef.current) {
                currentPlanetRef.current.scrollIntoView({ behavior: 'instant', block: 'center' });
            }
        };

        scrollToCurrent();
        const t1 = setTimeout(scrollToCurrent, 100);
        const t2 = setTimeout(scrollToCurrent, 300);

        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
        };
    }, []);

    const currentLeg = progress.currentLegId ? getLegById(progress.currentLegId) : null;
    const currentRank = getRankForXP(stats.totalXP);
    const xpProgress = getXPProgress(stats.totalXP);

    // Handle milestone dismiss
    const handleDismissMilestone = () => {
        if (activeMilestone) {
            const newProgress = markMilestoneSeen(progress, activeMilestone);
            const newStats = { ...stats, campaignProgress: newProgress };
            savePlayerStats(newStats);
            setStats(newStats);
        }
        setActiveMilestone(null);
    };

    // Handle rank-up dismiss
    const handleDismissRankUp = () => {
        if (rankUpModal.rank) {
            const newStats = { ...stats, lastSeenRankId: rankUpModal.rank.id };
            savePlayerStats(newStats);
            setStats(newStats);
        }
        setRankUpModal({ show: false, rank: null });
    };


    // Build planet list in campaign order, then reverse so distant planets are at top
    const planetListForward = campaignLegs.map((leg, index) => {
        const body = celestialBodies[leg.toBodyId];
        if (!body) return null;

        const legIndex = getLegIndex(leg.id);
        const currentLegIndex = currentLeg ? getLegIndex(currentLeg.id) : 0;
        const isCompleted = legIndex < currentLegIndex ||
            (legIndex === currentLegIndex && progress.currentWaypointIndex >= leg.waypointsRequired);
        const isCurrent = leg.id === progress.currentLegId;
        const isLocked = legIndex > currentLegIndex;
        const chapter = getChapterName(leg.chapter);
        const nextLeg = index < campaignLegs.length - 1 ? campaignLegs[index + 1] : null;
        // In reversed order, show chapter header after the last item of each chapter
        const isLastInChapter = !nextLeg || nextLeg.chapter !== leg.chapter;

        // Get stars earned for this leg (stored in starsEarned with format legId_waypointIndex)
        // Get the max stars for this leg by checking all waypoints
        let starsEarned = 0;
        if (progress.starsEarned) {
            for (let i = 0; i < leg.waypointsRequired; i++) {
                const key = `${leg.id}_${i}`;
                starsEarned = Math.max(starsEarned, progress.starsEarned[key] || 0);
            }
        }

        // Waypoint progress for current planet
        const waypointProgress = isCurrent ? {
            current: progress.currentWaypointIndex,
            total: leg.waypointsRequired,
        } : undefined;

        return {
            body,
            leg,
            isCompleted,
            isCurrent,
            isLocked,
            waypointProgress,
            starsEarned,
            chapter,
            isLastInChapter,
        };
    }).filter(Boolean);

    // Reverse so you scroll up towards distant planets
    const planetList = [...planetListForward].reverse();

    // Handle planet click - go directly to mission
    const handlePlanetClick = (planet: typeof planetList[0]) => {
        if (!planet || !planet.leg) return;
        audioEngine.playSFX('buttonClick');

        if (planet.isCurrent) {
            // Launch current mission
            navigate('/mission', { state: { legId: planet.leg.id } });
        } else if (planet.isCompleted) {
            // Replay completed mission
            navigate('/mission', { state: { legId: planet.leg.id, isReplay: true } });
        }
        // Locked planets do nothing (handled by onClick conditional)
    };

    return (
        <div className="h-full flex flex-col bg-space-black">
            {/* Fixed Header */}
            <div
                className="fixed top-0 left-0 right-0 z-20 flex items-center p-3 bg-industrial-dark border-b border-industrial-metal/30"
                style={{ paddingTop: 'calc(var(--safe-area-top) + 0.75rem)' }}
            >
                <button
                    onClick={() => navigate('/homebase')}
                    className="flex items-center gap-1 px-2 py-1 text-sm text-white/80 active:text-white w-16"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Home</span>
                </button>
                <div className="flex-1 text-center text-xs text-industrial-highlight uppercase tracking-wider">Mission Map</div>
                <div className="w-16" /> {/* Spacer to balance the title */}
            </div>

            {/* Screen frame border - fixed overlay on top of everything */}
            {/* Solid grey border on all sides, rounded top corners only */}
            <div
                className="fixed top-0 left-0 right-0 z-30 pointer-events-none"
                style={{
                    bottom: '326px',
                    border: '6px solid #4a4a5a',
                    borderBottom: 'none',
                    borderRadius: '12px 12px 0 0',
                }}
            />

            {/* Scrollable map area with space background */}
            {/* paddingBottom uses aspect ratio calc: 100vw * (326/428) = ~76vw, capped at 500px max-width panel */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto pt-14 relative" style={{ paddingBottom: 'min(76vw, 381px)' }}>
                {/* Parallax space background - fixed inside scroll container */}
                <div className="absolute inset-0 z-0 pointer-events-none">
                    <div
                        className="absolute inset-0"
                        style={{
                            backgroundImage: 'url(/assets/helianthus/SpaceBackgrounds/1.png)',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            backgroundAttachment: 'local',
                        }}
                    />
                    <div
                        className="absolute inset-0"
                        style={{
                            backgroundImage: 'url(/assets/helianthus/SpaceBackgrounds/stars_blue.png)',
                            backgroundRepeat: 'repeat',
                            backgroundSize: '512px',
                            opacity: 0.6,
                            imageRendering: 'pixelated',
                        }}
                    />
                </div>

                {/* Vertical path SVG - connecting all planets */}
                <svg
                    className="absolute left-1/2 top-0 -translate-x-1/2 pointer-events-none z-5"
                    style={{ width: '4px', height: `${planetList.length * 140 + 100}px` }}
                >
                    <defs>
                        <filter id="pathGlow">
                            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                            <feMerge>
                                <feMergeNode in="coloredBlur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>
                    {/* We'll draw lines between each planet pair below */}
                </svg>

                {/* Campaign planets (in reversed order - distant planets at top) */}
                <div className="relative z-10 flex flex-col items-center pt-8 pb-8">
                    {planetList.map((planet, index) => {
                        if (!planet) return null;

                        // Get the next planet for drawing the path line
                        const nextPlanet = index < planetList.length - 1 ? planetList[index + 1] : null;

                        // Determine line status based on the NEXT planet's status (the one below)
                        // Line is green if next planet is completed, cyan if next is current, gray otherwise
                        const getLineStatus = () => {
                            if (!nextPlanet) return 'locked';
                            if (nextPlanet.isCompleted) return 'completed';
                            if (nextPlanet.isCurrent) return 'current';
                            return 'locked';
                        };
                        const lineStatus = getLineStatus();

                        return (
                            <React.Fragment key={planet.body.id}>
                                {/* Planet node */}
                                <div
                                    id={`planet-${planet.body.id}`}
                                    ref={planet.isCurrent ? currentPlanetRef : undefined}
                                >
                                    <WaypointNode
                                        body={planet.body}
                                        leg={planet.leg}
                                        isCompleted={planet.isCompleted}
                                        isCurrent={planet.isCurrent}
                                        isLocked={planet.isLocked}
                                        onClick={() => handlePlanetClick(planet)}
                                        waypointProgress={planet.waypointProgress}
                                        starsEarned={planet.starsEarned}
                                    />
                                </div>

                                {/* Path line to next planet (below) */}
                                {nextPlanet && (
                                    <div
                                        className="w-1 relative z-0"
                                        style={{
                                            height: '60px',
                                            background: lineStatus === 'completed'
                                                ? 'var(--color-brand-success)'
                                                : lineStatus === 'current'
                                                    ? 'var(--color-brand-secondary)'
                                                    : 'var(--color-industrial-metal)',
                                            opacity: lineStatus === 'completed' ? 0.6 : lineStatus === 'current' ? 0.8 : 0.3,
                                            boxShadow: lineStatus === 'current' ? '0 0 8px var(--color-brand-secondary)' : 'none',
                                        }}
                                    />
                                )}
                            </React.Fragment>
                        );
                    })}

                    {/* Earth at the bottom */}
                    <div
                        className="w-1 relative z-0"
                        style={{
                            height: '60px',
                            background: 'var(--color-brand-success)',
                            opacity: 0.6,
                        }}
                    />
                    <div
                        className="relative flex flex-col items-center cursor-pointer transition-all duration-300 active:scale-95"
                        onClick={() => navigate('/homebase')}
                    >
                        <div className="relative">
                            <AnimatedPlanet planetId="earth" size={72} />
                        </div>
                        <div className="text-[11px] font-bold uppercase tracking-wider whitespace-nowrap mt-1 font-tech text-brand-success">
                            Earth
                        </div>
                        <div className="text-[9px] text-brand-secondary font-normal tracking-wide whitespace-nowrap">
                            (Home Base)
                        </div>
                    </div>
                </div>
            </div>

            {/* Fixed Bottom Menu Bar - uses aspect ratio container to keep PNG and overlays in sync */}
            <div
                className="fixed bottom-0 left-0 right-0 z-20 flex justify-center"
                style={{
                    paddingBottom: 'var(--safe-area-bottom)',
                }}
            >
                {/* Aspect ratio container - matches PNG ratio 428:326 */}
                <div
                    className="relative w-full"
                    style={{
                        maxWidth: '500px', // Cap max width for larger screens
                        aspectRatio: '428 / 326',
                    }}
                >
                    {/* Panel background PNG */}
                    <img
                        src="/assets/1NewStuff/panel/mobile_panel2.png"
                        alt=""
                        className="absolute inset-0 w-full h-full"
                        style={{
                            imageRendering: 'pixelated',
                            filter: 'brightness(0.8) sepia(0.2) saturate(0.4) hue-rotate(180deg)',
                        }}
                    />

                    {/* Upper CRT screen effects - positioned as % of PNG dimensions (428x326) */}
                    {/* Upper CRT black area: x=38-390, y=40-142 */}
                    <div
                        className="absolute pointer-events-none z-20"
                        style={{
                            left: '11.5%',
                            right: '10.5%',
                            top: '16%',
                            height: '30%',
                        }}
                    >
                        {/* Phosphor glow */}
                        <div
                            className="absolute inset-0"
                            style={{
                                boxShadow: 'inset 0 0 30px rgba(0,255,0,0.4)',
                                background: 'radial-gradient(ellipse at center, rgba(0,255,0,0.15) 0%, transparent 70%)',
                            }}
                        />
                        {/* Scanlines */}
                        <div
                            className="absolute inset-0"
                            style={{
                                backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(0,0,0,0.5) 1px, rgba(0,0,0,0.5) 2px)',
                                opacity: 0.7,
                            }}
                        />
                    </div>

                    {/* Lower CRT screen effects - positioned as % of PNG dimensions (428x326) */}
                    {/* Lower CRT black area: x=38-390, y=180-282 */}
                    <div
                        className="absolute pointer-events-none z-20"
                        style={{
                            left: '11.5%',
                            right: '10.5%',
                            top: '60%',
                            height: '30%',
                        }}
                    >
                        {/* Phosphor glow */}
                        <div
                            className="absolute inset-0"
                            style={{
                                boxShadow: 'inset 0 0 30px rgba(0,255,0,0.4)',
                                background: 'radial-gradient(ellipse at center, rgba(0,255,0,0.15) 0%, transparent 70%)',
                            }}
                        />
                        {/* Scanlines */}
                        <div
                            className="absolute inset-0"
                            style={{
                                backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(0,0,0,0.5) 1px, rgba(0,0,0,0.5) 2px)',
                                opacity: 0.7,
                            }}
                        />
                    </div>

                    {/* Upper CRT content - Earth / Home Base */}
                    <div
                        className="absolute flex items-center justify-start gap-4 cursor-pointer pl-4"
                        style={{
                            left: '11.5%',
                            right: '10.5%',
                            top: '16%',
                            height: '30%',
                        }}
                        onClick={() => navigate('/homebase')}
                    >
                        {/* Earth image */}
                        <div className="relative z-10">
                            <img
                                src={planetImages.earth}
                                alt="Earth"
                                className="w-16 h-16 md:w-20 md:h-20"
                                style={{ imageRendering: 'pixelated' }}
                            />
                        </div>

                        {/* Home info */}
                        <div className="relative z-10 flex flex-col">
                            <div className="text-xs md:text-sm text-green-400 uppercase tracking-wider font-bold mb-1 drop-shadow-[0_0_6px_rgba(74,222,128,0.6)] whitespace-nowrap">
                                Earth
                            </div>
                            <div className="text-[10px] md:text-xs text-green-300/70 font-mono whitespace-nowrap">
                                Command Center
                            </div>
                            <div className="flex items-center gap-1 mt-1">
                                <Home className="w-3 h-3 md:w-4 md:h-4 text-green-400" />
                                <span className="text-[10px] md:text-xs text-green-400/80">Home Base</span>
                            </div>
                        </div>
                    </div>

                    {/* Lower CRT content - Rank display */}
                    <div
                        className="absolute flex items-center justify-start gap-4 md:gap-6 pl-4"
                        style={{
                            left: '11.5%',
                            right: '10.5%',
                            top: '60%',
                            height: '30%',
                        }}
                    >
                        {/* Rank badge image */}
                        <div className="relative z-10">
                            <img
                                src={currentRank.badge}
                                alt={currentRank.name}
                                className="w-14 h-14 md:w-20 md:h-20"
                                style={{ imageRendering: 'pixelated' }}
                            />
                        </div>

                        {/* Rank info */}
                        <div className="relative z-10 flex flex-col">
                            {/* Rank name */}
                            <div className="text-xs md:text-sm text-cyan-400 uppercase tracking-wider font-bold mb-1 md:mb-2 drop-shadow-[0_0_6px_rgba(34,211,238,0.6)] whitespace-nowrap">
                                {currentRank.name}
                            </div>

                            {/* XP Progress bar */}
                            <div className="w-32 md:w-48 h-2 md:h-3 bg-black/60 rounded-sm overflow-hidden border border-cyan-900/50 mb-1">
                                <div
                                    className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 transition-all"
                                    style={{ width: `${xpProgress.progress * 100}%` }}
                                />
                            </div>

                            {/* XP text */}
                            <div className="text-[10px] md:text-xs text-cyan-300/70 font-mono">
                                {stats.totalXP.toLocaleString()} XP
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Milestone Modal */}
            {activeMilestone && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
                    onClick={handleDismissMilestone}
                >
                    <PixelCard className="w-full max-w-sm p-4 text-center">
                        <div className="flex items-center justify-center gap-2 mb-3">
                            <Radio className="w-5 h-5 text-brand-secondary" />
                            <span className="text-brand-secondary text-sm font-bold uppercase tracking-wider">
                                Incoming Transmission
                            </span>
                        </div>
                        <p className="text-white text-sm leading-relaxed mb-4">
                            "{MILESTONE_TEXT[activeMilestone]}"
                        </p>
                        <PixelButton onClick={handleDismissMilestone} size="sm" className="w-full">
                            Continue
                        </PixelButton>
                    </PixelCard>
                </div>
            )}

            {/* Rank-up Modal */}
            {rankUpModal.show && rankUpModal.rank && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
                    onClick={handleDismissRankUp}
                >
                    <PixelCard className="w-full max-w-sm p-4 text-center">
                        <div className="text-brand-accent text-xl font-bold mb-2">RANK UP!</div>
                        <div className="w-20 h-20 mx-auto mb-3 relative">
                            <img
                                src={rankUpModal.rank.badge}
                                alt={rankUpModal.rank.name}
                                className="w-full h-full"
                                style={{ imageRendering: 'pixelated' }}
                            />
                        </div>
                        <div className="text-white font-bold uppercase tracking-wider mb-4">
                            {rankUpModal.rank.name}
                        </div>
                        <PixelButton onClick={handleDismissRankUp} size="sm" className="w-full">
                            Continue
                        </PixelButton>
                    </PixelCard>
                </div>
            )}
        </div>
    );
};

export default SolarSystemMapMobile;
