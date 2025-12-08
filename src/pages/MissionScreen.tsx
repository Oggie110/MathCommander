import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AnimatedPlanet, SpaceBackground } from '@/components/game';
import { loadPlayerStats } from '@/utils/gameLogic';
import { initializeCampaignProgress, getLegById, getLegIndex, isBossLevel } from '@/utils/campaignLogic';
import { celestialBodies } from '@/data/campaignRoute';
import { Star } from 'lucide-react';
import { Header } from '@/components/ui/Header';
import { useSFX } from '@/audio';
import { useIsMobile } from '@/hooks/useIsMobile';

interface LocationState {
    legId: string;
    isReplay?: boolean;
}

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
        return { isCompleted: false, isLocked: true, isCurrent: false };
    };

    const getStars = (waypointIndex: number): number => {
        const key = `${legId}_${waypointIndex}`;
        return progress.starsEarned[key] || 0;
    };

    const handleStartMission = (waypointIndex: number) => {
        play('doors');

        // Speech preloading happens in useBattleInit for just the needed sounds
        navigate('/battle', {
            state: {
                legId,
                waypointIndex,
                isReplay: isReplay || getWaypointStatus(waypointIndex).isCompleted,
            },
        });
    };

    const waypoints = Array.from({ length: leg.waypointsRequired }, (_, i) => i);
    // Only reverse for phone portrait (vertical layout), not for tablet horizontal layout
    const isPhonePortrait = isMobile && window.innerWidth < 768;
    const displayWaypoints = isPhonePortrait ? [...waypoints].reverse() : waypoints;

    return (
        <div className="flex-1 flex flex-col bg-gray-950">
            {/* Header */}
            <Header
                backTo="/map"
                fixed
            />

            <SpaceBackground />

            {/* Main content */}
            <div className="flex-1 relative z-10 flex flex-col items-center justify-start md:justify-center p-4 md:p-8 pt-20 overflow-y-auto">
                {/* Journey visualization */}
                <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8 mb-6 md:mb-12">
                    {/* Origin - desktop only */}
                    <div className="hidden md:block text-center">
                        <AnimatedPlanet planetId={origin.id} size={64} className="mx-auto mb-2" />
                        <div className="text-xs text-gray-400 uppercase">{origin.name}</div>
                    </div>

                    {/* Destination - mobile only */}
                    <div className="md:hidden text-center">
                        <AnimatedPlanet planetId={destination.id} size={64} className="mx-auto mb-2" />
                        <div className="text-sm text-cyan-400 font-bold uppercase">{destination.name}</div>
                    </div>

                    {/* Path with waypoints */}
                    <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4">
                        {displayWaypoints.map((waypointIndex) => {
                            const status = getWaypointStatus(waypointIndex);
                            const stars = getStars(waypointIndex);
                            const isBoss = isBossLevel(waypointIndex, leg.waypointsRequired);

                            return (
                                <React.Fragment key={waypointIndex}>
                                    <div
                                        className={`w-1 h-6 md:w-8 md:h-1 ${
                                            status.isCompleted ? 'bg-green-500' : 'bg-gray-600'
                                        }`}
                                    />

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
                                        <div className="flex items-center justify-center mb-1 w-12 h-12 md:w-12 md:h-12">
                                            {isBoss ? (
                                                <img
                                                    src="/assets/images/ships/boss-ship.png"
                                                    alt="Boss"
                                                    className={`w-12 h-12 md:w-[88px] md:h-[88px] ${status.isLocked ? 'opacity-30 grayscale' : 'animate-hoverSmall'}`}
                                                    style={{ imageRendering: 'pixelated', objectFit: 'contain' }}
                                                />
                                            ) : (
                                                <img
                                                    src="/assets/helianthus/ShooterFull/Ships/2/Pattern1/Red/Left/1.png"
                                                    alt="Wave"
                                                    className={`w-12 h-12 md:w-10 md:h-10 ${status.isLocked ? 'opacity-30 grayscale' : ''}`}
                                                    style={{ imageRendering: 'pixelated', objectFit: 'contain' }}
                                                />
                                            )}
                                        </div>

                                        <div className={`text-xs font-bold uppercase ${
                                            status.isLocked ? 'text-gray-600' : 'text-white'
                                        }`}>
                                            {isBoss ? 'BOSS' : `Wave ${waypointIndex + 1}`}
                                        </div>

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

                                        {status.isCurrent && (
                                            <div className="absolute -top-2 left-1/2 -translate-x-1/2 text-[10px] bg-cyan-500 text-black px-2 font-bold">
                                                NEXT
                                            </div>
                                        )}
                                    </button>
                                </React.Fragment>
                            );
                        })}

                        <div
                            className={`w-1 h-6 md:w-8 md:h-1 ${
                                isCompletedLeg ? 'bg-green-500' : 'bg-gray-600'
                            }`}
                        />
                    </div>

                    {/* Origin - mobile only */}
                    <div className="md:hidden text-center">
                        <AnimatedPlanet planetId={origin.id} size={64} className="mx-auto mb-2" />
                        <div className="text-xs text-gray-400 uppercase">{origin.name}</div>
                    </div>

                    {/* Destination - desktop only */}
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
                            <h2 className="text-lg md:text-xl font-bold text-white mb-2">
                                <span className="md:hidden">Target: </span>{destination.name}
                            </h2>
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
