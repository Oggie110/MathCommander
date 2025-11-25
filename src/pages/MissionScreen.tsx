import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { PixelButton } from '@/components/ui/PixelButton';
import { loadPlayerStats } from '@/utils/gameLogic';
import { initializeCampaignProgress, getLegById, getLegIndex, isBossLevel } from '@/utils/campaignLogic';
import { celestialBodies, campaignLegs } from '@/data/campaignRoute';
import type { Leg } from '@/data/campaignRoute';
import { ArrowLeft, Star, Rocket, Target } from 'lucide-react';

// Planet image mapping (same as SolarSystemMap)
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

interface LocationState {
    legId: string;
    isReplay?: boolean;
}

const MissionScreen: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const state = location.state as LocationState | null;

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
        navigate('/battle', {
            state: {
                legId,
                waypointIndex,
                isReplay: isReplay || getWaypointStatus(waypointIndex).isCompleted,
            },
        });
    };

    const waypoints = Array.from({ length: leg.waypointsRequired }, (_, i) => i);

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
                <h1 className="text-xl font-bold text-cyan-400 uppercase tracking-widest">
                    Mission: {destination.name}
                </h1>
                <div className="text-lg text-yellow-400 font-bold">
                    XP: {stats.totalXP}
                </div>
            </div>

            {/* Main content */}
            <div className="flex-1 relative z-10 flex flex-col items-center justify-center p-8">
                {/* Journey visualization */}
                <div className="flex items-center gap-8 mb-12">
                    {/* Origin */}
                    <div className="text-center">
                        <img
                            src={planetImages[origin.id]}
                            alt={origin.name}
                            className="w-16 h-16 mx-auto mb-2"
                            style={{ imageRendering: 'pixelated' }}
                        />
                        <div className="text-xs text-gray-400 uppercase">{origin.name}</div>
                    </div>

                    {/* Path with waypoints */}
                    <div className="flex items-center gap-4">
                        {waypoints.map((waypointIndex) => {
                            const status = getWaypointStatus(waypointIndex);
                            const stars = getStars(waypointIndex);
                            const isBoss = isBossLevel(waypointIndex, leg.waypointsRequired);

                            return (
                                <React.Fragment key={waypointIndex}>
                                    {/* Connecting line */}
                                    <div
                                        className={`w-8 h-1 ${
                                            status.isCompleted ? 'bg-green-500' : 'bg-gray-600'
                                        }`}
                                    />

                                    {/* Waypoint node */}
                                    <button
                                        onClick={() => !status.isLocked && handleStartMission(waypointIndex)}
                                        disabled={status.isLocked}
                                        className={`
                                            relative flex flex-col items-center p-4 rounded-lg border-2 transition-all
                                            ${status.isLocked
                                                ? 'border-gray-700 bg-gray-900/50 cursor-not-allowed opacity-50'
                                                : status.isCurrent
                                                    ? 'border-cyan-400 bg-cyan-900/30 hover:bg-cyan-900/50 cursor-pointer animate-pulse'
                                                    : status.isCompleted
                                                        ? 'border-green-500 bg-green-900/30 hover:bg-green-900/50 cursor-pointer'
                                                        : 'border-gray-600 bg-gray-800/50 cursor-pointer'
                                            }
                                        `}
                                    >
                                        {/* Icon */}
                                        <div className={`
                                            w-12 h-12 rounded-full flex items-center justify-center mb-2
                                            ${isBoss ? 'bg-red-900/50' : 'bg-gray-800'}
                                        `}>
                                            {isBoss ? (
                                                <Target className={`w-6 h-6 ${status.isLocked ? 'text-gray-600' : 'text-red-400'}`} />
                                            ) : (
                                                <Rocket className={`w-6 h-6 ${status.isLocked ? 'text-gray-600' : 'text-cyan-400'}`} />
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
                                            <div className="absolute -top-2 left-1/2 -translate-x-1/2 text-[10px] bg-cyan-500 text-black px-2 rounded font-bold">
                                                NEXT
                                            </div>
                                        )}
                                    </button>
                                </React.Fragment>
                            );
                        })}

                        {/* Final line to destination */}
                        <div
                            className={`w-8 h-1 ${
                                isCompletedLeg ? 'bg-green-500' : 'bg-gray-600'
                            }`}
                        />
                    </div>

                    {/* Destination */}
                    <div className="text-center">
                        <img
                            src={planetImages[destination.id]}
                            alt={destination.name}
                            className="w-20 h-20 mx-auto mb-2"
                            style={{ imageRendering: 'pixelated' }}
                        />
                        <div className="text-sm text-cyan-400 font-bold uppercase">{destination.name}</div>
                    </div>
                </div>

                {/* Mission info panel */}
                <div className="bg-gray-900/80 border border-gray-700 rounded-lg p-6 max-w-xl w-full">
                    <div className="flex items-start gap-4">
                        <img
                            src={planetImages[destination.id]}
                            alt={destination.name}
                            className="w-24 h-24"
                            style={{ imageRendering: 'pixelated' }}
                        />
                        <div className="flex-1">
                            <h2 className="text-xl font-bold text-white mb-2">{destination.name}</h2>
                            <p className="text-sm text-gray-400 mb-3">{destination.fact}</p>
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
