import type { Config } from "tailwindcss";

export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                space: {
                    black: '#050510', // Deepest space background
                    dark: '#0B0B1E',  // Panel background
                    light: '#1A1A35', // Lighter panel/hover
                },
                industrial: {
                    dark: '#181825',  // Dark metal
                    metal: '#4A4A5A', // Base metal
                    blue: '#2A2A40',  // Blue-tinted metal
                    highlight: '#6E6E80', // Metal highlight
                },
                brand: {
                    primary: '#2563EB', // Bright Blue (Buttons)
                    secondary: '#00F0FF', // Cyan (Holograms/UI)
                    accent: '#FFE500', // Yellow (Stars/XP)
                    hazard: '#E5C000', // Hazard stripes
                    danger: '#FF2A2A', // Red (Enemies/Alerts)
                    success: '#00FF9D', // Green (Success)
                },
                ui: {
                    highlight: '#FFFFFF', // Bevel Highlight
                    shadow: '#000000',    // Bevel Shadow
                }
            },
            fontFamily: {
                pixel: ['"Press Start 2P"', 'cursive'],
                tech: ['"Rajdhani"', 'sans-serif'],
            },
            animation: {
                'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'float': 'float 3s ease-in-out infinite',
                'slideDown': 'slideDown 1s ease-out forwards',
                'slideInFromRight': 'slideInFromRight 1s ease-out forwards',
                'hover': 'hover 2s ease-in-out infinite',
                'shake': 'shake 0.3s ease-in-out',
                'slideOut': 'slideOut 2s ease-in forwards',
                'flyOutRight': 'flyOutRight 1.2s ease-in forwards',
                'fadeIn': 'fadeIn 0.3s ease-out',
                'parallaxMedium': 'parallaxStars4096 40s linear infinite',
                'parallaxFast': 'parallaxStars4096 20s linear infinite',
            },
            keyframes: {
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-5px)' },
                },
                slideDown: {
                    '0%': { transform: 'translateY(-100vh)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                slideInFromRight: {
                    '0%': { transform: 'translateX(100vw)', opacity: '0' },
                    '100%': { transform: 'translateX(0)', opacity: '1' },
                },
                hover: {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '50%': { transform: 'translateY(-10px)' },
                },
                shake: {
                    '0%, 100%': { transform: 'translateX(0)' },
                    '25%': { transform: 'translateX(-5px)' },
                    '75%': { transform: 'translateX(5px)' },
                },
                slideOut: {
                    '0%': { transform: 'translateX(0)', opacity: '1' },
                    '100%': { transform: 'translateX(100vw)', opacity: '0' },
                },
                flyOutRight: {
                    '0%': { transform: 'translateX(0) translateY(0)', opacity: '1' },
                    '100%': { transform: 'translateX(100vw) translateY(-50vh)', opacity: '0' },
                },
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                parallaxStars4096: {
                    '0%': { backgroundPosition: '0 0' },
                    '100%': { backgroundPosition: '-4096px 0' },
                },
            }
        },
    },
    plugins: [],
} satisfies Config;
