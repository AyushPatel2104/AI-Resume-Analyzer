import type { ReactNode } from "react";

type DashboardLayoutProps = {
  children: ReactNode;
};

/** Route-group shell for authenticated dashboard pages. */
export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return <>{children}</>;
}
