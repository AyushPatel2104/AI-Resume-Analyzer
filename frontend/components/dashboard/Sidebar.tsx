import type { AnchorHTMLAttributes, ReactNode } from "react";

import { colors } from "@/constants/colors";
import { radius } from "@/constants/radius";
import { spacing } from "@/constants/spacing";
import { textStyles } from "@/constants/typography";
import { zIndex } from "@/constants/zIndex";
import { cn } from "@/lib/utils";

type SidebarNavigationItem = {
  label: string;
  href: string;
  isActive?: boolean;
};

const navigationItems: SidebarNavigationItem[] = [
  { label: "Overview", href: "#", isActive: true },
  { label: "Resumes", href: "#" },
  { label: "Analyses", href: "#" },
  { label: "Insights", href: "#" },
  { label: "Settings", href: "#" },
];

/**
 * Reusable dashboard sidebar with placeholder workspace and navigation links.
 */
export function Sidebar() {
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
        <a
          aria-label="AI Resume Analyzer dashboard"
          className="flex items-center gap-3"
          href="#"
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
        </a>

        <nav aria-label="Dashboard navigation">
          <ul className="flex flex-col" style={{ gap: spacing[1] }}>
            {navigationItems.map((item) => (
              <li key={item.label}>
                <SidebarLink href={item.href} isActive={item.isActive}>
                  {item.label}
                </SidebarLink>
              </li>
            ))}
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
            Placeholder workspace for saved resumes and analysis history.
          </p>
        </section>
      </div>
    </aside>
  );
}

function SidebarLink({
  children,
  className,
  isActive = false,
  style,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & {
  children: ReactNode;
  isActive?: boolean;
}) {
  return (
    <a
      aria-current={isActive ? "page" : undefined}
      className={cn("flex min-h-10 items-center px-3 transition-colors", className)}
      style={{
        backgroundColor: isActive ? colors.brand.accentMuted : "transparent",
        borderRadius: radius.medium,
        color: isActive ? colors.brand.accent : colors.surface.foregroundMuted,
        fontSize: textStyles.bodySmall.fontSize,
        fontWeight: isActive ? textStyles.label.fontWeight : textStyles.bodySmall.fontWeight,
        lineHeight: textStyles.bodySmall.lineHeight,
        ...style,
      }}
      {...props}
    >
      {children}
    </a>
  );
}
