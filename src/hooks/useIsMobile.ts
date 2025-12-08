import { useState, useEffect } from 'react';

/**
 * Hook to detect if the user is on a mobile/tablet device that needs the mobile layout.
 * Returns true for:
 * - Phones in portrait mode (width < 768px)
 * - Tablets in portrait mode (touch devices in portrait)
 * Note: iPad landscape uses desktop layout with reduced viewport height
 */
export function useIsMobile(): boolean {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            const width = window.innerWidth;
            const height = window.innerHeight;
            const isPortrait = height > width;
            const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
            const isTabletUA = /iPad|Android(?!.*Mobile)/i.test(navigator.userAgent);

            // Phone in portrait
            const isPhonePortrait = width < 768 && isPortrait;

            // Tablet in portrait mode only - landscape uses desktop layout
            const isTabletPortrait = (isTabletUA || (hasTouch && width < 1400)) && isPortrait;

            setIsMobile(isPhonePortrait || isTabletPortrait);
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
