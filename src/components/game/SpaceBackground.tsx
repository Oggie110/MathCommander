import React from 'react';

interface SpaceBackgroundProps {
    variant?: 'default' | 'dark';
    showParallax?: boolean;
    className?: string;
}

export const SpaceBackground: React.FC<SpaceBackgroundProps> = ({
    variant = 'default',
    showParallax = true,
    className = '',
}) => {
    const bgImage = variant === 'dark'
        ? '/assets/helianthus/SpaceBackgrounds/Dark/blue_purple.png'
        : '/assets/helianthus/SpaceBackgrounds/1.png';

    return (
        <div className={`absolute inset-0 z-0 pointer-events-none ${className}`}>
            <div
                className="absolute inset-0"
                style={{
                    backgroundImage: `url(${bgImage})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                }}
            />
            {showParallax && (
                <div
                    className="absolute inset-0 animate-parallaxSlow"
                    style={{
                        backgroundImage: 'url(/assets/helianthus/SpaceBackgrounds/stars_blue.png)',
                        backgroundRepeat: 'repeat',
                        backgroundSize: '2048px',
                        opacity: 0.5,
                        imageRendering: 'pixelated',
                    }}
                />
            )}
        </div>
    );
};
