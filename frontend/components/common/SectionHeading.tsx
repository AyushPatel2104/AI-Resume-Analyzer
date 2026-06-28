import type { CSSProperties, HTMLAttributes, ReactNode } from "react";

import { colors } from "@/constants/colors";
import { spacing } from "@/constants/spacing";
import { textStyles } from "@/constants/typography";
import { cn } from "@/lib/utils";

export type SectionHeadingProps = HTMLAttributes<HTMLDivElement> & {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  centered?: boolean;
  className?: string;
};

const headingStyle: CSSProperties = {
  color: colors.surface.foreground,
  fontSize: textStyles.h2.fontSize,
  fontWeight: textStyles.h2.fontWeight,
  letterSpacing: textStyles.h2.letterSpacing,
  lineHeight: textStyles.h2.lineHeight,
};

/**
 * Reusable section heading with optional eyebrow and supporting description.
 */
export function SectionHeading({
  eyebrow,
  title,
  description,
  centered = false,
  className,
  style,
  ...props
}: SectionHeadingProps) {
  return (
    <div
      className={cn("flex flex-col", centered && "items-center text-center", className)}
      style={{
        gap: spacing[3],
        maxWidth: centered ? "48rem" : "42rem",
        ...style,
      }}
      {...props}
    >
      {eyebrow ? (
        <p
          style={{
            color: colors.brand.accent,
            fontSize: textStyles.label.fontSize,
            fontWeight: textStyles.label.fontWeight,
            letterSpacing: textStyles.caption.letterSpacing,
            lineHeight: textStyles.label.lineHeight,
            textTransform: "uppercase",
          }}
        >
          {eyebrow}
        </p>
      ) : null}

      <h2 style={headingStyle}>{title}</h2>

      {description ? (
        <p
          style={{
            color: colors.surface.foregroundMuted,
            fontSize: textStyles.body.fontSize,
            fontWeight: textStyles.body.fontWeight,
            letterSpacing: textStyles.body.letterSpacing,
            lineHeight: textStyles.body.lineHeight,
          }}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}
