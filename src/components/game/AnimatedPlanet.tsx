import React, { useState, useEffect } from 'react';

// Animated planet sprite mapping - folder path and frame count
export const animatedPlanets: Record<string, { folder: string; frames: number }> = {
    earth: { folder: '/assets/helianthus/AnimatedPlanetsFull/Terran_with_clouds/1', frames: 60 },
    moon: { folder: '/assets/helianthus/AnimatedPlanetsFull/Barren_or_Moon/1', frames: 60 },
    mars: { folder: '/assets/helianthus/AnimatedPlanetsFull/Desert/1', frames: 60 },
    ceres: { folder: '/assets/helianthus/AnimatedPlanetsFull/Barren_or_Moon/2', frames: 60 },
    jupiter: { folder: '/assets/helianthus/AnimatedPlanetsFull/Gas_giant_or_Toxic/1', frames: 60 },
    europa: { folder: '/assets/helianthus/AnimatedPlanetsFull/Ice', frames: 60 },
    saturn: { folder: '/assets/helianthus/AnimatedPlanetsFull/Gas_giant_or_Toxic/2', frames: 60 },
    titan: { folder: '/assets/helianthus/AnimatedPlanetsFull/Desert/2', frames: 60 },
    uranus: { folder: '/assets/helianthus/AnimatedPlanetsFull/Gas_giant_or_Toxic/3', frames: 60 },
    neptune: { folder: '/assets/helianthus/AnimatedPlanetsFull/Gas_giant_or_Toxic/4', frames: 60 },
    pluto: { folder: '/assets/helianthus/AnimatedPlanetsFull/Barren_or_Moon/3', frames: 60 },
    haumea: { folder: '/assets/helianthus/AnimatedPlanetsFull/Barren_or_Moon/4', frames: 60 },
    makemake: { folder: '/assets/helianthus/AnimatedPlanetsFull/Ice', frames: 60 },
    eris: { folder: '/assets/helianthus/AnimatedPlanetsFull/Ice', frames: 60 },
    arrokoth: { folder: '/assets/helianthus/AnimatedPlanetsFull/Barren_or_Moon/1', frames: 60 },
};

// Static planet images (fallback when animation data unavailable)
export const planetImages: Record<string, string> = {
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
