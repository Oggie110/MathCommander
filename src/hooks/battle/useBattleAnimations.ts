import { useState, useEffect } from 'react';
import { audioEngine } from '@/audio';

/**
 * Manages all battle animation states:
 * - Hero ship frame animation (engine thrust)
 * - Shot/laser frame animation
 * - Explosion frame animation
 */
export function useBattleAnimations(
    showLaser: boolean,
    gameEnding: 'explosion' | 'escape' | null
) {
    const [heroFrame, setHeroFrame] = useState(1);
    const [shotFrame, setShotFrame] = useState(1);
    const [explosionFrame, setExplosionFrame] = useState(1);

    // Hero ship animation - cycle through 6 frames for engine thrust
    useEffect(() => {
        const interval = setInterval(() => {
            setHeroFrame(prev => (prev % 6) + 1);
        }, 100);
        return () => clearInterval(interval);
    }, []);

    // Preload explosion assets (images + sound)
    useEffect(() => {
        audioEngine.preload('explosion');
        const explosionColors = ['Red', 'Blue'];
        explosionColors.forEach(color => {
            for (let frame = 1; frame <= 8; frame++) {
                const img = new Image();
                img.src = `/assets/helianthus/ShooterFull/Explosions/${color}/64px/${frame}.png`;
            }
        });
    }, []);

    // Shot animation - play through shot frames once when laser is active
    useEffect(() => {
        if (!showLaser) {
            setShotFrame(1);
            return;
        }
        const interval = setInterval(() => {
            setShotFrame(prev => {
                // Play through Shot1-5, then ShotHit1-6 (total 11 frames)
                if (prev < 11) return prev + 1;
                return 11; // Stay on last frame
            });
        }, 50);
        return () => clearInterval(interval);
    }, [showLaser]);

    // Explosion animation - cycle through 8 frames when explosion happens
    useEffect(() => {
        if (gameEnding !== 'explosion') {
            setExplosionFrame(1);
            return;
        }
        let frameCount = 1;
        const interval = setInterval(() => {
            frameCount++;
            setExplosionFrame(prev => {
                if (prev < 8) return prev + 1;
                return 8;
            });
            if (frameCount > 8) {
                clearInterval(interval);
                setTimeout(() => {
                    setExplosionFrame(0); // 0 = hide explosion
                }, 50);
            }
        }, 100);
        return () => clearInterval(interval);
    }, [gameEnding]);

    return {
        heroFrame,
        shotFrame,
        explosionFrame,
    };
}
