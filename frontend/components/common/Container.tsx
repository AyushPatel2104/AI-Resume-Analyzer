import type { CSSProperties, HTMLAttributes, ReactNode } from "react";

import { breakpoints } from "@/constants/breakpoints";
import { spacing, spacingAliases } from "@/constants/spacing";
import { cn } from "@/lib/utils";

export type ContainerWidth = "narrow" | "default" | "wide" | "full";

const containerMaxWidth: Record<ContainerWidth, CSSProperties["maxWidth"]> = {
  narrow: breakpoints.lg,
  default: breakpoints.xl,
  wide: breakpoints["2xl"],
  full: "100%",
};

export type ContainerProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  className?: string;
  width?: ContainerWidth;
};

/**
 * Responsive page container for constraining horizontal layout without coupling to a page.
 */
export function Container({
  children,
  className,
  width = "default",
  style,
  ...props
}: ContainerProps) {
  return (
    <div
      className={cn("mx-auto w-full", className)}
      style={{
        maxWidth: containerMaxWidth[width],
        paddingInline: spacingAliases.container,
        ...style,
      }}
      {...props}
    >
      <div
        style={{
          width: "100%",
          paddingInline: width === "full" ? spacing[0] : undefined,
        }}
      >
        {children}
      </div>
    </div>
  );
}
