import type { ReactNode } from "react";

type DashboardLayoutProps = {
  children: ReactNode;
};

/** Route shell for dashboard pages. */
export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return <>{children}</>;
}
