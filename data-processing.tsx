import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import Sidebar from "@/components/layout/sidebar";
import TopBar from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, Pause, Square, RotateCcw, Database } from "lucide-react";

export default function DataProcessing() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Removed useAuth & redirect logic here

  const { data: datasets = [], isLoading: datasetsLoading } = useQuery<any[]>({
    queryKey: ["/api/datasets"],
    retry: false,
  });

  const { data: jobs = [], isLoading: jobsLoading } = useQuery<any[]>({
    queryKey: ["/api/processing-jobs"],
    retry: false,
    refetchInterval: 5000,
  });

  const startJobMutation = useMutation({
    mutationFn: async ({ datasetId, jobType }: { datasetId: number; jobType: string }) => {
      return await apiRequest("POST", "/api/processing-jobs", { datasetId, jobType });
    },
    onSuccess: () => {
      toast({
        title: "Processing Started",
        description: "Data processing job has been started successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/processing-jobs"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 500);
        return;
      }
      toast({
        title: "Processing Failed",
        description: error.message || "Failed to start processing job",
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      running: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
      failed: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    };
    
    return (
      <Badge className={variants[status as keyof typeof variants] || variants.pending}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const activeJobs = jobs?.filter((job: any) => job.status === 'running' || job.status === 'pending') || [];
  const completedJobs = jobs?.filter((job: any) => job.status === 'completed') || [];
  const failedJobs = jobs?.filter((job: any) => job.status === 'failed') || [];

  // No loading spinner for auth since removed, but can keep dataset/jobs loading states if you want.

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      
      <div className="ml-64">
        <TopBar title="Data Processing" />
        
        <div className="p-6">
          {/* Processing Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Jobs</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{activeJobs.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                    <Play className="text-blue-600 dark:text-blue-400" size={24} />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completed</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{completedJobs.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                    <Database className="text-green-600 dark:text-green-400" size={24} />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Failed</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{failedJobs.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center">
                    <Square className="text-red-600 dark:text-red-400" size={24} />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Jobs</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{jobs?.length || 0}</p>
                  </div>
                  <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                    <RotateCcw className="text-gray-600 dark:text-gray-400" size={24} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Start New Processing Job */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Start New Processing Job</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Select Batch Name
                  </label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a batch" />
                    </SelectTrigger>
                    <SelectContent>
                      {datasets?.map((dataset: any) => (
                        <SelectItem key={dataset.id} value={dataset.id.toString()}>
                          {dataset.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Processing Type
                  </label>
                  <Select defaultValue="data_cleaning">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="data_cleaning">Data Cleaning</SelectItem>
                      <SelectItem value="statistical_analysis">Statistical Analysis</SelectItem>
                      <SelectItem value="ml_training">ML Model Training</SelectItem>
                      <SelectItem value="anomaly_detection">Anomaly Detection</SelectItem>
                      <SelectItem value="correlation_analysis">Correlation Analysis</SelectItem>
                      <SelectItem value="content_moderation">Content Moderation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button 
                  onClick={() => {
                    if (datasets && datasets.length > 0) {
                      startJobMutation.mutate({
                        datasetId: datasets[0].id,
                        jobType: "data_cleaning"
                      });
                    }
                  }}
                  disabled={startJobMutation.isPending || !datasets || datasets.length === 0}
                  className="bg-primary-blue hover:bg-blue-600"
                >
                  <Play size={16} className="mr-2" />
                  {startJobMutation.isPending ? "Starting..." : "Start Processing"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Active Jobs */}
          {activeJobs.length > 0 && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Active Processing Jobs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activeJobs.map((job: any) => (
                    <div key={job.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {job.jobType.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Job ID: {job.id}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getStatusBadge(job.status)}
                          <Button variant="outline" size="sm">
                            <Pause size={16} />
                          </Button>
                        </div>
                      </div>
                      <div className="mb-2">
                        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                          <span>Progress</span>
                          <span>{job.progress || 0}%</span>
                        </div>
                        <Progress value={job.progress || 0} className="mt-1" />
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        Started: {job.startedAt ? formatDate(job.startedAt) : 'Not started'}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Processing History */}
          <Card>
            <CardHeader>
              <CardTitle>Processing History</CardTitle>
            </CardHeader>
            <CardContent>
              {jobsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-blue"></div>
                </div>
              ) : jobs && jobs.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Job ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Progress</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Created</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Duration</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                      {jobs.map((job: any) => (
                        <tr key={job.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            #{job.id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                            {job.jobType.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(job.status)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <Progress value={job.progress || 0} className="w-20" />
                              <span className="text-sm text-gray-600 dark:text-gray-400">{job.progress || 0}%</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                            {formatDate(job.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                            {job.completedAt && job.startedAt 
                              ? `${Math.round((new Date(job.completedAt).getTime() - new Date(job.startedAt).getTime()) / 1000)}s`
                              : job.status === 'running' && job.startedAt
                              ? `${Math.round((Date.now() - new Date(job.startedAt).getTime()) / 1000)}s`
                              : '-'
                            }
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">No processing jobs found.</p>
                  <p className="text-sm text-gray-400">Start your first processing job above.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
