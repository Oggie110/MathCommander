import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";
import { colors } from "./src/styles/tokens/colors";
import { typography, fontFamilies } from "./src/styles/tokens/typography";
import { glows, textGlows, shadows, borderWidths, borderRadius } from "./src/styles/tokens/effects";

export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            // Colors from tokens
            colors: {
                space: colors.space,
                industrial: colors.industrial,
                brand: colors.brand,
                ui: {
                    highlight: '#FFFFFF',
                    shadow: '#000000',
                }
            },

            // Font families
            fontFamily: {
                pixel: ['"Press Start 2P"', 'cursive'],
                tech: ['"Rajdhani"', 'sans-serif'],
            },

            // Border widths from tokens
            borderWidth: {
                'thin': borderWidths.thin,
                'default': borderWidths.default,
                'thick': borderWidths.thick,
                'heavy': borderWidths.heavy,
            },

            // Border radius from tokens
            borderRadius: {
                'sm': borderRadius.sm,
                'md': borderRadius.md,
                'lg': borderRadius.lg,
                'xl': borderRadius.xl,
            },

            // Box shadows including glows
            boxShadow: {
                // Panel shadows
                'panel-inset': shadows.panel.inset,
                'panel-outer': shadows.panel.outer,
                'button': shadows.button.default,
                'button-pressed': shadows.button.pressed,
                'crt-outer': shadows.crt.outer,
                'crt-inner': shadows.crt.inner,
                // Glows
                'glow-green-soft': glows.green.soft,
                'glow-green': glows.green.medium,
                'glow-green-strong': glows.green.strong,
                'glow-red-soft': glows.red.soft,
                'glow-red': glows.red.medium,
                'glow-red-strong': glows.red.strong,
                'glow-yellow-soft': glows.yellow.soft,
                'glow-yellow': glows.yellow.medium,
                'glow-yellow-strong': glows.yellow.strong,
                'glow-cyan-soft': glows.cyan.soft,
                'glow-cyan': glows.cyan.medium,
                'glow-cyan-strong': glows.cyan.strong,
                'glow-blue-soft': glows.blue.soft,
                'glow-blue': glows.blue.medium,
                'glow-blue-strong': glows.blue.strong,
            },

            // Drop shadows for text glows
            dropShadow: {
                'text-green-soft': '0 0 4px rgba(74, 222, 128, 0.4)',
                'text-green': '0 0 6px rgba(74, 222, 128, 0.6)',
                'text-green-strong': '0 0 8px rgba(74, 222, 128, 0.8)',
                'text-red-soft': '0 0 4px rgba(248, 113, 113, 0.4)',
                'text-red': '0 0 6px rgba(248, 113, 113, 0.6)',
                'text-red-strong': '0 0 8px rgba(248, 113, 113, 0.8)',
                'text-yellow-soft': '0 0 4px rgba(250, 204, 21, 0.4)',
                'text-yellow': '0 0 6px rgba(250, 204, 21, 0.6)',
                'text-yellow-strong': '0 0 8px rgba(250, 204, 21, 0.8)',
                'text-cyan-soft': '0 0 4px rgba(34, 211, 238, 0.4)',
                'text-cyan': '0 0 6px rgba(34, 211, 238, 0.6)',
                'text-cyan-strong': '0 0 8px rgba(34, 211, 238, 0.8)',
                // Solid shadows for titles
                'solid-red': '4px 4px 0 rgba(255, 42, 42, 1)',
                'solid-blue': '4px 4px 0 rgba(37, 99, 235, 1)',
                'solid-black': '2px 2px 0 rgba(0, 0, 0, 1)',
            },

            // Animations
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
                'starPop': 'starPop 0.4s ease-out',
                'xpBounce': 'xpBounce 0.8s ease-out forwards',
            },

            transitionDuration: {
                '2000': '2000ms',
                '4000': '4000ms',
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
                starPop: {
                    '0%': { transform: 'scale(0)', opacity: '0' },
                    '50%': { transform: 'scale(1.3)' },
                    '100%': { transform: 'scale(1)', opacity: '1' },
                },
                xpBounce: {
                    '0%': { transform: 'scale(0)', opacity: '0' },
                    '20%': { transform: 'scale(2)', opacity: '1' },
                    '40%': { transform: 'scale(1.6)' },
                    '60%': { transform: 'scale(1.8)' },
                    '80%': { transform: 'scale(0.9)' },
                    '100%': { transform: 'scale(1)' },
                },
            }
        },
    },
    plugins: [
        // Custom plugin for semantic typography classes
        plugin(function({ addComponents }) {
            addComponents({
                // === SEMANTIC TYPOGRAPHY CLASSES ===

                // Display - Large scores (60px)
                '.text-display': {
                    fontFamily: fontFamilies.pixel,
                    fontSize: '3.75rem',
                    fontWeight: '700',
                    lineHeight: '1',
                    letterSpacing: '0.025em',
                },

                // Title - Screen titles (36px desktop, 24px mobile)
                '.text-title': {
                    fontFamily: fontFamilies.pixel,
                    fontSize: '1.5rem',
                    fontWeight: '700',
                    lineHeight: '1.1',
                    letterSpacing: '0.05em',
                    '@screen md': {
                        fontSize: '2.25rem',
                    },
                },

                // Heading - Section heads (24px desktop, 20px mobile)
                '.text-heading': {
                    fontFamily: fontFamilies.pixel,
                    fontSize: '1.25rem',
                    fontWeight: '700',
                    lineHeight: '1.2',
                    letterSpacing: '0.05em',
                    '@screen md': {
                        fontSize: '1.5rem',
                    },
                },

                // Subheading - Minor heads (18px)
                '.text-subheading': {
                    fontFamily: fontFamilies.tech,
                    fontSize: '1.125rem',
                    fontWeight: '700',
                    lineHeight: '1.3',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                },

                // Body - Main text (14px)
                '.text-body': {
                    fontFamily: fontFamilies.tech,
                    fontSize: '0.875rem',
                    fontWeight: '400',
                    lineHeight: '1.5',
                    letterSpacing: '0.025em',
                },

                // Body Large - Dialogue, important text (16px)
                '.text-body-lg': {
                    fontFamily: fontFamilies.tech,
                    fontSize: '1rem',
                    fontWeight: '400',
                    lineHeight: '1.6',
                    letterSpacing: '0.025em',
                },

                // Label - Form labels, stat labels (12px)
                '.text-label': {
                    fontFamily: fontFamilies.tech,
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    lineHeight: '1.4',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                },

                // Caption - Helper text (10px)
                '.text-caption': {
                    fontFamily: fontFamilies.tech,
                    fontSize: '0.625rem',
                    fontWeight: '400',
                    lineHeight: '1.4',
                    letterSpacing: '0.05em',
                },

                // Micro - Tiny labels (11px)
                '.text-micro': {
                    fontFamily: fontFamilies.tech,
                    fontSize: '0.6875rem',
                    fontWeight: '700',
                    lineHeight: '1.3',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                },

                // Mono - Numbers, equations (20px)
                '.text-mono': {
                    fontFamily: fontFamilies.pixel,
                    fontSize: '1.25rem',
                    fontWeight: '700',
                    lineHeight: '1.2',
                },

                // Dialogue - Character speech
                '.text-dialogue': {
                    fontFamily: fontFamilies.pixel,
                    fontSize: '0.75rem',
                    fontWeight: '400',
                    lineHeight: '1.5',
                    '@screen md': {
                        fontSize: '0.875rem',
                    },
                },

                // Speaker - "[COMMANDER]" labels
                '.text-speaker': {
                    fontFamily: fontFamilies.pixel,
                    fontSize: '0.625rem',
                    fontWeight: '700',
                    lineHeight: '1',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                },
            });
        }),
    ],
} satisfies Config;
