import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ApplicationDetailClient } from "@/components/applications/ApplicationDetailClient";
import { DashboardHeader, DashboardHeaderAction } from "@/components/dashboard/DashboardHeader";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { colors } from "@/constants/colors";
import { textStyles } from "@/constants/typography";
import { AUTH_COOKIE_NAME } from "@/services/auth-session";
import { fetchApplicationById } from "@/services/api";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ApplicationDetailPage({ params }: PageProps) {
  const { id } = await params;
  const accessToken = (await cookies()).get(AUTH_COOKIE_NAME)?.value;
  if (!accessToken) redirect("/login");

  let app = null;
  let error: string | null = null;
  try {
    app = await fetchApplicationById(id, accessToken);
  } catch (err) {
    error = err instanceof Error ? err.message : "Application not found.";
  }

  return (
    <DashboardShell
      header={
        <DashboardHeader
          actions={
            <DashboardHeaderAction href="/dashboard/applications" variant="secondary">
              Back to pipeline
            </DashboardHeaderAction>
          }
          description={app ? `${app.job.company_name ?? ""} · ${app.status}` : undefined}
          eyebrow="Application"
          title={app?.job.title ?? "Application"}
        />
      }
      sidebar={<Sidebar activePath="/dashboard/applications" />}
    >
      {error || !app ? (
        <p style={{ color: colors.semantic.error, fontSize: textStyles.bodySmall.fontSize }}>
          {error ?? "Not found."} <Link href="/dashboard/applications">Return to applications</Link>
        </p>
      ) : (
        <ApplicationDetailClient initial={app} />
      )}
    </DashboardShell>
  );
}
