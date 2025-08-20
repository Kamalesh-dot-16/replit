import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChartLine, Upload, Brain, Users, Shield, FileText } from "lucide-react";
import { useNavigate } from 'react-router-dom';

export default function Landing() {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/dashboard'); // or '/app'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-red-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-primary-blue rounded-lg flex items-center justify-center mr-4">
              <ChartLine className="text-white text-2xl" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Defender Pro</h1>
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Enterprise Security & Data Protection Platform with AI/ML capabilities, comprehensive user management, 
            and advanced threat detection features.
          </p>
          <Button
            onClick={handleGetStarted}
            size="lg"
            className="bg-primary-blue hover:bg-blue-600 text-white px-8 py-3 text-lg"
          >
            Get Started
          </Button>
        </div>

        {/* Features Grid */}
        {/* ... rest of your code ... */}

        {/* Demo Credentials */}
        <Card className="max-w-md mx-auto border border-gray-200 dark:border-gray-700">
          <CardContent className="p-6 text-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Demo Access</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Click "Get Started" above to begin the authentication process with Replit Auth.
            </p>
            <Button 
              onClick={handleGetStarted}
              className="w-full bg-primary-blue hover:bg-blue-600 text-white"
            >
              Sign In with Replit
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
