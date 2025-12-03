import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { PixelButton } from '@/components/ui/PixelButton';
import { loadPlayerStats, savePlayerStats, getRankForXP, getXPProgress } from '@/utils/gameLogic';
import { RANKS } from '@/types/game';
import { initializeCampaignProgress, getLegById, getLegIndex, checkForMilestone, markMilestoneSeen } from '@/utils/campaignLogic';
import { celestialBodies, campaignLegs, getChapterName } from '@/data/campaignRoute';
import type { CelestialBody, Leg } from '@/data/campaignRoute';
import { ArrowLeft, Lock, Star, Radio, ChevronRight, Home } from 'lucide-react';
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

// Planet card component for mobile
interface PlanetCardProps {
    body: CelestialBody;
    leg: Leg | null;
    isCompleted: boolean;
    isCurrent: boolean;
    isLocked: boolean;
    isSelected: boolean;
    onClick: () => void;
    waypointProgress?: { current: number; total: number };
    starsEarned?: number;
    chapter: string;
    isLastInChapter: boolean; // In reversed display, shows header after (below) this item
}

const PlanetCard: React.FC<PlanetCardProps> = ({
    body,
    isCompleted,
    isCurrent,
    isLocked,
    isSelected,
    onClick,
    waypointProgress,
    starsEarned = 0,
    chapter,
    isLastInChapter,
}) => {
    const [frame, setFrame] = useState(1);
    const planetData = animatedPlanets[body.id];
    const shouldAnimate = (isCurrent || isSelected) && planetData && !isLocked;

    useEffect(() => {
        if (!shouldAnimate) return;
        const interval = setInterval(() => {
            setFrame(prev => (prev % planetData.frames) + 1);
        }, 100);
        return () => clearInterval(interval);
    }, [shouldAnimate, planetData]);

    const planetSrc = shouldAnimate && planetData
        ? `${planetData.folder}/${frame}.png`
        : planetImages[body.id];

    return (
        <>
            <div
                className={`flex items-center gap-3 p-3 border-b border-industrial-metal/20 transition-all
                    ${isLocked ? 'opacity-50' : 'active:bg-white/5'}
                    ${isCurrent ? 'bg-brand-secondary/10 border-l-4 border-l-brand-secondary' : ''}
                    ${isSelected && !isCurrent ? 'bg-brand-accent/10 border-l-4 border-l-brand-accent' : ''}
                    ${isCompleted && !isCurrent && !isSelected ? 'bg-brand-success/5' : ''}
                `}
                onClick={!isLocked ? onClick : undefined}
            >
                {/* Planet image */}
                <div className="relative flex-shrink-0">
                    <img
                        src={planetSrc}
                        alt={body.name}
                        className="w-14 h-14"
                        style={{
                            imageRendering: 'pixelated',
                            filter: isLocked ? 'brightness(0.3) grayscale(1)' : 'none',
                        }}
                    />
                    {isLocked && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Lock className="w-5 h-5 text-industrial-highlight" />
                        </div>
                    )}
                    {isCurrent && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-brand-secondary rounded-full animate-pulse" />
                    )}
                </div>

                {/* Planet info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className={`font-bold text-sm uppercase tracking-wide
                            ${isLocked ? 'text-industrial-metal' :
                              isCurrent ? 'text-brand-secondary' :
                              isCompleted ? 'text-brand-success' : 'text-white'}
                        `}>
                            {body.name}
                        </span>
                        {body.id === 'earth' && (
                            <Home className="w-3 h-3 text-brand-secondary" />
                        )}
                    </div>

                    {/* Stars for completed */}
                    {isCompleted && body.id !== 'earth' && (
                        <div className="flex gap-0.5 mt-1">
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

                    {/* Progress dots for current */}
                    {isCurrent && waypointProgress && (
                        <div className="flex gap-1 mt-1">
                            {Array.from({ length: waypointProgress.total }).map((_, i) => (
                                <div
                                    key={i}
                                    className={`w-2 h-2 rounded-full ${
                                        i < waypointProgress.current
                                            ? 'bg-brand-success'
                                            : i === waypointProgress.current
                                                ? 'bg-brand-accent animate-pulse'
                                                : 'bg-industrial-metal'
                                    }`}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Right side indicator */}
                <div className="flex-shrink-0">
                    {!isLocked && (
                        <ChevronRight className={`w-5 h-5 ${
                            isCurrent ? 'text-brand-secondary' :
                            isCompleted ? 'text-brand-success' : 'text-industrial-metal'
                        }`} />
                    )}
                </div>
            </div>

            {/* Chapter header - shown below the last item of each chapter (which appears first in reversed list) */}
            {isLastInChapter && (
                <div className="px-4 py-2 bg-space-dark/80 border-b border-industrial-metal/30">
                    <span className="text-xs text-brand-secondary font-bold uppercase tracking-wider">
                        {chapter}
                    </span>
                </div>
            )}
        </>
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

    // Scroll to bottom on mount (Earth area - where the journey starts)
    // Use useLayoutEffect to run before browser paint
    useLayoutEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, []);

    // Also try after render with useEffect as backup
    useEffect(() => {
        const scrollToBottom = () => {
            if (scrollRef.current) {
                scrollRef.current.scrollTo({
                    top: scrollRef.current.scrollHeight,
                    behavior: 'instant'
                });
            }
        };

        // Multiple attempts to ensure it works after all content loads
        scrollToBottom();
        const timer1 = setTimeout(scrollToBottom, 50);
        const timer2 = setTimeout(scrollToBottom, 150);

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
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

            {/* Planet list - reversed so Earth is at bottom, scroll up to progress */}
            {/* Add padding top/bottom to account for fixed header/footer */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto pt-14" style={{ paddingBottom: '326px' }}>
                {/* Campaign planets (in reversed order - distant planets at top) */}
                <div>
                    {planetList.map((planet) => planet && (
                        <div key={planet.body.id} id={`planet-${planet.body.id}`}>
                            <PlanetCard
                                body={planet.body}
                                leg={planet.leg}
                                isCompleted={planet.isCompleted}
                                isCurrent={planet.isCurrent}
                                isLocked={planet.isLocked}
                                isSelected={false}
                                onClick={() => handlePlanetClick(planet)}
                                waypointProgress={planet.waypointProgress}
                                starsEarned={planet.starsEarned}
                                chapter={planet.chapter}
                                isLastInChapter={planet.isLastInChapter}
                            />
                        </div>
                    ))}
                </div>

                {/* Earth - Home base (always at bottom) */}
                <div className="px-4 py-2 bg-space-dark/80 border-b border-industrial-metal/30">
                    <span className="text-xs text-brand-secondary font-bold uppercase tracking-wider">
                        Home Base
                    </span>
                </div>
                <div
                    id="planet-earth"
                    className="flex items-center gap-3 p-3 border-b border-industrial-metal/20 transition-all active:bg-white/5"
                    onClick={() => navigate('/homebase')}
                >
                    <img
                        src={planetImages.earth}
                        alt="Earth"
                        className="w-14 h-14"
                        style={{ imageRendering: 'pixelated' }}
                    />
                    <div className="flex-1">
                        <span className="font-bold text-sm uppercase tracking-wide text-brand-success">
                            Earth
                        </span>
                        <div className="text-xs text-industrial-highlight">Command Center</div>
                    </div>
                    <Home className="w-5 h-5 text-brand-secondary" />
                </div>
            </div>

            {/* Fixed Bottom Menu Bar */}
            <div
                className="fixed bottom-0 left-0 right-0 z-20 flex flex-col items-center justify-center"
                style={{
                    height: '326px',
                    paddingBottom: 'var(--safe-area-bottom)',
                }}
            >
                {/* Panel background with battle screen style filter */}
                <div
                    className="absolute inset-0"
                    style={{
                        backgroundImage: 'url(/assets/1NewStuff/panel/mobile_panel2.png)',
                        backgroundSize: 'calc(100% + 16px) auto',
                        backgroundPosition: 'center bottom',
                        backgroundRepeat: 'no-repeat',
                        imageRendering: 'pixelated',
                        filter: 'brightness(0.8) sepia(0.2) saturate(0.4) hue-rotate(180deg)',
                    }}
                />
                {/* Rank badge */}
                <div className="relative z-10 flex items-center justify-center gap-4">
                    <div className="text-center">
                        <div className="text-xs text-industrial-highlight uppercase">{currentRank.name}</div>
                        <div className="w-24 h-2 bg-space-black rounded-full overflow-hidden border border-industrial-metal/50">
                            <div
                                className="h-full bg-brand-accent transition-all"
                                style={{ width: `${xpProgress.progress * 100}%` }}
                            />
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
