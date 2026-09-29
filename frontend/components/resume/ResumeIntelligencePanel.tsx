"use client";

import { useCallback, useEffect, useState } from "react";

import { ContentCard } from "@/components/dashboard/ContentCard";
import { StatCard } from "@/components/dashboard/StatCard";
import { colors } from "@/constants/colors";
import { spacing } from "@/constants/spacing";
import { textStyles } from "@/constants/typography";
import { fetchJobs, fetchResumeIntelligence } from "@/services/api";
import type { JobSummary, ResumeIntelligenceResponse } from "@/types/api";

type Props = {
  resumeId: string;
};

function severityColor(severity: string): string {
  if (severity === "Critical") return colors.semantic.error;
  if (severity === "Important") return colors.semantic.warning;
  return colors.surface.foregroundMuted;
}

export function ResumeIntelligencePanel({ resumeId }: Props) {
  const [data, setData] = useState<ResumeIntelligenceResponse | null>(null);
  const [jobs, setJobs] = useState<JobSummary[]>([]);
  const [jobId, setJobId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadIntelligence = useCallback(async (selectedJobId?: string) => {
    setLoading(true);
    setError(null);
    try {
      const intel = await fetchResumeIntelligence(resumeId, selectedJobId);
      setData(intel);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load resume intelligence.");
    } finally {
      setLoading(false);
    }
  }, [resumeId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [jobList, intel] = await Promise.all([
          fetchJobs().catch(() => [] as JobSummary[]),
          fetchResumeIntelligence(resumeId),
        ]);
        if (cancelled) return;
        setJobs(jobList);
        setData(intel);
        setError(null);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load resume intelligence.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [resumeId]);

  function handleJobChange(nextJobId: string) {
    setJobId(nextJobId);
    void loadIntelligence(nextJobId || undefined);
  }

  if (loading && !data) {
    return (
      <ContentCard title="Resume Intelligence">
        <p style={{ color: colors.surface.foregroundMuted, fontSize: textStyles.bodySmall.fontSize }}>
          Analyzing stored resume…
        </p>
      </ContentCard>
    );
  }

  if (error && !data) {
    return (
      <ContentCard title="Resume Intelligence">
        <p style={{ color: colors.semantic.error, fontSize: textStyles.bodySmall.fontSize }}>{error}</p>
      </ContentCard>
    );
  }

  if (!data) return null;

  const sectionEntries = Object.entries(data.sections ?? {});

  return (
    <div className="flex flex-col" style={{ gap: spacing[5] }}>
      <ContentCard
        title="Resume Intelligence"
        description="ATS-readiness signals from parsed text — separate from job match."
      >
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <p style={{ color: colors.surface.foregroundMuted, fontSize: textStyles.caption.fontSize, maxWidth: "42rem" }}>
            {data.score_disclaimer}
          </p>
          <label className="flex flex-col gap-1">
            <span style={{ fontSize: textStyles.caption.fontSize, color: colors.surface.foregroundMuted }}>
              Optional job-specific analysis
            </span>
            <select
              className="rounded-md border px-3 py-2 text-sm"
              style={{ borderColor: colors.surface.border, backgroundColor: colors.surface.card }}
              value={jobId}
              onChange={(e) => handleJobChange(e.target.value)}
            >
              <option value="">Generic resume health only</option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title}
                  {j.company_name ? ` · ${j.company_name}` : ""}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <StatCard
            label="Resume Health"
            value={`${data.resume_health_score}/100`}
            description="Completeness, structure, content, skills, experience, parsing signals"
          />
          {data.job_match ? (
            <StatCard
              label="Job Match"
              value={`${data.job_match.overall_score}/100`}
              description={data.job_match.disclaimer || "Independent compatibility score (matcher v2)."}
            />
          ) : null}
        </div>
      </ContentCard>

      <ContentCard title="Score components">
        <ul className="grid gap-2 sm:grid-cols-2">
          {[
            ["Completeness", data.components.completeness],
            ["Structure", data.components.structure],
            ["Content quality", data.components.content_quality],
            ["Skills quality", data.components.skills_quality],
            [
              "Experience quality",
              data.components.experience_available ? data.components.experience_quality : "N/A",
            ],
            ["Project quality", data.components.projects_available ? data.components.project_quality : "N/A"],
            ["Parsing readiness", data.components.parsing_readiness],
            ["Impact signals", data.components.impact_signals],
          ].map(([label, value]) => (
            <li
              key={String(label)}
              style={{ fontSize: textStyles.bodySmall.fontSize, color: colors.surface.foregroundMuted }}
            >
              <strong style={{ color: colors.surface.foreground }}>{label}:</strong> {value}
            </li>
          ))}
        </ul>
      </ContentCard>

      <ContentCard title="Section completeness">
        <ul className="flex flex-col" style={{ gap: spacing[2] }}>
          {sectionEntries.map(([key, status]) => (
            <li key={key} style={{ fontSize: textStyles.bodySmall.fontSize }}>
              <span style={{ textTransform: "capitalize", fontWeight: 600 }}>{key.replace("_", " ")}</span>
              {" — "}
              {status.strength ?? (status.detected ? "detected" : "missing")}
              {status.evidence ? (
                <span style={{ color: colors.surface.foregroundMuted }}> ({status.evidence})</span>
              ) : null}
            </li>
          ))}
        </ul>
      </ContentCard>

      {data.parsing_risks?.length ? (
        <ContentCard title="ATS parsing risk signals">
          <ul className="flex flex-col" style={{ gap: spacing[2] }}>
            {data.parsing_risks.map((risk) => (
              <li key={risk.title} style={{ fontSize: textStyles.bodySmall.fontSize }}>
                <span style={{ fontWeight: 600 }}>[{risk.level}]</span> {risk.title}: {risk.detail}
              </li>
            ))}
          </ul>
        </ContentCard>
      ) : null}

      {data.impact?.summary ? (
        <ContentCard title="Impact signals">
          <p style={{ fontSize: textStyles.bodySmall.fontSize, color: colors.surface.foregroundMuted }}>
            {data.impact.summary}
          </p>
          {data.impact.measurable_signals?.length ? (
            <p style={{ fontSize: textStyles.caption.fontSize, marginTop: spacing[2] }}>
              Detected: {data.impact.measurable_signals.join(", ")}
            </p>
          ) : null}
        </ContentCard>
      ) : null}

      {data.keywords?.mode === "job_specific" ? (
        <ContentCard title="Job terminology alignment">
          {data.keywords.missing_required_terms?.length ? (
            <p style={{ fontSize: textStyles.bodySmall.fontSize }}>
              Missing required: {data.keywords.missing_required_terms.join(", ")}
            </p>
          ) : (
            <p style={{ fontSize: textStyles.bodySmall.fontSize }}>No required term gaps detected.</p>
          )}
          {data.keywords.missing_preferred_terms?.length ? (
            <p style={{ fontSize: textStyles.bodySmall.fontSize, marginTop: spacing[2] }}>
              Missing preferred: {data.keywords.missing_preferred_terms.join(", ")}
            </p>
          ) : null}
        </ContentCard>
      ) : data.keywords?.career_keywords?.length ? (
        <ContentCard title="Career keywords (from resume)">
          <p style={{ fontSize: textStyles.bodySmall.fontSize }}>{data.keywords.career_keywords.join(", ")}</p>
        </ContentCard>
      ) : null}

      {data.recommendations?.length ? (
        <ContentCard title="Recommendations">
          <ul className="flex flex-col" style={{ gap: spacing[3] }}>
            {data.recommendations.map((rec, idx) => (
              <li
                key={`${rec.title}-${idx}`}
                style={{
                  borderLeft: `3px solid ${severityColor(rec.severity)}`,
                  paddingLeft: spacing[3],
                  fontSize: textStyles.bodySmall.fontSize,
                }}
              >
                <div style={{ fontWeight: 600 }}>
                  [{rec.category}] {rec.title}{" "}
                  <span style={{ color: severityColor(rec.severity), fontWeight: 500 }}>({rec.severity})</span>
                </div>
                <p style={{ color: colors.surface.foregroundMuted, marginTop: spacing[1] }}>{rec.explanation}</p>
                {rec.evidence ? (
                  <p style={{ color: colors.surface.foregroundMuted, fontSize: textStyles.caption.fontSize }}>
                    Evidence: {rec.evidence}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </ContentCard>
      ) : null}
    </div>
  );
}
