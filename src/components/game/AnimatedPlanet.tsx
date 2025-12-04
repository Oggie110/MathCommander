import React, { useState, useEffect } from 'react';

// Animated planet sprite mapping - folder path and frame count
export const animatedPlanets: Record<string, { folder: string; frames: number }> = {
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
export const planetImages: Record<string, string> = {
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
    const [frame, setFrame] = useState(1);
    const planetData = animatedPlanets[planetId];

    useEffect(() => {
        if (!planetData || isLocked) return;

        const interval = setInterval(() => {
            setFrame(prev => (prev % planetData.frames) + 1);
        }, 100); // ~10fps for gentle rotation

        return () => clearInterval(interval);
    }, [planetData, isLocked]);

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

    return (
        <img
            src={`${planetData.folder}/${frame}.png`}
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
};
