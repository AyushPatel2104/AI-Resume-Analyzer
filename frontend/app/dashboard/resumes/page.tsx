import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { ContentCard } from "@/components/dashboard/ContentCard";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { ResumeLibraryClient } from "@/components/resume/ResumeLibraryClient";
import { AUTH_COOKIE_NAME } from "@/services/auth-session";
import { fetchResumes } from "@/services/api";

export default async function ResumesPage() {
  const accessToken = (await cookies()).get(AUTH_COOKIE_NAME)?.value;
  if (!accessToken) {
    redirect("/login");
  }

  let resumes: Awaited<ReturnType<typeof fetchResumes>> = [];
  let error: string | null = null;
  try {
    resumes = await fetchResumes(accessToken);
  } catch (err) {
    error = err instanceof Error ? err.message : "Could not load resumes.";
  }

  return (
    <DashboardShell
      header={
        <DashboardHeader
          description="Upload once, reuse your structured profile for every job analysis."
          eyebrow="Resumes"
          title="Resume library"
        />
      }
      sidebar={<Sidebar activePath="/dashboard/resumes" />}
    >
      <ContentCard description="PDF and DOCX up to 5 MB. Parsed fields come from your document only." title="Your resumes">
        {error ? <p>{error}</p> : <ResumeLibraryClient initialResumes={resumes} />}
      </ContentCard>
    </DashboardShell>
  );
}
