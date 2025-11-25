import React from 'react';
import { cn } from '@/lib/utils';

interface PixelCardProps extends React.HTMLAttributes<HTMLDivElement> {
    title?: string;
}

export const PixelCard: React.FC<PixelCardProps> = ({
    className,
    title,
    children,
    ...props
}) => {
    return (
        <div
            className={cn(
                'pixel-card relative',
                className
            )}
            {...props}
        >
            {title && (
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-space-black px-4 py-1 border-2 border-white text-star-yellow font-bold uppercase tracking-widest whitespace-nowrap">
                    {title}
                </div>
            )}
            {children}
        </div>
    );
};
