import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { ContentCard } from "@/components/dashboard/ContentCard";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { JobLibraryClient } from "@/components/jobs/JobLibraryClient";
import { AUTH_COOKIE_NAME } from "@/services/auth-session";
import { fetchJobs } from "@/services/api";

export default async function JobsPage() {
  const accessToken = (await cookies()).get(AUTH_COOKIE_NAME)?.value;
  if (!accessToken) redirect("/login");

  let jobs: Awaited<ReturnType<typeof fetchJobs>> = [];
  let error: string | null = null;
  try {
    jobs = await fetchJobs(accessToken);
  } catch (err) {
    error = err instanceof Error ? err.message : "Could not load jobs.";
  }

  return (
    <DashboardShell
      header={
        <DashboardHeader
          description="Save jobs from a public URL or manual entry, then reuse them for analyses."
          eyebrow="Jobs"
          title="Job library"
        />
      }
      sidebar={<Sidebar activePath="/dashboard/jobs" />}
    >
      <ContentCard description="URL import only supports publicly accessible pages." title="My jobs">
        {error ? <p>{error}</p> : <JobLibraryClient initialJobs={jobs} />}
      </ContentCard>
    </DashboardShell>
  );
}
