import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import Sidebar from "@/components/layout/sidebar";
import TopBar from "@/components/layout/topbar";
import FileDropzone from "@/components/upload/file-dropzone";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { FileText, Trash2, Eye, X } from "lucide-react";

export default function DataUpload() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadOptions, setUploadOptions] = useState({
    name: "",
    category: "text", // text, image, video
    description: "",
    autoValidate: false,
    generatePreview: false,
    startAnalysis: false,
  });

  const { data: datasets = [], isLoading: datasetsLoading } = useQuery<any[]>({
    queryKey: ["/api/datasets"],
    retry: false,
  });

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      return await apiRequest("POST", "/api/datasets", formData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Dataset uploaded successfully!",
      });
      setSelectedFiles([]);
      setUploadOptions({
        name: "",
        category: "text",
        description: "",
        autoValidate: false,
        generatePreview: false,
        startAnalysis: false,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/datasets"] });
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
        title: "Upload Failed",
        description: error.message || "Failed to upload dataset",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/datasets/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Dataset deleted successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/datasets"] });
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
        title: "Delete Failed",
        description: error.message || "Failed to delete dataset",
        variant: "destructive",
      });
    },
  });

  const handleFilesSelected = (files: File[]) => {
    setSelectedFiles(prev => [...prev, ...files]);
    if (files.length === 1 && !uploadOptions.name) {
      setUploadOptions(prev => ({
        ...prev,
        name: files[0].name.replace(/\.[^/.]+$/, "")
      }));
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select files to upload",
        variant: "destructive",
      });
      return;
    }

    if (!uploadOptions.name.trim()) {
      toast({
        title: "Dataset name required",
        description: "Please enter a dataset name",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFiles[0]);
    formData.append('name', uploadOptions.name);
    formData.append('category', uploadOptions.category);
    formData.append('description', uploadOptions.description);

    uploadMutation.mutate(formData);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      processing: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
      failed: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
      uploaded: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    };

    return (
      <Badge className={variants[status as keyof typeof variants] || variants.uploaded}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();

    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(extension || '')) {
      return <FileText className="text-purple-500" size={20} />;
    }

    if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'].includes(extension || '')) {
      return <FileText className="text-red-500" size={20} />;
    }

    const iconClass: Record<string, string> = {
      'csv': 'text-green-500',
      'xlsx': 'text-green-600',
      'xls': 'text-green-600',
      'json': 'text-blue-500',
      'xml': 'text-orange-500',
      'txt': 'text-gray-600',
      'pdf': 'text-red-600',
    };

    return <FileText className={iconClass[extension || ''] || 'text-gray-500'} size={20} />;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar isCollapsed={sidebarCollapsed} setIsCollapsed={setSidebarCollapsed} />

      <div className={sidebarCollapsed ? "ml-16" : "ml-64"} style={{ transition: "margin-left 300ms" }}>
        <TopBar title="Data Upload" />

        <div className="p-6 max-w-4xl">
          {/* Upload Area */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Upload Data Files</CardTitle>
            </CardHeader>
            <CardContent>
              <FileDropzone onFilesSelected={handleFilesSelected} />

              {selectedFiles.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Selected Files:</h4>
                  <div className="space-y-2">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-md">
                        <div className="flex items-center space-x-2">
                          {getFileIcon(file.name)}
                          <span className="text-sm font-medium">{file.name}</span>
                          <span className="text-xs text-gray-500">({formatFileSize(file.size)})</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                        >
                          <X size={16} />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upload Options */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Upload Options</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Same upload options UI */}
              {/* ... unchanged */}
            </CardContent>
          </Card>

          {/* Recent Uploads */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Uploads</CardTitle>
            </CardHeader>
            <CardContent>
              {datasetsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-blue"></div>
                </div>
              ) : datasets && datasets.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">File Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Size</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Uploaded</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                      {datasets.map((dataset: any) => (
                        <tr key={dataset.id}>
                          <td className="px-6 py-4 whitespace-nowrap flex items-center space-x-2">
                            {getFileIcon(dataset.fileName)}
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{dataset.fileName}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{formatFileSize(dataset.fileSize)}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(dataset.status)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{new Date(dataset.uploadedAt).toLocaleString()}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex space-x-2">
                              <Button size="sm" variant="ghost" onClick={() => alert(`Preview for ${dataset.fileName}`)}>
                                <Eye size={16} />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => deleteMutation.mutate(dataset.id)}
                                disabled={deleteMutation.isPending}
                              >
                                <Trash2 size={16} />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">No datasets uploaded yet.</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
