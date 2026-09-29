import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ContentCard } from "@/components/dashboard/ContentCard";
import { DashboardHeader, DashboardHeaderAction } from "@/components/dashboard/DashboardHeader";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { colors } from "@/constants/colors";
import { radius } from "@/constants/radius";
import { spacing } from "@/constants/spacing";
import { textStyles } from "@/constants/typography";
import { AUTH_COOKIE_NAME } from "@/services/auth-session";
import { fetchAnalysisHistory } from "@/services/api";

export default async function AnalysesPage() {
  const accessToken = (await cookies()).get(AUTH_COOKIE_NAME)?.value;
  if (!accessToken) {
    redirect("/login");
  }

  let history: Awaited<ReturnType<typeof fetchAnalysisHistory>> = [];
  let error: string | null = null;
  try {
    history = await fetchAnalysisHistory(50, accessToken);
  } catch (err) {
    error = err instanceof Error ? err.message : "Could not load analyses.";
  }

  return (
    <DashboardShell
      header={
        <DashboardHeader
          actions={
            <DashboardHeaderAction href="/dashboard/analyze" variant="primary">
              New analysis
            </DashboardHeaderAction>
          }
          description="Match scores and job pairings for your saved resumes."
          eyebrow="Analyses"
          title="Analysis history"
        />
      }
      sidebar={<Sidebar activePath="/dashboard/analyses" />}
    >
      <ContentCard description="Only analyses you ran while signed in." title="Recent analyses">
        {error ? (
          <p style={{ color: colors.semantic.error, fontSize: textStyles.bodySmall.fontSize }}>{error}</p>
        ) : history.length === 0 ? (
          <p style={{ color: colors.surface.foregroundMuted, fontSize: textStyles.bodySmall.fontSize }}>
            No analyses yet.{" "}
            <Link href="/dashboard/analyze" style={{ color: colors.brand.accent }}>
              Run your first match
            </Link>
            .
          </p>
        ) : (
          <ul className="flex flex-col" style={{ gap: spacing[3] }}>
            {history.map((analysis) => (
              <li
                key={analysis.id}
                className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"
                style={{
                  border: `1px solid ${colors.surface.border}`,
                  borderRadius: radius.medium,
                  padding: spacing[4],
                }}
              >
                <div>
                  <Link href={`/dashboard/results/${analysis.id}`} style={{ color: colors.surface.foreground, fontWeight: 600 }}>
                    {analysis.resume_name}
                  </Link>
                  <p style={{ color: colors.surface.foregroundMuted, fontSize: textStyles.caption.fontSize }}>
                    {analysis.job_title}
                    {analysis.company_name ? ` · ${analysis.company_name}` : ""} · {new Date(analysis.created_at).toLocaleString()}
                  </p>
                </div>
                <span style={{ color: colors.brand.accent, fontWeight: 600 }}>{Math.round(analysis.overall_score)}%</span>
              </li>
            ))}
          </ul>
        )}
      </ContentCard>
    </DashboardShell>
  );
}
