"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";

import { colors } from "@/constants/colors";
import { radius } from "@/constants/radius";
import { spacing } from "@/constants/spacing";
import { textStyles } from "@/constants/typography";
import { loginUser, registerUser } from "@/services/api";

type AuthMode = "login" | "signup";

const PASSWORD_HINT = "At least 8 characters with one letter and one number.";

export function AuthForm({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      setError(null);
      setLoading(true);
      try {
        if (mode === "signup") {
          await registerUser({
            email: email.trim(),
            password,
            full_name: fullName.trim() || null,
          });
        } else {
          await loginUser({ email: email.trim(), password });
        }
        router.replace(nextPath);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Authentication failed.");
      } finally {
        setLoading(false);
      }
    },
    [email, fullName, mode, nextPath, password, router],
  );

  const title = mode === "login" ? "Sign in" : "Create account";
  const alternate =
    mode === "login" ? (
      <>
        No account?{" "}
        <Link href="/signup" style={{ color: colors.brand.accent }}>
          Sign up
        </Link>
      </>
    ) : (
      <>
        Already have an account?{" "}
        <Link href="/login" style={{ color: colors.brand.accent }}>
          Sign in
        </Link>
      </>
    );

  return (
    <form
      className="mx-auto flex w-full max-w-md flex-col"
      onSubmit={onSubmit}
      style={{
        gap: spacing[5],
        backgroundColor: colors.surface.background,
        border: `1px solid ${colors.surface.border}`,
        borderRadius: radius.large,
        padding: spacing[6],
      }}
    >
      <div>
        <h1
          style={{
            color: colors.surface.foreground,
            fontSize: textStyles.h2.fontSize,
            fontWeight: textStyles.h2.fontWeight,
            marginBottom: spacing[2],
          }}
        >
          {title}
        </h1>
        <p style={{ color: colors.surface.foregroundMuted, fontSize: textStyles.bodySmall.fontSize }}>
          Access your resume analyses and match history.
        </p>
      </div>

      {mode === "signup" ? (
        <label className="flex flex-col" style={{ gap: spacing[2] }}>
          <span style={{ fontSize: textStyles.label.fontSize, fontWeight: textStyles.label.fontWeight }}>
            Full name (optional)
          </span>
          <input
            autoComplete="name"
            className="w-full rounded-lg border px-3 py-2"
            onChange={(e) => setFullName(e.target.value)}
            style={{ borderColor: colors.surface.border }}
            type="text"
            value={fullName}
          />
        </label>
      ) : null}

      <label className="flex flex-col" style={{ gap: spacing[2] }}>
        <span style={{ fontSize: textStyles.label.fontSize, fontWeight: textStyles.label.fontWeight }}>Email</span>
        <input
          autoComplete="email"
          className="w-full rounded-lg border px-3 py-2"
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ borderColor: colors.surface.border }}
          type="email"
          value={email}
        />
      </label>

      <label className="flex flex-col" style={{ gap: spacing[2] }}>
        <span style={{ fontSize: textStyles.label.fontSize, fontWeight: textStyles.label.fontWeight }}>Password</span>
        <input
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          className="w-full rounded-lg border px-3 py-2"
          minLength={8}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ borderColor: colors.surface.border }}
          type="password"
          value={password}
        />
        {mode === "signup" ? (
          <span style={{ color: colors.surface.foregroundMuted, fontSize: textStyles.caption.fontSize }}>
            {PASSWORD_HINT}
          </span>
        ) : null}
      </label>

      {error ? (
        <p role="alert" style={{ color: colors.semantic.error, fontSize: textStyles.bodySmall.fontSize }}>
          {error}
        </p>
      ) : null}

      <button
        className="rounded-lg px-4 py-2 font-medium disabled:opacity-60"
        disabled={loading}
        style={{
          backgroundColor: colors.brand.accent,
          color: colors.brand.foreground,
        }}
        type="submit"
      >
        {loading ? "Please wait…" : title}
      </button>

      <p style={{ color: colors.surface.foregroundMuted, fontSize: textStyles.bodySmall.fontSize }}>{alternate}</p>
    </form>
  );
}
