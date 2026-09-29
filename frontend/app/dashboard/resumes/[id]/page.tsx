import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { DashboardHeader, DashboardHeaderAction } from "@/components/dashboard/DashboardHeader";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { ResumeDetailActions } from "@/components/resume/ResumeDetailActions";
import { ResumeIntelligencePanel } from "@/components/resume/ResumeIntelligencePanel";
import { ResumeProfileSections } from "@/components/resume/ResumeProfileSections";
import { colors } from "@/constants/colors";
import { textStyles } from "@/constants/typography";
import { AUTH_COOKIE_NAME } from "@/services/auth-session";
import { fetchResumeById } from "@/services/api";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ResumeDetailPage({ params }: PageProps) {
  const { id } = await params;
  const accessToken = (await cookies()).get(AUTH_COOKIE_NAME)?.value;
  if (!accessToken) {
    redirect("/login");
  }

  let error: string | null = null;
  let resume = null;
  try {
    resume = await fetchResumeById(id, accessToken);
  } catch (err) {
    error = err instanceof Error ? err.message : "Resume not found.";
  }

  return (
    <DashboardShell
      header={
        <DashboardHeader
          actions={
            <DashboardHeaderAction href="/dashboard/resumes" variant="secondary">
              Back to library
            </DashboardHeaderAction>
          }
          description={resume ? `${resume.original_filename} · uploaded ${new Date(resume.created_at).toLocaleString()}` : ""}
          eyebrow="Resume"
          title={resume?.name ?? "Resume"}
        />
      }
      sidebar={<Sidebar activePath={`/dashboard/resumes/${id}`} />}
    >
      {error || !resume ? (
        <p style={{ color: colors.semantic.error, fontSize: textStyles.bodySmall.fontSize }}>
          {error ?? "Resume not found."}{" "}
          <Link href="/dashboard/resumes">Return to library</Link>
        </p>
      ) : (
        <div className="flex flex-col gap-8">
          <ResumeIntelligencePanel key={resume.id} resumeId={resume.id} />
          <div className="grid gap-6 lg:grid-cols-[1fr_18rem]">
            <ResumeProfileSections profile={resume.profile} />
            <ResumeDetailActions initialName={resume.name} resumeId={resume.id} />
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
