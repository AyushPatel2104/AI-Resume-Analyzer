"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import { colors } from "@/constants/colors";
import { radius } from "@/constants/radius";
import { spacing } from "@/constants/spacing";
import { textStyles } from "@/constants/typography";
import { deleteResume, renameResume } from "@/services/api";

type Props = {
  resumeId: string;
  initialName: string;
};

export function ResumeDetailActions({ resumeId, initialName }: Props) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onRename = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      setError(null);
      setMessage(null);
      setBusy(true);
      try {
        await renameResume(resumeId, name.trim());
        setMessage("Resume renamed.");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Rename failed.");
      } finally {
        setBusy(false);
      }
    },
    [name, resumeId, router],
  );

  const onDelete = useCallback(async () => {
    if (!window.confirm("Delete this resume? Linked analyses will also be removed.")) {
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await deleteResume(resumeId);
      router.push("/dashboard/resumes");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed.");
      setBusy(false);
    }
  }, [resumeId, router]);

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
        href={`/dashboard/applications?resume=${resumeId}`}
        style={{
          alignSelf: "flex-start",
          borderRadius: radius.medium,
          border: `1px solid ${colors.surface.border}`,
          color: colors.surface.foreground,
          fontSize: textStyles.label.fontSize,
          fontWeight: textStyles.label.fontWeight,
          paddingBlock: spacing[2],
          paddingInline: spacing[4],
        }}
      >
        Track application
      </Link>

      <Link
        href={`/dashboard/analyze?resume=${resumeId}`}
        style={{
          alignSelf: "flex-start",
          backgroundColor: colors.brand.DEFAULT,
          borderRadius: radius.medium,
          color: colors.brand.foreground,
          fontSize: textStyles.label.fontSize,
          fontWeight: textStyles.label.fontWeight,
          paddingBlock: spacing[2],
          paddingInline: spacing[4],
        }}
      >
        Analyze this resume
      </Link>

      <form className="flex flex-col" onSubmit={onRename} style={{ gap: spacing[2] }}>
        <label style={{ fontSize: textStyles.label.fontSize }}>Rename</label>
        <input
          className="rounded-lg border px-3 py-2"
          onChange={(e) => setName(e.target.value)}
          required
          style={{ borderColor: colors.surface.border }}
          type="text"
          value={name}
        />
        <button
          className="self-start rounded-lg border px-3 py-2 disabled:opacity-60"
          disabled={busy}
          style={{ borderColor: colors.surface.border }}
          type="submit"
        >
          Save name
        </button>
      </form>

      <button
        className="self-start rounded-lg px-3 py-2 disabled:opacity-60"
        disabled={busy}
        onClick={onDelete}
        style={{ backgroundColor: colors.semantic.errorMuted, color: colors.semantic.error }}
        type="button"
      >
        Delete resume
      </button>

      {message ? (
        <p style={{ color: colors.brand.accent, fontSize: textStyles.caption.fontSize }}>{message}</p>
      ) : null}
      {error ? <p style={{ color: colors.semantic.error, fontSize: textStyles.caption.fontSize }}>{error}</p> : null}
    </div>
  );
}
