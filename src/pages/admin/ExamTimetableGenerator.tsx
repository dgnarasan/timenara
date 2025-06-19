
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { fetchExamCourses, fetchAdminExamSchedule } from "@/lib/db";
import { FileText, Settings, Eye, ArrowRight, CalendarDays } from "lucide-react";
import ExamCourseManagement from "@/components/admin/exam/ExamCourseManagement";
import ExamScheduleGenerator from "@/components/admin/exam/ExamScheduleGenerator";
import ExamSchedulePreview from "@/components/admin/exam/ExamSchedulePreview";
import ExamCourseGroupDisplay from "@/components/admin/exam/ExamCourseGroupDisplay";
import WorkflowProgress from "@/components/admin/exam/timetable/WorkflowProgress";
import StatsCards from "@/components/admin/exam/timetable/StatsCards";

const ExamTimetableGenerator = () => {
  const [activeTab, setActiveTab] = useState("courses");

  // Fetch exam courses
  const { data: examCourses = [] } = useQuery({
    queryKey: ['exam-courses'],
    queryFn: fetchExamCourses,
  });

  // Fetch exam schedule
  const { data: examSchedule = [] } = useQuery({
    queryKey: ['admin-exam-schedule'],
    queryFn: fetchAdminExamSchedule,
  });

  // Workflow step determination
  const getWorkflowStep = () => {
    if (examCourses.length === 0) return 1;
    if (examSchedule.length === 0) return 2;
    return 3;
  };

  const currentStep = getWorkflowStep();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4 py-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-white border rounded-xl shadow-sm">
              <CalendarDays className="h-8 w-8 text-gray-700" />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-gray-900">
                Exam Timetable Generator
              </h1>
            </div>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Generate and manage exam schedules with intelligent conflict detection and resource allocation
          </p>
        </div>

        {/* Workflow Progress */}
        <WorkflowProgress currentStep={currentStep} />

        {/* Stats Cards */}
        <StatsCards examCourses={examCourses} examSchedule={examSchedule} />

        {/* Main Content */}
        <Card className="border shadow-sm">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <div className="p-6 pb-0">
              <TabsList className="grid w-full grid-cols-3 bg-gray-100 p-1 rounded-lg">
                <TabsTrigger 
                  value="courses" 
                  className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200"
                >
                  <FileText className="h-4 w-4" />
                  Step 1: Upload & Preview
                </TabsTrigger>
                <TabsTrigger 
                  value="generate" 
                  className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200"
                  disabled={examCourses.length === 0}
                >
                  <Settings className="h-4 w-4" />
                  Step 2: Configure & Generate
                </TabsTrigger>
                <TabsTrigger 
                  value="preview" 
                  className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200"
                  disabled={examSchedule.length === 0}
                >
                  <Eye className="h-4 w-4" />
                  Step 3: Review & Publish
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="p-6 pt-0">
              <TabsContent value="courses" className="space-y-4 mt-0">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold mb-2">Step 1: Upload and Preview Courses</h3>
                  <p className="text-muted-foreground">
                    Upload your exam courses and review the parsed data grouped by college and level.
                  </p>
                </div>
                
                {/* Upload Section */}
                <ExamCourseManagement />
                
                {/* Course Groups Display - Only show after upload */}
                {examCourses.length > 0 && (
                  <div className="space-y-4">
                    <div className="border-t pt-6">
                      <h4 className="text-md font-semibold mb-4">Course Preview (Grouped by College + Level)</h4>
                      <ExamCourseGroupDisplay courses={examCourses} />
                    </div>
                    
                    <div className="flex justify-end pt-4">
                      <Button onClick={() => setActiveTab("generate")} className="gap-2">
                        Proceed to Configuration <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="generate" className="space-y-4 mt-0">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold mb-2">Step 2: Configure Generation Parameters</h3>
                  <p className="text-muted-foreground">
                    Set exam dates, duration, and constraints before generating the timetable.
                  </p>
                </div>
                <ExamScheduleGenerator onScheduleGenerated={() => setActiveTab("preview")} />
              </TabsContent>

              <TabsContent value="preview" className="space-y-4 mt-0">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold mb-2">Step 3: Review and Publish Schedule</h3>
                  <p className="text-muted-foreground">
                    Review the generated exam schedule and publish it for students to view.
                  </p>
                </div>
                <ExamSchedulePreview />
              </TabsContent>
            </div>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default ExamTimetableGenerator;
