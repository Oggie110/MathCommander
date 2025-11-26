import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PixelButton } from '@/components/ui/PixelButton';
import { PixelCard } from '@/components/ui/PixelCard';
import { audioEngine, SOUNDS, getSoundsByCategory } from '@/audio';
import { ArrowLeft, Play, Square, Upload, Music, Waves, Settings, Copy, Check } from 'lucide-react';

interface AudioTrack {
    id: string;
    name: string;
    url: string;
    buffer: AudioBuffer | null;
}

type TabType = 'sandbox' | 'engine';

const AudioTestPage: React.FC = () => {
    const navigate = useNavigate();
    const audioContextRef = useRef<AudioContext | null>(null);
    const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);
    const currentGainRef = useRef<GainNode | null>(null);
    const transitionSourceRef = useRef<AudioBufferSourceNode | null>(null);

    const [activeTab, setActiveTab] = useState<TabType>('engine');
    const [tracks, setTracks] = useState<AudioTrack[]>([]);
    const [selectedTrack1, setSelectedTrack1] = useState<string>('');
    const [selectedTrack2, setSelectedTrack2] = useState<string>('');
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentlyPlaying, setCurrentlyPlaying] = useState<string>('');
    const [copied, setCopied] = useState(false);

    // Engine sounds
    const [engineTrack1, setEngineTrack1] = useState<string>('menuMusic');
    const [engineTrack2, setEngineTrack2] = useState<string>('battleMusic');
    const [engineInitialized, setEngineInitialized] = useState(false);

    // Transition settings
    const [overlapDuration, setOverlapDuration] = useState(2000);
    const [fadeOutDuration, setFadeOutDuration] = useState(1000);
    const [fadeInDuration, setFadeInDuration] = useState(0);
    const [track1Volume, setTrack1Volume] = useState(0.5);
    const [track2Volume, setTrack2Volume] = useState(0.5);

    // Get music sounds from engine
    const musicSounds = getSoundsByCategory('music');
    const ambienceSounds = getSoundsByCategory('ambience');
    const sfxSounds = getSoundsByCategory('sfx');

    // Initialize audio engine
    const initEngine = useCallback(async () => {
        await audioEngine.init();
        // Preload all sounds
        const allSoundIds = Object.keys(SOUNDS);
        await audioEngine.preloadAll(allSoundIds);
        setEngineInitialized(true);
    }, []);

    useEffect(() => {
        initEngine();
    }, [initEngine]);

    const getAudioContext = useCallback(() => {
        if (!audioContextRef.current) {
            audioContextRef.current = new AudioContext();
        }
        return audioContextRef.current;
    }, []);

    const handleDrop = useCallback(async (e: React.DragEvent) => {
        e.preventDefault();
        const files = Array.from(e.dataTransfer.files).filter(
            f => f.type.startsWith('audio/') || f.name.endsWith('.wav') || f.name.endsWith('.mp3')
        );

        const ctx = getAudioContext();

        for (const file of files) {
            const url = URL.createObjectURL(file);
            const arrayBuffer = await file.arrayBuffer();
            const buffer = await ctx.decodeAudioData(arrayBuffer);

            const newTrack: AudioTrack = {
                id: `${file.name}-${Date.now()}`,
                name: file.name,
                url,
                buffer,
            };

            setTracks(prev => [...prev, newTrack]);
        }
    }, [getAudioContext]);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const stopAll = useCallback(() => {
        // Stop sandbox audio
        try {
            currentSourceRef.current?.stop();
        } catch { /* ignore */ }
        try {
            transitionSourceRef.current?.stop();
        } catch { /* ignore */ }
        currentSourceRef.current = null;
        transitionSourceRef.current = null;

        // Stop engine audio
        audioEngine.stopAll();

        setIsPlaying(false);
        setCurrentlyPlaying('');
    }, []);

    const playTrack = useCallback((trackId: string, loop = true) => {
        const track = tracks.find(t => t.id === trackId);
        if (!track?.buffer) return;

        stopAll();

        const ctx = getAudioContext();
        const source = ctx.createBufferSource();
        source.buffer = track.buffer;
        source.loop = loop;

        const gain = ctx.createGain();
        gain.gain.value = track === tracks.find(t => t.id === selectedTrack1) ? track1Volume : track2Volume;
        gain.connect(ctx.destination);
        source.connect(gain);

        source.start();
        currentSourceRef.current = source;
        currentGainRef.current = gain;
        setIsPlaying(true);
        setCurrentlyPlaying(track.name);
    }, [tracks, stopAll, getAudioContext, selectedTrack1, track1Volume, track2Volume]);

    const playSandboxTransition = useCallback(() => {
        const track1 = tracks.find(t => t.id === selectedTrack1);
        const track2 = tracks.find(t => t.id === selectedTrack2);

        if (!track1?.buffer || !track2?.buffer) {
            alert('Please select both tracks first');
            return;
        }

        stopAll();

        const ctx = getAudioContext();

        // Start track 1 (the loop)
        const source1 = ctx.createBufferSource();
        source1.buffer = track1.buffer;
        source1.loop = true;

        const gain1 = ctx.createGain();
        gain1.gain.value = track1Volume;
        gain1.connect(ctx.destination);
        source1.connect(gain1);
        source1.start();

        currentSourceRef.current = source1;
        currentGainRef.current = gain1;
        setIsPlaying(true);
        setCurrentlyPlaying(`${track1.name} (loop)`);

        // After 3 seconds, trigger the transition
        setTimeout(() => {
            setCurrentlyPlaying(`${track1.name} + ${track2.name} (transitioning)`);

            // Start track 2 (the transition track)
            const source2 = ctx.createBufferSource();
            source2.buffer = track2.buffer;
            source2.loop = false;

            const gain2 = ctx.createGain();
            if (fadeInDuration > 0) {
                gain2.gain.value = 0;
                gain2.gain.linearRampToValueAtTime(track2Volume, ctx.currentTime + fadeInDuration / 1000);
            } else {
                gain2.gain.value = track2Volume;
            }
            gain2.connect(ctx.destination);
            source2.connect(gain2);
            source2.start();

            transitionSourceRef.current = source2;

            // After overlap duration, fade out track 1
            setTimeout(() => {
                if (gain1 && ctx) {
                    gain1.gain.linearRampToValueAtTime(0, ctx.currentTime + fadeOutDuration / 1000);
                    setCurrentlyPlaying(`${track2.name} (fading out loop)`);

                    setTimeout(() => {
                        try {
                            source1.stop();
                        } catch { /* ignore */ }
                        setCurrentlyPlaying(`${track2.name}`);
                    }, fadeOutDuration);
                }
            }, overlapDuration);

            // When track 2 ends
            source2.onended = () => {
                setIsPlaying(false);
                setCurrentlyPlaying('');
            };
        }, 3000);
    }, [tracks, selectedTrack1, selectedTrack2, stopAll, getAudioContext, overlapDuration, fadeOutDuration, fadeInDuration, track1Volume, track2Volume]);

    // Engine-based playback
    const playEngineTrack = useCallback((soundId: string) => {
        stopAll();
        audioEngine.playMusic(soundId);
        setIsPlaying(true);
        setCurrentlyPlaying(`${soundId} (engine)`);
    }, [stopAll]);

    const playEngineSFX = useCallback((soundId: string) => {
        audioEngine.playSFX(soundId);
    }, []);

    const playEngineTransition = useCallback(() => {
        stopAll();

        // Start track 1
        audioEngine.playMusic(engineTrack1);
        setIsPlaying(true);
        setCurrentlyPlaying(`${engineTrack1} (loop)`);

        // After 3 seconds, trigger transition
        setTimeout(() => {
            setCurrentlyPlaying(`${engineTrack1} → ${engineTrack2} (transitioning)`);

            audioEngine.playMusicTransition(engineTrack2, {
                overlapDuration,
                fadeOutCurrent: fadeOutDuration,
                fadeInNew: fadeInDuration,
            });

            // Update status after transition
            setTimeout(() => {
                setCurrentlyPlaying(`${engineTrack2}`);
            }, overlapDuration + fadeOutDuration);
        }, 3000);
    }, [stopAll, engineTrack1, engineTrack2, overlapDuration, fadeOutDuration, fadeInDuration]);

    const removeTrack = (trackId: string) => {
        const track = tracks.find(t => t.id === trackId);
        if (track?.url) {
            URL.revokeObjectURL(track.url);
        }
        setTracks(prev => prev.filter(t => t.id !== trackId));
        if (selectedTrack1 === trackId) setSelectedTrack1('');
        if (selectedTrack2 === trackId) setSelectedTrack2('');
    };

    const copySettings = () => {
        const code = `audioEngine.playMusicTransition('${activeTab === 'engine' ? engineTrack2 : 'YOUR_SOUND_ID'}', {
    overlapDuration: ${overlapDuration},
    fadeOutCurrent: ${fadeOutDuration},
    fadeInNew: ${fadeInDuration},
});`;
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="flex-1 flex flex-col overflow-hidden bg-gray-950 p-4">
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
                <PixelButton variant="secondary" onClick={() => navigate('/')} className="px-4 py-2">
                    <ArrowLeft className="w-4 h-4" />
                </PixelButton>
                <h1 className="text-xl font-bold text-cyan-400 uppercase tracking-widest">Audio Test Lab</h1>
                <div className="text-xs text-gray-500">
                    {engineInitialized ? '● Engine Ready' : '○ Loading...'}
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-4">
                <button
                    onClick={() => setActiveTab('engine')}
                    className={`px-4 py-2 text-sm font-bold uppercase tracking-wider transition-colors ${
                        activeTab === 'engine'
                            ? 'bg-cyan-600 text-white'
                            : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                >
                    <Settings className="w-4 h-4 inline mr-2" />
                    Game Engine
                </button>
                <button
                    onClick={() => setActiveTab('sandbox')}
                    className={`px-4 py-2 text-sm font-bold uppercase tracking-wider transition-colors ${
                        activeTab === 'sandbox'
                            ? 'bg-cyan-600 text-white'
                            : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                >
                    <Upload className="w-4 h-4 inline mr-2" />
                    Sandbox (Drop Files)
                </button>
            </div>

            <div className="flex-1 grid grid-cols-2 gap-6 overflow-hidden">
                {/* Left column */}
                <div className="flex flex-col gap-4 overflow-hidden">
                    {activeTab === 'sandbox' ? (
                        <>
                            {/* Drop zone */}
                            <PixelCard
                                className="p-8 border-dashed border-2 border-gray-600 hover:border-cyan-500 transition-colors cursor-pointer"
                                onDrop={handleDrop}
                                onDragOver={handleDragOver}
                            >
                                <div className="flex flex-col items-center gap-3 text-gray-400">
                                    <Upload className="w-12 h-12" />
                                    <div className="text-center">
                                        <p className="font-bold">Drop audio files here</p>
                                        <p className="text-xs text-gray-500">WAV or MP3</p>
                                    </div>
                                </div>
                            </PixelCard>

                            {/* Track list */}
                            <PixelCard className="flex-1 overflow-auto p-4">
                                <h2 className="text-sm font-bold text-gray-400 mb-3 flex items-center gap-2">
                                    <Music className="w-4 h-4" /> Loaded Tracks
                                </h2>
                                {tracks.length === 0 ? (
                                    <p className="text-gray-600 text-sm">No tracks loaded</p>
                                ) : (
                                    <div className="space-y-2">
                                        {tracks.map(track => (
                                            <div
                                                key={track.id}
                                                className="flex items-center gap-2 p-2 bg-gray-800 rounded text-sm"
                                            >
                                                <span className="flex-1 truncate text-gray-300">{track.name}</span>
                                                <button
                                                    onClick={() => playTrack(track.id)}
                                                    className="p-1 hover:bg-gray-700 rounded"
                                                    title="Play"
                                                >
                                                    <Play className="w-4 h-4 text-green-400" />
                                                </button>
                                                <button
                                                    onClick={() => removeTrack(track.id)}
                                                    className="p-1 hover:bg-gray-700 rounded text-red-400"
                                                    title="Remove"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </PixelCard>
                        </>
                    ) : (
                        <>
                            {/* Engine Music */}
                            <PixelCard className="p-4 overflow-auto">
                                <h2 className="text-sm font-bold text-gray-400 mb-3 flex items-center gap-2">
                                    <Music className="w-4 h-4" /> Registered Music
                                </h2>
                                <div className="space-y-2">
                                    {musicSounds.map(sound => (
                                        <div
                                            key={sound.id}
                                            className="flex items-center gap-2 p-2 bg-gray-800 rounded text-sm"
                                        >
                                            <span className="flex-1 truncate text-gray-300">{sound.id}</span>
                                            <span className="text-xs text-gray-500">{sound.loop ? 'loop' : 'once'}</span>
                                            <button
                                                onClick={() => playEngineTrack(sound.id)}
                                                className="p-1 hover:bg-gray-700 rounded"
                                                title="Play"
                                            >
                                                <Play className="w-4 h-4 text-green-400" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </PixelCard>

                            {/* Engine SFX */}
                            <PixelCard className="p-4 overflow-auto">
                                <h2 className="text-sm font-bold text-gray-400 mb-3 flex items-center gap-2">
                                    <Waves className="w-4 h-4" /> Registered SFX
                                </h2>
                                <div className="flex flex-wrap gap-2">
                                    {sfxSounds.map(sound => (
                                        <button
                                            key={sound.id}
                                            onClick={() => playEngineSFX(sound.id)}
                                            className="px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded text-xs text-gray-300"
                                        >
                                            {sound.id}
                                        </button>
                                    ))}
                                </div>
                            </PixelCard>

                            {/* Engine Ambience */}
                            <PixelCard className="p-4 overflow-auto">
                                <h2 className="text-sm font-bold text-gray-400 mb-3">Registered Ambience</h2>
                                <div className="flex flex-wrap gap-2">
                                    {ambienceSounds.map(sound => (
                                        <button
                                            key={sound.id}
                                            onClick={() => audioEngine.startAmbience(sound.id)}
                                            className="px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded text-xs text-gray-300"
                                        >
                                            {sound.id}
                                        </button>
                                    ))}
                                </div>
                            </PixelCard>
                        </>
                    )}
                </div>

                {/* Right column - Transition controls */}
                <div className="flex flex-col gap-4">
                    <PixelCard className="p-4">
                        <h2 className="text-sm font-bold text-gray-400 mb-4 flex items-center gap-2">
                            <Waves className="w-4 h-4" /> Transition Test
                        </h2>

                        {/* Track selectors */}
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div>
                                <label className="text-xs text-gray-500 block mb-1">Track 1 (Loop)</label>
                                {activeTab === 'sandbox' ? (
                                    <select
                                        value={selectedTrack1}
                                        onChange={e => setSelectedTrack1(e.target.value)}
                                        className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-sm text-white"
                                    >
                                        <option value="">Select track...</option>
                                        {tracks.map(t => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <select
                                        value={engineTrack1}
                                        onChange={e => setEngineTrack1(e.target.value)}
                                        className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-sm text-white"
                                    >
                                        {musicSounds.map(s => (
                                            <option key={s.id} value={s.id}>{s.id}</option>
                                        ))}
                                    </select>
                                )}
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 block mb-1">Track 2 (Transition)</label>
                                {activeTab === 'sandbox' ? (
                                    <select
                                        value={selectedTrack2}
                                        onChange={e => setSelectedTrack2(e.target.value)}
                                        className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-sm text-white"
                                    >
                                        <option value="">Select track...</option>
                                        {tracks.map(t => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <select
                                        value={engineTrack2}
                                        onChange={e => setEngineTrack2(e.target.value)}
                                        className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-sm text-white"
                                    >
                                        {musicSounds.map(s => (
                                            <option key={s.id} value={s.id}>{s.id}</option>
                                        ))}
                                    </select>
                                )}
                            </div>
                        </div>

                        {/* Volume controls (sandbox only) */}
                        {activeTab === 'sandbox' && (
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div>
                                    <label className="text-xs text-gray-500 block mb-1">
                                        Track 1 Volume: {Math.round(track1Volume * 100)}%
                                    </label>
                                    <input
                                        type="range"
                                        min="0"
                                        max="1"
                                        step="0.05"
                                        value={track1Volume}
                                        onChange={e => setTrack1Volume(parseFloat(e.target.value))}
                                        className="w-full"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 block mb-1">
                                        Track 2 Volume: {Math.round(track2Volume * 100)}%
                                    </label>
                                    <input
                                        type="range"
                                        min="0"
                                        max="1"
                                        step="0.05"
                                        value={track2Volume}
                                        onChange={e => setTrack2Volume(parseFloat(e.target.value))}
                                        className="w-full"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Timing controls */}
                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="text-xs text-gray-500 block mb-1">
                                    Overlap Duration: {overlapDuration}ms
                                </label>
                                <input
                                    type="range"
                                    min="0"
                                    max="5000"
                                    step="100"
                                    value={overlapDuration}
                                    onChange={e => setOverlapDuration(parseInt(e.target.value))}
                                    className="w-full"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 block mb-1">
                                    Fade Out (Loop): {fadeOutDuration}ms
                                </label>
                                <input
                                    type="range"
                                    min="0"
                                    max="3000"
                                    step="100"
                                    value={fadeOutDuration}
                                    onChange={e => setFadeOutDuration(parseInt(e.target.value))}
                                    className="w-full"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 block mb-1">
                                    Fade In (Transition): {fadeInDuration}ms
                                </label>
                                <input
                                    type="range"
                                    min="0"
                                    max="3000"
                                    step="100"
                                    value={fadeInDuration}
                                    onChange={e => setFadeInDuration(parseInt(e.target.value))}
                                    className="w-full"
                                />
                            </div>
                        </div>

                        {/* Play controls */}
                        <div className="flex gap-3">
                            <PixelButton
                                onClick={activeTab === 'sandbox' ? playSandboxTransition : playEngineTransition}
                                disabled={activeTab === 'sandbox' ? (!selectedTrack1 || !selectedTrack2) : !engineInitialized}
                                className="flex-1 py-3"
                            >
                                <Play className="w-4 h-4 inline mr-2" />
                                Test Transition
                            </PixelButton>
                            <PixelButton
                                variant="danger"
                                onClick={stopAll}
                                disabled={!isPlaying}
                                className="px-6"
                            >
                                <Square className="w-4 h-4" />
                            </PixelButton>
                        </div>
                    </PixelCard>

                    {/* Status */}
                    <PixelCard className="p-4">
                        <h2 className="text-sm font-bold text-gray-400 mb-2">Status</h2>
                        <div className={`text-sm ${isPlaying ? 'text-green-400' : 'text-gray-600'}`}>
                            {isPlaying ? (
                                <span className="flex items-center gap-2">
                                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                                    {currentlyPlaying}
                                </span>
                            ) : (
                                'Stopped'
                            )}
                        </div>
                    </PixelCard>

                    {/* Copy settings */}
                    <PixelCard className="p-4">
                        <div className="flex justify-between items-center mb-2">
                            <h2 className="text-sm font-bold text-gray-400">Export Settings</h2>
                            <button
                                onClick={copySettings}
                                className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                            >
                                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                {copied ? 'Copied!' : 'Copy Code'}
                            </button>
                        </div>
                        <pre className="text-xs bg-gray-900 p-2 rounded text-gray-400 overflow-x-auto">
{`audioEngine.playMusicTransition('${activeTab === 'engine' ? engineTrack2 : 'soundId'}', {
  overlapDuration: ${overlapDuration},
  fadeOutCurrent: ${fadeOutDuration},
  fadeInNew: ${fadeInDuration},
});`}
                        </pre>
                    </PixelCard>

                    {/* Instructions */}
                    <PixelCard className="p-4 text-xs text-gray-500">
                        <h2 className="font-bold text-gray-400 mb-2">How to use:</h2>
                        <ol className="list-decimal list-inside space-y-1">
                            <li>Select Track 1 (loop) and Track 2 (transition)</li>
                            <li>Adjust overlap and fade durations</li>
                            <li>Click "Test Transition" - loop plays 3s, then transition</li>
                            <li>Copy the code when you find settings you like</li>
                        </ol>
                    </PixelCard>
                </div>
            </div>
        </div>
    );
};

export default AudioTestPage;
