import Link from "next/link";
import type { ReactNode } from "react";

import { colors } from "@/constants/colors";
import { radius } from "@/constants/radius";
import { spacing } from "@/constants/spacing";
import { textStyles } from "@/constants/typography";
import { zIndex } from "@/constants/zIndex";
import { cn } from "@/lib/utils";

type SidebarNavigationItem = {
  label: string;
  href: string;
};

const navigationItems: SidebarNavigationItem[] = [
  { label: "Overview", href: "/dashboard" },
  { label: "New analysis", href: "/dashboard/analyze" },
  { label: "Analyses", href: "/dashboard" },
];

export function Sidebar({ activePath = "/dashboard" }: { activePath?: string }) {
  return (
    <aside
      className="lg:sticky lg:top-0 lg:h-screen"
      style={{
        backgroundColor: colors.surface.background,
        borderBottom: `1px solid ${colors.surface.border}`,
        borderRight: `1px solid ${colors.surface.border}`,
        zIndex: zIndex.sticky,
      }}
    >
      <div
        className="flex h-full flex-col"
        style={{
          gap: spacing[6],
          padding: spacing[5],
        }}
      >
        <Link
          aria-label="AI Resume Analyzer dashboard"
          className="flex items-center gap-3"
          href="/"
          style={{ color: colors.surface.foreground }}
        >
          <span
            aria-hidden="true"
            className="inline-flex size-9 items-center justify-center"
            style={{
              backgroundColor: colors.brand.DEFAULT,
              borderRadius: radius.large,
              color: colors.brand.foreground,
              fontSize: textStyles.label.fontSize,
              fontWeight: textStyles.label.fontWeight,
            }}
          >
            AI
          </span>
          <span
            style={{
              fontSize: textStyles.body.fontSize,
              fontWeight: textStyles.h3.fontWeight,
              lineHeight: textStyles.body.lineHeight,
            }}
          >
            Resume Analyzer
          </span>
        </Link>

        <nav aria-label="Dashboard navigation">
          <ul className="flex flex-col" style={{ gap: spacing[1] }}>
            {navigationItems.map((item) => {
              const isActive =
                item.label === "Overview"
                  ? activePath === "/dashboard"
                  : item.label === "New analysis"
                    ? activePath.startsWith("/dashboard/analyze")
                    : item.label === "Analyses"
                      ? activePath.startsWith("/dashboard/results")
                      : activePath === item.href;
              return (
                <li key={item.label}>
                  <SidebarLink href={item.href} isActive={isActive}>
                    {item.label}
                  </SidebarLink>
                </li>
              );
            })}
          </ul>
        </nav>

        <section
          aria-labelledby="workspace-summary-title"
          className="mt-auto"
          style={{
            backgroundColor: colors.surface.backgroundSubtle,
            border: `1px solid ${colors.surface.border}`,
            borderRadius: radius.large,
            padding: spacing[4],
          }}
        >
          <h2
            id="workspace-summary-title"
            style={{
              color: colors.surface.foreground,
              fontSize: textStyles.label.fontSize,
              fontWeight: textStyles.label.fontWeight,
              lineHeight: textStyles.label.lineHeight,
              marginBottom: spacing[2],
            }}
          >
            Workspace
          </h2>
          <p
            style={{
              color: colors.surface.foregroundMuted,
              fontSize: textStyles.caption.fontSize,
              lineHeight: textStyles.caption.lineHeight,
            }}
          >
            Analyses are stored locally in your configured database when the API is running.
          </p>
        </section>
      </div>
    </aside>
  );
}

function SidebarLink({
  children,
  className,
  href,
  isActive = false,
}: {
  children: ReactNode;
  className?: string;
  href: string;
  isActive?: boolean;
}) {
  return (
    <Link
      aria-current={isActive ? "page" : undefined}
      className={cn("flex min-h-10 items-center px-3 transition-colors", className)}
      href={href}
      style={{
        backgroundColor: isActive ? colors.brand.accentMuted : "transparent",
        borderRadius: radius.medium,
        color: isActive ? colors.brand.accent : colors.surface.foregroundMuted,
        fontSize: textStyles.bodySmall.fontSize,
        fontWeight: isActive ? textStyles.label.fontWeight : textStyles.bodySmall.fontWeight,
        lineHeight: textStyles.bodySmall.lineHeight,
      }}
    >
      {children}
    </Link>
  );
}
