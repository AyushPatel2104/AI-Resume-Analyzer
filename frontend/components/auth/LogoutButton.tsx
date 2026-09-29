"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import { colors } from "@/constants/colors";
import { radius } from "@/constants/radius";
import { spacing } from "@/constants/spacing";
import { textStyles } from "@/constants/typography";
import { logoutUser } from "@/services/api";

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const onLogout = useCallback(async () => {
    setLoading(true);
    try {
      await logoutUser();
      router.replace("/login");
    } finally {
      setLoading(false);
    }
  }, [router]);

  return (
    <button
      className="w-full text-left transition-colors"
      disabled={loading}
      onClick={onLogout}
      style={{
        border: `1px solid ${colors.surface.border}`,
        borderRadius: radius.medium,
        color: colors.surface.foregroundMuted,
        fontSize: textStyles.bodySmall.fontSize,
        paddingBlock: spacing[2],
        paddingInline: spacing[3],
      }}
      type="button"
    >
      {loading ? "Signing out…" : "Sign out"}
    </button>
  );
}
