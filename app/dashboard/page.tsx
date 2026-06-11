"use client";

import DashboardStatsCard from "@/components/dashboard/stats";
import RequiringActionPanel from "@/components/dashboard/requiring-action";
import TopEquityOpportunities from "@/components/dashboard/equity-opportunities";
import RecentPropertyAlerts from "@/components/dashboard/recent-alerts";

export default function Home() {
  return (
    <div className="flex flex-col gap-[21px]">
      <DashboardStatsCard />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-[21px]">
        <RequiringActionPanel />
        <TopEquityOpportunities />
      </div>
      <RecentPropertyAlerts />
    </div>
  );
}
