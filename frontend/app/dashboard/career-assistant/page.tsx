import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { CareerAssistantClient } from "@/components/career/CareerAssistantClient";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { AUTH_COOKIE_NAME } from "@/services/auth-session";

export default async function CareerAssistantPage() {
  const accessToken = (await cookies()).get(AUTH_COOKIE_NAME)?.value;
  if (!accessToken) {
    redirect("/login");
  }

  return (
    <DashboardShell
      header={
        <DashboardHeader
          description="Actionable, fact-safe resume improvements grounded in your analysis data."
          eyebrow="Assistant"
          title="Career Assistant"
        />
      }
      sidebar={<Sidebar activePath="/dashboard/career-assistant" />}
    >
      <CareerAssistantClient />
    </DashboardShell>
  );
}
