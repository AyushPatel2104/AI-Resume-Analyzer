import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { ApplicationsBoard } from "@/components/applications/ApplicationsBoard";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { AUTH_COOKIE_NAME } from "@/services/auth-session";

type PageProps = {
  searchParams: Promise<{ job?: string; resume?: string }>;
};

export default async function ApplicationsPage({ searchParams }: PageProps) {
  const accessToken = (await cookies()).get(AUTH_COOKIE_NAME)?.value;
  if (!accessToken) redirect("/login");

  const params = await searchParams;

  return (
    <DashboardShell
      header={
        <DashboardHeader
          description="Track saved jobs, applications, interviews, and outcomes — factual counts only."
          eyebrow="Tracker"
          title="Applications"
        />
      }
      sidebar={<Sidebar activePath="/dashboard/applications" />}
    >
      <ApplicationsBoard initialJobId={params.job} initialResumeId={params.resume} />
    </DashboardShell>
  );
}
