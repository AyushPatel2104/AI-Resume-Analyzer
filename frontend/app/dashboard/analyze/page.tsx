import { Suspense } from "react";

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
            <DashboardHeaderAction href="/dashboard/resumes" variant="secondary">
              Manage resumes
            </DashboardHeaderAction>
          }
          description="Select a saved resume and a saved job to generate an explainable match report."
          eyebrow="Analyze"
          title="Resume & job match analysis"
        />
      }
      sidebar={<Sidebar activePath="/dashboard/analyze" />}
    >
      <ContentCard
        description="Uses your Resume Library and Job Library — add items under Resumes or Jobs first."
        title="New analysis"
      >
        <Suspense fallback={null}>
          <AnalyzeForm />
        </Suspense>
      </ContentCard>
    </DashboardShell>
  );
}
