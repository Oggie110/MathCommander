import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { PixelButton } from '@/components/ui/PixelButton';
import { AnimatedPlanet, SpaceBackground } from '@/components/game';
import { loadPlayerStats, savePlayerStats, getRankForXP, getNextRank, getXPProgress } from '@/utils/gameLogic';
import { RANKS } from '@/types/game';
import { initializeCampaignProgress, getLegById, getLegIndex, checkForMilestone, markMilestoneSeen, getTotalStarsEarned, getCompletedWaypointsCount, getTotalWaypoints } from '@/utils/campaignLogic';
import { celestialBodies, campaignLegs, getChapterName } from '@/data/campaignRoute';
import type { CelestialBody, Leg } from '@/data/campaignRoute';
import { Lock, Star, Radio, ChevronRight, Sparkles, Rocket } from 'lucide-react';
import { Header } from '@/components/ui/Header';
import { audioEngine } from '@/audio';
import { speechService } from '@/audio/SpeechService';
import { MILESTONE_TEXT } from '@/audio/speechSounds';
import { PixelCard } from '@/components/ui/PixelCard';

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
                className={`text-[11px] font-bold uppercase tracking-wider whitespace-nowrap mt-1 font-pixel ${
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
    const location = useLocation();
    const [stats, setStats] = useState(() => loadPlayerStats());
    const progress = stats.campaignProgress || initializeCampaignProgress();
    const scrollRef = useRef<HTMLDivElement>(null);

    // Check if we came from cinematic for fade-in effect
    const fromCinematic = (location.state as { fromCinematic?: boolean })?.fromCinematic;
    const [fadeIn, setFadeIn] = useState(fromCinematic);

    // Trigger fade-in animation
    useEffect(() => {
        if (fromCinematic) {
            const timer = setTimeout(() => setFadeIn(false), 50);
            return () => clearTimeout(timer);
        }
    }, [fromCinematic]);

    // Milestone modal state
    const [activeMilestone, setActiveMilestone] = useState<'inner' | 'kuiper' | null>(null);

    // Rank-up modal state
    const [rankUpModal, setRankUpModal] = useState<{ show: boolean; rank: typeof RANKS[0] | null }>({ show: false, rank: null });

    // Stats panel overlay state
    const [showStatsPanel, setShowStatsPanel] = useState(false);
    const [statsPanelVisible, setStatsPanelVisible] = useState(false);

    // Start menu music
    // NOTE: Ambience is already running from StartScreen - never stop it
    useEffect(() => {
        audioEngine.playMusic('menuMusic');
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
        <div className={`h-full flex flex-col bg-space-black transition-opacity duration-4000 ${fadeIn ? 'opacity-0' : 'opacity-100'}`}>
            {/* Fixed Header */}
            <Header
                showBackButton={false}
                leftLabel="HOME"
                onLeftLabelClick={() => navigate('/home')}
                title="Mission Map"
                fixed
            />

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
            <div ref={scrollRef} className="flex-1 overflow-y-auto pt-14 relative" style={{ paddingBottom: '150px' }}>
                {/* Space background - same as StartScreen */}
                <SpaceBackground />

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
                        <div className="text-[11px] font-bold uppercase tracking-wider whitespace-nowrap mt-1 font-pixel text-brand-success">
                            Earth
                        </div>
                        <div className="text-[9px] text-brand-secondary font-normal tracking-wide whitespace-nowrap">
                            (Home Base)
                        </div>
                    </div>
                </div>
            </div>

            {/* Fixed Bottom Panel - clickable to show Stats overlay */}
            <div
                className="fixed bottom-0 left-0 right-0 z-20 cursor-pointer"
                style={{ paddingBottom: 'var(--safe-area-bottom)' }}
                onClick={() => {
                    audioEngine.playSFX('shipSlide3');
                    setShowStatsPanel(true);
                    requestAnimationFrame(() => setStatsPanelVisible(true));
                }}
            >
                <div className="p-4 max-w-xl mx-auto">
                    <div className="bg-gray-900/80 border-4 border-cyan-600/50 p-4 active:bg-gray-800/80 transition-colors"
                        style={{ boxShadow: '0 0 12px rgba(0, 200, 255, 0.3)' }}
                    >
                        <div className="flex items-center gap-4">
                            {/* Rank Badge */}
                            <div className="flex-shrink-0">
                                <img
                                    src={currentRank.badge}
                                    alt={currentRank.name}
                                    className="w-16 h-16"
                                    style={{ imageRendering: 'pixelated' }}
                                />
                            </div>

                            {/* Info Content */}
                            <div className="flex-1 min-w-0">
                                <div className="text-xs text-cyan-400 font-bold uppercase mb-1">
                                    {currentRank.name}
                                </div>
                                <div className="text-xs">
                                    <span className="text-gray-500">Total XP: </span>
                                    <span className="text-yellow-400">{stats.totalXP.toLocaleString()}</span>
                                </div>
                            </div>

                            {/* Chevron indicator */}
                            <ChevronRight className="w-6 h-6 text-cyan-400 flex-shrink-0 animate-pulse" />
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

            {/* Stats Panel Overlay */}
            {showStatsPanel && (() => {
                const totalStars = getTotalStarsEarned(progress);
                const completedWaypoints = getCompletedWaypointsCount(progress);
                const totalWaypoints = getTotalWaypoints();
                const completedStages = progress.completedLegs.length;
                const nextRank = getNextRank(stats.totalXP);
                const xpProgress = getXPProgress(stats.totalXP);

                const handleClose = () => {
                    audioEngine.playSFX('shipSlide3');
                    setStatsPanelVisible(false);
                    setTimeout(() => setShowStatsPanel(false), 300);
                };

                return (
                    <div
                        className="fixed inset-0 z-50 transition-transform duration-300 ease-out"
                        style={{ transform: statsPanelVisible ? 'translateX(0)' : 'translateX(100%)' }}
                    >
                        {/* Background Image */}
                        <div
                            className="absolute inset-0 z-0"
                            style={{
                                backgroundImage: 'url(/assets/images/ui/misc/homebase2.png)',
                                backgroundSize: 'cover',
                                backgroundPosition: 'center center',
                                backgroundRepeat: 'no-repeat',
                            }}
                        />

                        {/* Dark overlay */}
                        <div className="absolute inset-0 z-0 bg-black/70" />

                        {/* Header */}
                        <Header
                            showBackButton={true}
                            onBackClick={handleClose}
                            fixed
                        />

                        {/* Main content */}
                        <div className="relative z-10 flex items-center justify-center w-full h-full p-4 pt-24">
                            <div className="flex flex-col gap-4 w-80">
                                <PixelCard className="p-8 bg-industrial-dark/95 backdrop-blur-sm">
                                    <h2 className="text-brand-accent font-pixel text-base mb-4 text-center">
                                        PILOT STATS
                                    </h2>

                                    {/* Player Rank Badge */}
                                    <div className="flex flex-col items-center mb-4 pb-4 border-b border-industrial-metal">
                                        <div className="w-32 h-32 flex items-center justify-center mb-3">
                                            <img
                                                src={currentRank.badge}
                                                alt={currentRank.name}
                                                className="w-full h-full object-contain"
                                                style={{ imageRendering: 'pixelated' }}
                                            />
                                        </div>
                                        <div className="text-center">
                                            <div className="text-gray-300 font-pixel text-lg uppercase">{currentRank.name}</div>
                                            <div className="text-yellow-400 text-sm font-pixel mt-1">
                                                {stats.totalXP.toLocaleString()} XP
                                            </div>
                                        </div>
                                    </div>

                                    {/* XP Progress to Next Rank */}
                                    <div className="mb-3">
                                        <div className="text-industrial-highlight font-pixel text-[10px] mb-1">
                                            {nextRank ? 'PROGRESS TO NEXT RANK' : 'MAX RANK ACHIEVED'}
                                        </div>
                                        {nextRank && (
                                            <div className="text-brand-secondary font-pixel text-xs mb-1">
                                                {xpProgress.current.toLocaleString()} / {xpProgress.next.toLocaleString()}
                                            </div>
                                        )}
                                        <div className="h-2 bg-industrial-metal rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-brand-accent to-brand-secondary transition-all"
                                                style={{ width: `${Math.round(xpProgress.progress * 100)}%` }}
                                            />
                                        </div>
                                        {nextRank && (
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className="text-industrial-highlight text-xs font-pixel whitespace-nowrap">NEXT:</span>
                                                <span className="text-brand-secondary text-xs font-pixel whitespace-nowrap">{nextRank.name}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Stars */}
                                    <div className="flex items-center justify-between mb-3 py-2 border-y border-industrial-metal">
                                        <div className="flex items-center gap-2">
                                            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                            <span className="text-industrial-highlight text-xs font-pixel">STARS EARNED</span>
                                        </div>
                                        <span className="text-yellow-400 font-pixel">{totalStars}</span>
                                    </div>

                                    {/* Progress */}
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <Rocket className="w-4 h-4 text-brand-secondary" />
                                            <span className="text-industrial-highlight text-xs font-pixel">MISSIONS</span>
                                        </div>
                                        <span className="text-white font-pixel">{completedWaypoints} / {totalWaypoints}</span>
                                    </div>

                                    {/* Stages */}
                                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-industrial-metal">
                                        <div className="flex items-center gap-2">
                                            <Sparkles className="w-4 h-4 text-brand-success" />
                                            <span className="text-industrial-highlight text-xs font-pixel">PLANETS CLEARED</span>
                                        </div>
                                        <span className="text-brand-success font-pixel">{completedStages}</span>
                                    </div>

                                    {/* Spaceship display */}
                                    <h3 className="text-brand-secondary font-pixel text-sm mb-3 text-center">YOUR SHIP</h3>
                                    <div className="flex justify-center">
                                        <video
                                            src="/assets/video/ShipRotate.mp4"
                                            autoPlay
                                            loop
                                            muted
                                            playsInline
                                            className="w-32 h-32 object-contain"
                                        />
                                    </div>
                                    <div className="text-center mt-2">
                                        <div className="text-white font-pixel text-sm">STELLAR FALCON</div>
                                        <div className="text-industrial-highlight text-xs font-pixel">CLASS: INTERCEPTOR</div>
                                    </div>
                                </PixelCard>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
};

export default SolarSystemMapMobile;
