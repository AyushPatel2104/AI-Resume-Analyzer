"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ContentCard } from "@/components/dashboard/ContentCard";
import { StatCard } from "@/components/dashboard/StatCard";
import { colors } from "@/constants/colors";
import { spacing } from "@/constants/spacing";
import { textStyles } from "@/constants/typography";
import { deleteApplication, updateApplication } from "@/services/api";
import type { ApplicationDetail } from "@/types/api";

const STATUSES = ["SAVED", "APPLIED", "SCREENING", "INTERVIEW", "OFFER", "REJECTED", "WITHDRAWN"];

type Props = {
  initial: ApplicationDetail;
};

export function ApplicationDetailClient({ initial }: Props) {
  const router = useRouter();
  const [app, setApp] = useState(initial);
  const [status, setStatus] = useState(initial.status);
  const [notes, setNotes] = useState(initial.notes ?? "");
  const [followUpDate, setFollowUpDate] = useState(initial.follow_up_date ?? "");
  const [source, setSource] = useState(initial.source ?? "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    setError(null);
    try {
      const updated = await updateApplication(app.id, {
        status,
        notes,
        follow_up_date: followUpDate || null,
        source: source || null,
      });
      setApp(updated);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed.");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!window.confirm("Delete this application record?")) return;
    setBusy(true);
    try {
      await deleteApplication(app.id);
      router.push("/dashboard/applications");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed.");
      setBusy(false);
    }
  }

  const analysis = app.analysis;

  return (
    <div className="flex flex-col" style={{ gap: spacing[6] }}>
      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard
          label="Resume Health"
          value={analysis.resume_health_score != null ? `${analysis.resume_health_score}/100` : "Unavailable"}
        />
        <StatCard
          label="Job Match"
          value={analysis.job_match_score != null ? `${analysis.job_match_score}/100` : "No analysis yet"}
        />
      </div>
      <p style={{ fontSize: textStyles.caption.fontSize, color: colors.surface.foregroundMuted }}>
        {analysis.scores_note}
      </p>

      <ContentCard title="Application">
        <div className="grid gap-3 md:grid-cols-2">
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
            Follow-up date
            <input
              type="date"
              className="rounded border px-2 py-2"
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm md:col-span-2">
            Source
            <input className="rounded border px-2 py-2" value={source} onChange={(e) => setSource(e.target.value)} />
          </label>
          <label className="flex flex-col gap-1 text-sm md:col-span-2">
            Notes
            <textarea className="min-h-28 rounded border px-2 py-2" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </label>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => void save()}
            className="rounded-md px-4 py-2 text-sm font-medium"
            style={{ backgroundColor: colors.brand.DEFAULT, color: colors.brand.foreground }}
          >
            Save changes
          </button>
          <button type="button" disabled={busy} className="rounded-md border px-4 py-2 text-sm" onClick={() => void remove()}>
            Delete
          </button>
        </div>
        {error ? <p className="mt-2" style={{ color: colors.semantic.error }}>{error}</p> : null}
      </ContentCard>

      <ContentCard title="Linked job & resume">
        <p style={{ fontSize: textStyles.bodySmall.fontSize }}>
          <strong>{app.job.title}</strong> — {app.job.company_name ?? "Company"}
        </p>
        {app.job.source_url ? (
          <a href={app.job.source_url} rel="noreferrer" target="_blank" style={{ fontSize: textStyles.caption.fontSize }}>
            Job posting
          </a>
        ) : null}
        <p className="mt-2" style={{ fontSize: textStyles.bodySmall.fontSize }}>
          Resume: <Link href={`/dashboard/resumes/${app.resume.id}`}>{app.resume.name}</Link>
        </p>
        <div className="mt-3 flex flex-wrap gap-3" style={{ fontSize: textStyles.caption.fontSize }}>
          {analysis.analysis_id ? (
            <Link href={`/dashboard/results/${analysis.analysis_id}`}>View match analysis</Link>
          ) : (
            <Link href={`/dashboard/analyze?resume=${app.resume.id}&job=${app.job.id}`}>Run analysis</Link>
          )}
          <Link href={`/dashboard/career-assistant?resume=${app.resume.id}&job=${app.job.id}`}>Career Assistant</Link>
          <Link href={`/dashboard/resumes/${app.resume.id}`}>Resume Intelligence</Link>
        </div>
      </ContentCard>
    </div>
  );
}
