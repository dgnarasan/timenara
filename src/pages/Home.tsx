
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CalendarDays, GraduationCap, Calendar, ArrowRight, LogIn, LogOut, Menu, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const Home = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const MobileMenu = () => (
    <div className="flex flex-col space-y-4 p-4">
      {user ? (
        <>
          <div className="text-sm text-muted-foreground">
            Welcome, {user.email?.split('@')[0]}
          </div>
          <Button variant="outline" onClick={() => signOut()} className="w-full">
            <LogOut className="mr-2 h-4 w-4" /> Sign Out
          </Button>
        </>
      ) : (
        <Button variant="outline" onClick={() => navigate('/auth')} className="w-full">
          <LogIn className="mr-2 h-4 w-4" /> Sign In
        </Button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background">
      {/* Mobile-responsive header */}
      <header className="container mx-auto py-4 px-4 flex items-center justify-between">
        <div className="text-xl md:text-2xl font-bold">Scheduler</div>
        
        {/* Desktop navigation */}
        <div className="hidden md:flex">
          {user ? (
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                Welcome, {user.email?.split('@')[0]}
              </span>
              <Button variant="outline" size="sm" onClick={() => signOut()}>
                <LogOut className="mr-2 h-4 w-4" /> Sign Out
              </Button>
            </div>
          ) : (
            <Button variant="outline" size="sm" onClick={() => navigate('/auth')}>
              <LogIn className="mr-2 h-4 w-4" /> Sign In
            </Button>
          )}
        </div>

        {/* Mobile navigation */}
        <div className="md:hidden">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64">
              <MobileMenu />
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 md:py-16 space-y-12 md:space-y-16">
        {/* Hero Section - Mobile optimized */}
        <div className="text-center space-y-4 md:space-y-6">
          <h1 className="text-3xl md:text-4xl lg:text-6xl font-bold tracking-tight leading-tight">
            Smart Course Scheduling
            <span className="text-primary block mt-2">Made Simple</span>
          </h1>
          <p className="text-base md:text-xl text-muted-foreground max-w-2xl mx-auto px-2">
            AI-powered course scheduling system that makes organizing academic timetables effortless for both students and administrators.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3 md:gap-4 px-4">
            <Button
              size="lg"
              className="text-base md:text-lg w-full sm:w-auto"
              onClick={() => navigate("/schedule")}
            >
              View Course Schedule <ArrowRight className="ml-2" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-base md:text-lg w-full sm:w-auto"
              onClick={() => navigate("/exam-schedule")}
            >
              <FileText className="mr-2 h-4 w-4" />
              Exam Timetable
            </Button>
          </div>
        </div>

        {/* Features Section - Mobile grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          <Card className="p-4 md:p-6 space-y-3 md:space-y-4 bg-card/50 backdrop-blur-sm">
            <div className="p-2 md:p-3 bg-primary/10 w-fit rounded-lg">
              <CalendarDays className="h-6 w-6 md:h-8 md:w-8 text-primary" />
            </div>
            <h3 className="text-lg md:text-xl font-semibold">Smart Scheduling</h3>
            <p className="text-sm md:text-base text-muted-foreground">
              Automatically generate conflict-free schedules optimized for both students and faculty.
            </p>
          </Card>

          <Card className="p-4 md:p-6 space-y-3 md:space-y-4 bg-card/50 backdrop-blur-sm">
            <div className="p-2 md:p-3 bg-primary/10 w-fit rounded-lg">
              <GraduationCap className="h-6 w-6 md:h-8 md:w-8 text-primary" />
            </div>
            <h3 className="text-lg md:text-xl font-semibold">Academic Management</h3>
            <p className="text-sm md:text-base text-muted-foreground">
              Easily manage courses, instructors, and venue assignments in one place.
            </p>
          </Card>

          <Card className="p-4 md:p-6 space-y-3 md:space-y-4 bg-card/50 backdrop-blur-sm">
            <div className="p-2 md:p-3 bg-primary/10 w-fit rounded-lg">
              <Calendar className="h-6 w-6 md:h-8 md:w-8 text-primary" />
            </div>
            <h3 className="text-lg md:text-xl font-semibold">Flexible Viewing</h3>
            <p className="text-sm md:text-base text-muted-foreground">
              View and manage schedules with an intuitive, customizable interface.
            </p>
          </Card>
        </div>

        {/* CTA Section - Mobile optimized */}
        <div className="text-center space-y-4 md:space-y-6 py-6 md:py-8 px-4">
          <h2 className="text-2xl md:text-3xl font-bold">Ready to Get Started?</h2>
          <p className="text-sm md:text-base text-muted-foreground max-w-xl mx-auto">
            Join our platform today and experience the future of academic scheduling.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <Button
              size="lg"
              className="text-base md:text-lg w-full sm:w-auto"
              onClick={() => navigate("/schedule")}
            >
              View Course Schedule <ArrowRight className="ml-2" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-base md:text-lg w-full sm:w-auto"
              onClick={() => navigate("/admin")}
            >
              Admin Dashboard
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
