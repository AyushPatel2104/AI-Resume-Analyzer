/**
 * Responsive breakpoints — mobile-first, aligned with Tailwind defaults.
 */
export const breakpoints = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
} as const;

export const breakpointsPx = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const;

/** Min-width media query helpers for use in CSS-in-JS or styled components. */
export const mediaQueries = {
  sm: `(min-width: ${breakpoints.sm})`,
  md: `(min-width: ${breakpoints.md})`,
  lg: `(min-width: ${breakpoints.lg})`,
  xl: `(min-width: ${breakpoints.xl})`,
  "2xl": `(min-width: ${breakpoints["2xl"]})`,
} as const;

/** Max-width helpers for mobile-only overrides. */
export const mediaQueriesMax = {
  sm: `(max-width: ${breakpointsPx.sm - 1}px)`,
  md: `(max-width: ${breakpointsPx.md - 1}px)`,
  lg: `(max-width: ${breakpointsPx.lg - 1}px)`,
  xl: `(max-width: ${breakpointsPx.xl - 1}px)`,
  "2xl": `(max-width: ${breakpointsPx["2xl"] - 1}px)`,
} as const;

export type Breakpoint = keyof typeof breakpoints;
