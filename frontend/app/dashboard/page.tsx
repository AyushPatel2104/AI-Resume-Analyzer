import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ContentCard } from "@/components/dashboard/ContentCard";
import {
  DashboardHeader,
  DashboardHeaderAction,
} from "@/components/dashboard/DashboardHeader";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { StatCard } from "@/components/dashboard/StatCard";
import { colors } from "@/constants/colors";
import { radius } from "@/constants/radius";
import { spacing } from "@/constants/spacing";
import { textStyles } from "@/constants/typography";
import { AUTH_COOKIE_NAME } from "@/services/auth-session";
import { checkApiHealth, fetchAnalysisHistory } from "@/services/api";

export default async function DashboardPage() {
  const accessToken = (await cookies()).get(AUTH_COOKIE_NAME)?.value;
  if (!accessToken) {
    redirect("/login");
  }

  const apiOnline = await checkApiHealth();
  let history: Awaited<ReturnType<typeof fetchAnalysisHistory>> = [];
  let historyError: string | null = null;

  if (apiOnline) {
    try {
      history = await fetchAnalysisHistory(8, accessToken);
    } catch (err) {
      historyError = err instanceof Error ? err.message : "Could not load history.";
    }
  }

  const latest = history[0];
  const avgScore =
    history.length > 0
      ? Math.round(history.reduce((sum, h) => sum + h.overall_score, 0) / history.length)
      : null;

  return (
    <DashboardShell
      header={
        <DashboardHeader
          actions={
            <DashboardHeaderAction href="/dashboard/analyze" variant="primary">
              New analysis
            </DashboardHeaderAction>
          }
          description="Track resume–job analyses, scores, and recommendations from your workspace."
          eyebrow="Dashboard"
          title="Resume intelligence overview"
        />
      }
      sidebar={<Sidebar activePath="/dashboard" />}
    >
      {!apiOnline ? (
        <div
          role="status"
          style={{
            backgroundColor: colors.semantic.warningMuted,
            color: colors.semantic.warning,
            borderRadius: radius.large,
            padding: spacing[4],
            fontSize: textStyles.bodySmall.fontSize,
          }}
        >
          API offline — start the backend at{" "}
          <code style={{ fontFamily: "monospace" }}>http://localhost:8000</code> to run analyses and
          save history.
        </div>
      ) : null}

      <section aria-label="Dashboard summary metrics" className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          description={latest ? "Most recent analysis" : "Run your first analysis"}
          label="Latest match score"
          value={latest ? `${Math.round(latest.overall_score)}%` : "—"}
        />
        <StatCard
          description="Across saved analyses"
          label="Average score"
          value={avgScore !== null ? `${avgScore}%` : "—"}
        />
        <StatCard
          description="Stored in database"
          label="Total analyses"
          value={String(history.length)}
        />
        <StatCard
          description="Backend connectivity"
          label="API status"
          value={apiOnline ? "Online" : "Offline"}
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <ContentCard description="Open a saved report or start a new match." title="Recent analyses">
          {historyError ? (
            <p style={{ color: colors.semantic.error, fontSize: textStyles.bodySmall.fontSize }}>
              {historyError}
            </p>
          ) : history.length === 0 ? (
            <p style={{ color: colors.surface.foregroundMuted, fontSize: textStyles.bodySmall.fontSize }}>
              No analyses yet.{" "}
              <Link href="/dashboard/resumes" style={{ color: colors.brand.accent }}>
                Add a resume
              </Link>{" "}
              then{" "}
              <Link href="/dashboard/analyze" style={{ color: colors.brand.accent }}>
                run an analysis
              </Link>
              .
            </p>
          ) : (
            <ul className="flex flex-col" style={{ gap: spacing[3] }}>
              {history.map((analysis) => (
                <li
                  className="flex items-center justify-between gap-4"
                  key={analysis.id}
                  style={{
                    border: `1px solid ${colors.surface.border}`,
                    borderRadius: radius.medium,
                    padding: spacing[4],
                  }}
                >
                  <div>
                    <Link
                      href={`/dashboard/results/${analysis.id}`}
                      style={{
                        color: colors.surface.foreground,
                        fontSize: textStyles.bodySmall.fontSize,
                        lineHeight: textStyles.bodySmall.lineHeight,
                        fontWeight: 600,
                      }}
                    >
                      {analysis.resume_name}
                    </Link>
                    <p style={{ color: colors.surface.foregroundMuted, fontSize: textStyles.caption.fontSize }}>
                      {analysis.job_title}
                      {analysis.company_name ? ` · ${analysis.company_name}` : ""}
                    </p>
                  </div>
                  <span
                    style={{
                      color: colors.brand.accent,
                      fontSize: textStyles.label.fontSize,
                      fontWeight: textStyles.label.fontWeight,
                    }}
                  >
                    {Math.round(analysis.overall_score)}%
                  </span>
                </li>
              ))}
            </ul>
          )}
        </ContentCard>

        <ContentCard
          description="End-to-end flow for recruiters and job seekers."
          title="How it works"
        >
          <ol className="flex flex-col" style={{ gap: spacing[3] }}>
            {[
              "Upload PDF or DOCX resume",
              "Paste the target job description",
              "Review match score, skills, gaps, and recommendations",
            ].map((step, index) => (
              <li
                key={step}
                style={{
                  color: colors.surface.foregroundMuted,
                  fontSize: textStyles.bodySmall.fontSize,
                  lineHeight: textStyles.bodySmall.lineHeight,
                }}
              >
                <span style={{ color: colors.brand.accent, fontWeight: 600 }}>{index + 1}. </span>
                {step}
              </li>
            ))}
          </ol>
        </ContentCard>
      </div>
    </DashboardShell>
  );
}
