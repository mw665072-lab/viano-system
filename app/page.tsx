import { PropertyEvaluationDashboard } from "@/components/dashboard/avaluation";
import DashboardStatsCard from "@/components/dashboard/stats";

export default function Home() {
  return (
    <div className="flex flex-col gap-[21px]">
      <DashboardStatsCard />
      <PropertyEvaluationDashboard />
    </div>
  );
}
