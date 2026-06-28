/**
 * Core color tokens — neutral-first palette with a single brand accent.
 * Optimized for light UI; pair with CSS variables in globals.css for theming.
 */
export const colors = {
  neutral: {
    0: "#FFFFFF",
    50: "#FAFAFA",
    100: "#F4F4F5",
    200: "#E4E4E7",
    300: "#D4D4D8",
    400: "#A1A1AA",
    500: "#71717A",
    600: "#52525B",
    700: "#3F3F46",
    800: "#27272A",
    900: "#18181B",
    950: "#09090B",
  },
  brand: {
    DEFAULT: "#18181B",
    foreground: "#FAFAFA",
    accent: "#635BFF",
    accentForeground: "#FFFFFF",
    accentMuted: "#EEF2FF",
  },
  semantic: {
    success: "#16A34A",
    successMuted: "#DCFCE7",
    warning: "#D97706",
    warningMuted: "#FEF3C7",
    error: "#DC2626",
    errorMuted: "#FEE2E2",
    info: "#2563EB",
    infoMuted: "#DBEAFE",
  },
  surface: {
    background: "#FFFFFF",
    backgroundSubtle: "#FAFAFA",
    foreground: "#09090B",
    foregroundMuted: "#71717A",
    foregroundSubtle: "#A1A1AA",
    border: "#E4E4E7",
    borderStrong: "#D4D4D8",
    card: "#FFFFFF",
    overlay: "rgba(9, 9, 11, 0.6)",
  },
} as const;

export type Colors = typeof colors;
export type NeutralShade = keyof typeof colors.neutral;
export type SemanticColor = keyof typeof colors.semantic;
