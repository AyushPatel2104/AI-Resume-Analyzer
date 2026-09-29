import { Suspense } from "react";

import { AuthForm } from "@/components/auth/AuthForm";
import { colors } from "@/constants/colors";
import { spacing } from "@/constants/spacing";

export default function SignupPage() {
  return (
    <main
      className="flex min-h-screen items-center justify-center px-4"
      style={{ backgroundColor: colors.surface.backgroundSubtle, paddingBlock: spacing[8] }}
    >
      <Suspense fallback={null}>
        <AuthForm mode="signup" />
      </Suspense>
    </main>
  );
}
