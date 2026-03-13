import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SpaceBackground } from '@/components/game';
import { audioEngine } from '@/audio';
import { loadPlayerStats, savePlayerStats, getRankForXP } from '@/utils/gameLogic';
import { initializeCampaignProgress } from '@/utils/campaignLogic';
import { Rocket, Play, Settings, AlertTriangle } from 'lucide-react';

const MainMenuScreen: React.FC = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [loadingLabel, setLoadingLabel] = useState('');
    const [showNewGameConfirm, setShowNewGameConfirm] = useState(false);

    const stats = loadPlayerStats();
    const hasSaveData = !!(stats.campaignProgress && stats.totalXP > 0);
    const rank = hasSaveData ? getRankForXP(stats.totalXP) : null;

    const initAudio = async () => {
        setIsLoading(true);
        setLoadingLabel('Initializing audio...');
        try {
            await audioEngine.init();
            audioEngine.playUnlockTone();
            await audioEngine.preloadAll([
                'menuAmbience',
                'spaceAmbience',
                'buttonClick1',
                'buttonClick2',
                'buttonClick3',
                'menuMusic',
            ], (_loaded, _total, currentId) => {
                if (currentId) setLoadingLabel(`Loading ${currentId}...`);
            });
        } catch (e) {
            console.error('[MainMenu] Audio init failed:', e);
        }
        setLoadingLabel('');
        setIsLoading(false);
    };

    const handleNewGame = async () => {
        if (hasSaveData) {
            setShowNewGameConfirm(true);
            return;
        }
        await startNewGame();
    };

    const startNewGame = async () => {
        setShowNewGameConfirm(false);
        // Clear existing save
        const freshStats = {
            totalXP: 0,
            weakAreas: {},
            campaignProgress: initializeCampaignProgress(),
        };
        savePlayerStats(freshStats);

        if (!audioEngine.isInitialized()) await initAudio();
        navigate('/start');
    };

    const handleContinue = async () => {
        if (!audioEngine.isInitialized()) await initAudio();
        audioEngine.startAmbience('menuAmbience');
        navigate('/map');
    };

    const handleSettings = async () => {
        if (!audioEngine.isInitialized()) await initAudio();
        navigate('/homebase');
    };

    return (
        <div className="flex-1 flex flex-col items-center justify-center p-4 text-center relative">
            <SpaceBackground />

            <div className="relative z-10 w-full max-w-md">
                {/* Title */}
                <div className="mb-16">
                    <h1 className="text-4xl md:text-6xl text-brand-accent mb-4 drop-shadow-[4px_4px_0_rgba(255,42,42,1)]">
                        SPACE MA<span style={{ marginLeft: '-0.3em' }}>TH</span>
                    </h1>
                    <h2 className="text-2xl md:text-4xl text-white drop-shadow-[4px_4px_0_rgba(37,99,235,1)]">
                        COMMANDER
                    </h2>
                </div>

                {/* Menu Buttons */}
                <div className="space-y-4">
                    {/* New Game */}
                    <button
                        onClick={handleNewGame}
                        disabled={isLoading}
                        className="
                            w-full text-lg px-8 py-5
                            bg-gradient-to-b from-blue-500 to-blue-700
                            border-4 border-blue-400
                            text-white font-bold
                            shadow-[0_4px_0_0_#1e40af,0_6px_0_0_#1e3a8a]
                            hover:from-blue-400 hover:to-blue-600
                            active:translate-y-1 active:shadow-[0_2px_0_0_#1e40af]
                            transition-all
                            font-pixel uppercase tracking-wider
                            disabled:opacity-70 disabled:cursor-not-allowed
                        "
                    >
                        <div className="flex items-center justify-center gap-3">
                            <Rocket className="w-6 h-6" />
                            NEW GAME
                        </div>
                    </button>

                    {/* Continue */}
                    <button
                        onClick={handleContinue}
                        disabled={isLoading || !hasSaveData}
                        className={`
                            w-full text-lg px-8 py-5
                            border-4 font-bold
                            shadow-[0_4px_0_0_#166534,0_6px_0_0_#14532d]
                            active:translate-y-1 active:shadow-[0_2px_0_0_#166534]
                            transition-all
                            font-pixel uppercase tracking-wider
                            ${hasSaveData
                                ? 'bg-gradient-to-b from-green-500 to-green-700 border-green-400 text-white hover:from-green-400 hover:to-green-600'
                                : 'bg-gradient-to-b from-gray-600 to-gray-800 border-gray-500 text-gray-400 cursor-not-allowed opacity-50'
                            }
                            disabled:cursor-not-allowed
                        `}
                    >
                        <div className="flex items-center justify-center gap-3">
                            <Play className="w-6 h-6" />
                            CONTINUE
                        </div>
                        {hasSaveData && rank && (
                            <div className="text-[9px] text-green-200/70 mt-1 tracking-wide">
                                {rank.name} &bull; {stats.totalXP} XP
                            </div>
                        )}
                    </button>

                    {/* Settings */}
                    <button
                        onClick={handleSettings}
                        disabled={isLoading}
                        className="
                            w-full text-base px-8 py-4
                            bg-gradient-to-b from-gray-500 to-gray-700
                            border-4 border-gray-400
                            text-white font-bold
                            shadow-[0_4px_0_0_#374151,0_6px_0_0_#1f2937]
                            hover:from-gray-400 hover:to-gray-600
                            active:translate-y-1 active:shadow-[0_2px_0_0_#374151]
                            transition-all
                            font-pixel uppercase tracking-wider
                            disabled:opacity-70 disabled:cursor-not-allowed
                        "
                    >
                        <div className="flex items-center justify-center gap-3">
                            <Settings className="w-5 h-5" />
                            SETTINGS
                        </div>
                    </button>
                </div>

                {/* Loading indicator */}
                {loadingLabel && (
                    <div className="text-brand-secondary text-[8px] mt-4 font-pixel tracking-wider animate-pulse">
                        {loadingLabel}
                    </div>
                )}

                {/* Version */}
                <div className="text-industrial-highlight text-xs mt-12 font-pixel tracking-widest">
                    v0.8.0
                </div>
            </div>

            {/* New Game Confirmation Modal */}
            {showNewGameConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
                    <div className="bg-gray-900 border-4 border-yellow-500 p-6 max-w-sm w-full text-center">
                        <AlertTriangle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
                        <h3 className="text-yellow-400 text-lg font-pixel mb-3">
                            START NEW GAME?
                        </h3>
                        <p className="text-gray-300 text-xs font-pixel leading-relaxed mb-2">
                            This will erase your current progress:
                        </p>
                        <p className="text-brand-accent text-xs font-pixel mb-6">
                            {rank?.name} &bull; {stats.totalXP} XP
                        </p>

                        <div className="space-y-3">
                            <button
                                onClick={startNewGame}
                                className="
                                    w-full py-3 px-6
                                    bg-gradient-to-b from-red-500 to-red-700
                                    border-4 border-red-400 text-white font-bold
                                    shadow-[0_3px_0_0_#991b1b]
                                    hover:from-red-400 hover:to-red-600
                                    active:translate-y-1 active:shadow-[0_1px_0_0_#991b1b]
                                    transition-all font-pixel text-sm uppercase
                                "
                            >
                                ERASE &amp; START NEW
                            </button>
                            <button
                                onClick={() => setShowNewGameConfirm(false)}
                                className="
                                    w-full py-3 px-6
                                    bg-gradient-to-b from-gray-600 to-gray-800
                                    border-4 border-gray-500 text-gray-200 font-bold
                                    shadow-[0_3px_0_0_#374151]
                                    hover:from-gray-500 hover:to-gray-700
                                    active:translate-y-1 active:shadow-[0_1px_0_0_#374151]
                                    transition-all font-pixel text-sm uppercase
                                "
                            >
                                CANCEL
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MainMenuScreen;
