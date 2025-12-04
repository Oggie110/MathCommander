import React from 'react';
import { cn } from '@/lib/utils';

interface PixelCardProps extends React.HTMLAttributes<HTMLDivElement> {
    title?: string;
    variant?: 'default' | 'danger';
}

export const PixelCard: React.FC<PixelCardProps> = ({
    className,
    title,
    variant = 'default',
    children,
    ...props
}) => {
    return (
        <div
            className={cn(
                'panel-industrial p-6 relative',
                variant === 'danger' && 'border-brand-danger',
                className
            )}
            {...props}
        >
            {/* Corner Rivets */}
            <div className="absolute top-2 left-2 w-2 h-2 bg-industrial-highlight rounded-full shadow-sm" />
            <div className="absolute top-2 right-2 w-2 h-2 bg-industrial-highlight rounded-full shadow-sm" />
            <div className="absolute bottom-2 left-2 w-2 h-2 bg-industrial-highlight rounded-full shadow-sm" />
            <div className="absolute bottom-2 right-2 w-2 h-2 bg-industrial-highlight rounded-full shadow-sm" />

            {title && (
                <div className="absolute -top-5 left-4 bg-industrial-dark px-3 py-1 border-2 border-industrial-metal text-brand-secondary font-pixel font-bold uppercase tracking-widest text-sm shadow-lg">
                    {title}
                </div>
            )}

            <div className="relative z-10">
                {children}
            </div>
        </div>
    );
};
