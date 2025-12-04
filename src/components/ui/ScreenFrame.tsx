import React from 'react';
import { cn } from '@/lib/utils';

interface ScreenFrameProps {
    children: React.ReactNode;
    className?: string;
}

export const ScreenFrame: React.FC<ScreenFrameProps> = ({ children, className }) => {
    return (
        <div className={cn("relative min-h-screen bg-space-black overflow-hidden font-pixel", className)}>
            {/* CRT Scanline Effect */}
            <div className="fixed inset-0 pointer-events-none z-50 opacity-10"
                style={{
                    background: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))',
                    backgroundSize: '100% 2px, 3px 100%'
                }}
            />

            {/* Vignette */}
            <div className="fixed inset-0 pointer-events-none z-40 bg-radial-gradient from-transparent to-black/80" />

            {/* Content Container */}
            <div className="relative z-10 h-full flex flex-col">
                {children}
            </div>
        </div>
    );
};
