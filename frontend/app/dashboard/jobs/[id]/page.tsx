import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { DashboardHeader, DashboardHeaderAction } from "@/components/dashboard/DashboardHeader";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { JobDetailActions } from "@/components/jobs/JobDetailActions";
import { JobRequirementsSections } from "@/components/jobs/JobRequirementsSections";
import { colors } from "@/constants/colors";
import { radius } from "@/constants/radius";
import { spacing } from "@/constants/spacing";
import { textStyles } from "@/constants/typography";
import { AUTH_COOKIE_NAME } from "@/services/auth-session";
import { fetchJobById } from "@/services/api";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function JobDetailPage({ params }: PageProps) {
  const { id } = await params;
  const accessToken = (await cookies()).get(AUTH_COOKIE_NAME)?.value;
  if (!accessToken) redirect("/login");

  let job = null;
  let error: string | null = null;
  try {
    job = await fetchJobById(id, accessToken);
  } catch (err) {
    error = err instanceof Error ? err.message : "Job not found.";
  }

  return (
    <DashboardShell
      header={
        <DashboardHeader
          actions={
            <DashboardHeaderAction href="/dashboard/jobs" variant="secondary">
              Back to jobs
            </DashboardHeaderAction>
          }
          description={job?.company_name ?? undefined}
          eyebrow="Job"
          title={job?.title ?? "Job"}
        />
      }
      sidebar={<Sidebar activePath={`/dashboard/jobs/${id}`} />}
    >
      {error || !job ? (
        <p style={{ color: colors.semantic.error }}>
          {error ?? "Job not found."} <Link href="/dashboard/jobs">Return to jobs</Link>
        </p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_18rem]">
          <div className="flex flex-col" style={{ gap: spacing[5] }}>
            {job.source_url ? (
              <p style={{ fontSize: textStyles.bodySmall.fontSize }}>
                Source:{" "}
                <a href={job.source_url} rel="noreferrer" target="_blank">
                  {job.source_url}
                </a>
              </p>
            ) : null}
            <section
              style={{
                border: `1px solid ${colors.surface.border}`,
                borderRadius: radius.large,
                padding: spacing[5],
                backgroundColor: colors.surface.background,
              }}
            >
              <h2 style={{ fontSize: textStyles.h3.fontSize, marginBottom: spacing[3] }}>Job description</h2>
              <pre
                style={{
                  whiteSpace: "pre-wrap",
                  fontFamily: "inherit",
                  fontSize: textStyles.bodySmall.fontSize,
                  color: colors.surface.foregroundMuted,
                }}
              >
                {job.job_description}
              </pre>
            </section>
            <JobRequirementsSections requirements={job.normalized_requirements} />
          </div>
          <JobDetailActions
            initialCompany={job.company_name ?? ""}
            initialDescription={job.job_description}
            initialTitle={job.title}
            jobId={job.id}
          />
        </div>
      )}
    </DashboardShell>
  );
}
