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
    // Default uses bright-blue, dark variant uses dark-blue-purple (for battles only)
    const bgImage = variant === 'dark'
        ? '/assets/images/backgrounds/base/dark-blue-purple.png'
        : '/assets/images/backgrounds/base/bright-blue.png';

    return (
        <div className={`absolute inset-0 z-0 pointer-events-none ${className}`}>
            {/* Base background layer */}
            <div
                className="absolute inset-0"
                style={{
                    backgroundImage: `url(${bgImage})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                }}
            />
            {showParallax && (
                <>
                    {/* Parallax star layer 1 - Blue stars (medium speed) */}
                    <div
                        className="absolute inset-0 animate-parallaxMedium"
                        style={{
                            backgroundImage: 'url(/assets/images/backgrounds/stars/stars-blue.png)',
                            backgroundRepeat: 'repeat',
                            backgroundSize: '4096px',
                            opacity: 0.4,
                            imageRendering: 'pixelated',
                        }}
                    />
                    {/* Parallax star layer 2 - Yellow stars (slower) */}
                    <div
                        className="absolute inset-0 animate-parallaxSlow"
                        style={{
                            backgroundImage: 'url(/assets/images/backgrounds/stars/stars-yellow.png)',
                            backgroundRepeat: 'repeat',
                            backgroundSize: '4096px',
                            opacity: 0.5,
                            imageRendering: 'pixelated',
                        }}
                    />
                    {/* Parallax star layer 3 - Close stars (fastest) */}
                    <div
                        className="absolute inset-0 animate-parallaxFast"
                        style={{
                            backgroundImage: 'url(/assets/images/backgrounds/stars/yellow-stars-alt.png)',
                            backgroundRepeat: 'repeat',
                            backgroundSize: '2048px',
                            opacity: 0.6,
                            imageRendering: 'pixelated',
                        }}
                    />
                </>
            )}
        </div>
    );
};
