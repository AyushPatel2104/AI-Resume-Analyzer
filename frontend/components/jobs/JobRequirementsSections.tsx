import { colors } from "@/constants/colors";
import { radius } from "@/constants/radius";
import { spacing } from "@/constants/spacing";
import { textStyles } from "@/constants/typography";
import type { NormalizedRequirements } from "@/types/api";

function ChipList({ title, items }: { title: string; items: string[] }) {
  return (
    <section style={{ marginBottom: spacing[4] }}>
      <h3 style={{ fontSize: textStyles.label.fontSize, fontWeight: 600, marginBottom: spacing[2] }}>{title}</h3>
      {items.length === 0 ? (
        <p style={{ color: colors.surface.foregroundMuted, fontSize: textStyles.caption.fontSize }}>Not detected</p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {items.map((item) => (
            <li
              key={item}
              style={{
                backgroundColor: colors.surface.backgroundSubtle,
                borderRadius: radius.medium,
                fontSize: textStyles.caption.fontSize,
                paddingBlock: spacing[1],
                paddingInline: spacing[2],
              }}
            >
              {item}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function JobRequirementsSections({ requirements }: { requirements: NormalizedRequirements | null }) {
  if (!requirements) {
    return (
      <p style={{ color: colors.surface.foregroundMuted, fontSize: textStyles.bodySmall.fontSize }}>
        No normalized requirements stored for this job.
      </p>
    );
  }

  const meta = [
    requirements.experience_years ? `Experience: ${requirements.experience_years}` : null,
    requirements.seniority_level ? `Level: ${requirements.seniority_level}` : null,
    requirements.job_type ? `Type: ${requirements.job_type}` : null,
    requirements.work_mode ? `Work mode: ${requirements.work_mode}` : null,
    requirements.location ? `Location: ${requirements.location}` : null,
  ].filter(Boolean);

  return (
    <div
      style={{
        border: `1px solid ${colors.surface.border}`,
        borderRadius: radius.large,
        padding: spacing[5],
        backgroundColor: colors.surface.background,
      }}
    >
      <h2 style={{ fontSize: textStyles.h3.fontSize, marginBottom: spacing[3] }}>Extracted requirements</h2>
      {meta.length > 0 ? (
        <p style={{ color: colors.surface.foregroundMuted, fontSize: textStyles.bodySmall.fontSize, marginBottom: spacing[4] }}>
          {meta.join(" · ")}
        </p>
      ) : null}
      <ChipList items={requirements.required_skills} title="Required skills" />
      <ChipList items={requirements.preferred_skills} title="Preferred skills" />
      <ChipList items={requirements.programming_languages} title="Programming languages" />
      <ChipList items={requirements.frameworks} title="Frameworks" />
      <ChipList items={requirements.tools} title="Tools" />
      <ChipList items={requirements.databases} title="Databases" />
      <ChipList items={requirements.cloud_platforms} title="Cloud / platform" />
      <ChipList items={requirements.education_requirements} title="Education" />
      <ChipList items={requirements.jd_skills_detected} title="Skills detected in description" />
    </div>
  );
}
