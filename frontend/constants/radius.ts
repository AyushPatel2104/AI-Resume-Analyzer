/**
 * Border radius tokens for surfaces, controls, and fully rounded affordances.
 */
export const radius = {
  none: "0rem",
  extraSmall: "0.125rem",
  small: "0.25rem",
  medium: "0.375rem",
  large: "0.5rem",
  extraLarge: "0.75rem",
  doubleExtraLarge: "1rem",
  full: "9999px",
} as const;

/**
 * Semantic radius aliases for consistent component treatment.
 */
export const radiusAliases = {
  control: radius.medium,
  card: radius.large,
  modal: radius.extraLarge,
  avatar: radius.full,
  pill: radius.full,
} as const;

export type RadiusToken = keyof typeof radius;
export type RadiusAlias = keyof typeof radiusAliases;
