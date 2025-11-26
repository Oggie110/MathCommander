import React from 'react';
import { cn } from '@/lib/utils';
import { useSFX } from '@/audio';

interface PixelButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'success';
    silent?: boolean;
}

export const PixelButton: React.FC<PixelButtonProps> = ({
    className,
    variant = 'primary',
    children,
    silent = false,
    onClick,
    ...props
}) => {
    const { play } = useSFX();

    const variants = {
        primary: 'bg-blue-600 hover:bg-blue-500 text-white',
        secondary: 'bg-gray-600 hover:bg-gray-500 text-white',
        danger: 'bg-red-600 hover:bg-red-500 text-white',
        success: 'bg-green-600 hover:bg-green-500 text-white',
    };

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        if (!silent) {
            play('buttonClick');
        }
        onClick?.(e);
    };

    return (
        <button
            className={cn(
                'pixel-btn relative font-pixel text-sm md:text-base tracking-wider',
                variants[variant],
                className
            )}
            onClick={handleClick}
            {...props}
        >
            {children}
        </button>
    );
};
