"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PropertyEvaluationDashboard } from "@/components/dashboard/avaluation";
import DashboardStatsCard from "@/components/dashboard/stats";
import { isAuthenticated } from "@/lib/api";
import { Loader2 } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

//   useEffect(() => {
//     // Check if user is authenticated
//     if (!isAuthenticated()) {
//       router.replace("/login");
//     } else {
//       setIsChecking(false);
//     }
//   }, [router]);

  // Show loading while checking auth
  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-[21px]">
      <DashboardStatsCard />
      <PropertyEvaluationDashboard />
    </div>
  );
}
