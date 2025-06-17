import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { Suspense, lazy } from "react";
import "./App.css";

// Lazy load components for better performance
const AdminDashboard = lazy(() => import("@/pages/admin/Dashboard"));
const StudentSchedule = lazy(() => import("@/pages/student/Schedule"));
const ExamSchedule = lazy(() => import("@/pages/student/ExamSchedule"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const Home = lazy(() => import("@/pages/Home"));
const Auth = lazy(() => import("@/pages/Auth"));
const AccessDenied = lazy(() => import("@/pages/AccessDenied"));
const ExamTimetableGenerator = lazy(() => import("@/pages/admin/ExamTimetableGenerator"));

// Improved loading fallback component
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen bg-background">
    <div className="flex flex-col items-center space-y-4">
      <div className="relative">
        <div className="h-16 w-16 rounded-full border-t-4 border-primary animate-spin"></div>
        <div className="h-16 w-16 rounded-full border-r-4 border-primary/30 animate-pulse absolute top-0"></div>
      </div>
      <p className="text-muted-foreground animate-pulse">Loading application...</p>
    </div>
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" enableSystem>
        <TooltipProvider>
          <AuthProvider>
            <div className="min-h-screen">
              <Suspense fallback={<LoadingFallback />}>
                <Routes>
                  {/* Public routes */}
                  <Route path="/" element={<Home />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/access-denied" element={<AccessDenied />} />
                  
                  {/* Protected routes */}
                  <Route 
                    path="/admin/*" 
                    element={
                      <ProtectedRoute requireAdmin={true}>
                        <AdminDashboard />
                      </ProtectedRoute>
                    } 
                  />
                  
                  {/* Add new exam timetable generator route */}
                  <Route 
                    path="/admin/exam-timetable-generator" 
                    element={
                      <ProtectedRoute requireAdmin={true}>
                        <ExamTimetableGenerator />
                      </ProtectedRoute>
                    } 
                  />
                  
                  <Route 
                    path="/schedule" 
                    element={
                      <ProtectedRoute>
                        <StudentSchedule />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/exam-schedule" 
                    element={
                      <ProtectedRoute>
                        <ExamSchedule />
                      </ProtectedRoute>
                    } 
                  />
                  
                  {/* Add a direct route to admin dashboard for testing */}
                  <Route 
                    path="/admin" 
                    element={
                      <ProtectedRoute requireAdmin={true}>
                        <AdminDashboard />
                      </ProtectedRoute>
                    } 
                  />
                  
                  {/* Catch-all route */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
              <Toaster />
            </div>
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
