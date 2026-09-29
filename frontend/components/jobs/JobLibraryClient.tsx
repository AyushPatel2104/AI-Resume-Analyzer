"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import { colors } from "@/constants/colors";
import { radius } from "@/constants/radius";
import { spacing } from "@/constants/spacing";
import { textStyles } from "@/constants/typography";
import { createJob, previewJobImport } from "@/services/api";
import type { JobImportPreview, JobSummary } from "@/types/api";

type Props = {
  initialJobs: JobSummary[];
};

type Mode = "url" | "manual";

export function JobLibraryClient({ initialJobs }: Props) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("url");
  const [url, setUrl] = useState("");
  const [preview, setPreview] = useState<JobImportPreview | null>(null);
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onFetchPreview = useCallback(async () => {
    setError(null);
    setPreview(null);
    setLoading(true);
    try {
      const data = await previewJobImport(url.trim());
      setPreview(data);
      setTitle(data.title);
      setCompany(data.company_name ?? "");
      setDescription(data.job_description);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not import job URL.");
    } finally {
      setLoading(false);
    }
  }, [url]);

  const onSave = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const created = await createJob({
        title: title.trim(),
        company_name: company.trim() || null,
        job_description: description.trim(),
        source_url: preview?.source_url ?? null,
      });
      router.push(`/dashboard/jobs/${created.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save job.");
    } finally {
      setLoading(false);
    }
  }, [company, description, preview, router, title]);

  return (
    <div className="flex flex-col" style={{ gap: spacing[6] }}>
      <div className="flex gap-2">
        {(["url", "manual"] as Mode[]).map((value) => (
          <button
            key={value}
            className="rounded-lg px-3 py-2"
            onClick={() => {
              setMode(value);
              setError(null);
              setPreview(null);
            }}
            style={{
              backgroundColor: mode === value ? colors.brand.accentMuted : colors.surface.backgroundSubtle,
              color: mode === value ? colors.brand.accent : colors.surface.foregroundMuted,
              fontSize: textStyles.bodySmall.fontSize,
            }}
            type="button"
          >
            {value === "url" ? "Import from URL" : "Add manually"}
          </button>
        ))}
      </div>

      <div
        style={{
          border: `1px solid ${colors.surface.border}`,
          borderRadius: radius.large,
          padding: spacing[5],
          backgroundColor: colors.surface.background,
        }}
      >
        {mode === "url" ? (
          <div className="flex flex-col" style={{ gap: spacing[3] }}>
            <label style={{ fontSize: textStyles.label.fontSize }}>Job posting URL</label>
            <input
              className="rounded-lg border px-3 py-2"
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://company.com/careers/role"
              style={{ borderColor: colors.surface.border }}
              type="url"
              value={url}
            />
            <button
              className="self-start rounded-lg px-4 py-2 disabled:opacity-60"
              disabled={loading || !url.trim()}
              onClick={onFetchPreview}
              style={{ backgroundColor: colors.brand.DEFAULT, color: colors.brand.foreground }}
              type="button"
            >
              {loading ? "Fetching…" : "Fetch & preview"}
            </button>
          </div>
        ) : (
          <div className="flex flex-col" style={{ gap: spacing[3] }}>
            <input
              className="rounded-lg border px-3 py-2"
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Job title"
              style={{ borderColor: colors.surface.border }}
              value={title}
            />
            <input
              className="rounded-lg border px-3 py-2"
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Company (optional)"
              style={{ borderColor: colors.surface.border }}
              value={company}
            />
            <textarea
              className="min-h-40 rounded-lg border px-3 py-2"
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Job description"
              style={{ borderColor: colors.surface.border }}
              value={description}
            />
          </div>
        )}

        {(preview || mode === "manual") && title && description ? (
          <div className="flex flex-col" style={{ gap: spacing[3], marginTop: spacing[4] }}>
            <h3 style={{ fontSize: textStyles.label.fontSize, fontWeight: 600 }}>Confirm & save</h3>
            <p style={{ fontSize: textStyles.bodySmall.fontSize, color: colors.surface.foregroundMuted }}>
              {title}
              {company ? ` · ${company}` : ""}
            </p>
            <textarea
              className="min-h-32 rounded-lg border px-3 py-2"
              onChange={(e) => setDescription(e.target.value)}
              style={{ borderColor: colors.surface.border }}
              value={description}
            />
            <button
              className="self-start rounded-lg px-4 py-2 disabled:opacity-60"
              disabled={loading}
              onClick={onSave}
              style={{ backgroundColor: colors.brand.accent, color: colors.brand.foreground }}
              type="button"
            >
              {loading ? "Saving…" : "Save job"}
            </button>
          </div>
        ) : null}

        {error ? (
          <p role="alert" style={{ color: colors.semantic.error, marginTop: spacing[3], fontSize: textStyles.bodySmall.fontSize }}>
            {error}
          </p>
        ) : null}
      </div>

      {initialJobs.length === 0 ? (
        <p style={{ color: colors.surface.foregroundMuted, fontSize: textStyles.bodySmall.fontSize }}>No saved jobs yet.</p>
      ) : (
        <ul className="flex flex-col" style={{ gap: spacing[3] }}>
          {initialJobs.map((job) => (
            <li
              key={job.id}
              style={{
                border: `1px solid ${colors.surface.border}`,
                borderRadius: radius.medium,
                padding: spacing[4],
                backgroundColor: colors.surface.background,
              }}
            >
              <Link href={`/dashboard/jobs/${job.id}`} style={{ color: colors.brand.accent, fontWeight: 600 }}>
                {job.title}
              </Link>
              <p style={{ color: colors.surface.foregroundMuted, fontSize: textStyles.caption.fontSize }}>
                {job.company_name ?? "Company not specified"}
                {job.source_url ? " · Imported" : " · Manual"}
                {" · "}
                {new Date(job.updated_at).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
