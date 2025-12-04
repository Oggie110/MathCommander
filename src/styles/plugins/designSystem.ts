import plugin from "tailwindcss/plugin";
import { buildCssVariableMap, createTailwindExtend, designTokens } from "../theme";

const typographyClasses = {
  ".text-display": {
    fontFamily: designTokens.fontFamilies.pixel,
    fontSize: "3.75rem",
    fontWeight: "700",
    lineHeight: "1",
    letterSpacing: "0.025em",
  },
  ".text-title": {
    fontFamily: designTokens.fontFamilies.pixel,
    fontSize: "1.5rem",
    fontWeight: "700",
    lineHeight: "1.1",
    letterSpacing: "0.05em",
    "@screen md": {
      fontSize: "2.25rem",
    },
  },
  ".text-heading": {
    fontFamily: designTokens.fontFamilies.pixel,
    fontSize: "1.25rem",
    fontWeight: "700",
    lineHeight: "1.2",
    letterSpacing: "0.05em",
    "@screen md": {
      fontSize: "1.5rem",
    },
  },
  ".text-subheading": {
    fontFamily: designTokens.fontFamilies.tech,
    fontSize: "1.125rem",
    fontWeight: "700",
    lineHeight: "1.3",
    letterSpacing: "0.1em",
    textTransform: "uppercase",
  },
  ".text-body": {
    fontFamily: designTokens.fontFamilies.tech,
    fontSize: "0.875rem",
    fontWeight: "400",
    lineHeight: "1.5",
    letterSpacing: "0.025em",
  },
  ".text-body-lg": {
    fontFamily: designTokens.fontFamilies.tech,
    fontSize: "1rem",
    fontWeight: "400",
    lineHeight: "1.6",
    letterSpacing: "0.025em",
  },
  ".text-label": {
    fontFamily: designTokens.fontFamilies.tech,
    fontSize: "0.75rem",
    fontWeight: "700",
    lineHeight: "1.4",
    letterSpacing: "0.1em",
    textTransform: "uppercase",
  },
  ".text-caption": {
    fontFamily: designTokens.fontFamilies.tech,
    fontSize: "0.625rem",
    fontWeight: "400",
    lineHeight: "1.4",
    letterSpacing: "0.05em",
  },
  ".text-micro": {
    fontFamily: designTokens.fontFamilies.tech,
    fontSize: "0.6875rem",
    fontWeight: "700",
    lineHeight: "1.3",
    letterSpacing: "0.1em",
    textTransform: "uppercase",
  },
  ".text-mono": {
    fontFamily: designTokens.fontFamilies.pixel,
    fontSize: "1.25rem",
    fontWeight: "700",
    lineHeight: "1.2",
  },
  ".text-dialogue": {
    fontFamily: designTokens.fontFamilies.pixel,
    fontSize: "0.75rem",
    fontWeight: "400",
    lineHeight: "1.5",
    "@screen md": {
      fontSize: "0.875rem",
    },
  },
  ".text-speaker": {
    fontFamily: designTokens.fontFamilies.pixel,
    fontSize: "0.625rem",
    fontWeight: "700",
    lineHeight: "1",
    letterSpacing: "0.1em",
    textTransform: "uppercase",
  },
};

const utilityComponents = {
  ".pixel-border": {
    boxShadow:
      "-4px 0 0 0 white, 4px 0 0 0 white, 0 -4px 0 0 white, 0 4px 0 0 white",
    margin: "4px",
  },
  ".panel-industrial": {
    backgroundColor: designTokens.colors.industrial.dark,
    borderWidth: designTokens.effects.borderWidths.thick,
    borderColor: designTokens.colors.industrial.metal,
    borderStyle: "solid",
    position: "relative",
    boxShadow: `${designTokens.effects.shadows.panel.inset}, ${designTokens.effects.shadows.panel.outer}`,
  },
  ".bg-hazard": {
    backgroundImage: designTokens.effects.patterns.hazard,
  },
  ".btn-retro": {
    fontFamily: designTokens.fontFamilies.pixel,
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    transition: designTokens.effects.transitions.transform,
    transform: "translateZ(0)",
    boxShadow: designTokens.effects.shadows.button.default,
    border: `${designTokens.effects.borderWidths.thick} solid ${designTokens.colors.ui.shadow}`,
    "&:hover": {
      filter: "brightness(1.1)",
    },
    "&:active": {
      transform: "scale(0.95)",
      boxShadow: designTokens.effects.shadows.button.pressed,
    },
  },
};

export default plugin(function ({ addBase, addComponents }) {
  addBase({
    ":root": buildCssVariableMap(),
    body: {
      fontFamily: designTokens.fontFamilies.pixel,
      backgroundColor: designTokens.colors.space.black,
      color: designTokens.colors.text.primary,
      imageRendering: "pixelated",
    },
    "h1, h2, h3, h4, h5, h6": {
      fontFamily: designTokens.fontFamilies.pixel,
    },
  });

  addComponents({
    ...typographyClasses,
    ...utilityComponents,
  });
});

export const tailwindExtend = createTailwindExtend();
