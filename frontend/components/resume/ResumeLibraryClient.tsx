"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import { colors } from "@/constants/colors";
import { radius } from "@/constants/radius";
import { spacing } from "@/constants/spacing";
import { textStyles } from "@/constants/typography";
import { uploadResume } from "@/services/api";
import type { ResumeSummary } from "@/types/api";

const ACCEPT = ".pdf,.docx";

type Props = {
  initialResumes: ResumeSummary[];
};

export function ResumeLibraryClient({ initialResumes }: Props) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onUpload = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      setError(null);
      if (!file) {
        setError("Choose a PDF or DOCX file to upload.");
        return;
      }
      setLoading(true);
      try {
        const created = await uploadResume(file, name || undefined);
        router.push(`/dashboard/resumes/${created.id}`);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed.");
      } finally {
        setLoading(false);
      }
    },
    [file, name, router],
  );

  return (
    <div className="flex flex-col" style={{ gap: spacing[6] }}>
      <form
        className="flex flex-col"
        onSubmit={onUpload}
        style={{
          gap: spacing[4],
          border: `1px solid ${colors.surface.border}`,
          borderRadius: radius.large,
          padding: spacing[5],
          backgroundColor: colors.surface.background,
        }}
      >
        <h2 style={{ fontSize: textStyles.h3.fontSize, fontWeight: textStyles.h3.fontWeight }}>Upload resume</h2>
        <label className="flex flex-col" style={{ gap: spacing[2] }}>
          <span style={{ fontSize: textStyles.label.fontSize }}>Display name (optional)</span>
          <input
            className="rounded-lg border px-3 py-2"
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Software Engineer Resume"
            style={{ borderColor: colors.surface.border }}
            type="text"
            value={name}
          />
        </label>
        <input accept={ACCEPT} onChange={(e) => setFile(e.target.files?.[0] ?? null)} type="file" />
        {error ? (
          <p role="alert" style={{ color: colors.semantic.error, fontSize: textStyles.bodySmall.fontSize }}>
            {error}
          </p>
        ) : null}
        <button
          className="self-start rounded-lg px-4 py-2 font-medium disabled:opacity-60"
          disabled={loading}
          style={{ backgroundColor: colors.brand.DEFAULT, color: colors.brand.foreground }}
          type="submit"
        >
          {loading ? "Uploading…" : "Upload to library"}
        </button>
      </form>

      {initialResumes.length === 0 ? (
        <p style={{ color: colors.surface.foregroundMuted, fontSize: textStyles.bodySmall.fontSize }}>
          No resumes yet — upload your resume to build your profile.
        </p>
      ) : (
        <ul className="flex flex-col" style={{ gap: spacing[3] }}>
          {initialResumes.map((resume) => (
            <li
              key={resume.id}
              style={{
                border: `1px solid ${colors.surface.border}`,
                borderRadius: radius.medium,
                padding: spacing[4],
                backgroundColor: colors.surface.background,
              }}
            >
              <Link href={`/dashboard/resumes/${resume.id}`} style={{ color: colors.brand.accent, fontWeight: 600 }}>
                {resume.name}
              </Link>
              <p style={{ color: colors.surface.foregroundMuted, fontSize: textStyles.caption.fontSize }}>
                {resume.original_filename} · {resume.skills_count} skills · Updated{" "}
                {new Date(resume.updated_at).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
