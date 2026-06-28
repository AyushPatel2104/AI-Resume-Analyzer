import { Container } from "@/components/common/Container";
import { colors } from "@/constants/colors";
import { radius } from "@/constants/radius";
import { spacing } from "@/constants/spacing";
import { textStyles } from "@/constants/typography";

const trustedCompanies = [
  "Northstar Labs",
  "Apex Talent",
  "Vertex Cloud",
  "SignalWorks",
  "BrightPath",
];

/**
 * Reusable social-proof strip with accessible placeholder customer names.
 */
export function TrustedBy() {
  return (
    <section
      aria-labelledby="trusted-by-title"
      style={{
        backgroundColor: colors.surface.background,
        paddingBlock: spacing[14],
      }}
    >
      <Container>
        <div className="flex flex-col items-center text-center" style={{ gap: spacing[6] }}>
          <p
            id="trusted-by-title"
            style={{
              color: colors.surface.foregroundMuted,
              fontSize: textStyles.label.fontSize,
              fontWeight: textStyles.label.fontWeight,
              letterSpacing: textStyles.caption.letterSpacing,
              lineHeight: textStyles.label.lineHeight,
              textTransform: "uppercase",
            }}
          >
            Trusted by teams building modern career workflows
          </p>

          <ul className="grid w-full gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {trustedCompanies.map((company) => (
              <li key={company}>
                <div
                  className="flex min-h-16 items-center justify-center px-4 text-center"
                  style={{
                    backgroundColor: colors.surface.backgroundSubtle,
                    border: `1px solid ${colors.surface.border}`,
                    borderRadius: radius.large,
                    color: colors.surface.foregroundMuted,
                    fontSize: textStyles.bodySmall.fontSize,
                    fontWeight: textStyles.label.fontWeight,
                    lineHeight: textStyles.bodySmall.lineHeight,
                  }}
                >
                  {company}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}
