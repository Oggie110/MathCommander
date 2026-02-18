import React, { useState, useEffect, useRef } from 'react';

// Animated planet sprite mapping - folder path and frame count
const animatedPlanets: Record<string, { folder: string; frames: number }> = {
    earth: { folder: '/assets/images/planets/animated/terran-clouds', frames: 60 },
    moon: { folder: '/assets/images/planets/animated/barren-1', frames: 60 },
    mars: { folder: '/assets/images/planets/animated/desert-1', frames: 60 },
    ceres: { folder: '/assets/images/planets/animated/barren-2', frames: 60 },
    jupiter: { folder: '/assets/images/planets/animated/gas-giant-1', frames: 60 },
    europa: { folder: '/assets/images/planets/animated/ice', frames: 60 },
    saturn: { folder: '/assets/images/planets/animated/gas-giant-2', frames: 60 },
    titan: { folder: '/assets/images/planets/animated/desert-2', frames: 60 },
    uranus: { folder: '/assets/images/planets/animated/gas-giant-3', frames: 60 },
    neptune: { folder: '/assets/images/planets/animated/gas-giant-4', frames: 60 },
    pluto: { folder: '/assets/images/planets/animated/barren-3', frames: 60 },
    haumea: { folder: '/assets/images/planets/animated/barren-4', frames: 60 },
    makemake: { folder: '/assets/images/planets/animated/ice', frames: 60 },
    eris: { folder: '/assets/images/planets/animated/ice', frames: 60 },
    arrokoth: { folder: '/assets/images/planets/animated/barren-1', frames: 60 },
};

// Static planet images (fallback when animation data unavailable)
const planetImages: Record<string, string> = {
    earth: '/assets/images/planets/static/ocean-1.png',
    moon: '/assets/images/planets/static/barren-1.png',
    mars: '/assets/images/planets/static/desert-1.png',
    ceres: '/assets/images/planets/static/asteroids-1.png',
    jupiter: '/assets/images/planets/static/gas-giant-1.png',
    europa: '/assets/images/planets/static/ice-1.png',
    saturn: '/assets/images/planets/static/gas-giant-2.png',
    titan: '/assets/images/planets/static/desert-2.png',
    uranus: '/assets/images/planets/static/gas-giant-3.png',
    neptune: '/assets/images/planets/static/gas-giant-4.png',
    pluto: '/assets/images/planets/static/barren-3.png',
    haumea: '/assets/images/planets/static/barren-4.png',
    makemake: '/assets/images/planets/static/ice-2.png',
    eris: '/assets/images/planets/static/ice-3.png',
    arrokoth: '/assets/images/planets/static/barren-5.png',
};

// Global cache for preloaded planet frames
// Key is folder path, value is array of Image objects
const frameCache: Map<string, HTMLImageElement[]> = new Map();
const loadingPromises: Map<string, Promise<HTMLImageElement[]>> = new Map();

/**
 * Preload all frames for a planet folder into memory
 * Returns cached array if already loaded
 */
async function preloadPlanetFrames(folder: string, frameCount: number): Promise<HTMLImageElement[]> {
    // Return cached frames if available
    if (frameCache.has(folder)) {
        return frameCache.get(folder)!;
    }

    // Return existing promise if currently loading
    if (loadingPromises.has(folder)) {
        return loadingPromises.get(folder)!;
    }

    // Create loading promise
    const loadPromise = new Promise<HTMLImageElement[]>((resolve) => {
        const frames: HTMLImageElement[] = [];
        let loadedCount = 0;

        for (let i = 1; i <= frameCount; i++) {
            const img = new Image();
            img.src = `${folder}/${i}.png`;

            img.onload = img.onerror = () => {
                loadedCount++;
                if (loadedCount === frameCount) {
                    frameCache.set(folder, frames);
                    loadingPromises.delete(folder);
                    resolve(frames);
                }
            };

            frames.push(img);
        }
    });

    loadingPromises.set(folder, loadPromise);
    return loadPromise;
}

interface AnimatedPlanetProps {
    planetId: string;
    size: number;
    isLocked?: boolean;
    className?: string;
}

export const AnimatedPlanet: React.FC<AnimatedPlanetProps> = ({
    planetId,
    size,
    isLocked = false,
    className = '',
}) => {
    const [frame, setFrame] = useState(0);
    const [frames, setFrames] = useState<HTMLImageElement[] | null>(null);
    const planetData = animatedPlanets[planetId];
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Preload frames on mount
    useEffect(() => {
        if (!planetData) return;

        let mounted = true;

        preloadPlanetFrames(planetData.folder, planetData.frames).then((loadedFrames) => {
            if (mounted) {
                setFrames(loadedFrames);
            }
        });

        return () => { mounted = false; };
    }, [planetData]);

    // Animate frames using canvas for efficiency
    useEffect(() => {
        if (!frames || !canvasRef.current || isLocked) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrame: number;
        let lastTime = 0;
        const frameInterval = 100; // ~10fps

        const animate = (time: number) => {
            if (time - lastTime >= frameInterval) {
                lastTime = time;
                setFrame(prev => (prev + 1) % frames.length);
            }
            animationFrame = requestAnimationFrame(animate);
        };

        animationFrame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationFrame);
    }, [frames, isLocked]);

    // Draw current frame to canvas
    useEffect(() => {
        if (!frames || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const img = frames[frame];
        if (img && img.complete) {
            ctx.clearRect(0, 0, size, size);
            ctx.imageSmoothingEnabled = false; // Pixelated rendering
            ctx.drawImage(img, 0, 0, size, size);
        }
    }, [frame, frames, size]);

    // Fallback to static image if no animation data
    if (!planetData) {
        return (
            <img
                src={planetImages[planetId]}
                alt={planetId}
                style={{
                    width: size,
                    height: size,
                    imageRendering: 'pixelated',
                    filter: isLocked ? 'brightness(0.3) grayscale(1)' : 'none',
                }}
                className={className}
            />
        );
    }

    // Show static image while loading frames
    if (!frames) {
        return (
            <img
                src={planetImages[planetId]}
                alt={planetId}
                style={{
                    width: size,
                    height: size,
                    imageRendering: 'pixelated',
                    filter: isLocked ? 'brightness(0.3) grayscale(1)' : 'none',
                }}
                className={className}
            />
        );
    }

    // Locked planets show static first frame
    if (isLocked) {
        return (
            <canvas
                ref={canvasRef}
                width={size}
                height={size}
                style={{
                    width: size,
                    height: size,
                    imageRendering: 'pixelated',
                    filter: 'brightness(0.3) grayscale(1)',
                }}
                className={className}
            />
        );
    }

    return (
        <canvas
            ref={canvasRef}
            width={size}
            height={size}
            style={{
                width: size,
                height: size,
                imageRendering: 'pixelated',
            }}
            className={className}
        />
    );
};
