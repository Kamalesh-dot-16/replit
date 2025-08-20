import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Shield, 
  Plus, 
  Edit, 
  Trash2, 
  Users, 
  Database,
  FileText,
  Upload,
  Brain,
  Settings,
  UserCheck,
  Eye
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

const availablePermissions: Permission[] = [
  // Data Management
  { id: "data.upload", name: "Upload Data", description: "Upload new datasets", category: "Data Management" },
  { id: "data.view", name: "View Data", description: "View uploaded datasets", category: "Data Management" },
  { id: "data.edit", name: "Edit Data", description: "Modify existing datasets", category: "Data Management" },
  { id: "data.delete", name: "Delete Data", description: "Remove datasets", category: "Data Management" },
  
  // Processing
  { id: "processing.start", name: "Start Processing", description: "Initiate data processing jobs", category: "Processing" },
  { id: "processing.view", name: "View Processing", description: "View processing status and history", category: "Processing" },
  { id: "processing.cancel", name: "Cancel Processing", description: "Stop running processing jobs", category: "Processing" },
  
  // Insights
  { id: "insights.view", name: "View Insights", description: "Access AI-generated insights", category: "Insights" },
  { id: "insights.generate", name: "Generate Insights", description: "Create new insights", category: "Insights" },
  { id: "insights.export", name: "Export Insights", description: "Export insights data", category: "Insights" },
  
  // Reports
  { id: "reports.view", name: "View Reports", description: "Access generated reports", category: "Reports" },
  { id: "reports.create", name: "Create Reports", description: "Generate new reports", category: "Reports" },
  { id: "reports.export", name: "Export Reports", description: "Download reports in various formats", category: "Reports" },
  
  // User Management
  { id: "users.view", name: "View Users", description: "View user list and profiles", category: "User Management" },
  { id: "users.edit", name: "Edit Users", description: "Modify user accounts", category: "User Management" },
  { id: "users.create", name: "Create Users", description: "Add new user accounts", category: "User Management" },
  { id: "users.delete", name: "Delete Users", description: "Remove user accounts", category: "User Management" },
  
  // Role Management
  { id: "roles.view", name: "View Roles", description: "View role definitions", category: "Role Management" },
  { id: "roles.edit", name: "Edit Roles", description: "Modify role permissions", category: "Role Management" },
  { id: "roles.create", name: "Create Roles", description: "Create new roles", category: "Role Management" },
  { id: "roles.delete", name: "Delete Roles", description: "Remove roles", category: "Role Management" },
  
  // System
  { id: "system.settings", name: "System Settings", description: "Access system configuration", category: "System" },
  { id: "system.logs", name: "View Logs", description: "Access system activity logs", category: "System" },
];

export default function RoleManagement() {
  const { toast } = useToast();
  const { user: currentUser, isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<any>(null);
  const [newRole, setNewRole] = useState({
    name: "",
    description: "",
    permissions: [] as string[],
  });

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || (currentUser as any)?.role !== "admin")) {
      toast({
        title: "Unauthorized",
        description: "Admin access required. Redirecting...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = isAuthenticated ? "/" : "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, currentUser, toast]);

  const { data: roles = [], isLoading: rolesLoading } = useQuery<any[]>({
    queryKey: ["/api/roles"],
    retry: false,
    enabled: (currentUser as any)?.role === "admin",
  });

  const createRoleMutation = useMutation({
    mutationFn: async (roleData: any) => {
      return await apiRequest("POST", "/api/roles", roleData);
    },
    onSuccess: () => {
      toast({
        title: "Role Created",
        description: "New role has been created successfully!",
      });
      setNewRole({ name: "", description: "", permissions: [] });
      setIsCreateDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/roles"] });
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
        title: "Creation Failed",
        description: error.message || "Failed to create role",
        variant: "destructive",
      });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ id, roleData }: { id: number; roleData: any }) => {
      return await apiRequest("PATCH", `/api/roles/${id}`, roleData);
    },
    onSuccess: () => {
      toast({
        title: "Role Updated",
        description: "Role has been updated successfully!",
      });
      setEditingRole(null);
      queryClient.invalidateQueries({ queryKey: ["/api/roles"] });
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
        title: "Update Failed",
        description: error.message || "Failed to update role",
        variant: "destructive",
      });
    },
  });

  const deleteRoleMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/roles/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Role Deleted",
        description: "Role has been deleted successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/roles"] });
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
        title: "Deletion Failed",
        description: error.message || "Failed to delete role",
        variant: "destructive",
      });
    },
  });

  const handleCreateRole = () => {
    if (!newRole.name.trim()) {
      toast({
        title: "Role name required",
        description: "Please enter a name for the role",
        variant: "destructive",
      });
      return;
    }

    if (newRole.permissions.length === 0) {
      toast({
        title: "Permissions required",
        description: "Please select at least one permission",
        variant: "destructive",
      });
      return;
    }

    createRoleMutation.mutate({
      name: newRole.name,
      description: newRole.description,
      permissions: newRole.permissions,
    });
  };

  const handleEditRole = (role: any) => {
    setEditingRole({
      ...role,
      permissions: Array.isArray(role.permissions) ? role.permissions : [],
    });
  };

  const handleUpdateRole = () => {
    if (!editingRole?.name.trim()) {
      toast({
        title: "Role name required",
        description: "Please enter a name for the role",
        variant: "destructive",
      });
      return;
    }

    updateRoleMutation.mutate({
      id: editingRole.id,
      roleData: {
        name: editingRole.name,
        description: editingRole.description,
        permissions: editingRole.permissions,
      },
    });
  };

  const handlePermissionToggle = (permissionId: string, isEditing = false) => {
    if (isEditing && editingRole) {
      setEditingRole((prev: any) => ({
        ...prev,
        permissions: prev.permissions.includes(permissionId)
          ? prev.permissions.filter((p: string) => p !== permissionId)
          : [...prev.permissions, permissionId]
      }));
    } else {
      setNewRole(prev => ({
        ...prev,
        permissions: prev.permissions.includes(permissionId)
          ? prev.permissions.filter(p => p !== permissionId)
          : [...prev.permissions, permissionId]
      }));
    }
  };

  const getCategoryIcon = (category: string) => {
    const iconMap = {
      "Data Management": Database,
      "Processing": Settings,
      "Insights": Brain,
      "Reports": FileText,
      "User Management": Users,
      "Role Management": Shield,
      "System": Settings,
    };
    
    const Icon = iconMap[category as keyof typeof iconMap] || Settings;
    return Icon;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getPermissionCount = (permissions: string[] | any) => {
    if (Array.isArray(permissions)) {
      return permissions.length;
    }
    return 0;
  };

  const groupedPermissions = availablePermissions.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = [];
    }
    acc[permission.category].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-blue"></div>
      </div>
    );
  }

  if ((currentUser as any)?.role !== "admin") {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      
      <div className="ml-64">
        <TopBar title="Role Management" />
        
        <div className="p-6">
          {/* Role Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Roles</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{roles?.length || 0}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                    <Shield className="text-blue-600 dark:text-blue-400" size={24} />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Custom Roles</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      {roles?.filter((role: any) => !['admin', 'user'].includes(role.name)).length || 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                    <UserCheck className="text-green-600 dark:text-green-400" size={24} />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Permissions</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{availablePermissions.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                    <Settings className="text-purple-600 dark:text-purple-400" size={24} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Create Role Section */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Role Management</CardTitle>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-primary-blue hover:bg-blue-600">
                      <Plus size={16} className="mr-2" />
                      Create Role
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Create New Role</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="role-name">Role Name</Label>
                          <Input
                            id="role-name"
                            value={newRole.name}
                            onChange={(e) => setNewRole(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Enter role name"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="role-description">Description</Label>
                          <Textarea
                            id="role-description"
                            value={newRole.description}
                            onChange={(e) => setNewRole(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Brief description of the role"
                            rows={3}
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-base font-semibold">Permissions</Label>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                          Select the permissions that users with this role should have.
                        </p>
                        
                        <div className="space-y-6">
                          {Object.entries(groupedPermissions).map(([category, permissions]) => {
                            const Icon = getCategoryIcon(category);
                            return (
                              <div key={category} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                                <div className="flex items-center mb-3">
                                  <Icon size={20} className="text-gray-600 dark:text-gray-400 mr-2" />
                                  <h4 className="font-medium text-gray-900 dark:text-white">{category}</h4>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  {permissions.map((permission) => (
                                    <div key={permission.id} className="flex items-start space-x-2">
                                      <Checkbox
                                        id={`new-${permission.id}`}
                                        checked={newRole.permissions.includes(permission.id)}
                                        onCheckedChange={() => handlePermissionToggle(permission.id)}
                                      />
                                      <div className="flex-1">
                                        <Label 
                                          htmlFor={`new-${permission.id}`} 
                                          className="text-sm font-medium cursor-pointer"
                                        >
                                          {permission.name}
                                        </Label>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                          {permission.description}
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleCreateRole}
                          disabled={createRoleMutation.isPending}
                          className="bg-primary-blue hover:bg-blue-600"
                        >
                          {createRoleMutation.isPending ? "Creating..." : "Create Role"}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
          </Card>

          {/* Roles List */}
          <Card>
            <CardHeader>
              <CardTitle>System Roles</CardTitle>
            </CardHeader>
            <CardContent>
              {rolesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-blue"></div>
                </div>
              ) : roles && roles.length > 0 ? (
                <div className="space-y-4">
                  {roles.map((role: any) => (
                    <div key={role.id} className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                            <Shield className="text-gray-600 dark:text-gray-400" size={20} />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              {role.name}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {role.description || "No description provided"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                            {getPermissionCount(role.permissions)} permissions
                          </Badge>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Eye size={16} className="mr-1" />
                                Actions
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditRole(role)}>
                                <Edit size={16} className="mr-2" />
                                Edit Role
                              </DropdownMenuItem>
                              {!['admin', 'user'].includes(role.name.toLowerCase()) && (
                                <DropdownMenuItem 
                                  onClick={() => deleteRoleMutation.mutate(role.id)}
                                  className="text-red-600"
                                >
                                  <Trash2 size={16} className="mr-2" />
                                  Delete Role
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4">
                        <h4 className="font-medium text-gray-900 dark:text-white mb-2">Permissions:</h4>
                        {Array.isArray(role.permissions) && role.permissions.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {role.permissions.map((permissionId: string) => {
                              const permission = availablePermissions.find(p => p.id === permissionId);
                              return permission ? (
                                <Badge 
                                  key={permissionId} 
                                  variant="outline" 
                                  className="text-xs"
                                >
                                  {permission.name}
                                </Badge>
                              ) : (
                                <Badge 
                                  key={permissionId} 
                                  variant="outline" 
                                  className="text-xs bg-red-50 text-red-700"
                                >
                                  {permissionId} (unknown)
                                </Badge>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 dark:text-gray-400">No permissions assigned</p>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                        <span>Created: {formatDate(role.createdAt)}</span>
                        <span>Last Updated: {formatDate(role.updatedAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No roles found</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-6">
                    Create your first role to manage user permissions.
                  </p>
                  <Button 
                    onClick={() => setIsCreateDialogOpen(true)}
                    className="bg-primary-blue hover:bg-blue-600"
                  >
                    <Plus size={16} className="mr-2" />
                    Create First Role
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Edit Role Dialog */}
          {editingRole && (
            <Dialog open={!!editingRole} onOpenChange={() => setEditingRole(null)}>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Edit Role: {editingRole.name}</DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-role-name">Role Name</Label>
                      <Input
                        id="edit-role-name"
                        value={editingRole.name}
                        onChange={(e) => setEditingRole((prev: any) => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter role name"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="edit-role-description">Description</Label>
                      <Textarea
                        id="edit-role-description"
                        value={editingRole.description}
                        onChange={(e) => setEditingRole((prev: any) => ({ ...prev, description: e.target.value }))}
                        placeholder="Brief description of the role"
                        rows={3}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-base font-semibold">Permissions</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Select the permissions that users with this role should have.
                    </p>
                    
                    <div className="space-y-6">
                      {Object.entries(groupedPermissions).map(([category, permissions]) => {
                        const Icon = getCategoryIcon(category);
                        return (
                          <div key={category} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                            <div className="flex items-center mb-3">
                              <Icon size={20} className="text-gray-600 dark:text-gray-400 mr-2" />
                              <h4 className="font-medium text-gray-900 dark:text-white">{category}</h4>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {permissions.map((permission) => (
                                <div key={permission.id} className="flex items-start space-x-2">
                                  <Checkbox
                                    id={`edit-${permission.id}`}
                                    checked={editingRole.permissions.includes(permission.id)}
                                    onCheckedChange={() => handlePermissionToggle(permission.id, true)}
                                  />
                                  <div className="flex-1">
                                    <Label 
                                      htmlFor={`edit-${permission.id}`} 
                                      className="text-sm font-medium cursor-pointer"
                                    >
                                      {permission.name}
                                    </Label>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                      {permission.description}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setEditingRole(null)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleUpdateRole}
                      disabled={updateRoleMutation.isPending}
                      className="bg-primary-blue hover:bg-blue-600"
                    >
                      {updateRoleMutation.isPending ? "Updating..." : "Update Role"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
    </div>
  );
}
