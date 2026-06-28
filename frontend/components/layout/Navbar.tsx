import type { AnchorHTMLAttributes, ReactNode } from "react";

import { colors } from "@/constants/colors";
import { radius } from "@/constants/radius";
import { shadows } from "@/constants/shadows";
import { spacing } from "@/constants/spacing";
import { textStyles } from "@/constants/typography";
import { zIndex } from "@/constants/zIndex";
import { cn } from "@/lib/utils";

import { Container } from "../common/Container";

type NavigationItem = {
  label: string;
  href: string;
};

const primaryNavigation: NavigationItem[] = [
  { label: "Product", href: "#" },
  { label: "Solutions", href: "#" },
  { label: "Resources", href: "#" },
  { label: "Pricing", href: "#" },
];

type NavbarActionProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  children: ReactNode;
  variant?: "primary" | "secondary";
};

function NavbarAction({
  children,
  className,
  variant = "secondary",
  style,
  ...props
}: NavbarActionProps) {
  const isPrimary = variant === "primary";

  return (
    <a
      className={cn(
        "inline-flex min-h-10 items-center justify-center whitespace-nowrap px-4 transition-colors focus-visible:outline-none focus-visible:ring-2",
        className,
      )}
      style={{
        backgroundColor: isPrimary ? colors.brand.DEFAULT : colors.surface.background,
        border: `1px solid ${isPrimary ? colors.brand.DEFAULT : colors.surface.border}`,
        borderRadius: radius.large,
        boxShadow: isPrimary ? shadows.extraSmall : shadows.none,
        color: isPrimary ? colors.brand.foreground : colors.surface.foreground,
        fontSize: textStyles.label.fontSize,
        fontWeight: textStyles.label.fontWeight,
        lineHeight: textStyles.label.lineHeight,
        ...style,
      }}
      {...props}
    >
      {children}
    </a>
  );
}

/**
 * Responsive marketing and application shell navigation for SaaS entry points.
 */
export function Navbar() {
  return (
    <header
      style={{
        backgroundColor: colors.surface.background,
        borderBottom: `1px solid ${colors.surface.border}`,
        position: "sticky",
        top: 0,
        zIndex: zIndex.sticky,
      }}
    >
      <Container>
        <nav
          aria-label="Primary navigation"
          className="flex min-h-16 items-center justify-between gap-6"
        >
          <a
            aria-label="AI Resume Analyzer home"
            className="flex items-center gap-3 font-semibold"
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
            <span className="hidden sm:inline">Resume Analyzer</span>
          </a>

          <ul className="hidden items-center gap-6 md:flex">
            {primaryNavigation.map((item) => (
              <li key={item.label}>
                <a
                  className="transition-colors hover:opacity-80"
                  href={item.href}
                  style={{
                    color: colors.surface.foregroundMuted,
                    fontSize: textStyles.bodySmall.fontSize,
                    fontWeight: textStyles.label.fontWeight,
                    lineHeight: textStyles.bodySmall.lineHeight,
                  }}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="flex items-center" style={{ gap: spacing[3] }}>
            <NavbarAction className="hidden sm:inline-flex" href="#">
              Sign In
            </NavbarAction>
            <NavbarAction href="#" variant="primary">
              Get Started
            </NavbarAction>
          </div>
        </nav>
      </Container>
    </header>
  );
}
