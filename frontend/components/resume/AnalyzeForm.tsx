"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { colors } from "@/constants/colors";
import { radius } from "@/constants/radius";
import { spacing } from "@/constants/spacing";
import { textStyles } from "@/constants/typography";
import { analyzeWithResumeAndJob, fetchJobs, fetchResumes } from "@/services/api";
import type { JobSummary, ResumeSummary } from "@/types/api";

export function AnalyzeForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedResume = searchParams.get("resume");
  const preselectedJob = searchParams.get("job");

  const [resumes, setResumes] = useState<ResumeSummary[]>([]);
  const [jobs, setJobs] = useState<JobSummary[]>([]);
  const [resumeId, setResumeId] = useState(preselectedResume ?? "");
  const [jobId, setJobId] = useState(preselectedJob ?? "");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [resumeList, jobList] = await Promise.all([fetchResumes(), fetchJobs()]);
        if (cancelled) return;
        setResumes(resumeList);
        setJobs(jobList);
        if (preselectedResume && resumeList.some((r) => r.id === preselectedResume)) {
          setResumeId(preselectedResume);
        } else if (resumeList.length > 0 && !resumeId) {
          setResumeId(resumeList[0].id);
        }
        if (preselectedJob && jobList.some((j) => j.id === preselectedJob)) {
          setJobId(preselectedJob);
        } else if (jobList.length > 0 && !jobId) {
          setJobId(jobList[0].id);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load resumes or jobs.");
        }
      } finally {
        if (!cancelled) setLoadingData(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [preselectedJob, preselectedResume, jobId, resumeId]);

  const onSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      setError(null);
      if (!resumeId) {
        setError("Select a resume from your library.");
        return;
      }
      if (!jobId) {
        setError("Select a saved job.");
        return;
      }
      setLoading(true);
      try {
        const result = await analyzeWithResumeAndJob(resumeId, jobId);
        router.push(`/dashboard/results/${result.analysis_id}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Analysis failed.");
      } finally {
        setLoading(false);
      }
    },
    [jobId, resumeId, router],
  );

  return (
    <form className="flex flex-col" onSubmit={onSubmit} style={{ gap: spacing[6] }}>
      {loadingData ? (
        <p style={{ color: colors.surface.foregroundMuted, fontSize: textStyles.bodySmall.fontSize }}>Loading library…</p>
      ) : (
        <>
          <div className="flex flex-col" style={{ gap: spacing[2] }}>
            <label htmlFor="resume-select" style={{ fontSize: textStyles.label.fontSize, fontWeight: textStyles.label.fontWeight }}>
              Resume
            </label>
            {resumes.length === 0 ? (
              <p style={{ color: colors.surface.foregroundMuted, fontSize: textStyles.bodySmall.fontSize }}>
                <Link href="/dashboard/resumes" style={{ color: colors.brand.accent }}>
                  Upload a resume
                </Link>{" "}
                first.
              </p>
            ) : (
              <select
                className="w-full rounded-lg border px-3 py-2"
                id="resume-select"
                onChange={(e) => setResumeId(e.target.value)}
                style={{ borderColor: colors.surface.border }}
                value={resumeId}
              >
                {resumes.map((resume) => (
                  <option key={resume.id} value={resume.id}>
                    {resume.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="flex flex-col" style={{ gap: spacing[2] }}>
            <label htmlFor="job-select" style={{ fontSize: textStyles.label.fontSize, fontWeight: textStyles.label.fontWeight }}>
              Job
            </label>
            {jobs.length === 0 ? (
              <p style={{ color: colors.surface.foregroundMuted, fontSize: textStyles.bodySmall.fontSize }}>
                <Link href="/dashboard/jobs" style={{ color: colors.brand.accent }}>
                  Add a job
                </Link>{" "}
                to your library first.
              </p>
            ) : (
              <select
                className="w-full rounded-lg border px-3 py-2"
                id="job-select"
                onChange={(e) => setJobId(e.target.value)}
                style={{ borderColor: colors.surface.border }}
                value={jobId}
              >
                {jobs.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.title}
                    {job.company_name ? ` · ${job.company_name}` : ""}
                  </option>
                ))}
              </select>
            )}
          </div>
        </>
      )}

      {error ? (
        <p role="alert" style={{ color: colors.semantic.error, fontSize: textStyles.bodySmall.fontSize, padding: spacing[3], backgroundColor: colors.semantic.errorMuted, borderRadius: radius.medium }}>
          {error}
        </p>
      ) : null}

      <button
        className="inline-flex min-h-11 items-center justify-center px-6 disabled:opacity-60"
        disabled={loading || loadingData || resumes.length === 0 || jobs.length === 0}
        style={{ backgroundColor: colors.brand.DEFAULT, color: colors.brand.foreground, borderRadius: radius.large, fontWeight: 600, alignSelf: "flex-start" }}
        type="submit"
      >
        {loading ? "Analyzing…" : "Run analysis"}
      </button>
    </form>
  );
}
