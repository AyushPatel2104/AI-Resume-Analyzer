import { Container } from "@/components/common/Container";
import { SectionHeading } from "@/components/common/SectionHeading";
import { colors } from "@/constants/colors";
import { radius } from "@/constants/radius";
import { spacing } from "@/constants/spacing";
import { textStyles } from "@/constants/typography";

const workflowSteps = [
  {
    title: "Upload",
    description: "Placeholder step for adding a resume or profile document to the workspace.",
  },
  {
    title: "Analyze",
    description: "Placeholder step for extracting role signals, keywords, and quality markers.",
  },
  {
    title: "Improve",
    description: "Placeholder step for turning insights into clear resume improvements.",
  },
  {
    title: "Apply",
    description: "Placeholder step for preparing a stronger application package.",
  },
] as const;

/**
 * Reusable process section that explains the product workflow.
 */
export function HowItWorks() {
  return (
    <section
      aria-labelledby="how-it-works-title"
      style={{
        backgroundColor: colors.surface.backgroundSubtle,
        paddingBlock: spacing[20],
      }}
    >
      <Container>
        <div className="flex flex-col" style={{ gap: spacing[10] }}>
          <SectionHeading
            centered
            description="Placeholder workflow copy showing how users move from raw resume content to actionable career intelligence."
            eyebrow="How it works"
            id="how-it-works-title"
            title="A simple path from resume upload to stronger positioning."
          />

          <ol className="grid gap-4 md:grid-cols-4">
            {workflowSteps.map((step, index) => (
              <li key={step.title}>
                <article
                  className="h-full"
                  style={{
                    backgroundColor: colors.surface.card,
                    border: `1px solid ${colors.surface.border}`,
                    borderRadius: radius.large,
                    padding: spacing[5],
                  }}
                >
                  <div
                    className="inline-flex items-center justify-center"
                    style={{
                      backgroundColor: index === 0 ? colors.brand.DEFAULT : colors.neutral[100],
                      borderRadius: radius.full,
                      color: index === 0 ? colors.brand.foreground : colors.surface.foreground,
                      fontSize: textStyles.label.fontSize,
                      fontWeight: textStyles.label.fontWeight,
                      height: spacing[8],
                      marginBottom: spacing[5],
                      width: spacing[8],
                    }}
                  >
                    {index + 1}
                  </div>
                  <h3
                    style={{
                      color: colors.surface.foreground,
                      fontSize: textStyles.h3.fontSize,
                      fontWeight: textStyles.h3.fontWeight,
                      lineHeight: textStyles.h3.lineHeight,
                      marginBottom: spacing[3],
                    }}
                  >
                    {step.title}
                  </h3>
                  <p
                    style={{
                      color: colors.surface.foregroundMuted,
                      fontSize: textStyles.bodySmall.fontSize,
                      lineHeight: textStyles.bodySmall.lineHeight,
                    }}
                  >
                    {step.description}
                  </p>
                </article>
              </li>
            ))}
          </ol>
        </div>
      </Container>
    </section>
  );
}
