import { useState, useEffect } from "react";
//import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import Sidebar from "@/components/layout/sidebar";
import TopBar from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HardDrive, Cloud, Server, Check } from "lucide-react";

type StorageOption = 'local' | 'azure' | 'aws';

interface StorageConfig {
  type: StorageOption;
  name: string;
  description: string;
  icon: any;
  color: string;
  bgColor: string;
}

export default function Settings() {
  const { toast } = useToast();
 // const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [selectedStorage, setSelectedStorage] = useState<StorageOption>('local');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Redirect if not authenticated
  /*useEffect(() => {
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

  // Fetch current storage settings
  const { data: storageSettings, isLoading: settingsLoading } = useQuery<{ storageType: StorageOption }>({
    queryKey: ["/api/settings/storage"],
    retry: false,
  });

  // Update storage settings mutation
  const updateStorageMutation = useMutation({
    mutationFn: async (storageType: StorageOption) => {
      return await apiRequest("PUT", "/api/settings/storage", { storageType });
    },
    onSuccess: () => {
      toast({
        title: "Settings Saved",
        description: "Storage configuration has been updated successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/settings/storage"] });
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
        title: "Save Failed",
        description: error.message || "Failed to update storage settings",
        variant: "destructive",
      });
    },
  });

  // Initialize selected storage from API data
  useEffect(() => {
    if (storageSettings?.storageType) {
      setSelectedStorage(storageSettings.storageType);
    }
  }, [storageSettings]);

  const storageOptions: StorageConfig[] = [
    {
      type: 'local',
      name: 'Local Storage',
      description: 'Store files on the local server. Fast access but limited scalability.',
      icon: HardDrive,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900',
    },
    {
      type: 'azure',
      name: 'Azure Blob Storage',
      description: 'Microsoft Azure cloud storage. Scalable and reliable with global distribution.',
      icon: Cloud,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900',
    },
    {
      type: 'aws',
      name: 'AWS S3',
      description: 'Amazon S3 cloud storage. Industry-leading scalability and durability.',
      icon: Server,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900',
    },
  ];

  const handleStorageSelect = (storageType: StorageOption) => {
    setSelectedStorage(storageType);
  };

  const handleSaveSettings = () => {
    updateStorageMutation.mutate(selectedStorage);
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
      <Sidebar isCollapsed={sidebarCollapsed} setIsCollapsed={setSidebarCollapsed} />
      
      <div className={sidebarCollapsed ? "ml-16" : "ml-64"} style={{ transition: "margin-left 300ms" }}>
        <TopBar title="Settings" />
        
        <div className="p-6">
          {/* Storage Configuration */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">
                Storage Configuration
              </CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Choose where to store your uploaded files and processed data.
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {storageOptions.map((option) => {
                  const Icon = option.icon;
                  const isSelected = selectedStorage === option.type;
                  const isCurrentActive = storageSettings?.storageType === option.type;
                  
                  return (
                    <Card
                      key={option.type}
                      className={`cursor-pointer transition-all border-2 ${
                        isSelected
                          ? 'border-primary-blue bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                      onClick={() => handleStorageSelect(option.type)}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className={`w-12 h-12 ${option.bgColor} rounded-lg flex items-center justify-center`}>
                            <Icon className={`${option.color} text-xl`} size={24} />
                          </div>
                          <div className="flex flex-col items-end space-y-2">
                            {isSelected && (
                              <div className="w-6 h-6 bg-primary-blue rounded-full flex items-center justify-center">
                                <Check className="text-white" size={16} />
                              </div>
                            )}
                            {isCurrentActive && (
                              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                                Active
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                          {option.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {option.description}
                        </p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
              
              <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {settingsLoading ? (
                    "Loading current settings..."
                  ) : storageSettings?.storageType ? (
                    `Currently using: ${storageOptions.find(opt => opt.type === storageSettings.storageType)?.name}`
                  ) : (
                    "No storage configuration found"
                  )}
                </div>
                
                <Button 
                  onClick={handleSaveSettings}
                  disabled={updateStorageMutation.isPending || selectedStorage === storageSettings?.storageType}
                  className="bg-primary-blue hover:bg-blue-600"
                >
                  {updateStorageMutation.isPending ? "Saving..." : "Save Settings"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Storage Status & Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                  Storage Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Current Storage</span>
                    <span className="text-sm text-gray-900 dark:text-white">
                      {storageOptions.find(opt => opt.type === (storageSettings?.storageType || 'local'))?.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Status</span>
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                      Connected
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Files</span>
                    <span className="text-sm text-gray-900 dark:text-white">0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Storage Used</span>
                    <span className="text-sm text-gray-900 dark:text-white">0 GB</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                  Configuration Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                  <p>• <strong>Local Storage:</strong> Files are stored on the server's local filesystem. Best for development and small deployments.</p>
                  <p>• <strong>Azure Blob Storage:</strong> Requires Azure account and storage connection string configuration.</p>
                  <p>• <strong>AWS S3:</strong> Requires AWS credentials (Access Key ID, Secret Access Key) and bucket configuration.</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-4">
                    Note: Changing storage type will not migrate existing files. Contact administrator for data migration assistance.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}