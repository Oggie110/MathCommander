import React from 'react';
import { cn } from '@/lib/utils';

interface PixelButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'warning';
    size?: 'sm' | 'md' | 'lg';
}

export const PixelButton: React.FC<PixelButtonProps> = ({
    className,
    variant = 'primary',
    size = 'md',
    children,
    ...props
}) => {
    const variants = {
        primary: 'bg-brand-primary text-white',
        secondary: 'bg-industrial-metal text-white border-industrial-highlight',
        danger: 'bg-brand-danger text-white',
        warning: 'bg-brand-hazard text-black',
    };

    const sizes = {
        sm: 'px-3 py-2 text-xs',
        md: 'px-6 py-3 text-sm',
        lg: 'px-8 py-4 text-base',
    };

    return (
        <button
            className={cn(
                'btn-retro relative overflow-hidden',
                variants[variant],
                sizes[size],
                className
            )}
            {...props}
        >
            {/* Scanline overlay for tech feel */}
            <div className="absolute inset-0 bg-black/10 pointer-events-none"
                style={{ backgroundSize: '100% 2px', backgroundImage: 'linear-gradient(transparent 50%, rgba(0,0,0,0.2) 50%)' }}
            />
            <span className="relative z-10 flex items-center justify-center gap-2">
                {children}
            </span>
        </button>
    );
};
