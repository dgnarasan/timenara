
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Routes, Route, useNavigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AdminDashboard from "@/pages/admin/Dashboard";
import StudentSchedule from "@/pages/student/Schedule";
import Auth from "@/pages/auth/Auth";
import NotFound from "@/pages/NotFound";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Users } from "lucide-react";
import "./App.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: 1,
    },
  },
});

function NavBar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isOnAdminPage = window.location.pathname.includes('/admin');

  const handleLogout = async () => {
    try {
      console.log('Attempting to sign out...');
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Signout error:', error);
        throw error;
      }
      
      console.log('Successfully signed out');
      toast({
        title: "Success",
        description: "Logged out successfully",
      });
      
      // Force navigation to auth page after successful logout
      window.location.href = '/auth';
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "Error",
        description: "Failed to log out",
        variant: "destructive",
      });
    }
  };

  const handleViewSwitch = () => {
    if (isOnAdminPage) {
      navigate('/schedule');
      toast({
        title: "View Switched",
        description: "Switched to student view",
      });
    } else {
      navigate('/admin');
      toast({
        title: "View Switched",
        description: "Switched to admin view",
      });
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 p-4 flex justify-between items-center bg-background/95 backdrop-blur-sm border-b z-50">
      <Button
        variant="ghost"
        onClick={() => navigate('/')}
        className="text-lg font-semibold"
      >
        Schedule App
      </Button>
      {user ? (
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            {user.email}
          </span>
          {user.role === 'admin' && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleViewSwitch}
            >
              <Users className="mr-2 h-4 w-4" />
              {isOnAdminPage ? 'Switch to Student View' : 'Switch to Admin View'}
            </Button>
          )}
          <Button
            variant="outline"
            onClick={handleLogout}
          >
            Log Out
          </Button>
        </div>
      ) : (
        <Button
          variant="outline"
          onClick={() => navigate('/auth')}
        >
          Sign In
        </Button>
      )}
    </div>
  );
}

function AppContent() {
  return (
    <div className="min-h-screen pt-16">
      <NavBar />
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route
          path="/"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/schedule"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <StudentSchedule />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" enableSystem>
        <TooltipProvider>
          <AuthProvider>
            <BrowserRouter>
              <AppContent />
            </BrowserRouter>
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
