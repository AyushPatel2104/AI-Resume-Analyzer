import type { ReactNode } from "react";

import { colors } from "@/constants/colors";
import { spacing } from "@/constants/spacing";

export type DashboardShellProps = {
  sidebar: ReactNode;
  header: ReactNode;
  children: ReactNode;
};

/**
 * Reusable dashboard shell with sidebar, header region, and main content area.
 */
export function DashboardShell({ sidebar, header, children }: DashboardShellProps) {
  return (
    <div
      className="min-h-screen lg:grid lg:grid-cols-[17rem_1fr]"
      style={{ backgroundColor: colors.surface.backgroundSubtle }}
    >
      {sidebar}
      <div className="flex min-w-0 flex-col">
        <div
          style={{
            backgroundColor: colors.surface.background,
            borderBottom: `1px solid ${colors.surface.border}`,
            paddingBlock: spacing[5],
            paddingInline: spacing[6],
          }}
        >
          {header}
        </div>
        <main
          className="flex-1"
          style={{
            paddingBlock: spacing[6],
            paddingInline: spacing[6],
          }}
        >
          <div className="mx-auto flex w-full max-w-7xl flex-col" style={{ gap: spacing[6] }}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
