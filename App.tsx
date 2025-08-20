import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import DataUpload from "@/pages/data-upload";
import DataProcessing from "@/pages/data-processing";
import Insights from "@/pages/insights";
import Reports from "@/pages/reports";
import History from "@/pages/history";
import Settings from "@/pages/settings";
import Profile from "@/pages/profile";
import UserManagement from "@/pages/user-management";
import RoleManagement from "@/pages/role-management";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/data-upload" component={DataUpload} />
      <Route path="/data-processing" component={DataProcessing} />
      <Route path="/insights" component={Insights} />
      <Route path="/reports" component={Reports} />
      <Route path="/history" component={History} />
      <Route path="/settings" component={Settings} />
      <Route path="/profile" component={Profile} />
      <Route path="/user-management" component={UserManagement} />
      <Route path="/role-management" component={RoleManagement} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
