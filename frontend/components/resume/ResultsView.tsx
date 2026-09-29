import { ContentCard } from "@/components/dashboard/ContentCard";
import { StatCard } from "@/components/dashboard/StatCard";
import { colors } from "@/constants/colors";
import { radius } from "@/constants/radius";
import { spacing } from "@/constants/spacing";
import { textStyles } from "@/constants/typography";
import type { AnalysisDetail } from "@/types/api";

function SkillPills({ items, tone }: { items: string[]; tone: "match" | "gap" }) {
  if (items.length === 0) {
    return (
      <p style={{ color: colors.surface.foregroundMuted, fontSize: textStyles.bodySmall.fontSize }}>
        None detected
      </p>
    );
  }

  const bg = tone === "match" ? colors.semantic.successMuted : colors.semantic.warningMuted;
  const fg = tone === "match" ? colors.semantic.success : colors.semantic.warning;

  return (
    <ul className="flex flex-wrap" style={{ gap: spacing[2] }}>
      {items.map((skill) => (
        <li
          key={skill}
          style={{
            backgroundColor: bg,
            color: fg,
            borderRadius: radius.full,
            fontSize: textStyles.caption.fontSize,
            paddingBlock: spacing[1],
            paddingInline: spacing[3],
          }}
        >
          {skill}
        </li>
      ))}
    </ul>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-col" style={{ gap: spacing[2] }}>
      {items.map((item) => (
        <li
          key={item}
          style={{
            color: colors.surface.foregroundMuted,
            fontSize: textStyles.bodySmall.fontSize,
            lineHeight: textStyles.bodySmall.lineHeight,
          }}
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

export function ResultsView({ data }: { data: AnalysisDetail }) {
  const { profile, match, filename } = data;

  return (
    <>
      <section aria-label="Match metrics" className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          description="Weighted skill coverage and semantic similarity"
          label="Overall match"
          value={`${Math.round(match.overall_score)}%`}
        />
        <StatCard
          description="TF-IDF cosine similarity vs. job description"
          label="Semantic alignment"
          value={`${Math.round(match.semantic_similarity)}%`}
        />
        <StatCard
          description="Skills from JD found on resume"
          label="Skill coverage"
          value={`${Math.round(match.skill_coverage)}%`}
        />
        <StatCard
          description="Parsed from uploaded file"
          label="Resume file"
          value={filename.length > 18 ? `${filename.slice(0, 15)}…` : filename}
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <ContentCard description="Skills aligned with the job description" title="Matched skills">
          <SkillPills items={match.matched_skills} tone="match" />
        </ContentCard>
        <ContentCard description="Job requirements not clearly present on the resume" title="Missing skills">
          <SkillPills items={match.missing_skills} tone="gap" />
        </ContentCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ContentCard title="Strengths">
          <BulletList items={match.strengths} />
        </ContentCard>
        <ContentCard title="Gaps & weaknesses">
          <BulletList items={match.weaknesses} />
        </ContentCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <ContentCard description="Experience lines relevant to the role" title="Relevant experience">
          <BulletList items={match.relevant_experience.length ? match.relevant_experience : ["No structured experience blocks detected."]} />
        </ContentCard>
        <ContentCard description="Actionable next steps" title="Recommendations">
          <ol className="flex flex-col" style={{ gap: spacing[3] }}>
            {match.recommendations.map((rec, index) => (
              <li
                key={rec}
                style={{
                  color: colors.surface.foregroundMuted,
                  fontSize: textStyles.bodySmall.fontSize,
                  lineHeight: textStyles.bodySmall.lineHeight,
                }}
              >
                <span style={{ color: colors.brand.accent, fontWeight: 600 }}>{index + 1}. </span>
                {rec}
              </li>
            ))}
          </ol>
        </ContentCard>
      </div>

      <ContentCard
        description="Structured fields extracted from your resume (heuristic parsing)"
        title={profile.name ? `${profile.name} — parsed profile` : "Parsed profile"}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <h3 style={{ ...textStyles.label, color: colors.surface.foreground, marginBottom: spacing[2] }}>
              Contact
            </h3>
            <ul style={{ color: colors.surface.foregroundMuted, fontSize: textStyles.bodySmall.fontSize }}>
              {profile.contact.email ? <li>{profile.contact.email}</li> : null}
              {profile.contact.phone ? <li>{profile.contact.phone}</li> : null}
              {profile.contact.linkedin ? <li>{profile.contact.linkedin}</li> : null}
              {!profile.contact.email && !profile.contact.phone && !profile.contact.linkedin ? (
                <li>Not detected</li>
              ) : null}
            </ul>
          </div>
          <div>
            <h3 style={{ ...textStyles.label, color: colors.surface.foreground, marginBottom: spacing[2] }}>
              Top skills
            </h3>
            <SkillPills items={profile.skills.slice(0, 12)} tone="match" />
          </div>
        </div>
        {profile.education.length > 0 ? (
          <div style={{ marginTop: spacing[4] }}>
            <h3 style={{ ...textStyles.label, color: colors.surface.foreground, marginBottom: spacing[2] }}>
              Education
            </h3>
            <BulletList
              items={profile.education.map((e) =>
                [e.degree, e.institution, e.year].filter(Boolean).join(" · "),
              )}
            />
          </div>
        ) : null}
      </ContentCard>
    </>
  );
}
