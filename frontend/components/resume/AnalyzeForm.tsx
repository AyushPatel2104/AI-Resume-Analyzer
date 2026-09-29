"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import { colors } from "@/constants/colors";
import { radius } from "@/constants/radius";
import { spacing } from "@/constants/spacing";
import { textStyles } from "@/constants/typography";
import { analyzeResume } from "@/services/api";

const ACCEPT = ".pdf,.docx";

export function AnalyzeForm() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      setError(null);

      if (!file) {
        setError("Please upload a PDF or DOCX resume.");
        return;
      }
      if (jobDescription.trim().length < 30) {
        setError("Job description must be at least 30 characters.");
        return;
      }

      setLoading(true);
      try {
        const result = await analyzeResume(file, jobDescription.trim());
        router.push(`/dashboard/results/${result.analysis_id}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Analysis failed.");
      } finally {
        setLoading(false);
      }
    },
    [file, jobDescription, router],
  );

  return (
    <form className="flex flex-col" onSubmit={onSubmit} style={{ gap: spacing[6] }}>
      <div className="flex flex-col" style={{ gap: spacing[2] }}>
        <label
          htmlFor="resume-upload"
          style={{
            color: colors.surface.foreground,
            fontSize: textStyles.label.fontSize,
            fontWeight: textStyles.label.fontWeight,
          }}
        >
          Resume (PDF or DOCX)
        </label>
        <input
          accept={ACCEPT}
          className="block w-full text-sm file:mr-4 file:rounded-lg file:border-0 file:px-4 file:py-2 file:font-medium"
          id="resume-upload"
          name="resume"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          style={{
            border: `1px dashed ${colors.surface.borderStrong}`,
            borderRadius: radius.large,
            padding: spacing[4],
            backgroundColor: colors.surface.card,
          }}
          type="file"
        />
        <p style={{ color: colors.surface.foregroundMuted, fontSize: textStyles.caption.fontSize }}>
          Max 5 MB. Scanned PDFs without text are not supported.
        </p>
      </div>

      <div className="flex flex-col" style={{ gap: spacing[2] }}>
        <label
          htmlFor="job-description"
          style={{
            color: colors.surface.foreground,
            fontSize: textStyles.label.fontSize,
            fontWeight: textStyles.label.fontWeight,
          }}
        >
          Job description
        </label>
        <textarea
          className="min-h-48 w-full resize-y focus-visible:outline-none focus-visible:ring-2"
          id="job-description"
          name="job_description"
          onChange={(e) => setJobDescription(e.target.value)}
          placeholder="Paste the full job description here…"
          style={{
            border: `1px solid ${colors.surface.border}`,
            borderRadius: radius.large,
            padding: spacing[4],
            fontSize: textStyles.bodySmall.fontSize,
            lineHeight: textStyles.bodySmall.lineHeight,
            color: colors.surface.foreground,
            backgroundColor: colors.surface.background,
          }}
          value={jobDescription}
        />
      </div>

      {error ? (
        <p
          role="alert"
          style={{
            color: colors.semantic.error,
            fontSize: textStyles.bodySmall.fontSize,
            backgroundColor: colors.semantic.errorMuted,
            borderRadius: radius.medium,
            padding: spacing[3],
          }}
        >
          {error}
        </p>
      ) : null}

      <button
        className="inline-flex min-h-11 items-center justify-center px-6 transition-opacity disabled:opacity-60"
        disabled={loading}
        style={{
          backgroundColor: colors.brand.DEFAULT,
          color: colors.brand.foreground,
          borderRadius: radius.large,
          fontSize: textStyles.label.fontSize,
          fontWeight: textStyles.label.fontWeight,
          alignSelf: "flex-start",
        }}
        type="submit"
      >
        {loading ? "Analyzing…" : "Run analysis"}
      </button>
    </form>
  );
}
