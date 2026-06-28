import { colors } from "@/constants/colors";
import { radius } from "@/constants/radius";
import { spacing } from "@/constants/spacing";
import { textStyles } from "@/constants/typography";

import { Container } from "../common/Container";

type FooterLink = {
  label: string;
  href: string;
};

const productLinks: FooterLink[] = [
  { label: "Resume Analysis", href: "#" },
  { label: "Job Fit Scoring", href: "#" },
  { label: "Career Insights", href: "#" },
  { label: "Interview Readiness", href: "#" },
];

const legalLinks: FooterLink[] = [
  { label: "Privacy", href: "#" },
  { label: "Terms", href: "#" },
  { label: "Security", href: "#" },
];

const socialLinks: FooterLink[] = [
  { label: "LinkedIn", href: "#" },
  { label: "X", href: "#" },
  { label: "GitHub", href: "#" },
];

/**
 * Reusable footer with company, product, legal, and social navigation areas.
 */
export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      style={{
        backgroundColor: colors.surface.backgroundSubtle,
        borderTop: `1px solid ${colors.surface.border}`,
        color: colors.surface.foreground,
      }}
    >
      <Container>
        <div className="grid gap-10 py-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <section aria-labelledby="footer-company">
            <div className="flex items-center gap-3">
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
              <h2
                id="footer-company"
                style={{
                  fontSize: textStyles.body.fontSize,
                  fontWeight: textStyles.h3.fontWeight,
                  lineHeight: textStyles.body.lineHeight,
                }}
              >
                AI Resume Analyzer
              </h2>
            </div>
            <p
              className="mt-4 max-w-sm"
              style={{
                color: colors.surface.foregroundMuted,
                fontSize: textStyles.bodySmall.fontSize,
                lineHeight: textStyles.bodySmall.lineHeight,
              }}
            >
              Enterprise-grade resume intelligence for evaluating fit, improving candidate
              readiness, and supporting career decisions.
            </p>
          </section>

          <FooterLinkGroup title="Product" links={productLinks} />
          <FooterLinkGroup title="Legal" links={legalLinks} />
          <FooterLinkGroup title="Social" links={socialLinks} />
        </div>

        <div
          className="flex flex-col gap-3 border-t py-6 sm:flex-row sm:items-center sm:justify-between"
          style={{ borderColor: colors.surface.border }}
        >
          <p
            style={{
              color: colors.surface.foregroundMuted,
              fontSize: textStyles.caption.fontSize,
              lineHeight: textStyles.caption.lineHeight,
            }}
          >
            &copy; {currentYear} AI Resume Analyzer. All rights reserved.
          </p>
          <p
            style={{
              color: colors.surface.foregroundSubtle,
              fontSize: textStyles.caption.fontSize,
              lineHeight: textStyles.caption.lineHeight,
            }}
          >
            Built for secure, scalable hiring and career workflows.
          </p>
        </div>
      </Container>
    </footer>
  );
}

function FooterLinkGroup({ title, links }: { title: string; links: FooterLink[] }) {
  return (
    <nav aria-label={`${title} links`}>
      <h2
        style={{
          fontSize: textStyles.label.fontSize,
          fontWeight: textStyles.label.fontWeight,
          lineHeight: textStyles.label.lineHeight,
          marginBottom: spacing[4],
        }}
      >
        {title}
      </h2>
      <ul className="space-y-3">
        {links.map((link) => (
          <li key={link.label}>
            <a
              className="transition-colors hover:opacity-80"
              href={link.href}
              style={{
                color: colors.surface.foregroundMuted,
                fontSize: textStyles.bodySmall.fontSize,
                lineHeight: textStyles.bodySmall.lineHeight,
              }}
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
