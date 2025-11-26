import React, { useMemo } from 'react';
import { Outlet } from 'react-router-dom';
import { ScreenFrame } from '@/components/ui/ScreenFrame';

// Generate star data once at module level to avoid re-randomizing on re-renders
const generateStars = (count: number) => {
    return Array.from({ length: count }, (_, i) => ({
        id: i,
        top: Math.random() * 100,
        left: Math.random() * 100,
        size: Math.random() * 3 + 1,
        opacity: Math.random(),
        duration: Math.random() * 5 + 2,
    }));
};

const STARS = generateStars(50);

export const Layout: React.FC = () => {
    const stars = useMemo(() => STARS, []);

    return (
        <ScreenFrame>
            {/* Starfield Background */}
            <div className="fixed inset-0 z-0">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 animate-pulse"></div>
                {stars.map((star) => (
                    <div
                        key={star.id}
                        className="absolute bg-brand-accent rounded-full"
                        style={{
                            top: `${star.top}%`,
                            left: `${star.left}%`,
                            width: `${star.size}px`,
                            height: `${star.size}px`,
                            opacity: star.opacity,
                            animation: `twinkle ${star.duration}s infinite`
                        }}
                    />
                ))}
            </div>

            {/* Content */}
            <div className="relative z-10 min-h-screen flex flex-col">
                <Outlet />
            </div>

            <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 1; }
        }
      `}</style>
        </ScreenFrame>
    );
};
