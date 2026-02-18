import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { PixelButton } from '@/components/ui/PixelButton';
import { AnimatedPlanet, SpaceBackground } from '@/components/game';
import { loadPlayerStats, savePlayerStats, getRankForXP, getXPProgress } from '@/utils/gameLogic';
import { RANKS } from '@/types/game';
import { initializeCampaignProgress, getLegById, getLegIndex, checkForMilestone, markMilestoneSeen } from '@/utils/campaignLogic';
import { celestialBodies, campaignLegs, getChapterName } from '@/data/campaignRoute';
import type { CelestialBody, Leg } from '@/data/campaignRoute';
import { ArrowLeft, Lock, Star, Radio } from 'lucide-react';
import { audioEngine } from '@/audio';
import { speechService } from '@/audio/SpeechService';
import { MILESTONE_TEXT } from '@/audio/speechSounds';

// Planet positions on the map - arranged in campaign flow order (serpentine path)
// Bottom row (L→R): Earth → Moon → Mars → Ceres → Jupiter
// Middle row (L→R): Europa → Saturn → Titan → Uranus → Neptune
// Top row (L→R): Pluto → Haumea → Makemake → Eris → Arrokoth
const planetPositions: Record<string, { x: number; y: number; size: number }> = {
    // Inner System (bottom row) - sizes doubled
    earth: { x: 6, y: 78, size: 88 },
    moon: { x: 16, y: 72, size: 56 },
    mars: { x: 28, y: 78, size: 72 },
    ceres: { x: 40, y: 72, size: 44 },
    jupiter: { x: 54, y: 78, size: 112 },
    // Gas Giants (middle row) - sizes doubled
    europa: { x: 66, y: 68, size: 52 },
    saturn: { x: 80, y: 62, size: 104 },
    titan: { x: 90, y: 52, size: 56 },
    // Ice Giants (continuing up) - sizes doubled
    uranus: { x: 82, y: 42, size: 80 },
    neptune: { x: 70, y: 35, size: 80 },
    // Kuiper Belt (top row, going left then right) - sizes doubled
    pluto: { x: 56, y: 28, size: 52 },
    haumea: { x: 42, y: 22, size: 44 },
    makemake: { x: 28, y: 18, size: 52 },
    eris: { x: 14, y: 24, size: 56 },
    arrokoth: { x: 6, y: 16, size: 36 },
};

interface WaypointNodeProps {
    body: CelestialBody;
    leg: Leg | null;
    isCompleted: boolean;
    isCurrent: boolean;
    isLocked: boolean;
    isSelected: boolean;
    onClick: () => void;
    waypointProgress?: { current: number; total: number };
    starsEarned?: number; // 0-3 stars for completed planets
    sizeScale?: number; // Scale factor for planet size (e.g., 0.75 for tablets)
}

const WaypointNode: React.FC<WaypointNodeProps> = ({
    body,
    isCompleted,
    isCurrent,
    isLocked,
    isSelected,
    onClick,
    waypointProgress,
    starsEarned = 0,
    sizeScale = 1,
}) => {
    const pos = planetPositions[body.id];
    const scaledSize = Math.round(pos.size * sizeScale);
    const canClick = !isLocked;

    return (
        <div
            className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 ${canClick ? 'hover:scale-110' : 'cursor-not-allowed'
                } ${isCurrent || isSelected ? 'z-20' : 'z-10'}`}
            style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
            onClick={canClick ? onClick : undefined}
        >
            {/* Selection ring for current (pulsing) */}
            {isCurrent && (
                <div
                    className="absolute inset-0 rounded-full animate-ping"
                    style={{
                        width: scaledSize + 16,
                        height: scaledSize + 16,
                        left: -8,
                        top: -8,
                        border: '3px solid var(--color-brand-secondary)',
                        opacity: 0.5,
                    }}
                />
            )}
            {/* Selection ring for selected planet (static) */}
            {isSelected && !isCurrent && (
                <div
                    className="absolute inset-0 rounded-full"
                    style={{
                        width: scaledSize + 16,
                        height: scaledSize + 16,
                        left: -8,
                        top: -8,
                        border: '3px solid var(--color-brand-accent)',
                        opacity: 0.8,
                    }}
                />
            )}

            {/* Planet image */}
            <div className="relative">
                <AnimatedPlanet
                    planetId={body.id}
                    size={scaledSize}
                    isLocked={isLocked}
                />


                {/* Lock icon */}
                {isLocked && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Lock className="w-6 h-6 text-industrial-highlight" />
                    </div>
                )}

            </div>

            {/* Planet name label, stars, and waypoint progress */}
            <div
                className="absolute left-1/2 transform -translate-x-1/2 flex flex-col items-center"
                style={{ top: scaledSize + 4 }}
            >
                <div
                    className={`text-[10px] font-bold uppercase tracking-wider whitespace-nowrap font-pixel ${isLocked ? 'text-industrial-metal' : isCurrent ? 'text-brand-secondary' : isCompleted ? 'text-brand-success' : 'text-industrial-highlight'
                        }`}
                >
                    {body.name}
                </div>
                {body.id === 'earth' && (
                    <div className="text-[9px] text-brand-secondary font-normal tracking-wide whitespace-nowrap">(Home Base)</div>
                )}
                {/* Star ratings for completed planets */}
                {isCompleted && body.id !== 'earth' && (
                    <div className="flex gap-0.5 mt-0.5">
                        {[1, 2, 3].map((starIndex) => (
                            <Star
                                key={starIndex}
                                className={`w-2.5 h-2.5 ${starIndex <= starsEarned
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
        </div>
    );
};

const SolarSystemMap: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [stats, setStats] = useState(() => loadPlayerStats());
    const progress = stats.campaignProgress || initializeCampaignProgress();

    // Detect touch devices (tablets) for planet size scaling
    const isTouch = typeof window !== 'undefined'
        && typeof navigator !== 'undefined'
        && ('ontouchstart' in window || navigator.maxTouchPoints > 0);
    // Tablets get smaller planets (75% size)
    const planetSizeScale = isTouch ? 0.75 : 1;

    // Check if we came from cinematic for fade-in effect
    const fromCinematic = (location.state as { fromCinematic?: boolean })?.fromCinematic;
    const [fadeIn, setFadeIn] = useState(fromCinematic);

    // Trigger fade-in animation
    useEffect(() => {
        if (fromCinematic) {
            // Small delay to ensure CSS transition works
            const timer = setTimeout(() => setFadeIn(false), 50);
            return () => clearTimeout(timer);
        }
    }, [fromCinematic]);

    // Milestone modal state
    const [activeMilestone, setActiveMilestone] = useState<'inner' | 'kuiper' | null>(null);

    // Rank-up modal state
    const [rankUpModal, setRankUpModal] = useState<{ show: boolean; rank: typeof RANKS[0] | null }>({ show: false, rank: null });

    // Start menu music when entering map (e.g., after battle)
    // NOTE: Ambience is already running from StartScreen - never stop it
    useEffect(() => {
        const startAudio = async () => {
            // Make sure audio engine is initialized (in case we got here without going through start screen)
            if (!audioEngine.isInitialized()) {
                await audioEngine.init();
            }
            // Ensure audio context is running
            await audioEngine.resume();
            // Switch to menu music (crossfades from battle music if coming from battle)
            console.log('Playing menu music...');
            audioEngine.playMusic('menuMusic');
        };
        startAudio();
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
    }, [progress]);

    // Check for rank-up on mount
    useEffect(() => {
        const currentRank = getRankForXP(stats.totalXP);
        const lastSeenRankId = stats.lastSeenRankId || 'cadet'; // Default to cadet if not set
        const lastSeenRankIndex = RANKS.findIndex(r => r.id === lastSeenRankId);
        const currentRankIndex = RANKS.findIndex(r => r.id === currentRank.id);

        // If current rank is higher than last seen, show rank-up modal
        if (currentRankIndex > lastSeenRankIndex) {
            // Delay slightly so it doesn't overlap with other effects
            const timer = setTimeout(() => {
                setRankUpModal({ show: true, rank: currentRank });
                // Play a celebration sound
                audioEngine.playSFX('victory');
            }, activeMilestone ? 3000 : 800); // Wait longer if milestone is showing
            return () => clearTimeout(timer);
        }
    }, [stats.totalXP, stats.lastSeenRankId, activeMilestone]);

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

    // Handle dismissing the rank-up modal
    const handleDismissRankUp = () => {
        if (rankUpModal.rank) {
            // Save the new rank as seen
            const updatedStats = {
                ...stats,
                lastSeenRankId: rankUpModal.rank.id,
            };
            savePlayerStats(updatedStats);
            setStats(updatedStats);
            setRankUpModal({ show: false, rank: null });
        }
    };

    const currentLegIndex = getLegIndex(progress.currentLegId);
    const currentLeg = getLegById(progress.currentLegId);

    const [selectedBody, setSelectedBody] = useState<CelestialBody | null>(
        currentLeg ? celestialBodies[currentLeg.toBodyId] : null
    );
    const [selectedLeg, setSelectedLeg] = useState<Leg | null>(currentLeg ?? null);
    // Track which planet has the replay popup open
    const [replayPopupBody, setReplayPopupBody] = useState<CelestialBody | null>(null);

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

            // For completed planets (including Earth) and current planet, show popup
            if (status.isCompleted || status.isCurrent) {
                setReplayPopupBody(body);
            } else {
                setReplayPopupBody(null);
            }
        }
    };

    const handleCloseReplayPopup = () => {
        setReplayPopupBody(null);
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
        <div
            className={`flex-1 flex flex-col overflow-hidden bg-space-black relative transition-opacity duration-4000 ${fadeIn ? 'opacity-0' : 'opacity-100'}`}
        >
            <SpaceBackground />

            {/* Header */}
            <div className="relative z-30 flex justify-between items-center px-4 py-3 bg-gradient-to-b from-black/80 to-transparent">
                <button
                    onClick={() => navigate('/')}
                    className="flex items-center gap-1 px-3 py-2 text-xs text-white/80 active:text-white bg-gray-900/50 border-2 border-gray-700 rounded font-pixel"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>BACK</span>
                </button>
                <h1 className="text-sm text-white/80 uppercase tracking-wider font-pixel">Star Map</h1>
                {/* Rank and XP display */}
                <div className="flex items-center gap-3">
                    <img
                        src={getRankForXP(stats.totalXP).badge}
                        alt={getRankForXP(stats.totalXP).name}
                        className="w-12 h-12 object-contain"
                        style={{ imageRendering: 'pixelated' }}
                    />
                    <div className="flex flex-col items-end gap-1">
                        <div className="text-sm text-brand-accent font-bold font-pixel">
                            {getRankForXP(stats.totalXP).name}
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-industrial-metal rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-brand-accent transition-all duration-300"
                                    style={{ width: `${getXPProgress(stats.totalXP).progress * 100}%` }}
                                />
                            </div>
                            <div className="text-xs text-industrial-highlight font-pixel">
                                {stats.totalXP} XP
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main map area */}
            <div className="flex-1 relative z-10 overflow-hidden">
                {/* Chapter labels - styled badges near where each section starts */}
                {/* Inner System - near Earth (x:6%, y:78%) */}
                <div
                    className="absolute z-5 px-3 py-1 rounded border border-blue-500/50 bg-blue-950/70 backdrop-blur-sm"
                    style={{ left: '1%', top: '64%' }}
                >
                    <span className="text-[11px] text-blue-400 uppercase tracking-widest font-pixel font-bold">Inner System</span>
                </div>
                {/* Gas Giants - near Jupiter (x:54%, y:78%) */}
                <div
                    className="absolute z-5 px-3 py-1 rounded border border-purple-500/50 bg-purple-950/70 backdrop-blur-sm"
                    style={{ left: '48%', top: '64%' }}
                >
                    <span className="text-[11px] text-purple-400 uppercase tracking-widest font-pixel font-bold">Gas Giants</span>
                </div>
                {/* Ice Giants - near Uranus (x:82%, y:42%) */}
                <div
                    className="absolute z-5 px-3 py-1 rounded border border-cyan-500/50 bg-cyan-950/70 backdrop-blur-sm"
                    style={{ left: '76%', top: '28%' }}
                >
                    <span className="text-[11px] text-cyan-400 uppercase tracking-widest font-pixel font-bold">Ice Giants</span>
                </div>
                {/* Kuiper Belt - near Pluto (x:56%, y:28%) */}
                <div
                    className="absolute z-5 px-3 py-1 rounded border border-orange-500/50 bg-orange-950/70 backdrop-blur-sm"
                    style={{ left: '50%', top: '14%' }}
                >
                    <span className="text-[11px] text-orange-400 uppercase tracking-widest font-pixel font-bold">Kuiper Belt</span>
                </div>

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

                    // Calculate stars earned for completed planets (minimum across all waypoints)
                    let starsEarned = 0;
                    if (status.isCompleted && leg) {
                        const waypointStars: number[] = [];
                        for (let i = 0; i < leg.waypointsRequired; i++) {
                            const key = `${leg.id}_${i}`;
                            const stars = progress.starsEarned[key] || 0;
                            waypointStars.push(stars);
                        }
                        // Use minimum stars (shows weakest performance)
                        starsEarned = waypointStars.length > 0 ? Math.min(...waypointStars) : 0;
                    }

                    return (
                        <WaypointNode
                            key={body.id}
                            body={body}
                            leg={leg || null}
                            isCompleted={status.isCompleted}
                            isCurrent={status.isCurrent}
                            isLocked={status.isLocked}
                            isSelected={selectedBody?.id === body.id}
                            onClick={() => handleBodyClick(body)}
                            waypointProgress={waypointProgress}
                            starsEarned={starsEarned}
                            sizeScale={planetSizeScale}
                        />
                    );
                })}

                {/* Replay popup over completed planet */}
                {replayPopupBody && (
                    <>
                        {/* Backdrop to close popup */}
                        <div
                            className="absolute inset-0 z-20"
                            onClick={handleCloseReplayPopup}
                        />
                        {/* Popup positioned above the planet - adjust for edge planets */}
                        <div
                            className={`absolute z-30 animate-fadeIn ${
                                planetPositions[replayPopupBody.id].x < 15
                                    ? '' // Left edge planets: no transform, position from left
                                    : planetPositions[replayPopupBody.id].x > 85
                                        ? '-translate-x-full' // Right edge planets: align right edge
                                        : '-translate-x-1/2' // Center planets: center align
                            }`}
                            style={{
                                left: `${planetPositions[replayPopupBody.id].x}%`,
                                top: `${planetPositions[replayPopupBody.id].y - 14}%`,
                            }}
                        >
                            <div className="bg-industrial-dark border-2 border-brand-accent rounded-lg p-3 shadow-lg shadow-brand-accent/20">
                                {replayPopupBody.id === 'earth' ? (
                                    <PixelButton
                                        variant="secondary"
                                        onClick={() => {
                                            handleCloseReplayPopup();
                                            navigate('/homebase');
                                        }}
                                        className="px-4 py-2 text-sm"
                                        size="sm"
                                    >
                                        HOMEBASE
                                    </PixelButton>
                                ) : getBodyStatus(replayPopupBody.id).isCurrent ? (
                                    <PixelButton
                                        variant="primary"
                                        onClick={() => {
                                            handleCloseReplayPopup();
                                            handleStartMission(false);
                                        }}
                                        className="px-4 py-2 text-sm"
                                        size="sm"
                                    >
                                        LAUNCH
                                    </PixelButton>
                                ) : (
                                    <>
                                        <div className="text-center mb-2">
                                            <div className="text-brand-success text-xs font-bold flex items-center justify-center gap-1 font-pixel">
                                                <Star className="w-3 h-3 fill-brand-success" /> CLEARED
                                            </div>
                                        </div>
                                        <PixelButton
                                            variant="primary"
                                            onClick={() => {
                                                handleCloseReplayPopup();
                                                handleStartMission(true);
                                            }}
                                            className="px-4 py-2 text-sm"
                                            size="sm"
                                        >
                                            REPLAY
                                        </PixelButton>
                                    </>
                                )}
                                {/* Arrow pointing down to planet */}
                                <div
                                    className="absolute left-1/2 -translate-x-1/2 -bottom-2 w-0 h-0"
                                    style={{
                                        borderLeft: '8px solid transparent',
                                        borderRight: '8px solid transparent',
                                        borderTop: '8px solid var(--color-brand-accent)',
                                    }}
                                />
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Bottom info panel */}
            <div className="relative z-30 bg-industrial-dark border-t-4 border-industrial-metal shadow-[0_-4px_10px_rgba(0,0,0,0.5)]">
                {/* Hazard Stripe Top Border */}
                <div className="h-2 w-full bg-hazard opacity-50" />

                <div className="p-4 min-h-[120px] flex items-center">
                    {selectedBody ? (
                        <div className="flex items-center gap-6 w-full">
                            {/* Selected planet preview */}
                            <div className="flex-shrink-0 relative">
                                <div className="absolute inset-0 bg-brand-secondary/20 rounded-full blur-xl animate-pulse" />
                                <div className="relative z-10">
                                    <AnimatedPlanet planetId={selectedBody.id} size={80} />
                                </div>
                            </div>

                            {/* Planet info */}
                            <div className="flex-1 min-w-0">
                                <h2 className="text-2xl font-bold text-white mb-1 font-pixel">{selectedBody.name}</h2>
                                <div className="text-xs text-brand-secondary uppercase tracking-wider mb-2 font-pixel">
                                    {selectedLeg ? getChapterName(selectedLeg.chapter) : 'Inner System'}
                                </div>
                                <p className="text-sm text-gray-300 line-clamp-2 font-pixel">{selectedBody.fact}</p>
                                <div className="flex gap-4 mt-2">
                                    <div className="text-xs font-pixel">
                                        <span className="text-industrial-highlight">Tables: </span>
                                        <span className="text-brand-success">{selectedBody.focusTables.join(', ')}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Status indicator */}
                            <div className="flex-shrink-0 text-center">
                                {getBodyStatus(selectedBody.id).isCurrent ? (
                                    <div className="text-brand-accent text-sm font-bold font-pixel">
                                        CURRENT TARGET
                                    </div>
                                ) : getBodyStatus(selectedBody.id).isCompleted ? (
                                    selectedBody.id === 'earth' ? (
                                        <div className="text-brand-secondary text-sm font-bold font-pixel">
                                            HOMEBASE
                                        </div>
                                    ) : (
                                        <div className="text-brand-success text-sm font-bold flex items-center gap-1 font-pixel">
                                            <Star className="w-4 h-4 fill-brand-success" /> CLEARED
                                        </div>
                                    )
                                ) : null}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center text-industrial-highlight font-pixel w-full">
                            SELECT A DESTINATION ON THE MAP
                        </div>
                    )}
                </div>
            </div>

            {/* Milestone Modal Overlay */}
            {activeMilestone && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 animate-fadeIn">
                    <div className="relative max-w-lg mx-4 rounded-lg overflow-hidden border-2 border-brand-secondary shadow-lg shadow-brand-secondary/30">
                        {/* Background image */}
                        <div
                            className="absolute inset-0 z-0"
                            style={{
                                backgroundImage: `url(/assets/images/ui/milestones/${activeMilestone === 'inner' ? 'milestone1' : 'milestone2'}.png)`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                            }}
                        />
                        {/* Dark overlay for text readability */}
                        <div className="absolute inset-0 z-0 bg-black/60" />

                        {/* Content */}
                        <div className="relative z-10 p-6">
                            <div className="flex items-center gap-3 mb-4 border-b border-brand-secondary/30 pb-3">
                                <div className="w-3 h-3 rounded-full bg-brand-secondary animate-pulse" />
                                <Radio className="w-5 h-5 text-brand-secondary" />
                                <span className="text-brand-secondary text-sm font-bold tracking-widest font-pixel">
                                    MILESTONE REACHED
                                </span>
                            </div>
                            <p className="text-cyan-300 text-lg leading-relaxed mb-6 drop-shadow-lg">
                                "{MILESTONE_TEXT[activeMilestone === 'inner' ? 'milestone_inner' : 'milestone_kuiper']}"
                            </p>
                            <PixelButton
                                onClick={handleDismissMilestone}
                                className="w-full py-3"
                                variant="primary"
                            >
                                CONTINUE
                            </PixelButton>
                        </div>
                    </div>
                </div>
            )}

            {/* Rank-Up Modal Overlay */}
            {rankUpModal.show && rankUpModal.rank && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 animate-fadeIn">
                    <div className="relative max-w-md mx-4 rounded-lg overflow-hidden border-2 border-brand-accent shadow-lg shadow-brand-accent/30">
                        {/* Background image */}
                        <div
                            className="absolute inset-0 z-0"
                            style={{
                                backgroundImage: 'url(/assets/images/ui/milestones/milestone3.png)',
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                            }}
                        />
                        {/* Dark overlay for text readability */}
                        <div className="absolute inset-0 z-0 bg-black/50" />

                        {/* Content */}
                        <div className="relative z-10 p-6">
                            <div className="flex items-center justify-center gap-2 mb-4">
                                <Star className="w-5 h-5 text-brand-accent fill-brand-accent" />
                                <span className="text-brand-accent text-sm font-bold tracking-widest font-pixel">
                                    RANK UP!
                                </span>
                                <Star className="w-5 h-5 text-brand-accent fill-brand-accent" />
                            </div>

                            {/* Badge display */}
                            <div className="flex justify-center mb-4">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-brand-accent/30 rounded-full blur-xl animate-pulse" />
                                    <img
                                        src={rankUpModal.rank.badge}
                                        alt={rankUpModal.rank.name}
                                        className="w-32 h-32 object-contain relative z-10"
                                        style={{ imageRendering: 'pixelated' }}
                                    />
                                </div>
                            </div>

                            <div className="text-center mb-4">
                                <div className="text-brand-accent text-2xl font-bold font-pixel uppercase drop-shadow-lg">
                                    {rankUpModal.rank.name}
                                </div>
                                <div className="text-white text-sm font-pixel mt-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                                    You've earned this rank through your dedication to the mission!
                                </div>
                            </div>

                            <PixelButton
                                onClick={handleDismissRankUp}
                                className="w-full py-3"
                                variant="primary"
                            >
                                ACCEPT PROMOTION
                            </PixelButton>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SolarSystemMap;
