import type { CSSProperties, ReactNode } from "react";

import { Container } from "@/components/common/Container";
import { colors } from "@/constants/colors";
import { radius } from "@/constants/radius";
import { shadows } from "@/constants/shadows";
import { spacing } from "@/constants/spacing";
import { fontSize, textStyles } from "@/constants/typography";

type HeroAction = {
  label: string;
  href: string;
  variant: "primary" | "secondary";
};

const heroActions: HeroAction[] = [
  { label: "Analyze resume", href: "#", variant: "primary" },
  { label: "View demo", href: "#", variant: "secondary" },
];

const insightRows = [
  { label: "Role alignment", value: "92%", tone: colors.semantic.success },
  { label: "Keyword coverage", value: "84%", tone: colors.semantic.info },
  { label: "Experience signal", value: "High", tone: colors.brand.accent },
];

const previewCards = [
  "Skills mapped to job requirements",
  "Impact statements scored for clarity",
  "ATS gaps converted into next actions",
];

const eyebrowStyle: CSSProperties = {
  color: colors.brand.accent,
  fontSize: textStyles.label.fontSize,
  fontWeight: textStyles.label.fontWeight,
  letterSpacing: textStyles.caption.letterSpacing,
  lineHeight: textStyles.label.lineHeight,
  textTransform: "uppercase",
};

/**
 * Reusable landing hero with placeholder copy and a static product preview.
 */
export function Hero() {
  return (
    <section
      aria-labelledby="landing-hero-title"
      style={{
        backgroundColor: colors.surface.background,
        overflow: "hidden",
        paddingBlock: spacing[24],
      }}
    >
      <Container width="wide">
        <div className="grid items-center gap-12 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="flex flex-col items-start" style={{ gap: spacing[6] }}>
            <p style={eyebrowStyle}>AI Resume Intelligence</p>

            <div className="flex flex-col" style={{ gap: spacing[5] }}>
              <h1
                id="landing-hero-title"
                style={{
                  color: colors.surface.foreground,
                  fontSize: fontSize["6xl"],
                  fontWeight: textStyles.display.fontWeight,
                  letterSpacing: textStyles.display.letterSpacing,
                  lineHeight: textStyles.display.lineHeight,
                  maxWidth: "46rem",
                }}
              >
                Turn every resume into a clear career signal.
              </h1>
              <p
                style={{
                  color: colors.surface.foregroundMuted,
                  fontSize: textStyles.body.fontSize,
                  lineHeight: textStyles.body.lineHeight,
                  maxWidth: "38rem",
                }}
              >
                Placeholder platform copy for resume analysis, job-fit scoring, skill gap
                detection, and interview readiness workflows.
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              {heroActions.map((action) => (
                <HeroButton key={action.label} href={action.href} variant={action.variant}>
                  {action.label}
                </HeroButton>
              ))}
            </div>
          </div>

          <ProductPreview />
        </div>
      </Container>
    </section>
  );
}

function HeroButton({
  children,
  href,
  variant,
}: {
  children: ReactNode;
  href: string;
  variant: HeroAction["variant"];
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

function ProductPreview() {
  return (
    <div
      aria-label="Placeholder resume analysis preview"
      className="relative"
      role="img"
      style={{
        backgroundColor: colors.surface.card,
        border: `1px solid ${colors.surface.border}`,
        borderRadius: radius.doubleExtraLarge,
        boxShadow: shadows.large,
        padding: spacing[4],
      }}
    >
      <div
        className="grid gap-4 md:grid-cols-[0.8fr_1.2fr]"
        style={{
          backgroundColor: colors.surface.backgroundSubtle,
          border: `1px solid ${colors.surface.border}`,
          borderRadius: radius.extraLarge,
          padding: spacing[4],
        }}
      >
        <div
          className="flex flex-col"
          style={{
            backgroundColor: colors.surface.card,
            border: `1px solid ${colors.surface.border}`,
            borderRadius: radius.large,
            gap: spacing[4],
            padding: spacing[5],
          }}
        >
          <div>
            <p style={eyebrowStyle}>Match score</p>
            <p
              style={{
                color: colors.surface.foreground,
                fontSize: fontSize["5xl"],
                fontWeight: textStyles.display.fontWeight,
                lineHeight: textStyles.display.lineHeight,
                marginTop: spacing[2],
              }}
            >
              92
            </p>
          </div>
          <div className="flex flex-col" style={{ gap: spacing[3] }}>
            {insightRows.map((row) => (
              <div className="flex items-center justify-between gap-4" key={row.label}>
                <span
                  style={{
                    color: colors.surface.foregroundMuted,
                    fontSize: textStyles.bodySmall.fontSize,
                    lineHeight: textStyles.bodySmall.lineHeight,
                  }}
                >
                  {row.label}
                </span>
                <span
                  style={{
                    color: row.tone,
                    fontSize: textStyles.label.fontSize,
                    fontWeight: textStyles.label.fontWeight,
                    lineHeight: textStyles.label.lineHeight,
                  }}
                >
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col" style={{ gap: spacing[3] }}>
          {previewCards.map((item, index) => (
            <div
              className="flex items-center gap-3"
              key={item}
              style={{
                backgroundColor: colors.surface.card,
                border: `1px solid ${colors.surface.border}`,
                borderRadius: radius.large,
                padding: spacing[4],
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  backgroundColor: index === 0 ? colors.brand.accentMuted : colors.neutral[100],
                  borderRadius: radius.full,
                  display: "inline-block",
                  height: spacing[3],
                  width: spacing[3],
                }}
              />
              <span
                style={{
                  color: colors.surface.foreground,
                  fontSize: textStyles.bodySmall.fontSize,
                  lineHeight: textStyles.bodySmall.lineHeight,
                }}
              >
                {item}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
