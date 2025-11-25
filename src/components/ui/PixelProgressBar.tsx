import React from 'react';
import { cn } from '@/lib/utils';

interface PixelProgressBarProps {
    value: number;
    max?: number;
    label?: string;
    color?: string;
    className?: string;
}

export const PixelProgressBar: React.FC<PixelProgressBarProps> = ({
    value,
    max = 100,
    label,
    color = 'bg-green-500',
    className
}) => {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));

    return (
        <div className={cn("w-full", className)}>
            {label && (
                <div className="flex justify-between mb-1 text-xs uppercase tracking-wider">
                    <span>{label}</span>
                    <span>{Math.round(percentage)}%</span>
                </div>
            )}
            <div className="h-6 border-4 border-white bg-space-black p-1 relative">
                <div
                    className={cn("h-full transition-all duration-300", color)}
                    style={{ width: `${percentage}%` }}
                />
                {/* Grid lines for retro feel */}
                <div className="absolute inset-0 grid grid-cols-10 pointer-events-none">
                    {Array.from({ length: 9 }).map((_, i) => (
                        <div key={i} className="border-r border-black/20 h-full" />
                    ))}
                </div>
            </div>
        </div>
    );
};
