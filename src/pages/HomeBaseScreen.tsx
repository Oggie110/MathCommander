import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Volume2, VolumeX, Sparkles, Star, Rocket, Play, RotateCcw } from 'lucide-react';
import { PixelCard } from '@/components/ui/PixelCard';
import { PixelButton } from '@/components/ui/PixelButton';
import { audioEngine } from '@/audio';
import { loadPlayerStats, getRankForXP, getNextRank, getXPProgress, savePlayerStats } from '@/utils/gameLogic';
import { initializeCampaignProgress, getTotalStarsEarned, getCompletedWaypointsCount, getTotalWaypoints } from '@/utils/campaignLogic';

const HomeBaseScreen: React.FC = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState(() => loadPlayerStats());
    const progress = stats.campaignProgress || initializeCampaignProgress();

    // Reset confirmation modal state
    const [showResetConfirm, setShowResetConfirm] = useState(false);

    // Handle reset game progression
    const handleResetProgress = () => {
        const freshStats = {
            totalXP: 0,
            weakAreas: {},
            campaignProgress: initializeCampaignProgress(),
        };
        savePlayerStats(freshStats);
        setStats(freshStats);
        setShowResetConfirm(false);
    };

    // Audio volumes state
    const [volumes, setVolumes] = useState(() => audioEngine.getVolumes());
    const [muted, setMuted] = useState({
        music: volumes.music === 0,
        sfx: volumes.sfx === 0 && volumes.ambience === 0,
        speech: volumes.speech === 0,
    });

    // Store previous volumes for unmute
    const [prevVolumes, setPrevVolumes] = useState({
        music: volumes.music || 0.3,
        sfx: volumes.sfx || 0.5,
        ambience: volumes.ambience || 0.2,
        speech: volumes.speech || 0.4,
    });

    // Sync with audio engine
    useEffect(() => {
        const currentVolumes = audioEngine.getVolumes();
        setVolumes(currentVolumes);
    }, []);

    const handleMusicVolumeChange = (value: number) => {
        audioEngine.setMusicVolume(value);
        setVolumes(prev => ({ ...prev, music: value }));
        if (value > 0) {
            setMuted(prev => ({ ...prev, music: false }));
            setPrevVolumes(prev => ({ ...prev, music: value }));
        }
    };

    const handleSFXVolumeChange = (value: number) => {
        // SFX and ambience share the same control
        audioEngine.setSFXVolume(value);
        audioEngine.setAmbienceVolume(value * 0.4); // Ambience at 40% of SFX
        setVolumes(prev => ({ ...prev, sfx: value, ambience: value * 0.4 }));
        if (value > 0) {
            setMuted(prev => ({ ...prev, sfx: false }));
            setPrevVolumes(prev => ({ ...prev, sfx: value, ambience: value * 0.4 }));
        }
    };

    const handleSpeechVolumeChange = (value: number) => {
        audioEngine.setSpeechVolume(value);
        setVolumes(prev => ({ ...prev, speech: value }));
        if (value > 0) {
            setMuted(prev => ({ ...prev, speech: false }));
            setPrevVolumes(prev => ({ ...prev, speech: value }));
        }
    };

    const toggleMusicMute = () => {
        if (muted.music) {
            audioEngine.setMusicVolume(prevVolumes.music);
            setVolumes(prev => ({ ...prev, music: prevVolumes.music }));
        } else {
            setPrevVolumes(prev => ({ ...prev, music: volumes.music }));
            audioEngine.setMusicVolume(0);
            setVolumes(prev => ({ ...prev, music: 0 }));
        }
        setMuted(prev => ({ ...prev, music: !prev.music }));
    };

    const toggleSFXMute = () => {
        if (muted.sfx) {
            audioEngine.setSFXVolume(prevVolumes.sfx);
            audioEngine.setAmbienceVolume(prevVolumes.ambience);
            setVolumes(prev => ({ ...prev, sfx: prevVolumes.sfx, ambience: prevVolumes.ambience }));
        } else {
            setPrevVolumes(prev => ({ ...prev, sfx: volumes.sfx, ambience: volumes.ambience }));
            audioEngine.setSFXVolume(0);
            audioEngine.setAmbienceVolume(0);
            setVolumes(prev => ({ ...prev, sfx: 0, ambience: 0 }));
        }
        setMuted(prev => ({ ...prev, sfx: !prev.sfx }));
    };

    const toggleSpeechMute = () => {
        if (muted.speech) {
            audioEngine.setSpeechVolume(prevVolumes.speech);
            setVolumes(prev => ({ ...prev, speech: prevVolumes.speech }));
        } else {
            setPrevVolumes(prev => ({ ...prev, speech: volumes.speech }));
            audioEngine.setSpeechVolume(0);
            setVolumes(prev => ({ ...prev, speech: 0 }));
        }
        setMuted(prev => ({ ...prev, speech: !prev.speech }));
    };

    // Initialize audio if needed and preload test sounds
    const initAndPreload = async () => {
        if (!audioEngine.isInitialized()) {
            await audioEngine.init();
        }
        await audioEngine.preloadAll(['menuMusic', 'laser', 'humanTaunt1']);
    };

    // Test sound functions
    const testMusic = async () => {
        await initAndPreload();
        audioEngine.playMusic('menuMusic');
    };

    const testSFX = async () => {
        await initAndPreload();
        audioEngine.playSFX('laser');
    };

    const testSpeech = async () => {
        await initAndPreload();
        audioEngine.playSpeech('humanTaunt1');
    };

    // Stats calculations
    const totalStars = getTotalStarsEarned(progress);
    const completedWaypoints = getCompletedWaypointsCount(progress);
    const totalWaypoints = getTotalWaypoints();
    const completedStages = progress.completedLegs.length;

    // Rank calculations
    const currentRank = getRankForXP(stats.totalXP);
    const nextRank = getNextRank(stats.totalXP);
    const xpProgress = getXPProgress(stats.totalXP);

    return (
        <div className="flex-1 flex relative overflow-hidden">
            {/* Background Image - covers full height, aligned left */}
            <div
                className="absolute inset-0 z-0"
                style={{
                    backgroundImage: 'url(/assets/1NewStuff/homebase2.png)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center center',
                    backgroundRepeat: 'no-repeat',
                }}
            />

            {/* Dark overlay for better readability */}
            <div className="absolute inset-0 z-0 bg-black/70" />

            {/* Header - fixed at top */}
            <div className="fixed top-0 left-0 right-0 z-30 flex justify-between items-center p-4 bg-gradient-to-b from-black/80 to-transparent">
                <button
                    onClick={() => navigate('/map')}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-800/90 hover:bg-gray-700 text-white rounded border-2 border-gray-600 transition-colors backdrop-blur-sm"
                >
                    <ArrowLeft className="w-5 h-5" />
                    <span className="text-sm font-tech">BACK TO MAP</span>
                </button>
                <h1 className="hidden md:block text-xl font-bold text-cyan-400 uppercase tracking-widest">
                    HOME BASE
                </h1>
                <div className="w-32" /> {/* Spacer for centering */}
            </div>

            {/* Main content area - centered panels side by side */}
            <div className="relative z-10 flex items-center justify-center w-full p-4 pt-24">
                <div className="flex flex-col md:flex-row md:items-start gap-4 max-h-[calc(100vh-7rem)] overflow-y-auto">
                    {/* Left column - Pilot Stats & Ship */}
                    <div className="flex flex-col gap-4 w-80">
                    <PixelCard className="p-8 bg-industrial-dark/95 backdrop-blur-sm">
                        <h2 className="text-brand-accent font-tech text-base mb-4 text-center">
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
                                <div className="text-brand-accent font-tech text-lg uppercase">{currentRank.name}</div>
                                <div className="text-industrial-highlight text-sm font-tech mt-1">
                                    {stats.totalXP.toLocaleString()} XP
                                </div>
                            </div>
                        </div>

                        {/* XP Progress to Next Rank */}
                        <div className="mb-3">
                            <div className="text-industrial-highlight font-tech text-[10px] mb-1">
                                {nextRank ? 'PROGRESS TO NEXT RANK' : 'MAX RANK ACHIEVED'}
                            </div>
                            {nextRank && (
                                <div className="text-brand-secondary font-tech text-xs mb-1">
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
                                    <span className="text-industrial-highlight text-xs font-tech whitespace-nowrap">NEXT:</span>
                                    <span className="text-brand-secondary text-xs font-tech whitespace-nowrap">{nextRank.name}</span>
                                </div>
                            )}
                        </div>

                        {/* Stars */}
                        <div className="flex items-center justify-between mb-3 py-2 border-y border-industrial-metal">
                            <div className="flex items-center gap-2">
                                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                <span className="text-industrial-highlight text-xs font-tech">STARS EARNED</span>
                            </div>
                            <span className="text-yellow-400 font-tech">{totalStars}</span>
                        </div>

                        {/* Progress */}
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <Rocket className="w-4 h-4 text-brand-secondary" />
                                <span className="text-industrial-highlight text-xs font-tech">MISSIONS</span>
                            </div>
                            <span className="text-white font-tech">{completedWaypoints} / {totalWaypoints}</span>
                        </div>

                        {/* Stages */}
                        <div className="flex items-center justify-between mb-4 pb-4 border-b border-industrial-metal">
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-brand-success" />
                                <span className="text-industrial-highlight text-xs font-tech">PLANETS CLEARED</span>
                            </div>
                            <span className="text-brand-success font-tech">{completedStages}</span>
                        </div>

                        {/* Spaceship display - now inside Pilot Stats */}
                        <h3 className="text-brand-secondary font-tech text-sm mb-3 text-center">YOUR SHIP</h3>
                        <div className="flex justify-center">
                            <video
                                src="/assets/1NewStuff/ShipRotate.mp4"
                                autoPlay
                                loop
                                muted
                                playsInline
                                className="w-32 h-32 object-contain"
                            />
                        </div>
                        <div className="text-center mt-2">
                            <div className="text-white font-tech text-sm">STELLAR FALCON</div>
                            <div className="text-industrial-highlight text-xs font-tech">CLASS: INTERCEPTOR</div>
                        </div>
                    </PixelCard>
                    </div>

                    {/* Right column - Audio Settings */}
                    <div className="flex flex-col gap-4 w-80">
                    <PixelCard className="p-8 bg-industrial-dark/95 backdrop-blur-sm h-fit">
                        <h2 className="text-brand-accent font-tech text-base mb-4 text-center">
                            AUDIO SETTINGS
                        </h2>

                        {/* Music Volume */}
                        <div className="mb-5">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-white text-xs font-tech">MUSIC</span>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={testMusic}
                                        className="p-1.5 rounded hover:bg-industrial-metal transition-colors"
                                        title="Test Music"
                                    >
                                        <Play className="w-4 h-4 text-brand-secondary" />
                                    </button>
                                    <button
                                        onClick={toggleMusicMute}
                                        className="p-1.5 rounded hover:bg-industrial-metal transition-colors"
                                    >
                                        {muted.music ? (
                                            <VolumeX className="w-4 h-4 text-red-400" />
                                        ) : (
                                            <Volume2 className="w-4 h-4 text-brand-success" />
                                        )}
                                    </button>
                                </div>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.01"
                                value={volumes.music}
                                onChange={(e) => handleMusicVolumeChange(parseFloat(e.target.value))}
                                className="w-full h-2 bg-industrial-metal rounded-lg appearance-none cursor-pointer accent-brand-secondary"
                            />
                            <div className="flex justify-between text-xs text-industrial-highlight mt-1 font-tech">
                                <span>0%</span>
                                <span>{Math.round(volumes.music * 100)}%</span>
                                <span>100%</span>
                            </div>
                        </div>

                        {/* SFX & Ambience Volume */}
                        <div className="mb-5">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-white text-xs font-tech whitespace-nowrap">SFX & AMBIENCE</span>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={testSFX}
                                        className="p-1.5 rounded hover:bg-industrial-metal transition-colors"
                                        title="Test SFX"
                                    >
                                        <Play className="w-4 h-4 text-brand-accent" />
                                    </button>
                                    <button
                                        onClick={toggleSFXMute}
                                        className="p-1.5 rounded hover:bg-industrial-metal transition-colors"
                                    >
                                        {muted.sfx ? (
                                            <VolumeX className="w-4 h-4 text-red-400" />
                                        ) : (
                                            <Volume2 className="w-4 h-4 text-brand-success" />
                                        )}
                                    </button>
                                </div>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.01"
                                value={volumes.sfx}
                                onChange={(e) => handleSFXVolumeChange(parseFloat(e.target.value))}
                                className="w-full h-2 bg-industrial-metal rounded-lg appearance-none cursor-pointer accent-brand-accent"
                            />
                            <div className="flex justify-between text-xs text-industrial-highlight mt-1 font-tech">
                                <span>0%</span>
                                <span>{Math.round(volumes.sfx * 100)}%</span>
                                <span>100%</span>
                            </div>
                        </div>

                        {/* Speech Volume */}
                        <div className="mb-2">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-white text-xs font-tech">SPEECH</span>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={testSpeech}
                                        className="p-1.5 rounded hover:bg-industrial-metal transition-colors"
                                        title="Test Speech"
                                    >
                                        <Play className="w-4 h-4 text-brand-success" />
                                    </button>
                                    <button
                                        onClick={toggleSpeechMute}
                                        className="p-1.5 rounded hover:bg-industrial-metal transition-colors"
                                    >
                                        {muted.speech ? (
                                            <VolumeX className="w-4 h-4 text-red-400" />
                                        ) : (
                                            <Volume2 className="w-4 h-4 text-brand-success" />
                                        )}
                                    </button>
                                </div>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.01"
                                value={volumes.speech}
                                onChange={(e) => handleSpeechVolumeChange(parseFloat(e.target.value))}
                                className="w-full h-2 bg-industrial-metal rounded-lg appearance-none cursor-pointer accent-brand-success"
                            />
                            <div className="flex justify-between text-xs text-industrial-highlight mt-1 font-tech">
                                <span>0%</span>
                                <span>{Math.round(volumes.speech * 100)}%</span>
                                <span>100%</span>
                            </div>
                        </div>
                    </PixelCard>

                    {/* Reset Progress Card */}
                    <PixelCard className="p-6 bg-industrial-dark/95 backdrop-blur-sm">
                        <h2 className="text-brand-danger font-tech text-base mb-4 text-center">
                            DANGER ZONE
                        </h2>
                        <PixelButton
                            variant="danger"
                            size="sm"
                            onClick={() => setShowResetConfirm(true)}
                            className="w-full"
                        >
                            <RotateCcw className="w-4 h-4 mr-2" />
                            RESET PROGRESS
                        </PixelButton>
                    </PixelCard>
                    </div>
                </div>
            </div>

            {/* Reset Confirmation Modal */}
            {showResetConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                    <PixelCard className="p-6 bg-industrial-dark/95 max-w-sm mx-4">
                        <h3 className="text-brand-danger font-tech text-lg mb-4 text-center">
                            RESET PROGRESS?
                        </h3>
                        <p className="text-industrial-highlight text-sm mb-6 text-center font-tech">
                            This will erase all your XP, stars, and mission progress. This action cannot be undone!
                        </p>
                        <div className="flex gap-3">
                            <PixelButton
                                variant="secondary"
                                onClick={() => setShowResetConfirm(false)}
                                className="flex-1"
                            >
                                CANCEL
                            </PixelButton>
                            <PixelButton
                                variant="danger"
                                onClick={handleResetProgress}
                                className="flex-1"
                            >
                                RESET
                            </PixelButton>
                        </div>
                    </PixelCard>
                </div>
            )}
        </div>
    );
};

export default HomeBaseScreen;

