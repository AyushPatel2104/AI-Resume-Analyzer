import { Container } from "@/components/common/Container";
import { SectionHeading } from "@/components/common/SectionHeading";
import { colors } from "@/constants/colors";
import { radius } from "@/constants/radius";
import { shadows } from "@/constants/shadows";
import { spacing } from "@/constants/spacing";
import { textStyles } from "@/constants/typography";

const resumeSections = ["Experience", "Skills", "Projects", "Education"] as const;
const scoreItems = [
  { label: "Structure", value: "Strong", color: colors.semantic.success },
  { label: "Keywords", value: "Needs work", color: colors.semantic.warning },
  { label: "Impact", value: "Clear", color: colors.semantic.info },
] as const;

/**
 * Reusable landing section with a static resume review preview.
 */
export function ResumePreview() {
  return (
    <section
      aria-labelledby="resume-preview-title"
      style={{
        backgroundColor: colors.surface.background,
        paddingBlock: spacing[20],
      }}
    >
      <Container width="wide">
        <div className="grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <SectionHeading
            description="Placeholder preview copy for how resume content, scoring signals, and recommendations can appear in the product."
            eyebrow="Resume preview"
            id="resume-preview-title"
            title="Review resume quality in a structured, scannable workspace."
          />

          <div
            aria-label="Placeholder resume analysis workspace"
            role="img"
            style={{
              backgroundColor: colors.surface.card,
              border: `1px solid ${colors.surface.border}`,
              borderRadius: radius.doubleExtraLarge,
              boxShadow: shadows.large,
              padding: spacing[4],
            }}
          >
            <div className="grid gap-4 md:grid-cols-[1fr_0.85fr]">
              <div
                style={{
                  backgroundColor: colors.surface.backgroundSubtle,
                  border: `1px solid ${colors.surface.border}`,
                  borderRadius: radius.extraLarge,
                  padding: spacing[5],
                }}
              >
                <div
                  style={{
                    backgroundColor: colors.neutral[900],
                    borderRadius: radius.medium,
                    height: spacing[4],
                    marginBottom: spacing[5],
                    width: "46%",
                  }}
                />
                <div className="flex flex-col" style={{ gap: spacing[4] }}>
                  {resumeSections.map((section) => (
                    <div key={section}>
                      <p
                        style={{
                          color: colors.surface.foreground,
                          fontSize: textStyles.label.fontSize,
                          fontWeight: textStyles.label.fontWeight,
                          lineHeight: textStyles.label.lineHeight,
                          marginBottom: spacing[2],
                        }}
                      >
                        {section}
                      </p>
                      <div className="flex flex-col" style={{ gap: spacing[2] }}>
                        <span
                          style={{
                            backgroundColor: colors.neutral[200],
                            borderRadius: radius.full,
                            display: "block",
                            height: spacing[2],
                            width: "100%",
                          }}
                        />
                        <span
                          style={{
                            backgroundColor: colors.neutral[100],
                            borderRadius: radius.full,
                            display: "block",
                            height: spacing[2],
                            width: "72%",
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <aside
                aria-label="Placeholder scoring summary"
                className="flex flex-col"
                style={{ gap: spacing[3] }}
              >
                {scoreItems.map((item) => (
                  <div
                    className="flex items-center justify-between gap-4"
                    key={item.label}
                    style={{
                      backgroundColor: colors.surface.background,
                      border: `1px solid ${colors.surface.border}`,
                      borderRadius: radius.large,
                      padding: spacing[4],
                    }}
                  >
                    <span
                      style={{
                        color: colors.surface.foregroundMuted,
                        fontSize: textStyles.bodySmall.fontSize,
                        lineHeight: textStyles.bodySmall.lineHeight,
                      }}
                    >
                      {item.label}
                    </span>
                    <strong
                      style={{
                        color: item.color,
                        fontSize: textStyles.label.fontSize,
                        fontWeight: textStyles.label.fontWeight,
                        lineHeight: textStyles.label.lineHeight,
                      }}
                    >
                      {item.value}
                    </strong>
                  </div>
                ))}
              </aside>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
