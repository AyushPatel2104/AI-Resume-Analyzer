import type { ReactNode } from "react";

import { Container } from "@/components/common/Container";
import { SectionHeading } from "@/components/common/SectionHeading";
import { colors } from "@/constants/colors";
import { radius } from "@/constants/radius";
import { shadows } from "@/constants/shadows";
import { spacing } from "@/constants/spacing";
import { textStyles } from "@/constants/typography";

const ctaActions = [
  { label: "Start analysis", href: "#", variant: "primary" },
  { label: "Talk to sales", href: "#", variant: "secondary" },
] as const;

const supportPoints = [
  "Private resume review workspace",
  "Structured fit and skill-gap insights",
  "Reusable workflows for teams",
];

/**
 * Reusable landing call-to-action section with placeholder actions and support points.
 */
export function CTA() {
  return (
    <section
      aria-labelledby="landing-cta-title"
      style={{
        backgroundColor: colors.surface.background,
        paddingBlock: spacing[20],
      }}
    >
      <Container>
        <div
          className="flex flex-col items-center text-center"
          style={{
            backgroundColor: colors.surface.backgroundSubtle,
            border: `1px solid ${colors.surface.border}`,
            borderRadius: radius.doubleExtraLarge,
            boxShadow: shadows.small,
            gap: spacing[8],
            paddingBlock: spacing[16],
            paddingInline: spacing[6],
          }}
        >
          <SectionHeading
            centered
            description="Placeholder CTA copy for teams that want faster resume screening, clearer recommendations, and consistent career intelligence."
            eyebrow="Get started"
            id="landing-cta-title"
            title="Build a smarter resume analysis workflow."
          />

          <div className="flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
            {ctaActions.map((action) => (
              <CTAButton key={action.label} href={action.href} variant={action.variant}>
                {action.label}
              </CTAButton>
            ))}
          </div>

          <ul className="grid gap-3 text-left md:grid-cols-3">
            {supportPoints.map((point) => (
              <li
                className="flex items-center gap-3"
                key={point}
                style={{
                  color: colors.surface.foregroundMuted,
                  fontSize: textStyles.bodySmall.fontSize,
                  lineHeight: textStyles.bodySmall.lineHeight,
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    backgroundColor: colors.semantic.success,
                    borderRadius: radius.full,
                    display: "inline-block",
                    height: spacing[2],
                    width: spacing[2],
                  }}
                />
                {point}
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}

function CTAButton({
  children,
  href,
  variant,
}: {
  children: ReactNode;
  href: string;
  variant: (typeof ctaActions)[number]["variant"];
}) {
  const isPrimary = variant === "primary";

  return (
    <a
      className="inline-flex min-h-11 items-center justify-center px-5 text-center transition-colors focus-visible:outline-none focus-visible:ring-2"
      href={href}
      style={{
        backgroundColor: isPrimary ? colors.brand.DEFAULT : colors.surface.background,
        border: `1px solid ${isPrimary ? colors.brand.DEFAULT : colors.surface.borderStrong}`,
        borderRadius: radius.large,
        boxShadow: isPrimary ? shadows.extraSmall : shadows.none,
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
