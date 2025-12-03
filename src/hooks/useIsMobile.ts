import { useState, useEffect } from 'react';

/**
 * Hook to detect if the user is on a mobile phone in portrait orientation.
 * Returns true for phones (width < 768px) in portrait mode.
 * Tablets and desktops return false.
 */
export function useIsMobile(): boolean {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            // Check if it's a phone-sized screen in portrait
            // 768px is typical tablet breakpoint
            const isPhoneWidth = window.innerWidth < 768;
            const isPortrait = window.innerHeight > window.innerWidth;
            setIsMobile(isPhoneWidth && isPortrait);
        };

        // Check on mount
        checkMobile();

        // Listen for resize/orientation changes
        window.addEventListener('resize', checkMobile);
        window.addEventListener('orientationchange', checkMobile);

        return () => {
            window.removeEventListener('resize', checkMobile);
            window.removeEventListener('orientationchange', checkMobile);
        };
    }, []);

    return isMobile;
}

/**
 * Hook to detect if device is a phone (regardless of orientation)
 */
export function useIsPhone(): boolean {
    const [isPhone, setIsPhone] = useState(false);

    useEffect(() => {
        const checkPhone = () => {
            // Check for phone-like characteristics
            const isSmallScreen = Math.min(window.innerWidth, window.innerHeight) < 500;
            const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
            const isMobileUA = /iPhone|iPod|Android.*Mobile|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

            setIsPhone(isSmallScreen || (hasTouch && isMobileUA));
        };

        checkPhone();
        window.addEventListener('resize', checkPhone);

        return () => window.removeEventListener('resize', checkPhone);
    }, []);

    return isPhone;
}
