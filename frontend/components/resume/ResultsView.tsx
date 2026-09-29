import { ContentCard } from "@/components/dashboard/ContentCard";
import { StatCard } from "@/components/dashboard/StatCard";
import { colors } from "@/constants/colors";
import { radius } from "@/constants/radius";
import { spacing } from "@/constants/spacing";
import { textStyles } from "@/constants/typography";
import type { AnalysisDetail, MatchComponents, SkillGapItem } from "@/types/api";

function SkillPills({ items, tone }: { items: string[]; tone: "match" | "gap" }) {
  if (items.length === 0) {
    return (
      <p style={{ color: colors.surface.foregroundMuted, fontSize: textStyles.bodySmall.fontSize }}>None detected</p>
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

function ComponentRow({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex items-start justify-between gap-4" style={{ paddingBlock: spacing[2] }}>
      <div>
        <p style={{ fontWeight: 600, fontSize: textStyles.bodySmall.fontSize }}>{label}</p>
        {hint ? (
          <p style={{ color: colors.surface.foregroundMuted, fontSize: textStyles.caption.fontSize }}>{hint}</p>
        ) : null}
      </div>
      <span style={{ color: colors.brand.accent, fontWeight: 700 }}>{value}</span>
    </div>
  );
}

function formatComponent(components: MatchComponents, key: keyof MatchComponents, availableKey?: keyof MatchComponents) {
  if (availableKey && components[availableKey] === false) {
    return "N/A";
  }
  const value = components[key];
  if (value === null || value === undefined) return "N/A";
  if (typeof value === "number") return `${Math.round(value)}%`;
  return String(value);
}

function GapList({ gaps }: { gaps: SkillGapItem[] }) {
  const groups = {
    critical: gaps.filter((g) => g.severity === "critical"),
    important: gaps.filter((g) => g.severity === "important"),
    optional: gaps.filter((g) => g.severity === "optional"),
  };
  return (
    <div className="flex flex-col" style={{ gap: spacing[4] }}>
      {(["critical", "important", "optional"] as const).map((severity) => (
        <div key={severity}>
          <h4 style={{ fontSize: textStyles.label.fontSize, fontWeight: 600, textTransform: "capitalize" }}>{severity}</h4>
          {groups[severity].length === 0 ? (
            <p style={{ color: colors.surface.foregroundMuted, fontSize: textStyles.caption.fontSize }}>None</p>
          ) : (
            <ul className="flex flex-col" style={{ gap: spacing[2], marginTop: spacing[2] }}>
              {groups[severity].map((gap) => (
                <li key={`${gap.item}-${gap.detail}`} style={{ fontSize: textStyles.bodySmall.fontSize }}>
                  <strong>{gap.item}</strong> — {gap.detail}
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}

export function ResultsView({ data }: { data: AnalysisDetail }) {
  const { match, filename } = data;
  const components = match.components;
  const semanticHint =
    components?.semantic_available && components.semantic_method === "sentence_transformer"
      ? "Local embedding model"
      : "TF-IDF text similarity (fallback — not deep semantic AI)";

  return (
    <>
      <section aria-label="Match metrics" className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          description={match.score_disclaimer || "Explainable compatibility score — not hiring probability"}
          label="Overall match"
          value={`${Math.round(match.overall_score)}%`}
        />
        <StatCard description={semanticHint} label="Semantic / text relevance" value={`${Math.round(match.semantic_similarity)}%`} />
        <StatCard description="Required skill coverage" label="Required coverage" value={`${Math.round(match.skill_coverage)}%`} />
        <StatCard description="Parsed from uploaded file" label="Resume file" value={filename.length > 18 ? `${filename.slice(0, 15)}…` : filename} />
      </section>

      {components ? (
        <ContentCard description="Component signals (V2 matcher)" title="Score breakdown">
          <ComponentRow label="Skills" value={formatComponent(components, "skill_score")} />
          <ComponentRow
            hint={components.semantic_available ? "Sentence-transformer embeddings" : "Semantic signal unavailable"}
            label="Semantic"
            value={formatComponent(components, "semantic_score", "semantic_available")}
          />
          {!components.semantic_available ? (
            <ComponentRow label="Text similarity (TF-IDF)" value={formatComponent(components, "text_similarity_score")} />
          ) : null}
          <ComponentRow label="Experience" value={formatComponent(components, "experience_score", "experience_available")} />
          <ComponentRow
            hint={components.education_requirement_specified ? undefined : "No explicit education requirement in job"}
            label="Education"
            value={formatComponent(components, "education_score", "education_available")}
          />
          <ComponentRow label="Projects" value={formatComponent(components, "project_score")} />
          <ComponentRow label="Seniority" value={formatComponent(components, "seniority_score", "seniority_available")} />
          <ComponentRow label="Required requirements" value={formatComponent(components, "required_coverage")} />
          <ComponentRow label="Preferred requirements" value={formatComponent(components, "preferred_coverage")} />
          <ComponentRow label="Keyword / technology" value={formatComponent(components, "keyword_score")} />
        </ContentCard>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <ContentCard title="Required skills — matched">
          <SkillPills items={match.matched_required_skills ?? match.matched_skills} tone="match" />
        </ContentCard>
        <ContentCard title="Required skills — missing">
          <SkillPills items={match.missing_required_skills ?? match.missing_skills} tone="gap" />
        </ContentCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ContentCard title="Preferred skills — matched">
          <SkillPills items={match.matched_preferred_skills ?? []} tone="match" />
        </ContentCard>
        <ContentCard title="Preferred skills — missing">
          <SkillPills items={match.missing_preferred_skills ?? []} tone="gap" />
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

      {match.skill_gaps && match.skill_gaps.length > 0 ? (
        <ContentCard title="Skill gap severity">
          <GapList gaps={match.skill_gaps} />
        </ContentCard>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <ContentCard description="Experience lines with job relevance" title="Relevant experience">
          <BulletList items={match.relevant_experience.length ? match.relevant_experience : ["No structured experience blocks detected."]} />
        </ContentCard>
        <ContentCard description="Project evidence" title="Relevant projects">
          <BulletList items={match.relevant_projects?.length ? match.relevant_projects : ["No project relevance detected."]} />
        </ContentCard>
      </div>

      <ContentCard description="Actionable next steps" title="Recommendations">
        <ol className="flex flex-col" style={{ gap: spacing[3] }}>
          {match.recommendations.map((rec, index) => (
            <li key={rec} style={{ color: colors.surface.foregroundMuted, fontSize: textStyles.bodySmall.fontSize }}>
              <span style={{ color: colors.brand.accent, fontWeight: 600 }}>{index + 1}. </span>
              {rec}
            </li>
          ))}
        </ol>
      </ContentCard>

      {match.partial_matches && match.partial_matches.length > 0 ? (
        <ContentCard title="Partial matches">
          <BulletList items={match.partial_matches} />
        </ContentCard>
      ) : null}
    </>
  );
}
