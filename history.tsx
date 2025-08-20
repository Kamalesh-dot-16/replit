import { useEffect, useState } from "react";
//import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { isUnauthorizedError } from "@/lib/authUtils";
import Sidebar from "@/components/layout/sidebar";
import TopBar from "@/components/layout/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Upload, 
  Database, 
  Brain, 
  FileText, 
  Users, 
  Shield, 
  Trash2,
  Search,
  Filter,
  Calendar
} from "lucide-react";

export default function History() {
  const { toast } = useToast();
  //const { isAuthenticated, isLoading } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("all");

  // Redirect if not authenticated
 /* useEffect(() => {
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

  const { data: activityLogs = [], isLoading: logsLoading } = useQuery<any[]>({
    queryKey: ["/api/dashboard/recent-activity"],
    retry: false,
  });

  const { data: notifications = [] } = useQuery<any[]>({
    queryKey: ["/api/notifications"],
    retry: false,
  });

  const getActionIcon = (action: string) => {
    const iconMap = {
      upload_dataset: Upload,
      delete_dataset: Trash2,
      processing_complete: Database,
      generate_insight: Brain,
      generate_report: FileText,
      update_user_role: Users,
      update_user_status: Users,
      create_role: Shield,
    };
    
    const Icon = iconMap[action as keyof typeof iconMap] || Database;
    return Icon;
  };

  const getActionColor = (action: string) => {
    const colorMap = {
      upload_dataset: "text-blue-600",
      delete_dataset: "text-red-600",
      processing_complete: "text-green-600",
      generate_insight: "text-purple-600",
      generate_report: "text-orange-600",
      update_user_role: "text-yellow-600",
      update_user_status: "text-gray-600",
      create_role: "text-indigo-600",
    };
    
    return colorMap[action as keyof typeof colorMap] || "text-gray-600";
  };

  const getBadgeColor = (action: string) => {
    const colorMap = {
      upload_dataset: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      delete_dataset: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
      processing_complete: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      generate_insight: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
      generate_report: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
      update_user_role: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
      update_user_status: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
      create_role: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300",
    };
    
    return colorMap[action as keyof typeof colorMap] || "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
  };

  const formatActionMessage = (activity: any) => {
    const actionMessages = {
      upload_dataset: `Uploaded dataset "${activity.metadata?.fileName || 'unknown'}"`,
      delete_dataset: "Deleted a dataset",
      processing_complete: "Completed data processing",
      generate_insight: "Generated new insights",
      generate_report: "Generated a report",
      update_user_role: `Updated user role to ${activity.metadata?.newRole || 'unknown'}`,
      update_user_status: `${activity.metadata?.isActive ? 'Activated' : 'Deactivated'} user account`,
      create_role: "Created new role",
    };
    
    return actionMessages[activity.action as keyof typeof actionMessages] || activity.action;
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const activityDate = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - activityDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  // Filter activities based on search and filters
  const filteredActivities = activityLogs?.filter((activity: any) => {
    const matchesSearch = searchTerm === "" || 
      formatActionMessage(activity).toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.action.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAction = actionFilter === "all" || activity.action === actionFilter;
    
    const matchesTime = timeFilter === "all" || (() => {
      const activityDate = new Date(activity.createdAt);
      const now = new Date();
      const diffInDays = Math.floor((now.getTime() - activityDate.getTime()) / (1000 * 60 * 60 * 24));
      
      switch (timeFilter) {
        case "today": return diffInDays === 0;
        case "week": return diffInDays <= 7;
        case "month": return diffInDays <= 30;
        default: return true;
      }
    })();
    
    return matchesSearch && matchesAction && matchesTime;
  }) || [];

  // Combine activities and notifications for a unified timeline
  const allEvents = [
    ...(filteredActivities || []).map((activity: any) => ({
      ...activity,
      type: 'activity',
      timestamp: activity.createdAt,
    })),
    ...(notifications || []).map((notification: any) => ({
      ...notification,
      type: 'notification',
      timestamp: notification.createdAt,
    }))
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  /*if (isLoading) {
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
        <TopBar title="Activity History" />
        
        <div className="p-6">
          {/* Filters */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Filter className="mr-2" size={20} />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Search
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                    <Input
                      placeholder="Search activities..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Action Type
                  </label>
                  <Select value={actionFilter} onValueChange={setActionFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Actions</SelectItem>
                      <SelectItem value="upload_dataset">Data Upload</SelectItem>
                      <SelectItem value="delete_dataset">Data Deletion</SelectItem>
                      <SelectItem value="processing_complete">Processing</SelectItem>
                      <SelectItem value="generate_insight">Insights</SelectItem>
                      <SelectItem value="generate_report">Reports</SelectItem>
                      <SelectItem value="update_user_role">User Management</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Time Period
                  </label>
                  <Select value={timeFilter} onValueChange={setTimeFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">This Week</SelectItem>
                      <SelectItem value="month">This Month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-end">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSearchTerm("");
                      setActionFilter("all");
                      setTimeFilter("all");
                    }}
                    className="w-full"
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Activity Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="mr-2" size={20} />
                Activity Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              {logsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-blue"></div>
                </div>
              ) : allEvents.length > 0 ? (
                <div className="space-y-4">
                  {allEvents.map((event: any, index) => {
                    if (event.type === 'activity') {
                      const Icon = getActionIcon(event.action);
                      const iconColor = getActionColor(event.action);
                      const badgeColor = getBadgeColor(event.action);
                      
                      return (
                        <div key={`activity-${event.id}`} className="flex items-start space-x-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                          <div className={`w-10 h-10 rounded-full bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 flex items-center justify-center flex-shrink-0`}>
                            <Icon className={iconColor} size={18} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {formatActionMessage(event)}
                              </p>
                              <Badge className={badgeColor}>
                                {event.action.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                              </Badge>
                            </div>
                            
                            {event.metadata && Object.keys(event.metadata).length > 0 && (
                              <div className="bg-gray-50 dark:bg-gray-800 rounded p-2 mb-2">
                                <p className="text-xs text-gray-600 dark:text-gray-400">Details:</p>
                                <div className="text-xs text-gray-500 dark:text-gray-500">
                                  {Object.entries(event.metadata).map(([key, value]) => (
                                    <span key={key} className="mr-3">
                                      {key}: {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                              <span>{formatDateTime(event.createdAt)}</span>
                              <span>{getTimeAgo(event.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    } else {
                      // Notification event
                      return (
                        <div key={`notification-${event.id}`} className="flex items-start space-x-4 p-4 border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 border-2 border-blue-200 dark:border-blue-700 flex items-center justify-center flex-shrink-0">
                            <FileText className="text-blue-600 dark:text-blue-400" size={18} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {event.title}
                              </p>
                              <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                                Notification
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                              {event.message}
                            </p>
                            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                              <span>{formatDateTime(event.createdAt)}</span>
                              <span>{getTimeAgo(event.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    {searchTerm || actionFilter !== "all" || timeFilter !== "all" 
                      ? "No matching activities found" 
                      : "No activity history yet"
                    }
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    {searchTerm || actionFilter !== "all" || timeFilter !== "all" 
                      ? "Try adjusting your filters to see more results." 
                      : "Activity will appear here as you use the application."
                    }
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
