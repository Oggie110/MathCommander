import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Volume2, VolumeX, Music, MessageSquare, Sparkles, Star, Trophy, Rocket, Play } from 'lucide-react';
import { PixelCard } from '@/components/ui/PixelCard';
import { audioEngine } from '@/audio';
import { loadPlayerStats } from '@/utils/gameLogic';
import { initializeCampaignProgress, getTotalStarsEarned, getCompletedWaypointsCount, getTotalWaypoints } from '@/utils/campaignLogic';

const HomeBaseScreen: React.FC = () => {
    const navigate = useNavigate();
    const [stats] = useState(() => loadPlayerStats());
    const progress = stats.campaignProgress || initializeCampaignProgress();

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

    return (
        <div className="flex-1 flex relative overflow-hidden">
            {/* Background Image - covers full height, aligned left */}
            <div
                className="absolute inset-0 z-0"
                style={{
                    backgroundImage: 'url(/assets/1NewStuff/homebase.png)',
                    backgroundSize: 'auto 100%',
                    backgroundPosition: 'left center',
                    backgroundRepeat: 'no-repeat',
                    imageRendering: 'pixelated',
                }}
            />

            {/* Dark overlay for better readability */}
            <div className="absolute inset-0 z-0 bg-black/30" />

            {/* Back button */}
            <div className="absolute top-4 left-4 z-20">
                <button
                    onClick={() => navigate('/map')}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-800/90 hover:bg-gray-700 text-white rounded border-2 border-gray-600 transition-colors backdrop-blur-sm"
                >
                    <ArrowLeft className="w-5 h-5" />
                    <span className="text-sm font-tech">BACK TO MAP</span>
                </button>
            </div>

            {/* Main content area - panels on the right */}
            <div className="relative z-10 flex w-full p-4">
                {/* Right side panels - centered in right half */}
                <div className="md:w-80 ml-auto mr-[3%] mt-8 space-y-4 max-h-[calc(100vh-4rem)] overflow-y-auto">
                    <PixelCard className="p-4 bg-industrial-dark/95 backdrop-blur-sm">
                        <h2 className="text-brand-accent font-tech text-lg mb-4 flex items-center gap-2">
                            <Trophy className="w-5 h-5" />
                            PILOT STATS
                        </h2>

                        {/* Player Avatar */}
                        <div className="flex items-center gap-4 mb-4 pb-4 border-b border-industrial-metal">
                            <div className="w-16 h-16 rounded-lg border-2 border-brand-accent overflow-hidden bg-industrial-dark">
                                <img
                                    src="/assets/helianthus/PlayerShips/1.png"
                                    alt="Player Ship"
                                    className="w-full h-full object-contain"
                                    style={{ imageRendering: 'pixelated' }}
                                />
                            </div>
                            <div>
                                <div className="text-white font-tech text-sm">COMMANDER</div>
                                <div className="text-brand-secondary text-xs font-tech">RANK: CADET</div>
                            </div>
                        </div>

                        {/* XP */}
                        <div className="mb-3">
                            <div className="flex justify-between text-xs mb-1">
                                <span className="text-industrial-highlight font-tech">TOTAL XP</span>
                                <span className="text-brand-accent font-tech">{stats.totalXP.toLocaleString()}</span>
                            </div>
                            <div className="h-2 bg-industrial-metal rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-brand-accent to-brand-secondary"
                                    style={{ width: `${Math.min((stats.totalXP % 1000) / 10, 100)}%` }}
                                />
                            </div>
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
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-brand-success" />
                                <span className="text-industrial-highlight text-xs font-tech">PLANETS CLEARED</span>
                            </div>
                            <span className="text-brand-success font-tech">{completedStages}</span>
                        </div>
                    </PixelCard>

                    {/* Spaceship display */}
                    <PixelCard className="p-4 bg-industrial-dark/95 backdrop-blur-sm">
                        <h2 className="text-brand-secondary font-tech text-sm mb-3">YOUR SHIP</h2>
                        <div className="flex justify-center">
                            <video
                                src="/assets/1NewStuff/ShipRotate.mp4"
                                autoPlay
                                loop
                                muted
                                playsInline
                                className="w-40 h-40 object-contain"
                            />
                        </div>
                        <div className="text-center mt-2">
                            <div className="text-white font-tech text-sm">STELLAR FALCON</div>
                            <div className="text-industrial-highlight text-xs font-tech">CLASS: INTERCEPTOR</div>
                        </div>
                    </PixelCard>

                    {/* Audio Settings - below stats */}
                    <PixelCard className="p-4 bg-industrial-dark/95 backdrop-blur-sm">
                        <h2 className="text-brand-accent font-tech text-lg mb-4 flex items-center gap-2">
                            <Volume2 className="w-5 h-5" />
                            AUDIO SETTINGS
                        </h2>

                        {/* Music Volume */}
                        <div className="mb-5">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <Music className="w-4 h-4 text-brand-secondary" />
                                    <span className="text-white text-sm font-tech">MUSIC</span>
                                </div>
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
                                <div className="flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-brand-accent" />
                                    <span className="text-white text-sm font-tech">SFX & AMBIENCE</span>
                                </div>
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
                                <div className="flex items-center gap-2">
                                    <MessageSquare className="w-4 h-4 text-brand-success" />
                                    <span className="text-white text-sm font-tech">SPEECH</span>
                                </div>
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
                </div>
            </div>
        </div>
    );
};

export default HomeBaseScreen;
