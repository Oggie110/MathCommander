import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PixelButton } from '@/components/ui/PixelButton';
import { loadPlayerStats, savePlayerStats } from '@/utils/gameLogic';
import { initializeCampaignProgress, getLegById, getLegIndex, checkForMilestone, markMilestoneSeen } from '@/utils/campaignLogic';
import { celestialBodies, campaignLegs, getChapterName } from '@/data/campaignRoute';
import type { CelestialBody, Leg } from '@/data/campaignRoute';
import { ArrowLeft, Lock, Star, ChevronRight, Radio } from 'lucide-react';
import { audioEngine } from '@/audio';
import { speechService } from '@/audio/SpeechService';
import { milestoneMessages } from '@/data/narrative';
import { PixelCard } from '@/components/ui/PixelCard';
import { MILESTONE_TEXT } from '@/audio/speechSounds';

// Planet image mapping
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

// Planet positions on the map - arranged in campaign flow order (serpentine path)
// Bottom row (L→R): Earth → Moon → Mars → Ceres → Jupiter
// Middle row (L→R): Europa → Saturn → Titan → Uranus → Neptune
// Top row (L→R): Pluto → Haumea → Makemake → Eris → Arrokoth
const planetPositions: Record<string, { x: number; y: number; size: number }> = {
    // Inner System (bottom row)
    earth: { x: 6, y: 78, size: 44 },
    moon: { x: 16, y: 72, size: 28 },
    mars: { x: 28, y: 78, size: 36 },
    ceres: { x: 40, y: 72, size: 22 },
    jupiter: { x: 54, y: 78, size: 56 },
    // Gas Giants (middle row)
    europa: { x: 66, y: 68, size: 26 },
    saturn: { x: 80, y: 62, size: 52 },
    titan: { x: 90, y: 52, size: 28 },
    // Ice Giants (continuing up)
    uranus: { x: 82, y: 42, size: 40 },
    neptune: { x: 70, y: 35, size: 40 },
    // Kuiper Belt (top row, going left then right)
    pluto: { x: 56, y: 28, size: 26 },
    haumea: { x: 42, y: 22, size: 22 },
    makemake: { x: 28, y: 18, size: 26 },
    eris: { x: 14, y: 24, size: 28 },
    arrokoth: { x: 6, y: 16, size: 18 },
};

interface WaypointNodeProps {
    body: CelestialBody;
    leg: Leg | null;
    isCompleted: boolean;
    isCurrent: boolean;
    isLocked: boolean;
    onClick: () => void;
    waypointProgress?: { current: number; total: number };
}

const WaypointNode: React.FC<WaypointNodeProps> = ({
    body,
    isCompleted,
    isCurrent,
    isLocked,
    onClick,
    waypointProgress,
}) => {
    const pos = planetPositions[body.id];
    const canClick = !isLocked;

    return (
        <div
            className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 ${canClick ? 'hover:scale-110' : 'cursor-not-allowed'
                } ${isCurrent ? 'z-20' : 'z-10'}`}
            style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
            onClick={canClick ? onClick : undefined}
        >
            {/* Selection ring for current */}
            {isCurrent && (
                <div
                    className="absolute inset-0 rounded-full animate-ping"
                    style={{
                        width: pos.size + 16,
                        height: pos.size + 16,
                        left: -8,
                        top: -8,
                        border: '3px solid var(--color-brand-secondary)',
                        opacity: 0.5,
                    }}
                />
            )}

            {/* Planet image */}
            <div className="relative">
                <img
                    src={planetImages[body.id]}
                    alt={body.name}
                    style={{
                        width: pos.size,
                        height: pos.size,
                        imageRendering: 'pixelated',
                        filter: isLocked ? 'brightness(0.3) grayscale(1)' : 'none',
                    }}
                    className={`${isCurrent ? 'animate-pulse' : ''}`}
                />


                {/* Lock icon */}
                {isLocked && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Lock className="w-6 h-6 text-industrial-highlight" />
                    </div>
                )}

                {/* Waypoint progress dots */}
                {isCurrent && waypointProgress && (
                    <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 flex gap-1">
                        {Array.from({ length: waypointProgress.total }).map((_, i) => (
                            <div
                                key={i}
                                className={`w-2 h-2 rounded-full ${i < waypointProgress.current
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

            {/* Planet name label and stars */}
            <div
                className="absolute left-1/2 transform -translate-x-1/2 flex flex-col items-center"
                style={{ top: pos.size + 4 }}
            >
                <div
                    className={`text-[10px] font-bold uppercase tracking-wider whitespace-nowrap font-tech ${isLocked ? 'text-industrial-metal' : isCurrent ? 'text-brand-secondary' : isCompleted ? 'text-brand-success' : 'text-industrial-highlight'
                        }`}
                >
                    {body.name}
                </div>
                {/* Star ratings for completed planets */}
                {isCompleted && body.id !== 'earth' && (
                    <div className="flex gap-0.5 mt-0.5">
                        {[1, 2, 3].map((star) => (
                            <Star
                                key={star}
                                className="w-2.5 h-2.5 text-brand-accent fill-brand-accent"
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

const SolarSystemMap: React.FC = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState(() => loadPlayerStats());
    const progress = stats.campaignProgress || initializeCampaignProgress();

    // Milestone modal state
    const [activeMilestone, setActiveMilestone] = useState<'inner' | 'kuiper' | null>(null);

    // Start menu music and ambience when entering map (e.g., after battle)
    useEffect(() => {
        // Switch to menu music (crossfades from battle music if coming from battle)
        audioEngine.playMusic('menuMusic');
        // Stop space ambience and start menu ambience
        audioEngine.stopAmbience('spaceAmbience');
        audioEngine.startAmbience('menuAmbience');
    }, []);

    // Check for milestone on mount
    useEffect(() => {
        const milestone = checkForMilestone(progress);
        if (milestone) {
            // Show the milestone modal after a short delay for dramatic effect
            const timer = setTimeout(() => {
                setActiveMilestone(milestone);
                // Play the milestone audio
                speechService.playMilestone(milestone);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [progress.currentLegId, progress.currentWaypointIndex]);

    // Handle dismissing the milestone modal
    const handleDismissMilestone = () => {
        if (activeMilestone) {
            // Mark milestone as seen and save
            const updatedProgress = markMilestoneSeen(progress, activeMilestone);
            const updatedStats = {
                ...stats,
                campaignProgress: updatedProgress,
            };
            savePlayerStats(updatedStats);
            setStats(updatedStats);
            setActiveMilestone(null);
        }
    };

    const currentLegIndex = getLegIndex(progress.currentLegId);
    const currentLeg = getLegById(progress.currentLegId);

    const [selectedBody, setSelectedBody] = useState<CelestialBody | null>(
        currentLeg ? celestialBodies[currentLeg.toBodyId] : null
    );
    const [selectedLeg, setSelectedLeg] = useState<Leg | null>(currentLeg ?? null);

    const getBodyStatus = (bodyId: string) => {
        // Find which leg this body is the destination of
        const legForBody = campaignLegs.find(leg => leg.toBodyId === bodyId);
        if (!legForBody) {
            // Earth is the starting point
            return { isCompleted: true, isCurrent: false, isLocked: false };
        }

        const legIndex = campaignLegs.indexOf(legForBody);

        // Check if this leg is in completedLegs (important for final leg which stays as currentLegId)
        const isLegCompleted = progress.completedLegs.includes(legForBody.id);

        if (isLegCompleted || legIndex < currentLegIndex) {
            return { isCompleted: true, isCurrent: false, isLocked: false };
        } else if (legIndex === currentLegIndex) {
            return { isCompleted: false, isCurrent: true, isLocked: false };
        } else {
            return { isCompleted: false, isCurrent: false, isLocked: true };
        }
    };

    const handleBodyClick = (body: CelestialBody) => {
        const status = getBodyStatus(body.id);
        if (!status.isLocked) {
            setSelectedBody(body);
            const leg = campaignLegs.find(l => l.toBodyId === body.id);
            setSelectedLeg(leg || null);
        }
    };

    const handleStartMission = (isReplay: boolean = false) => {
        if (!selectedBody) return;
        // Earth is the starting point, not a destination - can't start mission from it
        if (selectedBody.id === 'earth') return;
        const leg = campaignLegs.find(l => l.toBodyId === selectedBody.id);
        if (!leg) return;
        navigate('/mission', {
            state: {
                legId: leg.id,
                isReplay,
            },
        });
    };

    // Draw path lines between connected planets (SVG lines with glow effect)
    const renderPaths = () => {
        return (
            <svg
                className="absolute inset-0 w-full h-full pointer-events-none"
                style={{ zIndex: 1 }}
            >
                <defs>
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>
                {campaignLegs.map((leg, index) => {
                    const from = planetPositions[leg.fromBodyId];
                    const to = planetPositions[leg.toBodyId];
                    const isCompleted = index < currentLegIndex;
                    const isCurrent = index === currentLegIndex;
                    const isLocked = index > currentLegIndex;

                    return (
                        <line
                            key={leg.id}
                            x1={`${from.x}%`}
                            y1={`${from.y}%`}
                            x2={`${to.x}%`}
                            y2={`${to.y}%`}
                            stroke={isCompleted ? 'var(--color-brand-success)' : isCurrent ? 'var(--color-brand-secondary)' : 'var(--color-industrial-metal)'}
                            strokeWidth={isCurrent ? 3 : isCompleted ? 2 : 1}
                            strokeDasharray={isCurrent ? '10 5' : isLocked ? '3 6' : 'none'}
                            opacity={isCompleted ? 0.5 : isCurrent ? 0.9 : 0.2}
                            strokeLinecap="round"
                            filter={isCurrent ? 'url(#glow)' : undefined}
                        />
                    );
                })}
            </svg>
        );
    };

    return (
        <div className="flex-1 flex flex-col overflow-hidden bg-space-black relative">
            {/* Background with stars */}
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
            <div className="relative z-30 flex justify-between items-center p-4 bg-industrial-dark/90 border-b-2 border-industrial-metal shadow-lg">
                <PixelButton variant="secondary" onClick={() => navigate('/')} className="px-4 py-2" size="sm">
                    <ArrowLeft className="w-4 h-4" />
                </PixelButton>
                <h1 className="text-xl font-bold text-brand-secondary uppercase tracking-widest font-tech">Star Map</h1>
                <div className="text-lg text-brand-accent font-bold font-pixel">
                    XP: {stats.totalXP}
                </div>
            </div>

            {/* Main map area */}
            <div className="flex-1 relative z-10 overflow-hidden">
                {/* Chapter labels - positioned to match new layout */}
                <div className="absolute bottom-4 left-4 text-[10px] text-industrial-highlight uppercase tracking-wider opacity-60 font-tech">Inner System</div>
                <div className="absolute bottom-4 right-8 text-[10px] text-industrial-highlight uppercase tracking-wider opacity-60 font-tech">Gas Giants</div>
                <div className="absolute top-1/2 right-4 text-[10px] text-industrial-highlight uppercase tracking-wider opacity-60 font-tech">Ice Giants</div>
                <div className="absolute top-4 left-4 text-[10px] text-industrial-highlight uppercase tracking-wider opacity-60 font-tech">Kuiper Belt</div>

                {/* Paths */}
                {renderPaths()}

                {/* Planet nodes */}
                {Object.values(celestialBodies).map(body => {
                    const status = getBodyStatus(body.id);
                    const leg = campaignLegs.find(l => l.toBodyId === body.id);
                    const waypointProgress = status.isCurrent ? {
                        current: progress.currentWaypointIndex,
                        total: currentLeg?.waypointsRequired || 4,
                    } : undefined;

                    return (
                        <WaypointNode
                            key={body.id}
                            body={body}
                            leg={leg || null}
                            isCompleted={status.isCompleted}
                            isCurrent={status.isCurrent}
                            isLocked={status.isLocked}
                            onClick={() => handleBodyClick(body)}
                            waypointProgress={waypointProgress}
                        />
                    );
                })}
            </div>

            {/* Bottom info panel */}
            <div className="relative z-30 bg-industrial-dark border-t-4 border-industrial-metal shadow-[0_-4px_10px_rgba(0,0,0,0.5)]">
                {/* Hazard Stripe Top Border */}
                <div className="h-2 w-full bg-hazard opacity-50" />

                <div className="p-4">
                    {selectedBody ? (
                        <div className="flex items-center gap-6">
                            {/* Selected planet preview */}
                            <div className="flex-shrink-0 relative">
                                <div className="absolute inset-0 bg-brand-secondary/20 rounded-full blur-xl animate-pulse" />
                                <img
                                    src={planetImages[selectedBody.id]}
                                    alt={selectedBody.name}
                                    className="w-20 h-20 relative z-10"
                                    style={{ imageRendering: 'pixelated' }}
                                />
                            </div>

                            {/* Planet info */}
                            <div className="flex-1 min-w-0">
                                <h2 className="text-2xl font-bold text-white mb-1 font-pixel">{selectedBody.name}</h2>
                                {selectedLeg && (
                                    <div className="text-xs text-brand-secondary uppercase tracking-wider mb-2 font-tech">
                                        {getChapterName(selectedLeg.chapter)}
                                    </div>
                                )}
                                <p className="text-sm text-gray-300 line-clamp-2 font-tech">{selectedBody.fact}</p>
                                <div className="flex gap-4 mt-2">
                                    <div className="text-xs font-tech">
                                        <span className="text-industrial-highlight">Tables: </span>
                                        <span className="text-brand-success">{selectedBody.focusTables.join(', ')}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Action button */}
                            <div className="flex-shrink-0">
                                {getBodyStatus(selectedBody.id).isCurrent ? (
                                    <PixelButton onClick={() => handleStartMission(false)} className="px-6 py-3 text-lg" variant="primary">
                                        LAUNCH <ChevronRight className="w-5 h-5 inline" />
                                    </PixelButton>
                                ) : getBodyStatus(selectedBody.id).isCompleted && selectedBody.id !== 'earth' ? (
                                    <div className="text-center">
                                        <div className="text-brand-success text-sm font-bold flex items-center gap-1 font-tech">
                                            <Star className="w-4 h-4 fill-brand-success" /> CLEARED
                                        </div>
                                        <PixelButton variant="secondary" onClick={() => handleStartMission(true)} className="px-4 py-2 mt-2 text-sm" size="sm">
                                            REPLAY
                                        </PixelButton>
                                    </div>
                                ) : selectedBody.id === 'earth' ? (
                                    <div className="text-center text-brand-secondary text-sm font-bold font-tech">
                                        HOME BASE
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center text-industrial-highlight font-tech py-4">
                            SELECT A DESTINATION ON THE MAP
                        </div>
                    )}
                </div>
            </div>

            {/* Milestone Modal Overlay */}
            {activeMilestone && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 animate-fadeIn">
                    <PixelCard className="max-w-lg mx-4 p-6 border-brand-secondary bg-gray-900/95">
                        <div className="flex items-center gap-3 mb-4 border-b border-brand-secondary/30 pb-3">
                            <div className="w-3 h-3 rounded-full bg-brand-secondary animate-pulse" />
                            <Radio className="w-5 h-5 text-brand-secondary" />
                            <span className="text-brand-secondary text-sm font-bold tracking-widest">
                                MILESTONE REACHED
                            </span>
                        </div>
                        <p className="text-cyan-300 text-lg leading-relaxed mb-6">
                            "{MILESTONE_TEXT[activeMilestone === 'inner' ? 'milestone_inner' : 'milestone_kuiper']}"
                        </p>
                        <PixelButton
                            onClick={handleDismissMilestone}
                            className="w-full py-3"
                            variant="primary"
                        >
                            CONTINUE
                        </PixelButton>
                    </PixelCard>
                </div>
            )}
        </div>
    );
};

export default SolarSystemMap;
