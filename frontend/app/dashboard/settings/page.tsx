import { ContentCard } from "@/components/dashboard/ContentCard";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { colors } from "@/constants/colors";
import { textStyles } from "@/constants/typography";

export default function SettingsPage() {
  return (
    <DashboardShell
      header={
        <DashboardHeader
          description="Account and workspace preferences will live here in a future release."
          eyebrow="Settings"
          title="Settings"
        />
      }
      sidebar={<Sidebar activePath="/dashboard/settings" />}
    >
      <ContentCard title="Coming soon">
        <p style={{ color: colors.surface.foregroundMuted, fontSize: textStyles.bodySmall.fontSize }}>
          Profile settings, notifications, and integrations are not part of this phase.
        </p>
      </ContentCard>
    </DashboardShell>
  );
}
