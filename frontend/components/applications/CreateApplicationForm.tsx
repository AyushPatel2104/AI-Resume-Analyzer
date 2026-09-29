"use client";

import { useEffect, useState } from "react";

import { colors } from "@/constants/colors";
import { spacing } from "@/constants/spacing";
import { textStyles } from "@/constants/typography";
import { createApplication, fetchJobs, fetchResumes } from "@/services/api";
import type { JobSummary, ResumeSummary } from "@/types/api";

const STATUSES = ["SAVED", "APPLIED", "SCREENING", "INTERVIEW", "OFFER", "REJECTED", "WITHDRAWN"];
const SOURCES = ["LINKEDIN", "COMPANY_WEBSITE", "INDEED", "REFERRAL", "UNIVERSITY", "OTHER"];

type Props = {
  initialJobId?: string;
  initialResumeId?: string;
  onCreated?: () => void;
};

export function CreateApplicationForm({ initialJobId, initialResumeId, onCreated }: Props) {
  const [resumes, setResumes] = useState<ResumeSummary[]>([]);
  const [jobs, setJobs] = useState<JobSummary[]>([]);
  const [resumeId, setResumeId] = useState(initialResumeId ?? "");
  const [jobId, setJobId] = useState(initialJobId ?? "");
  const [status, setStatus] = useState("SAVED");
  const [source, setSource] = useState("");
  const [notes, setNotes] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void Promise.all([fetchResumes(), fetchJobs()]).then(([r, j]) => {
      setResumes(r);
      setJobs(j);
      setResumeId((prev) => prev || initialResumeId || r[0]?.id || "");
      setJobId((prev) => prev || initialJobId || j[0]?.id || "");
    });
  }, [initialJobId, initialResumeId]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!jobId || !resumeId) return;
    setBusy(true);
    setError(null);
    try {
      await createApplication({
        job_id: jobId,
        resume_id: resumeId,
        status,
        source: source || undefined,
        notes: notes || undefined,
        follow_up_date: followUpDate || undefined,
      });
      onCreated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create application.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mb-6 flex flex-col rounded-md border p-4" style={{ gap: spacing[3] }}>
      <h3 style={{ fontSize: textStyles.label.fontSize, fontWeight: 600 }}>Create application</h3>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          Job
          <select className="rounded border px-2 py-2" value={jobId} onChange={(e) => setJobId(e.target.value)}>
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.title} {j.company_name ? `· ${j.company_name}` : ""}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Resume
          <select className="rounded border px-2 py-2" value={resumeId} onChange={(e) => setResumeId(e.target.value)}>
            {resumes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Status
          <select className="rounded border px-2 py-2" value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Source
          <select className="rounded border px-2 py-2" value={source} onChange={(e) => setSource(e.target.value)}>
            <option value="">Optional</option>
            {SOURCES.map((s) => (
              <option key={s} value={s}>
                {s.replace("_", " ")}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Follow-up date
          <input
            type="date"
            className="rounded border px-2 py-2"
            value={followUpDate}
            onChange={(e) => setFollowUpDate(e.target.value)}
          />
        </label>
      </div>
      <label className="flex flex-col gap-1 text-sm">
        Notes
        <textarea className="min-h-20 rounded border px-2 py-2" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </label>
      <button
        type="submit"
        disabled={busy || !jobId || !resumeId}
        className="self-start rounded-md px-4 py-2 text-sm font-medium disabled:opacity-60"
        style={{ backgroundColor: colors.brand.DEFAULT, color: colors.brand.foreground }}
      >
        {busy ? "Saving…" : "Create"}
      </button>
      {error ? <p style={{ color: colors.semantic.error, fontSize: textStyles.caption.fontSize }}>{error}</p> : null}
    </form>
  );
}
