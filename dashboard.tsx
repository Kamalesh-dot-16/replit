import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import TopBar from "@/components/layout/topbar";
import KPICards from "@/components/dashboard/kpi-cards";
import ActivityChart from "@/components/dashboard/activity-chart";
import RecentActivity from "@/components/dashboard/recent-activity";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Play, Brain, Download } from "lucide-react";

type Metrics = {
  totalDatasets: number;
  activeJobs: number;
  totalInsights: number;
  storageUsed: string;
};

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const { data: metrics, isLoading: metricsLoading } = useQuery<Metrics>({
    queryKey: ["/api/dashboard/metrics"],
    queryFn: () => fetch("/api/dashboard/metrics").then(res => res.json()),
    retry: false,
  });

  const { data: recentActivity, isLoading: activityLoading } = useQuery<any[]>({
    queryKey: ["/api/dashboard/recent-activity"],
    queryFn: () => fetch("/api/dashboard/recent-activity").then(res => res.json()),
    retry: false,
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Notice",
        description: "You are viewing the dashboard without logging in.",
        variant: "default",
      });
    }
  }, [isAuthenticated, isLoading, toast]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar isCollapsed={sidebarCollapsed} setIsCollapsed={setSidebarCollapsed} />

      <div className={sidebarCollapsed ? "ml-16" : "ml-64"} style={{ transition: "margin-left 300ms" }}>
        <TopBar title="Dashboard" />

        <div className="p-6">
          <KPICards metrics={metrics} isLoading={metricsLoading} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2">
              <ActivityChart />
            </div>

            <RecentActivity activities={recentActivity} isLoading={activityLoading} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Button
                  variant="outline"
                  className="h-24 flex flex-col items-center justify-center space-y-2 border-2 border-dashed hover:border-primary-blue hover:bg-blue-50 dark:hover:bg-blue-900"
                  onClick={() => window.location.href = "/data-upload"}
                >
                  <Upload className="text-gray-400 text-2xl" />
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Upload Data</span>
                </Button>

                <Button
                  variant="outline"
                  className="h-24 flex flex-col items-center justify-center space-y-2 border-2 border-dashed hover:border-primary-blue hover:bg-blue-50 dark:hover:bg-blue-900"
                  onClick={() => window.location.href = "/data-processing"}
                >
                  <Play className="text-gray-400 text-2xl" />
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Start Processing</span>
                </Button>

                <Button
                  variant="outline"
                  className="h-24 flex flex-col items-center justify-center space-y-2 border-2 border-dashed hover:border-primary-blue hover:bg-blue-50 dark:hover:bg-blue-900"
                  onClick={() => window.location.href = "/insights"}
                >
                  <Brain className="text-gray-400 text-2xl" />
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Generate Insights</span>
                </Button>

                <Button
                  variant="outline"
                  className="h-24 flex flex-col items-center justify-center space-y-2 border-2 border-dashed hover:border-primary-blue hover:bg-blue-50 dark:hover:bg-blue-900"
                  onClick={() => window.location.href = "/reports"}
                >
                  <Download className="text-gray-400 text-2xl" />
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Export Report</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
