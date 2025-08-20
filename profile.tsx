import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Sidebar from "@/components/layout/sidebar";
import TopBar from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Edit, Save, Shield, Eye, Lock } from "lucide-react";

const personalInfoSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
});

const accessControlSchema = z.object({
  canViewDashboard: z.boolean().default(true),
  canUploadData: z.boolean().default(true),
  canProcessData: z.boolean().default(true),
  canViewInsights: z.boolean().default(true),
  canGenerateReports: z.boolean().default(true),
  canViewHistory: z.boolean().default(true),
  canManageUsers: z.boolean().default(false),
  canManageRoles: z.boolean().default(false),
});

type PersonalInfoFormData = z.infer<typeof personalInfoSchema>;
type AccessControlFormData = z.infer<typeof accessControlSchema>;

export default function Profile() {
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [isEditingAccess, setIsEditingAccess] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/dshboard";
      }, 500);
      return;
    }
  }, [user, authLoading, toast]);

  // Fetch user profile data
  const { data: userProfile, isLoading: profileLoading } = useQuery<any>({
    queryKey: ["/api/profile"],
    retry: false,
  });

  // Personal Info Form
  const personalForm = useForm<PersonalInfoFormData>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
    },
  });

  // Access Control Form
  const accessForm = useForm<AccessControlFormData>({
    resolver: zodResolver(accessControlSchema),
    defaultValues: {
      canViewDashboard: true,
      canUploadData: true,
      canProcessData: true,
      canViewInsights: true,
      canGenerateReports: true,
      canViewHistory: true,
      canManageUsers: false,
      canManageRoles: false,
    },
  });

  // Update personal info mutation
  const updatePersonalMutation = useMutation({
    mutationFn: async (data: PersonalInfoFormData) => {
      return await apiRequest("PUT", "/api/profile/personal", data);
    },
    onSuccess: () => {
      toast({
        title: "Profile Updated",
        description: "Your personal information has been updated successfully!",
      });
      setIsEditingPersonal(false);
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
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
        description: error.message || "Failed to update personal information",
        variant: "destructive",
      });
    },
  });

  // Update access control mutation
  const updateAccessMutation = useMutation({
    mutationFn: async (data: AccessControlFormData) => {
      return await apiRequest("PUT", "/api/profile/access", data);
    },
    onSuccess: () => {
      toast({
        title: "Access Settings Updated",
        description: "Your page access preferences have been updated successfully!",
      });
      setIsEditingAccess(false);
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
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
        description: error.message || "Failed to update access settings",
        variant: "destructive",
      });
    },
  });

  // Initialize form values when profile data loads
  useEffect(() => {
    if (userProfile || user) {
      const profile = userProfile || user;
      personalForm.reset({
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        email: profile.email || "",
      });
      
      if (userProfile?.accessSettings) {
        accessForm.reset(userProfile.accessSettings);
      }
    }
  }, [userProfile, user, personalForm, accessForm]);

  const getUserInitials = (firstName?: string | null, lastName?: string | null, email?: string | null) => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    } else if (firstName) {
      return firstName[0].toUpperCase();
    } else if (email) {
      return email[0].toUpperCase();
    }
    return "U";
  };

  const getUserDisplayName = (firstName?: string | null, lastName?: string | null, email?: string | null) => {
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    } else if (firstName) {
      return firstName;
    } else if (email) {
      return email;
    }
    return "User";
  };

  const formatRole = (role?: string) => {
    if (!role) return "User";
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  const onSubmitPersonal = (data: PersonalInfoFormData) => {
    updatePersonalMutation.mutate(data);
  };

  const onSubmitAccess = (data: AccessControlFormData) => {
    updateAccessMutation.mutate(data);
  };

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-blue"></div>
      </div>
    );
  }

  const profile = userProfile || user;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar isCollapsed={sidebarCollapsed} setIsCollapsed={setSidebarCollapsed} />
      
      <div className={sidebarCollapsed ? "ml-16" : "ml-64"} style={{ transition: "margin-left 300ms" }}>
        <TopBar title="Profile" />
        
        <div className="p-6">
          {/* Profile Header */}
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-6">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={profile?.profileImageUrl} />
                  <AvatarFallback className="bg-primary-blue text-white text-xl">
                    {getUserInitials(profile?.firstName, profile?.lastName, profile?.email)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {getUserDisplayName(profile?.firstName, profile?.lastName, profile?.email)}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">{profile?.email}</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <Badge className="bg-primary-blue text-white">
                      <Shield size={14} className="mr-1" />
                      {formatRole(profile?.role)}
                    </Badge>
                    <Badge variant="outline">
                      Active since {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'N/A'}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profile Tabs */}
          <Tabs defaultValue="personal" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="personal" className="flex items-center space-x-2">
                <User size={16} />
                <span>Personal Info</span>
              </TabsTrigger>
              <TabsTrigger value="role" className="flex items-center space-x-2">
                <Shield size={16} />
                <span>Role & Security</span>
              </TabsTrigger>
              <TabsTrigger value="access" className="flex items-center space-x-2">
                <Eye size={16} />
                <span>Page Access</span>
              </TabsTrigger>
            </TabsList>

            {/* Personal Information Tab */}
            <TabsContent value="personal">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Personal Information</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditingPersonal(!isEditingPersonal)}
                  >
                    {isEditingPersonal ? <Save size={16} /> : <Edit size={16} />}
                    {isEditingPersonal ? "Cancel" : "Edit"}
                  </Button>
                </CardHeader>
                <CardContent>
                  {isEditingPersonal ? (
                    <Form {...personalForm}>
                      <form onSubmit={personalForm.handleSubmit(onSubmitPersonal)} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={personalForm.control}
                            name="firstName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>First Name</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={personalForm.control}
                            name="lastName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Last Name</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <FormField
                          control={personalForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email Address</FormLabel>
                              <FormControl>
                                <Input {...field} type="email" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="flex space-x-2">
                          <Button 
                            type="submit" 
                            disabled={updatePersonalMutation.isPending}
                            className="bg-primary-blue hover:bg-blue-600"
                          >
                            {updatePersonalMutation.isPending ? "Saving..." : "Save Changes"}
                          </Button>
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => setIsEditingPersonal(false)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </form>
                    </Form>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">First Name</Label>
                          <p className="text-gray-900 dark:text-white">{profile?.firstName || "Not provided"}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Last Name</Label>
                          <p className="text-gray-900 dark:text-white">{profile?.lastName || "Not provided"}</p>
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Email Address</Label>
                        <p className="text-gray-900 dark:text-white">{profile?.email || "Not provided"}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Role & Security Tab */}
            <TabsContent value="role">
              <Card>
                <CardHeader>
                  <CardTitle>Role & Security Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Current Role</Label>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge className="bg-primary-blue text-white">
                          <Shield size={14} className="mr-1" />
                          {formatRole(profile?.role)}
                        </Badge>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          ({profile?.role === 'admin' ? 'Full system access' : 'Standard user access'})
                        </span>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Account Status</Label>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                          Active
                        </Badge>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          Account is active and in good standing
                        </span>
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Member Since</Label>
                      <p className="text-gray-900 dark:text-white">
                        {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        }) : 'Not available'}
                      </p>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Last Updated</Label>
                      <p className="text-gray-900 dark:text-white">
                        {profile?.updatedAt ? new Date(profile.updatedAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        }) : 'Not available'}
                      </p>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center space-x-2">
                        <Lock className="text-blue-600 dark:text-blue-400" size={16} />
                        <span className="text-sm font-medium text-blue-900 dark:text-blue-300">Security Note</span>
                      </div>
                      <p className="text-sm text-blue-800 dark:text-blue-400 mt-1">
                        Role changes require administrator approval. Contact your system administrator if you need role modifications.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Page Access Tab */}
            <TabsContent value="access">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Page Access Control</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditingAccess(!isEditingAccess)}
                  >
                    {isEditingAccess ? <Save size={16} /> : <Edit size={16} />}
                    {isEditingAccess ? "Cancel" : "Edit"}
                  </Button>
                </CardHeader>
                <CardContent>
                  {isEditingAccess ? (
                    <Form {...accessForm}>
                      <form onSubmit={accessForm.handleSubmit(onSubmitAccess)} className="space-y-4">
                        <div className="space-y-4">
                          {[
                            { name: 'canViewDashboard', label: 'Dashboard Access', description: 'View main dashboard and metrics' },
                            { name: 'canUploadData', label: 'Data Upload', description: 'Upload files and create batches' },
                            { name: 'canProcessData', label: 'Data Processing', description: 'Process uploaded data and run jobs' },
                            { name: 'canViewInsights', label: 'AI Insights', description: 'View AI-generated insights and analysis' },
                            { name: 'canGenerateReports', label: 'Reports', description: 'Generate and view reports' },
                            { name: 'canViewHistory', label: 'History', description: 'View processing history and activity logs' },
                            { name: 'canManageUsers', label: 'User Management', description: 'Manage user accounts (Admin only)' },
                            { name: 'canManageRoles', label: 'Role Management', description: 'Manage user roles and permissions (Admin only)' },
                          ].map((item) => (
                            <FormField
                              key={item.name}
                              control={accessForm.control}
                              name={item.name as keyof AccessControlFormData}
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                  <div className="space-y-0.5">
                                    <FormLabel className="text-base font-medium">
                                      {item.label}
                                    </FormLabel>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                      {item.description}
                                    </p>
                                  </div>
                                  <FormControl>
                                    <Switch
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                      disabled={item.name.includes('Manage') && profile?.role !== 'admin'}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          ))}
                        </div>
                        <div className="flex space-x-2">
                          <Button 
                            type="submit" 
                            disabled={updateAccessMutation.isPending}
                            className="bg-primary-blue hover:bg-blue-600"
                          >
                            {updateAccessMutation.isPending ? "Saving..." : "Save Preferences"}
                          </Button>
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => setIsEditingAccess(false)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </form>
                    </Form>
                  ) : (
                    <div className="space-y-4">
                      {[
                        { key: 'canViewDashboard', label: 'Dashboard Access', description: 'View main dashboard and metrics' },
                        { key: 'canUploadData', label: 'Data Upload', description: 'Upload files and create batches' },
                        { key: 'canProcessData', label: 'Data Processing', description: 'Process uploaded data and run jobs' },
                        { key: 'canViewInsights', label: 'AI Insights', description: 'View AI-generated insights and analysis' },
                        { key: 'canGenerateReports', label: 'Reports', description: 'Generate and view reports' },
                        { key: 'canViewHistory', label: 'History', description: 'View processing history and activity logs' },
                        { key: 'canManageUsers', label: 'User Management', description: 'Manage user accounts (Admin only)' },
                        { key: 'canManageRoles', label: 'Role Management', description: 'Manage user roles and permissions (Admin only)' },
                      ].map((item) => {
                        const hasAccess = userProfile?.accessSettings?.[item.key] ?? true;
                        return (
                          <div key={item.key} className="flex items-center justify-between rounded-lg border p-4">
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">{item.label}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{item.description}</p>
                            </div>
                            <Badge className={hasAccess ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"}>
                              {hasAccess ? "Enabled" : "Disabled"}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}