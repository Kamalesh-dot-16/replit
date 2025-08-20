import { useEffect, useState } from "react";
//import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import Sidebar from "@/components/layout/sidebar";
import TopBar from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FileText, Plus, Download, Eye, Calendar } from "lucide-react";

export default function Reports() {
  const { toast } = useToast();
  //const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  
  const [newReport, setNewReport] = useState({
    name: "",
    description: "",
    reportType: "summary",
    selectedDatasets: [] as number[],
    includeCharts: true,
    includeInsights: true,
    includeProcessingDetails: false,
  });

  // Redirect if not authenticated
/*  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
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
  }, [isAuthenticated, isLoading, toast]);*/

  const { data: reports = [], isLoading: reportsLoading } = useQuery<any[]>({
    queryKey: ["/api/reports"],
    retry: false,
  });

  const { data: datasets = [] } = useQuery<any[]>({
    queryKey: ["/api/datasets"],
    retry: false,
  });

  const generateReportMutation = useMutation({
    mutationFn: async (reportData: any) => {
      return await apiRequest("POST", "/api/reports", reportData);
    },
    onSuccess: () => {
      toast({
        title: "Report Generated",
        description: "Your report has been generated successfully!",
      });
      setNewReport({
        name: "",
        description: "",
        reportType: "summary",
        selectedDatasets: [],
        includeCharts: true,
        includeInsights: true,
        includeProcessingDetails: false,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
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
        title: "Generation Failed",
        description: error.message || "Failed to generate report",
        variant: "destructive",
      });
    },
  });

  const handleGenerateReport = () => {
    if (!newReport.name.trim()) {
      toast({
        title: "Report name required",
        description: "Please enter a name for the report",
        variant: "destructive",
      });
      return;
    }

    if (newReport.selectedDatasets.length === 0) {
      toast({
        title: "No datasets selected",
        description: "Please select at least one dataset",
        variant: "destructive",
      });
      return;
    }

    const reportData = {
      name: newReport.name,
      description: newReport.description,
      reportType: newReport.reportType,
      datasetIds: newReport.selectedDatasets,
      parameters: {
        includeCharts: newReport.includeCharts,
        includeInsights: newReport.includeInsights,
        includeProcessingDetails: newReport.includeProcessingDetails,
      },
    };

    generateReportMutation.mutate(reportData);
  };

  const handleDatasetToggle = (datasetId: number) => {
    setNewReport(prev => ({
      ...prev,
      selectedDatasets: prev.selectedDatasets.includes(datasetId)
        ? prev.selectedDatasets.filter(id => id !== datasetId)
        : [...prev.selectedDatasets, datasetId]
    }));
  };

  const getReportTypeBadge = (type: string) => {
    const variants = {
      summary: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      detailed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      analysis: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
      insights: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
    };
    
    return (
      <Badge className={variants[type as keyof typeof variants] || variants.summary}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const handleExportReport = (reportId: number, format: string) => {
    // In a real application, this would trigger a download
    toast({
      title: "Export Started",
      description: `Exporting report in ${format.toUpperCase()} format...`,
    });
  };

/*  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-blue"></div>
      </div>
    );
  }*/

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      
      <div className="ml-64">
        <TopBar title="Reports" />
        
        <div className="p-6">
          {/* Report Generation */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Generate New Report</CardTitle>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="bg-primary-blue hover:bg-blue-600">
                      <Plus size={16} className="mr-2" />
                      Create Report
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Generate New Report</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="report-name">Report Name</Label>
                          <Input
                            id="report-name"
                            value={newReport.name}
                            onChange={(e) => setNewReport(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Enter report name"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="report-type">Report Type</Label>
                          <Select
                            value={newReport.reportType}
                            onValueChange={(value) => setNewReport(prev => ({ ...prev, reportType: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="summary">Summary Report</SelectItem>
                              <SelectItem value="detailed">Detailed Analysis</SelectItem>
                              <SelectItem value="analysis">Statistical Analysis</SelectItem>
                              <SelectItem value="insights">AI Insights Report</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={newReport.description}
                          onChange={(e) => setNewReport(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Brief description of the report"
                          rows={3}
                        />
                      </div>
                      
                      <div>
                        <Label>Select Datasets</Label>
                        <div className="mt-2 max-h-32 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-md p-3">
                          {datasets && datasets.length > 0 ? (
                            <div className="space-y-2">
                              {datasets.map((dataset: any) => (
                                <div key={dataset.id} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`dataset-${dataset.id}`}
                                    checked={newReport.selectedDatasets.includes(dataset.id)}
                                    onCheckedChange={() => handleDatasetToggle(dataset.id)}
                                  />
                                  <Label htmlFor={`dataset-${dataset.id}`} className="text-sm">
                                    {dataset.name}
                                  </Label>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500">No datasets available</p>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <Label>Report Options</Label>
                        <div className="mt-2 space-y-2">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="include-charts"
                              checked={newReport.includeCharts}
                              onCheckedChange={(checked) => 
                                setNewReport(prev => ({ ...prev, includeCharts: checked as boolean }))
                              }
                            />
                            <Label htmlFor="include-charts" className="text-sm">Include charts and visualizations</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="include-insights"
                              checked={newReport.includeInsights}
                              onCheckedChange={(checked) => 
                                setNewReport(prev => ({ ...prev, includeInsights: checked as boolean }))
                              }
                            />
                            <Label htmlFor="include-insights" className="text-sm">Include AI insights</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="include-processing"
                              checked={newReport.includeProcessingDetails}
                              onCheckedChange={(checked) => 
                                setNewReport(prev => ({ ...prev, includeProcessingDetails: checked as boolean }))
                              }
                            />
                            <Label htmlFor="include-processing" className="text-sm">Include processing details</Label>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline">Cancel</Button>
                        <Button 
                          onClick={handleGenerateReport}
                          disabled={generateReportMutation.isPending}
                          className="bg-primary-blue hover:bg-blue-600"
                        >
                          {generateReportMutation.isPending ? "Generating..." : "Generate Report"}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-primary-blue hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer transition-colors">
                  <div className="text-center">
                    <FileText className="text-2xl text-gray-400 mb-2 mx-auto" />
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Summary Report</p>
                    <p className="text-xs text-gray-500 mt-1">Quick overview of key metrics</p>
                  </div>
                </Card>
                
                <Card className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-primary-blue hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer transition-colors">
                  <div className="text-center">
                    <FileText className="text-2xl text-gray-400 mb-2 mx-auto" />
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Detailed Analysis</p>
                    <p className="text-xs text-gray-500 mt-1">Comprehensive data analysis</p>
                  </div>
                </Card>
                
                <Card className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-primary-blue hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer transition-colors">
                  <div className="text-center">
                    <FileText className="text-2xl text-gray-400 mb-2 mx-auto" />
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">AI Insights</p>
                    <p className="text-xs text-gray-500 mt-1">Machine learning findings</p>
                  </div>
                </Card>
              </div>
            </CardContent>
          </Card>

          {/* Generated Reports */}
          <Card>
            <CardHeader>
              <CardTitle>Generated Reports</CardTitle>
            </CardHeader>
            <CardContent>
              {reportsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-blue"></div>
                </div>
              ) : reports && reports.length > 0 ? (
                <div className="space-y-4">
                  {reports.map((report: any) => (
                    <div key={report.id} className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                            <FileText className="text-gray-600 dark:text-gray-400" size={20} />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              {report.name}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {report.description || "No description"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getReportTypeBadge(report.reportType)}
                          <Button variant="outline" size="sm">
                            <Eye size={16} className="mr-1" />
                            View
                          </Button>
                          <Select>
                            <SelectTrigger className="w-32">
                              <SelectValue placeholder="Export" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem 
                                value="pdf"
                                onClick={() => handleExportReport(report.id, "pdf")}
                              >
                                Export PDF
                              </SelectItem>
                              <SelectItem 
                                value="excel"
                                onClick={() => handleExportReport(report.id, "excel")}
                              >
                                Export Excel
                              </SelectItem>
                              <SelectItem 
                                value="csv"
                                onClick={() => handleExportReport(report.id, "csv")}
                              >
                                Export CSV
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4">
                        <h4 className="font-medium text-gray-900 dark:text-white mb-2">Report Details:</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Datasets:</span>
                            <span className="ml-2 text-gray-900 dark:text-white font-medium">
                              {Array.isArray(report.datasetIds) ? report.datasetIds.length : 0} datasets
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Type:</span>
                            <span className="ml-2 text-gray-900 dark:text-white font-medium">
                              {report.reportType.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center">
                          <Calendar size={16} className="mr-1" />
                          <span>Generated on {formatDate(report.createdAt)}</span>
                        </div>
                        <span>Report ID: {report.id}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No reports generated yet</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-6">
                    Create your first report to get comprehensive insights from your data.
                  </p>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="bg-primary-blue hover:bg-blue-600">
                        <Plus size={16} className="mr-2" />
                        Generate First Report
                      </Button>
                    </DialogTrigger>
                  </Dialog>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
