/**
 * Typography tokens — system-ui stack aligned with Geist / modern SaaS defaults.
 */
export const fontFamily = {
  sans: "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif",
  mono: "var(--font-geist-mono), ui-monospace, monospace",
} as const;

export const fontSize = {
  xs: "0.75rem",
  sm: "0.875rem",
  base: "1rem",
  lg: "1.125rem",
  xl: "1.25rem",
  "2xl": "1.5rem",
  "3xl": "1.875rem",
  "4xl": "2.25rem",
  "5xl": "3rem",
  "6xl": "3.75rem",
} as const;

export const lineHeight = {
  none: "1",
  tight: "1.25",
  snug: "1.375",
  normal: "1.5",
  relaxed: "1.625",
  loose: "2",
} as const;

export const fontWeight = {
  normal: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
} as const;

export const letterSpacing = {
  tighter: "-0.05em",
  tight: "-0.025em",
  normal: "0em",
  wide: "0.025em",
  wider: "0.05em",
} as const;

/** Pre-composed text styles for headings and body copy. */
export const textStyles = {
  display: {
    fontSize: fontSize["5xl"],
    lineHeight: lineHeight.tight,
    fontWeight: fontWeight.semibold,
    letterSpacing: letterSpacing.tight,
  },
  h1: {
    fontSize: fontSize["4xl"],
    lineHeight: lineHeight.tight,
    fontWeight: fontWeight.semibold,
    letterSpacing: letterSpacing.tight,
  },
  h2: {
    fontSize: fontSize["3xl"],
    lineHeight: lineHeight.tight,
    fontWeight: fontWeight.semibold,
    letterSpacing: letterSpacing.tight,
  },
  h3: {
    fontSize: fontSize["2xl"],
    lineHeight: lineHeight.snug,
    fontWeight: fontWeight.semibold,
    letterSpacing: letterSpacing.normal,
  },
  body: {
    fontSize: fontSize.base,
    lineHeight: lineHeight.normal,
    fontWeight: fontWeight.normal,
    letterSpacing: letterSpacing.normal,
  },
  bodySmall: {
    fontSize: fontSize.sm,
    lineHeight: lineHeight.normal,
    fontWeight: fontWeight.normal,
    letterSpacing: letterSpacing.normal,
  },
  caption: {
    fontSize: fontSize.xs,
    lineHeight: lineHeight.normal,
    fontWeight: fontWeight.normal,
    letterSpacing: letterSpacing.wide,
  },
  label: {
    fontSize: fontSize.sm,
    lineHeight: lineHeight.none,
    fontWeight: fontWeight.medium,
    letterSpacing: letterSpacing.normal,
  },
} as const;

export type FontSize = keyof typeof fontSize;
export type TextStyle = keyof typeof textStyles;
