/**
 * Z-index tokens for predictable stacking across application chrome and overlays.
 */
export const zIndex = {
  hide: -1,
  base: 0,
  content: 1,
  sticky: 100,
  fixed: 200,
  overlay: 400,
  popover: 500,
  toast: 600,
  modal: 700,
  commandPalette: 800,
  tooltip: 900,
} as const;

export type ZIndexToken = keyof typeof zIndex;
export type ZIndexValue = (typeof zIndex)[ZIndexToken];
