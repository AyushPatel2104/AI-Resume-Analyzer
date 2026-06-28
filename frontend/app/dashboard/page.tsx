import { ContentCard } from "@/components/dashboard/ContentCard";
import {
  DashboardHeader,
  DashboardHeaderAction,
} from "@/components/dashboard/DashboardHeader";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { StatCard } from "@/components/dashboard/StatCard";
import { colors } from "@/constants/colors";
import { radius } from "@/constants/radius";
import { spacing } from "@/constants/spacing";
import { textStyles } from "@/constants/typography";

const overviewStats = [
  {
    label: "Resume score",
    value: "84",
    description: "Placeholder overall quality score",
    trend: "+8%",
  },
  {
    label: "Role match",
    value: "72%",
    description: "Placeholder fit against target role",
    trend: "+5%",
  },
  {
    label: "Skill coverage",
    value: "18/24",
    description: "Placeholder required skills detected",
  },
  {
    label: "Open insights",
    value: "6",
    description: "Placeholder recommendations to review",
  },
] as const;

const recentAnalyses = [
  "Senior Product Designer resume",
  "Frontend Architect resume",
  "Data Analyst resume",
] as const;

const recommendations = [
  "Add measurable outcomes to recent experience bullets.",
  "Clarify leadership scope in project descriptions.",
  "Increase keyword coverage for the target role.",
] as const;

/** Placeholder dashboard home page. */
export default function DashboardPage() {
  return (
    <DashboardShell
      header={
        <DashboardHeader
          actions={
            <>
              <DashboardHeaderAction href="#">Review history</DashboardHeaderAction>
              <DashboardHeaderAction href="#" variant="primary">
                New analysis
              </DashboardHeaderAction>
            </>
          }
          description="Placeholder dashboard overview for resume quality, role alignment, and career intelligence signals."
          eyebrow="Dashboard"
          title="Resume intelligence overview"
        />
      }
      sidebar={<Sidebar />}
    >
      <section aria-label="Dashboard summary metrics" className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {overviewStats.map((stat) => (
          <StatCard
            description={stat.description}
            key={stat.label}
            label={stat.label}
            trend={"trend" in stat ? stat.trend : undefined}
            value={stat.value}
          />
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <ContentCard
          description="Placeholder list of recent analysis sessions."
          title="Recent analyses"
        >
          <ul className="flex flex-col" style={{ gap: spacing[3] }}>
            {recentAnalyses.map((analysis) => (
              <li
                className="flex items-center justify-between gap-4"
                key={analysis}
                style={{
                  border: `1px solid ${colors.surface.border}`,
                  borderRadius: radius.medium,
                  padding: spacing[4],
                }}
              >
                <span
                  style={{
                    color: colors.surface.foreground,
                    fontSize: textStyles.bodySmall.fontSize,
                    lineHeight: textStyles.bodySmall.lineHeight,
                  }}
                >
                  {analysis}
                </span>
                <span
                  style={{
                    color: colors.surface.foregroundMuted,
                    fontSize: textStyles.caption.fontSize,
                    lineHeight: textStyles.caption.lineHeight,
                  }}
                >
                  Placeholder
                </span>
              </li>
            ))}
          </ul>
        </ContentCard>

        <ContentCard
          description="Placeholder next actions generated from analysis signals."
          title="Recommended actions"
        >
          <ol className="flex flex-col" style={{ gap: spacing[3] }}>
            {recommendations.map((recommendation) => (
              <li
                key={recommendation}
                style={{
                  color: colors.surface.foregroundMuted,
                  fontSize: textStyles.bodySmall.fontSize,
                  lineHeight: textStyles.bodySmall.lineHeight,
                }}
              >
                {recommendation}
              </li>
            ))}
          </ol>
        </ContentCard>
      </div>
    </DashboardShell>
  );
}
