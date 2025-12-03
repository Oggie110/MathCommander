import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { PixelButton } from '@/components/ui/PixelButton';
import { loadPlayerStats } from '@/utils/gameLogic';
import { initializeCampaignProgress, getLegById, getLegIndex, isBossLevel } from '@/utils/campaignLogic';
import { celestialBodies } from '@/data/campaignRoute';
import { ArrowLeft, Star } from 'lucide-react';
import { useSFX } from '@/audio';
import { useIsMobile } from '@/hooks/useIsMobile';

// Animated planet sprite mapping - folder path and frame count
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

// Animated Planet Component
const AnimatedPlanet: React.FC<{
    planetId: string;
    size: number;
    className?: string;
}> = ({ planetId, size, className = '' }) => {
    const [frame, setFrame] = useState(1);
    const planetData = animatedPlanets[planetId];

    useEffect(() => {
        if (!planetData) return;

        const interval = setInterval(() => {
            setFrame(prev => (prev % planetData.frames) + 1);
        }, 100); // ~10fps for gentle rotation

        return () => clearInterval(interval);
    }, [planetData]);

    if (!planetData) {
        return null;
    }

    return (
        <img
            src={`${planetData.folder}/${frame}.png`}
            alt={planetId}
            style={{
                width: size,
                height: size,
                imageRendering: 'pixelated',
            }}
            className={className}
        />
    );
};

interface LocationState {
    legId: string;
    isReplay?: boolean;
}

// Animated enemy ship sprite
const AnimatedShip: React.FC<{ isLocked: boolean }> = ({ isLocked }) => {
    const [frame, setFrame] = useState(1);

    useEffect(() => {
        const interval = setInterval(() => {
            setFrame(f => f >= 6 ? 1 : f + 1);
        }, 150); // 150ms per frame
        return () => clearInterval(interval);
    }, []);

    return (
        <img
            src={`/assets/helianthus/ShooterFull/Ships/2/Pattern1/Red/Left/${frame}.png`}
            alt="Wave"
            className={`w-10 h-10 object-contain ${isLocked ? 'opacity-30 grayscale' : ''}`}
            style={{ imageRendering: 'pixelated' }}
        />
    );
};

const MissionScreen: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const state = location.state as LocationState | null;
    const { play } = useSFX();
    const isMobile = useIsMobile();

    const stats = loadPlayerStats();
    const progress = stats.campaignProgress || initializeCampaignProgress();

    // Get the leg to display - from state or current progress
    const legId = state?.legId || progress.currentLegId;
    const isReplay = state?.isReplay || false;
    const leg = getLegById(legId);

    if (!leg) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="text-red-500">Mission not found</div>
            </div>
        );
    }

    const destination = celestialBodies[leg.toBodyId];
    const origin = celestialBodies[leg.fromBodyId];
    const legIndex = getLegIndex(legId);
    const currentLegIndex = getLegIndex(progress.currentLegId);
    const isCurrentLeg = legId === progress.currentLegId;
    const isCompletedLeg = legIndex < currentLegIndex;

    const getWaypointStatus = (waypointIndex: number) => {
        if (isCompletedLeg) {
            // All waypoints in completed legs are playable
            return { isCompleted: true, isLocked: false, isCurrent: false };
        }
        if (isCurrentLeg) {
            if (waypointIndex < progress.currentWaypointIndex) {
                return { isCompleted: true, isLocked: false, isCurrent: false };
            }
            if (waypointIndex === progress.currentWaypointIndex) {
                return { isCompleted: false, isLocked: false, isCurrent: true };
            }
            return { isCompleted: false, isLocked: true, isCurrent: false };
        }
        // Future leg - all locked
        return { isCompleted: false, isLocked: true, isCurrent: false };
    };

    const getStars = (waypointIndex: number): number => {
        const key = `${legId}_${waypointIndex}`;
        return progress.starsEarned[key] || 0;
    };

    const handleStartMission = (waypointIndex: number) => {
        play('doors');
        navigate('/battle', {
            state: {
                legId,
                waypointIndex,
                isReplay: isReplay || getWaypointStatus(waypointIndex).isCompleted,
            },
        });
    };

    const waypoints = Array.from({ length: leg.waypointsRequired }, (_, i) => i);
    // Reverse order on mobile so you scroll up to progress (destination at top)
    const displayWaypoints = isMobile ? [...waypoints].reverse() : waypoints;

    return (
        <div className="flex-1 flex flex-col overflow-hidden bg-gray-950">
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
                    className="absolute inset-0 animate-parallaxSlow"
                    style={{
                        backgroundImage: 'url(/assets/helianthus/SpaceBackgrounds/stars_blue.png)',
                        backgroundRepeat: 'repeat',
                        backgroundSize: '2048px',
                        opacity: 0.5,
                        imageRendering: 'pixelated',
                    }}
                />
            </div>

            {/* Header */}
            <div className="relative z-30 flex justify-between items-center p-4 bg-gradient-to-b from-black/80 to-transparent">
                <PixelButton variant="secondary" onClick={() => navigate('/map')} className="px-4 py-2">
                    <ArrowLeft className="w-4 h-4" />
                </PixelButton>
                <h1 className="hidden md:block text-xl font-bold text-cyan-400 uppercase tracking-widest">
                    Mission: {destination.name}
                </h1>
                <div className="text-sm md:text-lg text-yellow-400 font-bold whitespace-nowrap">
                    XP: {stats.totalXP}
                </div>
            </div>

            {/* Main content */}
            <div className="flex-1 relative z-10 flex flex-col items-center justify-start md:justify-center p-4 md:p-8 overflow-y-auto">
                {/* Journey visualization - vertical on mobile, horizontal on desktop */}
                <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8 mb-6 md:mb-12">
                    {/* Origin - desktop: left side, mobile: bottom */}
                    <div className="hidden md:block text-center">
                        <AnimatedPlanet planetId={origin.id} size={64} className="mx-auto mb-2" />
                        <div className="text-xs text-gray-400 uppercase">{origin.name}</div>
                    </div>

                    {/* Destination - mobile only: at top */}
                    <div className="md:hidden text-center">
                        <AnimatedPlanet planetId={destination.id} size={64} className="mx-auto mb-2" />
                        <div className="text-sm text-cyan-400 font-bold uppercase">{destination.name}</div>
                    </div>

                    {/* Path with waypoints - vertical on mobile */}
                    <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4">
                        {displayWaypoints.map((waypointIndex) => {
                            const status = getWaypointStatus(waypointIndex);
                            const stars = getStars(waypointIndex);
                            const isBoss = isBossLevel(waypointIndex, leg.waypointsRequired);

                            return (
                                <React.Fragment key={waypointIndex}>
                                    {/* Connecting line - vertical on mobile, horizontal on desktop */}
                                    <div
                                        className={`w-1 h-6 md:w-8 md:h-1 ${
                                            status.isCompleted ? 'bg-green-500' : 'bg-gray-600'
                                        }`}
                                    />

                                    {/* Waypoint node */}
                                    <button
                                        onClick={() => !status.isLocked && handleStartMission(waypointIndex)}
                                        disabled={status.isLocked}
                                        className={`
                                            relative flex flex-col items-center justify-center w-28 h-28 md:w-auto md:h-auto md:p-4 border-4 transition-all
                                            ${status.isLocked
                                                ? 'border-red-900 bg-gray-900/50 cursor-not-allowed opacity-50'
                                                : status.isCurrent
                                                    ? 'border-red-500 bg-red-900/30 hover:bg-red-900/50 cursor-pointer animate-pulseSubtle'
                                                    : status.isCompleted
                                                        ? 'border-green-500 bg-green-900/30 hover:bg-green-900/50 cursor-pointer'
                                                        : 'border-red-500 bg-red-900/30 hover:bg-red-900/50 cursor-pointer'
                                            }
                                        `}
                                    >
                                        {/* Icon - uniform size on mobile */}
                                        <div className="flex items-center justify-center mb-1 w-12 h-12 md:w-12 md:h-12">
                                            {isBoss ? (
                                                <img
                                                    src="/assets/1Ships/BossShip1Small.png"
                                                    alt="Boss"
                                                    className={`w-12 h-12 md:w-[88px] md:h-[88px] ${status.isLocked ? 'opacity-30 grayscale' : 'animate-hoverSmall'}`}
                                                    style={{ imageRendering: 'pixelated', objectFit: 'contain' }}
                                                />
                                            ) : (
                                                <img
                                                    src={`/assets/helianthus/ShooterFull/Ships/2/Pattern1/Red/Left/1.png`}
                                                    alt="Wave"
                                                    className={`w-12 h-12 md:w-10 md:h-10 ${status.isLocked ? 'opacity-30 grayscale' : ''}`}
                                                    style={{ imageRendering: 'pixelated', objectFit: 'contain' }}
                                                />
                                            )}
                                        </div>

                                        {/* Label */}
                                        <div className={`text-xs font-bold uppercase ${
                                            status.isLocked ? 'text-gray-600' : 'text-white'
                                        }`}>
                                            {isBoss ? 'BOSS' : `Wave ${waypointIndex + 1}`}
                                        </div>

                                        {/* Stars */}
                                        {status.isCompleted && (
                                            <div className="flex gap-0.5 mt-1">
                                                {[1, 2, 3].map((star) => (
                                                    <Star
                                                        key={star}
                                                        className={`w-3 h-3 ${
                                                            star <= stars
                                                                ? 'text-yellow-400 fill-yellow-400'
                                                                : 'text-gray-600'
                                                        }`}
                                                    />
                                                ))}
                                            </div>
                                        )}

                                        {/* Current indicator */}
                                        {status.isCurrent && (
                                            <div className="absolute -top-2 left-1/2 -translate-x-1/2 text-[10px] bg-cyan-500 text-black px-2 font-bold">
                                                NEXT
                                            </div>
                                        )}
                                    </button>
                                </React.Fragment>
                            );
                        })}

                        {/* Final line to destination */}
                        <div
                            className={`w-1 h-6 md:w-8 md:h-1 ${
                                isCompletedLeg ? 'bg-green-500' : 'bg-gray-600'
                            }`}
                        />
                    </div>

                    {/* Origin - mobile only: at bottom */}
                    <div className="md:hidden text-center">
                        <AnimatedPlanet planetId={origin.id} size={64} className="mx-auto mb-2" />
                        <div className="text-xs text-gray-400 uppercase">{origin.name}</div>
                    </div>

                    {/* Destination - desktop only: right side */}
                    <div className="hidden md:block text-center">
                        <AnimatedPlanet planetId={destination.id} size={64} className="mx-auto mb-2 md:w-20 md:h-20" />
                        <div className="text-sm text-cyan-400 font-bold uppercase">{destination.name}</div>
                    </div>
                </div>

                {/* Mission info panel */}
                <div className="bg-gray-900/80 border-4 border-gray-700 p-4 md:p-6 max-w-xl w-full">
                    <div className="flex items-start gap-3 md:gap-4">
                        <AnimatedPlanet planetId={destination.id} size={64} className="md:w-24 md:h-24 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                            <h2 className="text-lg md:text-xl font-bold text-white mb-2"><span className="md:hidden">Target: </span>{destination.name}</h2>
                            <p className="text-xs md:text-sm text-gray-400 mb-2 md:mb-3">{destination.fact}</p>
                            <div className="text-xs">
                                <span className="text-gray-500">Focus Tables: </span>
                                <span className="text-green-400">{destination.focusTables.join(', ')}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MissionScreen;
