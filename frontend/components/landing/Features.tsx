import { Container } from "@/components/common/Container";
import { SectionHeading } from "@/components/common/SectionHeading";
import { colors } from "@/constants/colors";
import { radius } from "@/constants/radius";
import { shadows } from "@/constants/shadows";
import { spacing } from "@/constants/spacing";
import { textStyles } from "@/constants/typography";

const features = [
  {
    title: "Resume scoring",
    description: "Placeholder guidance for evaluating clarity, relevance, and role alignment.",
  },
  {
    title: "Skill gap mapping",
    description: "Placeholder insights that compare candidate signals against target requirements.",
  },
  {
    title: "ATS readiness",
    description: "Placeholder checks for structure, keywords, readability, and parsing quality.",
  },
  {
    title: "Career recommendations",
    description: "Placeholder next steps for improving positioning, impact, and interview readiness.",
  },
] as const;

/**
 * Reusable landing section for high-level product capabilities.
 */
export function Features() {
  return (
    <section
      aria-labelledby="features-title"
      style={{
        backgroundColor: colors.surface.background,
        paddingBlock: spacing[20],
      }}
    >
      <Container>
        <div className="flex flex-col" style={{ gap: spacing[10] }}>
          <SectionHeading
            description="Placeholder overview of the core capabilities that power a modern resume intelligence workflow."
            eyebrow="Capabilities"
            id="features-title"
            title="Everything needed to evaluate resume quality with confidence."
          />

          <ul className="grid gap-4 md:grid-cols-2">
            {features.map((feature) => (
              <li key={feature.title}>
                <article
                  className="h-full"
                  style={{
                    backgroundColor: colors.surface.card,
                    border: `1px solid ${colors.surface.border}`,
                    borderRadius: radius.large,
                    boxShadow: shadows.none,
                    padding: spacing[6],
                  }}
                >
                  <div
                    aria-hidden="true"
                    style={{
                      backgroundColor: colors.brand.accentMuted,
                      borderRadius: radius.medium,
                      height: spacing[8],
                      marginBottom: spacing[5],
                      width: spacing[8],
                    }}
                  />
                  <h3
                    style={{
                      color: colors.surface.foreground,
                      fontSize: textStyles.h3.fontSize,
                      fontWeight: textStyles.h3.fontWeight,
                      lineHeight: textStyles.h3.lineHeight,
                      marginBottom: spacing[3],
                    }}
                  >
                    {feature.title}
                  </h3>
                  <p
                    style={{
                      color: colors.surface.foregroundMuted,
                      fontSize: textStyles.body.fontSize,
                      lineHeight: textStyles.body.lineHeight,
                    }}
                  >
                    {feature.description}
                  </p>
                </article>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}
