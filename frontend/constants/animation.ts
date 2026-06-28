/**
 * Duration tokens for interaction feedback and layout transitions.
 */
export const duration = {
  instant: "0ms",
  fast: "120ms",
  base: "180ms",
  moderate: "240ms",
  slow: "320ms",
  deliberate: "500ms",
} as const;

/**
 * Easing tokens tuned for responsive enterprise interfaces.
 */
export const easing = {
  linear: "linear",
  standard: "cubic-bezier(0.2, 0, 0, 1)",
  entrance: "cubic-bezier(0, 0, 0.2, 1)",
  exit: "cubic-bezier(0.4, 0, 1, 1)",
  emphasized: "cubic-bezier(0.2, 0, 0, 1)",
} as const;

/**
 * Pre-composed transition tokens for common interaction patterns.
 */
export const transition = {
  control: `${duration.fast} ${easing.standard}`,
  surface: `${duration.base} ${easing.standard}`,
  overlayEnter: `${duration.moderate} ${easing.entrance}`,
  overlayExit: `${duration.fast} ${easing.exit}`,
  layout: `${duration.slow} ${easing.emphasized}`,
} as const;

export type DurationToken = keyof typeof duration;
export type EasingToken = keyof typeof easing;
export type TransitionToken = keyof typeof transition;
