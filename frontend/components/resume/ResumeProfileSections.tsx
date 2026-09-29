import { colors } from "@/constants/colors";
import { radius } from "@/constants/radius";
import { spacing } from "@/constants/spacing";
import { textStyles } from "@/constants/typography";
import type { ParsedProfile } from "@/types/api";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section
      style={{
        border: `1px solid ${colors.surface.border}`,
        borderRadius: radius.large,
        padding: spacing[5],
        backgroundColor: colors.surface.background,
      }}
    >
      <h2
        style={{
          color: colors.surface.foreground,
          fontSize: textStyles.h3.fontSize,
          fontWeight: textStyles.h3.fontWeight,
          marginBottom: spacing[3],
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

function ListItems({ items, emptyLabel }: { items: string[]; emptyLabel: string }) {
  if (items.length === 0) {
    return (
      <p style={{ color: colors.surface.foregroundMuted, fontSize: textStyles.bodySmall.fontSize }}>{emptyLabel}</p>
    );
  }
  return (
    <ul className="flex flex-col" style={{ gap: spacing[2] }}>
      {items.map((item) => (
        <li key={item} style={{ color: colors.surface.foreground, fontSize: textStyles.bodySmall.fontSize }}>
          {item}
        </li>
      ))}
    </ul>
  );
}

export function ResumeProfileSections({ profile }: { profile: ParsedProfile }) {
  const contactParts = [
    profile.contact.email,
    profile.contact.phone,
    profile.contact.location,
    profile.contact.linkedin,
  ].filter(Boolean);

  return (
    <div className="flex flex-col" style={{ gap: spacing[5] }}>
      <Section title="Profile">
        <p style={{ color: colors.surface.foreground, fontSize: textStyles.body.fontSize, marginBottom: spacing[2] }}>
          {profile.name ?? "Name not detected"}
        </p>
        {contactParts.length > 0 ? (
          <p style={{ color: colors.surface.foregroundMuted, fontSize: textStyles.bodySmall.fontSize }}>
            {contactParts.join(" · ")}
          </p>
        ) : (
          <p style={{ color: colors.surface.foregroundMuted, fontSize: textStyles.bodySmall.fontSize }}>
            No contact details detected.
          </p>
        )}
        {profile.summary ? (
          <p
            style={{
              color: colors.surface.foregroundMuted,
              fontSize: textStyles.bodySmall.fontSize,
              marginTop: spacing[3],
              lineHeight: textStyles.bodySmall.lineHeight,
            }}
          >
            {profile.summary}
          </p>
        ) : null}
      </Section>

      <Section title="Skills">
        <ListItems emptyLabel="No skills detected." items={profile.skills} />
      </Section>

      <Section title="Technologies">
        <ListItems emptyLabel="No technologies detected." items={profile.technologies} />
      </Section>

      <Section title="Experience">
        {profile.experience.length === 0 ? (
          <p style={{ color: colors.surface.foregroundMuted, fontSize: textStyles.bodySmall.fontSize }}>
            No experience sections detected.
          </p>
        ) : (
          <ul className="flex flex-col" style={{ gap: spacing[3] }}>
            {profile.experience.map((item, index) => (
              <li key={`${item.title}-${index}`}>
                <p style={{ color: colors.surface.foreground, fontWeight: 600, fontSize: textStyles.bodySmall.fontSize }}>
                  {[item.title, item.company].filter(Boolean).join(" · ")}
                </p>
                {item.duration ? (
                  <p style={{ color: colors.surface.foregroundMuted, fontSize: textStyles.caption.fontSize }}>
                    {item.duration}
                  </p>
                ) : null}
                {item.description ? (
                  <p style={{ color: colors.surface.foregroundMuted, fontSize: textStyles.bodySmall.fontSize }}>
                    {item.description}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Education">
        {profile.education.length === 0 ? (
          <p style={{ color: colors.surface.foregroundMuted, fontSize: textStyles.bodySmall.fontSize }}>
            No education entries detected.
          </p>
        ) : (
          <ul className="flex flex-col" style={{ gap: spacing[2] }}>
            {profile.education.map((item, index) => (
              <li key={`${item.degree}-${index}`} style={{ fontSize: textStyles.bodySmall.fontSize }}>
                {[item.degree, item.institution, item.year].filter(Boolean).join(" · ")}
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Projects">
        <ListItems emptyLabel="No projects detected." items={profile.projects} />
      </Section>

      <Section title="Certifications">
        <ListItems emptyLabel="No certifications detected." items={profile.certifications} />
      </Section>
    </div>
  );
}
