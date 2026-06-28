import type { HTMLAttributes, ReactNode } from "react";

import { colors } from "@/constants/colors";
import { radius } from "@/constants/radius";
import { shadows } from "@/constants/shadows";
import { spacing } from "@/constants/spacing";
import { textStyles } from "@/constants/typography";
import { cn } from "@/lib/utils";

export type StatCardProps = HTMLAttributes<HTMLElement> & {
  label: ReactNode;
  value: ReactNode;
  description?: ReactNode;
  trend?: ReactNode;
  className?: string;
};

/**
 * Reusable dashboard statistic card for summary metrics and placeholder KPIs.
 */
export function StatCard({
  label,
  value,
  description,
  trend,
  className,
  style,
  ...props
}: StatCardProps) {
  return (
    <article
      className={cn("flex min-h-36 flex-col justify-between", className)}
      style={{
        backgroundColor: colors.surface.card,
        border: `1px solid ${colors.surface.border}`,
        borderRadius: radius.large,
        boxShadow: shadows.none,
        padding: spacing[5],
        ...style,
      }}
      {...props}
    >
      <div className="flex items-start justify-between gap-4">
        <p
          style={{
            color: colors.surface.foregroundMuted,
            fontSize: textStyles.bodySmall.fontSize,
            lineHeight: textStyles.bodySmall.lineHeight,
          }}
        >
          {label}
        </p>
        {trend ? (
          <span
            style={{
              backgroundColor: colors.semantic.successMuted,
              borderRadius: radius.full,
              color: colors.semantic.success,
              fontSize: textStyles.caption.fontSize,
              fontWeight: textStyles.label.fontWeight,
              lineHeight: textStyles.caption.lineHeight,
              paddingBlock: spacing[1],
              paddingInline: spacing[2],
            }}
          >
            {trend}
          </span>
        ) : null}
      </div>
      <div className="flex flex-col" style={{ gap: spacing[2] }}>
        <strong
          style={{
            color: colors.surface.foreground,
            fontSize: textStyles.h2.fontSize,
            fontWeight: textStyles.h2.fontWeight,
            lineHeight: textStyles.h2.lineHeight,
          }}
        >
          {value}
        </strong>
        {description ? (
          <p
            style={{
              color: colors.surface.foregroundMuted,
              fontSize: textStyles.caption.fontSize,
              lineHeight: textStyles.caption.lineHeight,
            }}
          >
            {description}
          </p>
        ) : null}
      </div>
    </article>
  );
}
