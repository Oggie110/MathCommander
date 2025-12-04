import React from 'react';

interface SpaceBackgroundProps {
    variant?: 'default' | 'dark' | 'stars-only';
    showParallax?: boolean;
    showStardust?: boolean;
    className?: string;
}

export const SpaceBackground: React.FC<SpaceBackgroundProps> = ({
    variant = 'stars-only',
    showParallax = true,
    showStardust = true,  // Stardust texture layer (matches boss fight)
    className = '',
}) => {
    // stars-only = just black + stars (default for non-battle screens)
    // dark = dark-blue-purple.png (for regular battles)
    // default = bright-blue.png (legacy, not used)
    const showBaseImage = variant !== 'stars-only';
    const bgImage = variant === 'dark'
        ? '/assets/images/backgrounds/base/dark-blue-purple.png'
        : '/assets/images/backgrounds/base/bright-blue.png';

    return (
        <div className={`absolute inset-0 z-0 pointer-events-none ${className}`}>
            {/* Base background layer - only show if not stars-only */}
            {showBaseImage && (
                <div
                    className="absolute inset-0"
                    style={{
                        backgroundImage: `url(${bgImage})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                    }}
                />
            )}
            {showParallax && (
                <>
                    {/* Parallax star layer 1 - Blue stars (slower) */}
                    <div
                        className="absolute inset-0 animate-parallaxSlow"
                        style={{
                            backgroundImage: 'url(/assets/images/backgrounds/stars/stars-blue.png)',
                            backgroundRepeat: 'repeat',
                            backgroundSize: '2048px',
                            opacity: 0.4,
                            imageRendering: 'pixelated',
                        }}
                    />
                    {/* Parallax star layer 2 - Yellow stars (very slow) */}
                    <div
                        className="absolute inset-0 animate-parallaxVerySlow"
                        style={{
                            backgroundImage: 'url(/assets/images/backgrounds/stars/stars-yellow.png)',
                            backgroundRepeat: 'repeat',
                            backgroundSize: '1024px',
                            opacity: 0.5,
                            imageRendering: 'pixelated',
                        }}
                    />
                    {/* Parallax star layer 3 - Close stars (medium speed) - TEMPORARILY HIDDEN */}
                    {/* <div
                        className="absolute inset-0 animate-parallaxMedium"
                        style={{
                            backgroundImage: 'url(/assets/images/backgrounds/stars/yellow-stars-alt.png)',
                            backgroundRepeat: 'repeat',
                            backgroundSize: '1024px',
                            opacity: 0.4,
                            imageRendering: 'pixelated',
                        }}
                    /> */}
                </>
            )}
            {/* Stardust texture layer - subtle additional stars */}
            {showStardust && (
                <div
                    className="absolute inset-0 animate-pulse"
                    style={{
                        backgroundImage: "url('https://www.transparenttextures.com/patterns/stardust.png')",
                        backgroundSize: '1536px',
                        opacity: 0.3,
                    }}
                />
            )}
        </div>
    );
};
