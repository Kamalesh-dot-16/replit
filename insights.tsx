import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import TopBar from "@/components/layout/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Brain,
  TrendingUp,
  AlertTriangle,
  BarChart3,
  Eye,
  Download
} from "lucide-react";

export default function Insights() {
  const { toast } = useToast();

  const { data: insights = [], isLoading: insightsLoading } = useQuery<any[]>({
    queryKey: ["/api/insights"],
    retry: false,
  });

  const { data: datasets = [] } = useQuery<any[]>({
    queryKey: ["/api/datasets"],
    retry: false,
  });

  const getInsightIcon = (type: string) => {
    const iconMap = {
      processing_result: Brain,
      statistical_analysis: BarChart3,
      anomaly_detection: AlertTriangle,
      trend_analysis: TrendingUp,
      correlation: BarChart3,
    };
    const Icon = iconMap[type as keyof typeof iconMap] || Brain;
    return <Icon size={20} />;
  };

  const getInsightColor = (type: string) => {
    const colorMap = {
      processing_result: "text-blue-600",
      statistical_analysis: "text-green-600",
      anomaly_detection: "text-red-600",
      trend_analysis: "text-purple-600",
      correlation: "text-orange-600",
    };
    return colorMap[type as keyof typeof colorMap] || "text-blue-600";
  };

  const getConfidenceBadge = (confidence: string) => {
    const conf = parseFloat(confidence);
    if (conf >= 90) {
      return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">High ({confidence}%)</Badge>;
    } else if (conf >= 70) {
      return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">Medium ({confidence}%)</Badge>;
    } else {
      return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">Low ({confidence}%)</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const totalInsights = insights?.length || 0;
  const highConfidenceInsights = insights?.filter((insight: any) => parseFloat(insight.confidence) >= 90).length || 0;
  const recentInsights = insights?.filter((insight: any) => {
    const insightDate = new Date(insight.createdAt);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return insightDate > weekAgo;
  }).length || 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar/>
      <div className="ml-64">
        <TopBar title="AI Insights" />
        <div className="p-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Insights</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{totalInsights}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                    <Brain className="text-blue-600 dark:text-blue-400" size={24} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">High Confidence</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{highConfidenceInsights}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                    <TrendingUp className="text-green-600 dark:text-green-400" size={24} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">This Week</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{recentInsights}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                    <BarChart3 className="text-purple-600 dark:text-purple-400" size={24} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Filter Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Dataset</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="All datasets" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All datasets</SelectItem>
                      {datasets?.map((dataset: any) => (
                        <SelectItem key={dataset.id} value={dataset.id.toString()}>
                          {dataset.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Insight Type</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All types</SelectItem>
                      <SelectItem value="processing_result">Processing Result</SelectItem>
                      <SelectItem value="statistical_analysis">Statistical Analysis</SelectItem>
                      <SelectItem value="anomaly_detection">Anomaly Detection</SelectItem>
                      <SelectItem value="trend_analysis">Trend Analysis</SelectItem>
                      <SelectItem value="correlation">Correlation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Confidence Level</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="All levels" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All levels</SelectItem>
                      <SelectItem value="high">High (90%+)</SelectItem>
                      <SelectItem value="medium">Medium (70–89%)</SelectItem>
                      <SelectItem value="low">Low (&lt;70%)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Insights List */}
          <Card>
            <CardHeader>
              <CardTitle>Generated Insights</CardTitle>
            </CardHeader>
            <CardContent>
              {insightsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-blue"></div>
                </div>
              ) : insights && insights.length > 0 ? (
                <div className="space-y-4">
                  {insights.map((insight: any) => (
                    <div key={insight.id} className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center ${getInsightColor(insight.insightType)}`}>
                            {getInsightIcon(insight.insightType)}
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{insight.title}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{formatDate(insight.createdAt)}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getConfidenceBadge(insight.confidence)}
                          <Button variant="outline" size="icon">
                            <Eye size={16} />
                          </Button>
                          <Button variant="outline" size="icon">
                            <Download size={16} />
                          </Button>
                        </div>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300">{insight.description}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">No insights found.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
