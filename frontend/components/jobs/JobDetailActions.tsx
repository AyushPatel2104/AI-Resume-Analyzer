"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import { colors } from "@/constants/colors";
import { radius } from "@/constants/radius";
import { spacing } from "@/constants/spacing";
import { textStyles } from "@/constants/typography";
import { deleteJob, updateJob } from "@/services/api";

type Props = {
  jobId: string;
  initialTitle: string;
  initialCompany: string;
  initialDescription: string;
};

export function JobDetailActions({ jobId, initialTitle, initialCompany, initialDescription }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [company, setCompany] = useState(initialCompany);
  const [description, setDescription] = useState(initialDescription);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSave = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      setBusy(true);
      setError(null);
      try {
        await updateJob(jobId, {
          title: title.trim(),
          company_name: company.trim() || null,
          job_description: description.trim(),
        });
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Update failed.");
      } finally {
        setBusy(false);
      }
    },
    [company, description, jobId, router, title],
  );

  const onDelete = useCallback(async () => {
    if (!window.confirm("Delete this job? Linked analyses will also be removed.")) return;
    setBusy(true);
    try {
      await deleteJob(jobId);
      router.push("/dashboard/jobs");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed.");
      setBusy(false);
    }
  }, [jobId, router]);

  return (
    <div
      className="flex flex-col"
      style={{
        gap: spacing[4],
        border: `1px solid ${colors.surface.border}`,
        borderRadius: radius.large,
        padding: spacing[5],
        backgroundColor: colors.surface.backgroundSubtle,
      }}
    >
      <Link
        href={`/dashboard/applications?job=${jobId}`}
        style={{
          alignSelf: "flex-start",
          borderRadius: radius.medium,
          border: `1px solid ${colors.surface.border}`,
          color: colors.surface.foreground,
          paddingBlock: spacing[2],
          paddingInline: spacing[4],
          fontSize: textStyles.label.fontSize,
          fontWeight: 600,
        }}
      >
        Track application
      </Link>

      <Link
        href={`/dashboard/analyze?job=${jobId}`}
        style={{
          alignSelf: "flex-start",
          backgroundColor: colors.brand.DEFAULT,
          borderRadius: radius.medium,
          color: colors.brand.foreground,
          paddingBlock: spacing[2],
          paddingInline: spacing[4],
          fontSize: textStyles.label.fontSize,
          fontWeight: 600,
        }}
      >
        Analyze with a resume
      </Link>

      <form className="flex flex-col" onSubmit={onSave} style={{ gap: spacing[2] }}>
        <label style={{ fontSize: textStyles.label.fontSize }}>Edit job</label>
        <input className="rounded-lg border px-3 py-2" onChange={(e) => setTitle(e.target.value)} value={title} />
        <input className="rounded-lg border px-3 py-2" onChange={(e) => setCompany(e.target.value)} value={company} />
        <textarea className="min-h-32 rounded-lg border px-3 py-2" onChange={(e) => setDescription(e.target.value)} value={description} />
        <button className="self-start rounded-lg border px-3 py-2 disabled:opacity-60" disabled={busy} type="submit">
          Save changes
        </button>
      </form>

      <button
        className="self-start rounded-lg px-3 py-2 disabled:opacity-60"
        disabled={busy}
        onClick={onDelete}
        style={{ backgroundColor: colors.semantic.errorMuted, color: colors.semantic.error }}
        type="button"
      >
        Delete job
      </button>

      {error ? <p style={{ color: colors.semantic.error, fontSize: textStyles.caption.fontSize }}>{error}</p> : null}
    </div>
  );
}
