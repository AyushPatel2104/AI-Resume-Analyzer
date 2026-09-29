import Link from "next/link";

import { DashboardHeader, DashboardHeaderAction } from "@/components/dashboard/DashboardHeader";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { ResultsView } from "@/components/resume/ResultsView";
import { colors } from "@/constants/colors";
import { radius } from "@/constants/radius";
import { spacing } from "@/constants/spacing";
import { textStyles } from "@/constants/typography";
import { fetchAnalysisById } from "@/services/api";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ResultsPage({ params }: PageProps) {
  const { id } = await params;

  let error: string | null = null;
  let data = null;

  try {
    data = await fetchAnalysisById(id);
  } catch (err) {
    error = err instanceof Error ? err.message : "Unable to load analysis.";
  }

  return (
    <DashboardShell
      header={
        <DashboardHeader
          actions={
            <>
              <DashboardHeaderAction href="/dashboard/analyze" variant="secondary">
                New analysis
              </DashboardHeaderAction>
              <DashboardHeaderAction href="/dashboard" variant="primary">
                Overview
              </DashboardHeaderAction>
            </>
          }
          description="Explainable scoring, skill gaps, and recommendations for this resume–job pairing."
          eyebrow="Results"
          title={data ? `Match report · ${data.filename}` : "Match report"}
        />
      }
      sidebar={<Sidebar activePath={`/dashboard/results/${id}`} />}
    >
      {error || !data ? (
        <div
          role="alert"
          style={{
            backgroundColor: colors.semantic.errorMuted,
            color: colors.semantic.error,
            borderRadius: radius.large,
            padding: spacing[5],
            fontSize: textStyles.bodySmall.fontSize,
          }}
        >
          {error ?? "Analysis not found."}{" "}
          <Link href="/dashboard/analyze" style={{ textDecoration: "underline" }}>
            Start a new analysis
          </Link>
        </div>
      ) : (
        <ResultsView data={data} />
      )}
    </DashboardShell>
  );
}
