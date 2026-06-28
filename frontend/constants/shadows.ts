/**
 * Elevation tokens for layered UI, ordered from subtle separation to overlay emphasis.
 */
export const shadows = {
  none: "none",
  extraSmall: "0 1px 2px 0 rgb(9 9 11 / 0.05)",
  small: "0 1px 3px 0 rgb(9 9 11 / 0.1), 0 1px 2px -1px rgb(9 9 11 / 0.1)",
  medium: "0 4px 6px -1px rgb(9 9 11 / 0.1), 0 2px 4px -2px rgb(9 9 11 / 0.1)",
  large: "0 10px 15px -3px rgb(9 9 11 / 0.1), 0 4px 6px -4px rgb(9 9 11 / 0.1)",
  extraLarge: "0 20px 25px -5px rgb(9 9 11 / 0.1), 0 8px 10px -6px rgb(9 9 11 / 0.1)",
  focus: "0 0 0 3px rgb(99 91 255 / 0.24)",
} as const;

/**
 * Semantic elevation aliases for common interface layers.
 */
export const elevation = {
  base: shadows.none,
  raised: shadows.small,
  floating: shadows.medium,
  popover: shadows.large,
  modal: shadows.extraLarge,
  focusRing: shadows.focus,
} as const;

export type ShadowToken = keyof typeof shadows;
export type ElevationToken = keyof typeof elevation;
