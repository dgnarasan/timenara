
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CalendarDays, GraduationCap, Calendar, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background">
      {/* Header without auth buttons */}
      <header className="container mx-auto py-4 px-4 flex items-center justify-between">
        <div className="text-2xl font-bold">Scheduler</div>
      </header>

      <div className="container mx-auto px-4 py-16 space-y-16">
        {/* Hero Section */}
        <div className="text-center space-y-6">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            Smart Course Scheduling
            <span className="text-primary block mt-2">Made Simple</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            AI-powered course scheduling system that makes organizing academic timetables effortless for both students and administrators.
          </p>
          <div className="flex justify-center gap-4">
            <Button
              size="lg"
              className="text-lg"
              onClick={() => navigate("/schedule")}
            >
              Get Started <ArrowRight className="ml-2" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-lg"
              onClick={() => navigate("/admin")}
            >
              Admin Dashboard
            </Button>
          </div>
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="p-6 space-y-4 bg-card/50 backdrop-blur-sm">
            <div className="p-3 bg-primary/10 w-fit rounded-lg">
              <CalendarDays className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">Smart Scheduling</h3>
            <p className="text-muted-foreground">
              Automatically generate conflict-free schedules optimized for both students and faculty.
            </p>
          </Card>

          <Card className="p-6 space-y-4 bg-card/50 backdrop-blur-sm">
            <div className="p-3 bg-primary/10 w-fit rounded-lg">
              <GraduationCap className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">Academic Management</h3>
            <p className="text-muted-foreground">
              Easily manage courses, instructors, and venue assignments in one place.
            </p>
          </Card>

          <Card className="p-6 space-y-4 bg-card/50 backdrop-blur-sm">
            <div className="p-3 bg-primary/10 w-fit rounded-lg">
              <Calendar className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">Flexible Viewing</h3>
            <p className="text-muted-foreground">
              View and manage schedules with an intuitive, customizable interface.
            </p>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center space-y-6 py-8">
          <h2 className="text-3xl font-bold">Ready to Get Started?</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Join our platform today and experience the future of academic scheduling.
          </p>
          <Button
            size="lg"
            className="text-lg"
            onClick={() => navigate("/schedule")}
          >
            View Schedule <ArrowRight className="ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Home;
