"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { ContentCard } from "@/components/dashboard/ContentCard";
import { StatCard } from "@/components/dashboard/StatCard";
import { CreateApplicationForm } from "@/components/applications/CreateApplicationForm";
import { colors } from "@/constants/colors";
import { spacing } from "@/constants/spacing";
import { textStyles } from "@/constants/typography";
import { fetchApplications, updateApplication } from "@/services/api";
import type { ApplicationListResponse, ApplicationSummary } from "@/types/api";

const PIPELINE_STATUSES = [
  "SAVED",
  "APPLIED",
  "SCREENING",
  "INTERVIEW",
  "OFFER",
  "REJECTED",
  "WITHDRAWN",
] as const;

type Props = {
  initialJobId?: string;
  initialResumeId?: string;
};

export function ApplicationsBoard({ initialJobId, initialResumeId }: Props) {
  const [data, setData] = useState<ApplicationListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(Boolean(initialJobId || initialResumeId));

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchApplications({
        status: statusFilter || undefined,
        search: search.trim() || undefined,
      });
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load applications.");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await fetchApplications({
          status: statusFilter || undefined,
          search: search.trim() || undefined,
        });
        if (!cancelled) setData(result);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load applications.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [search, statusFilter]);

  async function changeStatus(app: ApplicationSummary, status: string) {
    try {
      await updateApplication(app.id, { status });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Status update failed.");
    }
  }

  const stats = data?.statistics;
  const items = data?.items ?? [];

  return (
    <div className="flex flex-col" style={{ gap: spacing[6] }}>
      {stats ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total" value={stats.total} />
          <StatCard label="Applied" value={stats.applied} />
          <StatCard label="Interview" value={stats.interview} />
          <StatCard label="Upcoming follow-ups" value={stats.upcoming_follow_ups} />
        </div>
      ) : null}

      <ContentCard title="Pipeline">
        <div className="mb-4 flex flex-wrap gap-2">
          <input
            className="rounded-md border px-3 py-2 text-sm"
            placeholder="Search title, company, notes…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="rounded-md border px-3 py-2 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All statuses</option>
            {PIPELINE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="rounded-md border px-3 py-2 text-sm"
            onClick={() => setShowCreate((v) => !v)}
          >
            {showCreate ? "Hide form" : "New application"}
          </button>
        </div>

        {showCreate ? (
          <CreateApplicationForm
            initialJobId={initialJobId}
            initialResumeId={initialResumeId}
            onCreated={() => {
              setShowCreate(false);
              void load();
            }}
          />
        ) : null}

        {loading && !data ? (
          <p style={{ color: colors.surface.foregroundMuted }}>Loading…</p>
        ) : error ? (
          <p style={{ color: colors.semantic.error }}>{error}</p>
        ) : items.length === 0 ? (
          <div style={{ fontSize: textStyles.bodySmall.fontSize }}>
            <p>No applications yet.</p>
            <ul className="mt-2 list-disc pl-5">
              <li>
                <Link href="/dashboard/jobs">Browse jobs</Link>
              </li>
              <li>
                <Link href="/dashboard/analyze">Analyze a job</Link>
              </li>
              <li>
                <button type="button" className="underline" onClick={() => setShowCreate(true)}>
                  Create application
                </button>
              </li>
            </ul>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-4 xl:grid-cols-7">
            {PIPELINE_STATUSES.map((column) => (
              <section key={column} aria-label={column}>
                <h3 style={{ fontSize: textStyles.label.fontSize, fontWeight: 600, marginBottom: spacing[2] }}>
                  {column}
                  <span style={{ color: colors.surface.foregroundMuted, marginLeft: spacing[1] }}>
                    ({items.filter((i) => i.status === column).length})
                  </span>
                </h3>
                <ul className="flex flex-col" style={{ gap: spacing[2] }}>
                  {items
                    .filter((i) => i.status === column)
                    .map((app) => (
                      <li
                        key={app.id}
                        style={{
                          border: `1px solid ${colors.surface.border}`,
                          borderRadius: 8,
                          padding: spacing[3],
                          backgroundColor: colors.surface.card,
                        }}
                      >
                        <Link href={`/dashboard/applications/${app.id}`} style={{ fontWeight: 600 }}>
                          {app.job.title}
                        </Link>
                        <p style={{ fontSize: textStyles.caption.fontSize, color: colors.surface.foregroundMuted }}>
                          {app.job.company_name ?? "Company"} · {app.resume.name}
                        </p>
                        {app.latest_job_match_score != null ? (
                          <p style={{ fontSize: textStyles.caption.fontSize }}>Match: {app.latest_job_match_score}/100</p>
                        ) : null}
                        <label className="mt-2 flex flex-col gap-1">
                          <span className="sr-only">Change status</span>
                          <select
                            className="rounded border px-2 py-1 text-xs"
                            value={app.status}
                            onChange={(e) => void changeStatus(app, e.target.value)}
                          >
                            {PIPELINE_STATUSES.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        </label>
                      </li>
                    ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </ContentCard>
    </div>
  );
}
