import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HeaderProps {
    /** Where to navigate when back button is clicked. If not provided, uses navigate(-1) */
    backTo?: string;
    /** Custom back button label. Defaults to "BACK" */
    backLabel?: string;
    /** Content to display on the right side of the header */
    rightContent?: React.ReactNode;
    /** Centered title text (optional) */
    title?: string;
    /** Additional className for the header container */
    className?: string;
    /** Whether to show the back button. Defaults to true */
    showBackButton?: boolean;
    /** Custom onClick handler for back button (overrides backTo) */
    onBackClick?: () => void;
    /** Whether this is a fixed header (adds safe area padding) */
    fixed?: boolean;
    /** Left label text (no arrow, just styled text in the same position as back button) */
    leftLabel?: string;
    /** Click handler for left label */
    onLeftLabelClick?: () => void;
}

/**
 * Reusable header component for all screens.
 *
 * Consistent styling:
 * - Gradient background fading from black/80 to transparent
 * - Back button with border styling
 * - Optional centered title
 * - Optional right content slot
 * - iOS safe area support when fixed
 *
 * @example
 * // Simple back navigation
 * <Header backTo="/map" />
 *
 * // With centered title
 * <Header backTo="/homebase" title="Mission Map" />
 *
 * // With right content
 * <Header backTo="/map" rightContent={<StarsDisplay />} />
 *
 * // Fixed with safe area
 * <Header backTo="/homebase" title="Mission Map" fixed />
 */
export const Header: React.FC<HeaderProps> = ({
    backTo,
    backLabel = 'BACK',
    rightContent,
    title,
    className,
    showBackButton = true,
    onBackClick,
    fixed = false,
    leftLabel,
    onLeftLabelClick,
}) => {
    const navigate = useNavigate();

    const handleBackClick = () => {
        if (onBackClick) {
            onBackClick();
        } else if (backTo) {
            navigate(backTo);
        } else {
            navigate(-1);
        }
    };

    const fixedClasses = fixed ? 'fixed top-0 left-0 right-0 z-50' : 'flex-shrink-0';
    const fixedStyle = fixed ? { paddingTop: 'calc(var(--safe-area-top, 0px) + 0.5rem)' } : undefined;

    return (
        <div
            className={cn(
                fixedClasses,
                'flex items-center justify-between px-4 py-3',
                'bg-gradient-to-b from-black/80 to-transparent',
                className
            )}
            style={fixedStyle}
        >
            {/* Left: Back button or left label */}
            {showBackButton ? (
                <button
                    onClick={handleBackClick}
                    className="flex items-center gap-1 px-3 py-2 text-xs text-white/80 active:text-white bg-gray-900/50 border-2 border-gray-700 rounded font-pixel"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>{backLabel}</span>
                </button>
            ) : leftLabel ? (
                <button
                    onClick={onLeftLabelClick}
                    className="flex items-center px-3 py-2 text-xs text-white/80 active:text-white bg-gray-900/50 border-2 border-gray-700 rounded font-pixel"
                >
                    <span>{leftLabel}</span>
                </button>
            ) : (
                <div className="w-20" />
            )}

            {/* Center: Optional title */}
            {title && (
                <div className="flex-1 text-center text-xs text-white/80 uppercase tracking-wider font-pixel">
                    {title}
                </div>
            )}

            {/* Right: Optional content or spacer */}
            {rightContent ? (
                <div className="flex items-center">
                    {rightContent}
                </div>
            ) : (
                title ? <div className="w-20" /> : null
            )}
        </div>
    );
};
