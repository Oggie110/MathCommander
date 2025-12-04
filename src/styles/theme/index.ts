import { colors } from "../tokens/colors";
import {
  borderRadius,
  borderWidths,
  crtEffects,
  glows,
  patterns,
  shadows,
  textGlows,
  transitions,
} from "../tokens/effects";
import { fontFamilies as rawFontFamilies, fontWeights, typography } from "../tokens/typography";

type NestedToken = Record<string, string | NestedToken>;

type TailwindExtend = {
  colors: Record<string, unknown>;
  fontFamily: Record<string, (string | string[])[]>;
  borderWidth: Record<string, string>;
  borderRadius: Record<string, string>;
  boxShadow: Record<string, string>;
  dropShadow: Record<string, string>;
  backgroundImage: Record<string, string>;
  animation: Record<string, string>;
  keyframes: Record<string, Record<string, Record<string, string>>>;
  transitionDuration: Record<string, string>;
};

const fontFamilies = {
  pixel: rawFontFamilies.pixel,
  tech: '"Rajdhani", sans-serif',
};

export const designTokens = {
  colors,
  typography,
  fontFamilies,
  fontWeights,
  effects: {
    borderWidths,
    borderRadius,
    shadows,
    glows,
    textGlows,
    crtEffects,
    patterns,
    transitions,
  },
};

function flattenTokens(tokens: NestedToken, prefix: string, vars: Record<string, string>) {
  Object.entries(tokens).forEach(([key, value]) => {
    const varName = `${prefix}-${key}`;
    if (typeof value === "string") {
      vars[varName] = value;
    } else {
      flattenTokens(value, varName, vars);
    }
  });
}

export function buildCssVariableMap(): Record<string, string> {
  const vars: Record<string, string> = {};

  flattenTokens(colors as NestedToken, "--color", vars);
  flattenTokens(fontFamilies as NestedToken, "--font", vars);
  flattenTokens(borderRadius as NestedToken, "--radius", vars);
  flattenTokens(borderWidths as NestedToken, "--border", vars);
  flattenTokens(shadows as NestedToken, "--shadow", vars);
  flattenTokens(glows as NestedToken, "--glow", vars);
  flattenTokens(textGlows as NestedToken, "--text-glow", vars);

  return vars;
}

export function createTailwindExtend(): TailwindExtend {
  return {
    colors: {
      space: colors.space,
      industrial: colors.industrial,
      brand: colors.brand,
      text: colors.text,
      ui: {
        highlight: "#FFFFFF",
        shadow: "#000000",
      },
    },
    fontFamily: {
      pixel: [fontFamilies.pixel],
      tech: [fontFamilies.tech],
    },
    borderWidth: {
      thin: borderWidths.thin,
      default: borderWidths.default,
      thick: borderWidths.thick,
      heavy: borderWidths.heavy,
    },
    borderRadius: {
      sm: borderRadius.sm,
      md: borderRadius.md,
      lg: borderRadius.lg,
      xl: borderRadius.xl,
    },
    boxShadow: {
      "panel-inset": shadows.panel.inset,
      "panel-outer": shadows.panel.outer,
      button: shadows.button.default,
      "button-pressed": shadows.button.pressed,
      "crt-outer": shadows.crt.outer,
      "crt-inner": shadows.crt.inner,
      "glow-green-soft": glows.green.soft,
      "glow-green": glows.green.medium,
      "glow-green-strong": glows.green.strong,
      "glow-red-soft": glows.red.soft,
      "glow-red": glows.red.medium,
      "glow-red-strong": glows.red.strong,
      "glow-yellow-soft": glows.yellow.soft,
      "glow-yellow": glows.yellow.medium,
      "glow-yellow-strong": glows.yellow.strong,
      "glow-cyan-soft": glows.cyan.soft,
      "glow-cyan": glows.cyan.medium,
      "glow-cyan-strong": glows.cyan.strong,
      "glow-blue-soft": glows.blue.soft,
      "glow-blue": glows.blue.medium,
      "glow-blue-strong": glows.blue.strong,
    },
    dropShadow: {
      "text-green-soft": textGlows.green.soft,
      "text-green": textGlows.green.medium,
      "text-green-strong": textGlows.green.strong,
      "text-red-soft": textGlows.red.soft,
      "text-red": textGlows.red.medium,
      "text-red-strong": textGlows.red.strong,
      "text-yellow-soft": textGlows.yellow.soft,
      "text-yellow": textGlows.yellow.medium,
      "text-yellow-strong": textGlows.yellow.strong,
      "text-cyan-soft": textGlows.cyan.soft,
      "text-cyan": textGlows.cyan.medium,
      "text-cyan-strong": textGlows.cyan.strong,
      "solid-red": textGlows.solid.red,
      "solid-blue": textGlows.solid.blue,
      "solid-black": textGlows.solid.black,
    },
    backgroundImage: {
      hazard: patterns.hazard,
    },
    animation: {
      "pulse-fast": "pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      float: "float 3s ease-in-out infinite",
      slideDown: "slideDown 1s ease-out forwards",
      slideInFromRight: "slideInFromRight 1s ease-out forwards",
      hover: "hover 2s ease-in-out infinite",
      shake: "shake 0.3s ease-in-out",
      slideOut: "slideOut 2s ease-in forwards",
      flyOutRight: "flyOutRight 1.2s ease-in forwards",
      fadeIn: "fadeIn 0.3s ease-out",
      parallaxMedium: "parallaxStars4096 40s linear infinite",
      parallaxFast: "parallaxStars4096 20s linear infinite",
      starPop: "starPop 0.4s ease-out",
      xpBounce: "xpBounce 0.8s ease-out forwards",
    },
    keyframes: {
      float: {
        "0%, 100%": { transform: "translateY(0)" },
        "50%": { transform: "translateY(-5px)" },
      },
      slideDown: {
        "0%": { transform: "translateY(-100vh)", opacity: "0" },
        "100%": { transform: "translateY(0)", opacity: "1" },
      },
      slideInFromRight: {
        "0%": { transform: "translateX(100vw)", opacity: "0" },
        "100%": { transform: "translateX(0)", opacity: "1" },
      },
      hover: {
        "0%, 100%": { transform: "translateY(0px)" },
        "50%": { transform: "translateY(-10px)" },
      },
      shake: {
        "0%, 100%": { transform: "translateX(0)" },
        "25%": { transform: "translateX(-5px)" },
        "75%": { transform: "translateX(5px)" },
      },
      slideOut: {
        "0%": { transform: "translateX(0)", opacity: "1" },
        "100%": { transform: "translateX(100vw)", opacity: "0" },
      },
      flyOutRight: {
        "0%": { transform: "translateX(0) translateY(0)", opacity: "1" },
        "100%": { transform: "translateX(100vw) translateY(-50vh)", opacity: "0" },
      },
      fadeIn: {
        "0%": { opacity: "0" },
        "100%": { opacity: "1" },
      },
      parallaxStars4096: {
        "0%": { backgroundPosition: "0 0" },
        "100%": { backgroundPosition: "-4096px 0" },
      },
      starPop: {
        "0%": { transform: "scale(0)", opacity: "0" },
        "50%": { transform: "scale(1.3)" },
        "100%": { transform: "scale(1)", opacity: "1" },
      },
      xpBounce: {
        "0%": { transform: "scale(0)", opacity: "0" },
        "20%": { transform: "scale(2)", opacity: "1" },
        "40%": { transform: "scale(1.6)" },
        "60%": { transform: "scale(1.8)" },
        "80%": { transform: "scale(0.9)" },
        "100%": { transform: "scale(1)" },
      },
    },
    transitionDuration: {
      2000: "2000ms",
      4000: "4000ms",
    },
  };
}
