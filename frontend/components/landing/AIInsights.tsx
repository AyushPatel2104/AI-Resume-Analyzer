import { Container } from "@/components/common/Container";
import { SectionHeading } from "@/components/common/SectionHeading";
import { colors } from "@/constants/colors";
import { radius } from "@/constants/radius";
import { shadows } from "@/constants/shadows";
import { spacing } from "@/constants/spacing";
import { textStyles } from "@/constants/typography";

const insightCards = [
  {
    title: "Priority recommendation",
    description: "Placeholder AI insight that turns resume analysis into a focused next action.",
    label: "High impact",
  },
  {
    title: "Keyword opportunity",
    description: "Placeholder AI insight for missing terms, skills, or role-specific signals.",
    label: "Role fit",
  },
  {
    title: "Narrative clarity",
    description: "Placeholder AI insight for strengthening outcomes, ownership, and scope.",
    label: "Writing",
  },
] as const;

/**
 * Reusable landing section for AI-generated recommendation previews.
 */
export function AIInsights() {
  return (
    <section
      aria-labelledby="ai-insights-title"
      style={{
        backgroundColor: colors.surface.backgroundSubtle,
        paddingBlock: spacing[20],
      }}
    >
      <Container>
        <div className="flex flex-col" style={{ gap: spacing[10] }}>
          <SectionHeading
            centered
            description="Placeholder section copy for explainable AI recommendations that help users understand what to improve and why it matters."
            eyebrow="AI insights"
            id="ai-insights-title"
            title="Recommendations that stay specific, explainable, and actionable."
          />

          <div className="grid gap-4 lg:grid-cols-3">
            {insightCards.map((insight) => (
              <article
                key={insight.title}
                style={{
                  backgroundColor: colors.surface.card,
                  border: `1px solid ${colors.surface.border}`,
                  borderRadius: radius.large,
                  boxShadow: shadows.extraSmall,
                  padding: spacing[6],
                }}
              >
                <span
                  style={{
                    backgroundColor: colors.brand.accentMuted,
                    borderRadius: radius.full,
                    color: colors.brand.accent,
                    display: "inline-flex",
                    fontSize: textStyles.caption.fontSize,
                    fontWeight: textStyles.label.fontWeight,
                    lineHeight: textStyles.caption.lineHeight,
                    marginBottom: spacing[5],
                    paddingBlock: spacing[1],
                    paddingInline: spacing[3],
                  }}
                >
                  {insight.label}
                </span>
                <h3
                  style={{
                    color: colors.surface.foreground,
                    fontSize: textStyles.h3.fontSize,
                    fontWeight: textStyles.h3.fontWeight,
                    lineHeight: textStyles.h3.lineHeight,
                    marginBottom: spacing[3],
                  }}
                >
                  {insight.title}
                </h3>
                <p
                  style={{
                    color: colors.surface.foregroundMuted,
                    fontSize: textStyles.body.fontSize,
                    lineHeight: textStyles.body.lineHeight,
                  }}
                >
                  {insight.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
