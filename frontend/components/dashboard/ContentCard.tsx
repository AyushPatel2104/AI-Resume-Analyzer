import type { HTMLAttributes, ReactNode } from "react";

import { colors } from "@/constants/colors";
import { radius } from "@/constants/radius";
import { shadows } from "@/constants/shadows";
import { spacing } from "@/constants/spacing";
import { textStyles } from "@/constants/typography";
import { cn } from "@/lib/utils";

export type ContentCardProps = HTMLAttributes<HTMLElement> & {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
};

/**
 * Reusable dashboard content panel for grouped information and placeholder workflows.
 */
export function ContentCard({
  title,
  description,
  action,
  children,
  className,
  style,
  ...props
}: ContentCardProps) {
  return (
    <section
      className={cn("flex flex-col", className)}
      style={{
        backgroundColor: colors.surface.card,
        border: `1px solid ${colors.surface.border}`,
        borderRadius: radius.large,
        boxShadow: shadows.none,
        ...style,
      }}
      {...props}
    >
      <header
        className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
        style={{
          borderBottom: `1px solid ${colors.surface.border}`,
          padding: spacing[5],
        }}
      >
        <div className="flex flex-col" style={{ gap: spacing[2] }}>
          <h2
            style={{
              color: colors.surface.foreground,
              fontSize: textStyles.body.fontSize,
              fontWeight: textStyles.h3.fontWeight,
              lineHeight: textStyles.body.lineHeight,
            }}
          >
            {title}
          </h2>
          {description ? (
            <p
              style={{
                color: colors.surface.foregroundMuted,
                fontSize: textStyles.bodySmall.fontSize,
                lineHeight: textStyles.bodySmall.lineHeight,
              }}
            >
              {description}
            </p>
          ) : null}
        </div>
        {action ? <div>{action}</div> : null}
      </header>

      <div style={{ padding: spacing[5] }}>{children}</div>
    </section>
  );
}
