import React, { useState, useEffect } from 'react';
import { Volume2 } from 'lucide-react';
import { audioEngine } from '@/audio';

/**
 * Global audio unlock prompt for iOS Safari
 * Shows a "Tap to enable sound" button when AudioContext is suspended
 * This is a fallback for deep-linked pages or when normal unlock fails
 */
export const AudioUnlockPrompt: React.FC = () => {
    const [showPrompt, setShowPrompt] = useState(false);
    const [debugInfo, setDebugInfo] = useState('checking...');
    const [showDebug] = useState(true); // Set to true for debugging iOS

    useEffect(() => {
        // Check if audio needs unlocking after a short delay
        const checkAudio = () => {
            const initialized = audioEngine.isInitialized();
            const suspended = initialized ? audioEngine.isSuspended() : false;
            setDebugInfo(`init=${initialized}, suspended=${suspended}`);

            if (initialized && suspended) {
                setShowPrompt(true);
            } else if (initialized && !suspended) {
                setShowPrompt(false);
            }
        };

        // Check after mount and periodically
        const timeout = setTimeout(checkAudio, 1000);
        const interval = setInterval(checkAudio, 2000);

        return () => {
            clearTimeout(timeout);
            clearInterval(interval);
        };
    }, []);

    const handleUnlock = async () => {
        await audioEngine.init();
        await audioEngine.resume();
        setShowPrompt(false);
        setDebugInfo('unlocked!');
    };

    return (
        <>
            {/* Debug info - always visible for now */}
            {showDebug && (
                <div className="fixed top-2 left-2 z-50 px-2 py-1 bg-black/80 text-green-400 text-xs font-mono rounded">
                    Audio: {debugInfo}
                </div>
            )}

            {/* Unlock button - shows when suspended */}
            {showPrompt && (
                <button
                    onClick={handleUnlock}
                    className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-lg shadow-lg animate-pulse"
                >
                    <Volume2 className="w-5 h-5" />
                    Tap to enable sound
                </button>
            )}
        </>
    );
};
