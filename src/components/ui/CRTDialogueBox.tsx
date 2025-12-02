import React from 'react';
import { cn } from '@/lib/utils';

interface CRTDialogueBoxProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'green' | 'red' | 'yellow';
}

export const CRTDialogueBox: React.FC<CRTDialogueBoxProps> = ({
    className,
    variant = 'green',
    children,
    ...props
}) => {
    const screenColors = {
        green: {
            background: 'linear-gradient(135deg, #001a00 0%, #000d00 50%, #001400 100%)',
            glow: 'inset 0 0 40px rgba(0,255,0,0.15)',
        },
        red: {
            background: 'linear-gradient(135deg, #1a0000 0%, #0d0000 50%, #140000 100%)',
            glow: 'inset 0 0 40px rgba(255,0,0,0.15)',
        },
        yellow: {
            background: 'linear-gradient(135deg, #1a1a00 0%, #0d0d00 50%, #141400 100%)',
            glow: 'inset 0 0 40px rgba(255,200,0,0.15)',
        },
    };

    const colors = screenColors[variant];

    return (
        <div
            className={cn('relative', className)}
            style={{
                background: 'linear-gradient(180deg, #6a6a7a 0%, #4a4a5a 20%, #3a3a4a 80%, #4a4a5a 100%)',
                padding: '12px',
                borderRadius: '8px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.15)',
            }}
            {...props}
        >
            {/* Inner bezel */}
            <div
                style={{
                    background: 'linear-gradient(180deg, #1a1a2a 0%, #0a0a15 100%)',
                    border: '3px solid #0a0a10',
                    borderRadius: '4px',
                    padding: '3px',
                }}
            >
                {/* Screen area */}
                <div
                    className="relative overflow-hidden"
                    style={{
                        background: colors.background,
                        borderRadius: '2px',
                    }}
                >
                    {/* CRT Scanline effect */}
                    <div
                        className="absolute inset-0 pointer-events-none z-10"
                        style={{
                            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(0,0,0,0.4) 1px, rgba(0,0,0,0.4) 2px)',
                            opacity: 0.6,
                        }}
                    />
                    {/* Screen phosphor glow */}
                    <div
                        className="absolute inset-0 rounded pointer-events-none"
                        style={{ boxShadow: colors.glow }}
                    />

                    {/* Content */}
                    <div className="relative z-0 p-6">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
};
