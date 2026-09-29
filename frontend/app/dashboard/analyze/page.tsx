import { DashboardHeader, DashboardHeaderAction } from "@/components/dashboard/DashboardHeader";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { AnalyzeForm } from "@/components/resume/AnalyzeForm";
import { ContentCard } from "@/components/dashboard/ContentCard";

export default function AnalyzePage() {
  return (
    <DashboardShell
      header={
        <DashboardHeader
          actions={
            <DashboardHeaderAction href="/dashboard" variant="secondary">
              Back to overview
            </DashboardHeaderAction>
          }
          description="Upload a resume and paste a job description to generate an explainable match report."
          eyebrow="Analyze"
          title="Resume & job match analysis"
        />
      }
      sidebar={<Sidebar activePath="/dashboard/analyze" />}
    >
      <ContentCard
        description="Supported formats: PDF and DOCX (max 5 MB). Analysis runs on the API — start the backend on port 8000."
        title="New analysis"
      >
        <AnalyzeForm />
      </ContentCard>
    </DashboardShell>
  );
}
