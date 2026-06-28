import type { HTMLAttributes, ReactNode } from "react";

import { colors } from "@/constants/colors";
import { radius } from "@/constants/radius";
import { spacing } from "@/constants/spacing";
import { textStyles } from "@/constants/typography";
import { cn } from "@/lib/utils";

export type DashboardHeaderProps = HTMLAttributes<HTMLElement> & {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
};

/**
 * Reusable dashboard header for page titles, summaries, and placeholder actions.
 */
export function DashboardHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
  style,
  ...props
}: DashboardHeaderProps) {
  return (
    <header
      className={cn("flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between", className)}
      style={style}
      {...props}
    >
      <div className="flex flex-col" style={{ gap: spacing[3] }}>
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
        <div className="flex flex-col" style={{ gap: spacing[2] }}>
          <h1
            style={{
              color: colors.surface.foreground,
              fontSize: textStyles.h1.fontSize,
              fontWeight: textStyles.h1.fontWeight,
              letterSpacing: textStyles.h1.letterSpacing,
              lineHeight: textStyles.h1.lineHeight,
            }}
          >
            {title}
          </h1>
          {description ? (
            <p
              style={{
                color: colors.surface.foregroundMuted,
                fontSize: textStyles.body.fontSize,
                lineHeight: textStyles.body.lineHeight,
                maxWidth: "44rem",
              }}
            >
              {description}
            </p>
          ) : null}
        </div>
      </div>

      {actions ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">{actions}</div>
      ) : null}
    </header>
  );
}

export function DashboardHeaderAction({
  children,
  href,
  variant = "secondary",
}: {
  children: ReactNode;
  href: string;
  variant?: "primary" | "secondary";
}) {
  const isPrimary = variant === "primary";

  return (
    <a
      className="inline-flex min-h-10 items-center justify-center px-4 text-center transition-colors focus-visible:outline-none focus-visible:ring-2"
      href={href}
      style={{
        backgroundColor: isPrimary ? colors.brand.DEFAULT : colors.surface.background,
        border: `1px solid ${isPrimary ? colors.brand.DEFAULT : colors.surface.borderStrong}`,
        borderRadius: radius.large,
        color: isPrimary ? colors.brand.foreground : colors.surface.foreground,
        fontSize: textStyles.label.fontSize,
        fontWeight: textStyles.label.fontWeight,
        lineHeight: textStyles.label.lineHeight,
      }}
    >
      {children}
    </a>
  );
}
