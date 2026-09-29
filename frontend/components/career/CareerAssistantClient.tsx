"use client";

import { useCallback, useEffect, useState } from "react";

import { ContentCard } from "@/components/dashboard/ContentCard";
import { StatCard } from "@/components/dashboard/StatCard";
import { colors } from "@/constants/colors";
import { spacing } from "@/constants/spacing";
import { textStyles } from "@/constants/typography";
import {
  careerAsk,
  careerReview,
  careerRewriteBullet,
  careerRewriteProject,
  careerRewriteSummary,
  careerSkills,
  fetchJobs,
  fetchResumes,
} from "@/services/api";
import type {
  CareerAskResponse,
  CareerReviewResponse,
  JobSummary,
  ResumeSummary,
  RewriteResponse,
} from "@/types/api";

type Action =
  | "review"
  | "review_job"
  | "summary"
  | "bullet"
  | "project"
  | "skills"
  | "ask";

export function CareerAssistantClient() {
  const [resumes, setResumes] = useState<ResumeSummary[]>([]);
  const [jobs, setJobs] = useState<JobSummary[]>([]);
  const [resumeId, setResumeId] = useState("");
  const [jobId, setJobId] = useState("");
  const [action, setAction] = useState<Action>("review");
  const [selectedText, setSelectedText] = useState("");
  const [askMessage, setAskMessage] = useState("Why am I not matching this job?");
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [review, setReview] = useState<CareerReviewResponse | null>(null);
  const [rewrite, setRewrite] = useState<RewriteResponse | null>(null);
  const [askResult, setAskResult] = useState<CareerAskResponse | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [r, j] = await Promise.all([fetchResumes(), fetchJobs()]);
        if (cancelled) return;
        setResumes(r);
        setJobs(j);
        if (r.length > 0) setResumeId(r[0].id);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load data.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const run = useCallback(async () => {
    if (!resumeId) return;
    setRunning(true);
    setError(null);
    setReview(null);
    setRewrite(null);
    setAskResult(null);
    const job = jobId || undefined;
    try {
      if (action === "review") {
        setReview(await careerReview(resumeId));
      } else if (action === "review_job") {
        if (!job) throw new Error("Select a job for job-specific review.");
        setReview(await careerReview(resumeId, job));
      } else if (action === "summary") {
        setRewrite(await careerRewriteSummary(resumeId, job));
      } else if (action === "bullet") {
        if (selectedText.trim().length < 8) throw new Error("Paste an experience bullet from your resume.");
        setRewrite(await careerRewriteBullet(resumeId, selectedText.trim(), job));
      } else if (action === "project") {
        if (selectedText.trim().length < 8) throw new Error("Paste a project description from your resume.");
        setRewrite(await careerRewriteProject(resumeId, selectedText.trim(), job));
      } else if (action === "skills") {
        setRewrite(await careerSkills(resumeId, job));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed.");
    } finally {
      setRunning(false);
    }
  }, [action, jobId, resumeId, selectedText]);

  async function handleAsk() {
    if (!resumeId) return;
    setRunning(true);
    setError(null);
    setReview(null);
    setRewrite(null);
    setAskResult(null);
    try {
      const result = await careerAsk(resumeId, askMessage.trim(), jobId || undefined);
      setAskResult(result);
      if (result.review) setReview(result.review);
      if (result.rewrite) setRewrite(result.rewrite);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed.");
    } finally {
      setRunning(false);
    }
  }

  async function copyText(text: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* ignore */
    }
  }

  if (loading) {
    return <p style={{ color: colors.surface.foregroundMuted }}>Loading resumes and jobs…</p>;
  }

  return (
    <div className="flex flex-col" style={{ gap: spacing[6] }}>
      <ContentCard title="Career Assistant" description="Fact-safe guidance from your stored resume and optional job.">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span style={{ fontSize: textStyles.caption.fontSize }}>Resume</span>
            <select
              className="rounded-md border px-3 py-2 text-sm"
              value={resumeId}
              onChange={(e) => setResumeId(e.target.value)}
            >
              {resumes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span style={{ fontSize: textStyles.caption.fontSize }}>Job (optional)</span>
            <select
              className="rounded-md border px-3 py-2 text-sm"
              value={jobId}
              onChange={(e) => setJobId(e.target.value)}
            >
              <option value="">None</option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {(
            [
              ["review", "Review Resume"],
              ["review_job", "Review for Job"],
              ["summary", "Improve Summary"],
              ["bullet", "Improve Bullet"],
              ["project", "Improve Project"],
              ["skills", "Improve Skills"],
              ["ask", "Ask (grounded)"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className="rounded-md border px-3 py-2 text-sm"
              style={{
                borderColor: action === id ? colors.brand.accent : colors.surface.border,
                backgroundColor: action === id ? colors.brand.accentMuted : colors.surface.card,
              }}
              onClick={() => setAction(id)}
            >
              {label}
            </button>
          ))}
        </div>

        {(action === "bullet" || action === "project") && (
          <textarea
            className="mt-4 w-full rounded-md border p-3 text-sm"
            placeholder="Paste exact text from your stored resume…"
            rows={4}
            value={selectedText}
            onChange={(e) => setSelectedText(e.target.value)}
          />
        )}

        {action === "ask" && (
          <textarea
            className="mt-4 w-full rounded-md border p-3 text-sm"
            rows={3}
            value={askMessage}
            onChange={(e) => setAskMessage(e.target.value)}
          />
        )}

        <button
          type="button"
          className="mt-4 rounded-md px-4 py-2 text-sm font-medium"
          style={{ backgroundColor: colors.brand.DEFAULT, color: colors.brand.foreground }}
          disabled={running || !resumeId}
          onClick={() => (action === "ask" ? void handleAsk() : void run())}
        >
          {running ? "Working…" : "Run"}
        </button>

        {error ? (
          <p className="mt-3" style={{ color: colors.semantic.error, fontSize: textStyles.bodySmall.fontSize }}>
            {error}
          </p>
        ) : null}
      </ContentCard>

      {review ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <StatCard label="Resume Health" value={`${review.resume_health_score}/100`} />
            {review.job_match_score != null ? (
              <StatCard label="Job Match" value={`${review.job_match_score}/100`} />
            ) : null}
          </div>
          <ContentCard title="Priority improvements">
            <AssistantItemList items={review.priority_improvements} />
          </ContentCard>
          <ContentCard title="Strengths">
            <AssistantItemList items={review.strengths} />
          </ContentCard>
          <ContentCard title="Weak areas">
            <AssistantItemList items={review.weaknesses} />
          </ContentCard>
        </>
      ) : null}

      {rewrite ? <RewritePanel rewrite={rewrite} onCopy={copyText} /> : null}

      {askResult ? (
        <ContentCard title="Assistant answer">
          <p style={{ fontSize: textStyles.bodySmall.fontSize }}>{askResult.answer}</p>
          <p style={{ fontSize: textStyles.caption.fontSize, color: colors.surface.foregroundMuted }}>
            Intent: {askResult.intent} · Provider: {askResult.provider}
          </p>
        </ContentCard>
      ) : null}

      <p style={{ fontSize: textStyles.caption.fontSize, color: colors.surface.foregroundMuted }}>
        Suggestions do not overwrite your saved resume. See also{" "}
        <a href={`/dashboard/resumes/${resumeId}`}>Resume Intelligence</a> on the resume detail page.
      </p>
    </div>
  );
}

function AssistantItemList({ items }: { items: CareerReviewResponse["priority_improvements"] }) {
  if (!items.length) return <p style={{ color: colors.surface.foregroundMuted }}>None</p>;
  return (
    <ul className="flex flex-col" style={{ gap: spacing[3] }}>
      {items.map((item, idx) => (
        <li key={`${item.title}-${idx}`} style={{ fontSize: textStyles.bodySmall.fontSize }}>
          <strong>
            [{item.severity}] {item.title}
          </strong>
          <p style={{ color: colors.surface.foregroundMuted }}>{item.why_it_matters}</p>
          <p style={{ fontSize: textStyles.caption.fontSize }}>Evidence: {item.evidence}</p>
          <p style={{ fontSize: textStyles.caption.fontSize }}>Action: {item.suggested_action}</p>
        </li>
      ))}
    </ul>
  );
}

function RewritePanel({ rewrite, onCopy }: { rewrite: RewriteResponse; onCopy: (t: string) => void }) {
  return (
    <ContentCard title="Suggested rewrite">
      <p style={{ fontSize: textStyles.caption.fontSize, color: colors.surface.foregroundMuted }}>
        Existing fact (original)
      </p>
      <p style={{ fontSize: textStyles.bodySmall.fontSize }}>{rewrite.original}</p>
      <p className="mt-3" style={{ fontSize: textStyles.caption.fontSize, color: colors.brand.accent }}>
        Suggested wording
      </p>
      <p style={{ fontSize: textStyles.bodySmall.fontSize }}>{rewrite.rewritten}</p>
      <button
        type="button"
        className="mt-2 rounded-md border px-3 py-1 text-sm"
        onClick={() => onCopy(rewrite.rewritten)}
      >
        Copy suggestion
      </button>
      {rewrite.evidence_used.length ? (
        <p className="mt-3" style={{ fontSize: textStyles.caption.fontSize }}>
          Evidence used: {rewrite.evidence_used.join(", ")}
        </p>
      ) : null}
      {rewrite.missing_information.length ? (
        <p style={{ fontSize: textStyles.caption.fontSize, color: colors.semantic.warning }}>
          Missing information: {rewrite.missing_information.join(" ")}
        </p>
      ) : null}
      {rewrite.changes.length ? (
        <ul className="mt-2 list-disc pl-5" style={{ fontSize: textStyles.caption.fontSize }}>
          {rewrite.changes.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      ) : null}
    </ContentCard>
  );
}
