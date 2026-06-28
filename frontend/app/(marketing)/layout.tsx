import type { ReactNode } from "react";

type MarketingLayoutProps = {
  children: ReactNode;
};

/** Route-group shell for public marketing pages. */
export default function MarketingLayout({ children }: MarketingLayoutProps) {
  return <>{children}</>;
}
