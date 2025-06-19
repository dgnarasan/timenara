
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchExamCourses, saveExamSchedule } from "@/lib/db";
import { useToast } from "@/hooks/use-toast";
import { Play, Loader2 } from "lucide-react";
import { ExamScheduleItem } from "@/lib/types";
import GenerationParameters, { GenerationConfig } from "./generator/GenerationParameters";
import CourseAnalysis from "./generator/CourseAnalysis";
import GenerationProgress from "./generator/GenerationProgress";
import GenerationValidation from "./generator/GenerationValidation";

interface ExamScheduleGeneratorProps {
  onScheduleGenerated: () => void;
}

const ExamScheduleGenerator = ({ onScheduleGenerated }: ExamScheduleGeneratorProps) => {
  const [config, setConfig] = useState<GenerationConfig>({
    startDate: "",
    endDate: "",
    sessionDuration: "3", // hours
    breakBetweenSessions: "1", // hours
    maxExamsPerDay: "2", // Max 2 exams per student per day
    preferredStartTime: "08:00",
    preferredEndTime: "17:00",
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch exam courses
  const { data: examCourses = [], isLoading } = useQuery({
    queryKey: ['exam-courses'],
    queryFn: fetchExamCourses,
  });

  // Save schedule mutation
  const saveScheduleMutation = useMutation({
    mutationFn: (schedule: ExamScheduleItem[]) => saveExamSchedule(schedule, false),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-exam-schedule'] });
      toast({
        title: "Schedule Generated Successfully",
        description: "Exam schedule has been generated and saved.",
      });
      onScheduleGenerated();
    },
    onError: (error) => {
      toast({
        title: "Generation Failed",
        description: "Failed to generate exam schedule. Please try again.",
        variant: "destructive",
      });
      console.error("Generation error:", error);
    },
  });

  const generateSchedule = async () => {
    if (!config.startDate || !config.endDate) {
      toast({
        title: "Missing Configuration",
        description: "Please select both start and end dates.",
        variant: "destructive",
      });
      return;
    }

    if (examCourses.length === 0) {
      toast({
        title: "No Courses Available",
        description: "Please upload exam courses before generating schedule.",
        variant: "destructive",
      });
      return;
    }

    const startDate = new Date(config.startDate);
    const endDate = new Date(config.endDate);
    
    if (startDate >= endDate) {
      toast({
        title: "Invalid Date Range",
        description: "End date must be after start date.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(0);

    try {
      // Progress simulation
      const progressInterval = setInterval(() => {
        setGenerationProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      // Enhanced scheduling algorithm with shared course handling
      const schedule: ExamScheduleItem[] = [];
      const sessions = ['Morning', 'Midday'] as const; // Max 2 sessions per day
      const processedCourses: Set<string> = new Set();
      
      let currentDate = new Date(startDate);
      let courseIndex = 0;
      
      // Group courses by course code to handle shared courses - with null safety
      const courseGroups: Record<string, typeof examCourses> = {};
      examCourses.forEach(course => {
        if (course && course.courseCode) {
          if (!courseGroups[course.courseCode]) {
            courseGroups[course.courseCode] = [];
          }
          courseGroups[course.courseCode].push(course);
        }
      });

      const uniqueCourses = Object.keys(courseGroups);
      console.log(`Processing ${uniqueCourses.length} unique courses from ${examCourses.length} total courses`);
      
      while (currentDate <= endDate && courseIndex < uniqueCourses.length) {
        // Skip weekends
        if (currentDate.getDay() === 0 || currentDate.getDay() === 6) {
          currentDate.setDate(currentDate.getDate() + 1);
          continue;
        }

        for (let sessionIndex = 0; sessionIndex < Math.min(parseInt(config.maxExamsPerDay), sessions.length); sessionIndex++) {
          if (courseIndex >= uniqueCourses.length) break;

          const courseCode = uniqueCourses[courseIndex];
          const courseGroup = courseGroups[courseCode];
          
          // Skip if already processed
          if (processedCourses.has(courseCode)) {
            courseIndex++;
            continue;
          }

          // Use the course with highest student count for scheduling - with safety checks
          const representativeCourse = courseGroup.reduce((max, course) => {
            if (!course || !max) return course || max;
            return (course.studentCount || 0) > (max.studentCount || 0) ? course : max;
          });
          
          if (!representativeCourse) {
            courseIndex++;
            continue;
          }
          
          const session = sessions[sessionIndex];
          
          // Calculate session times
          let startTime: string;
          let endTime: string;
          
          const sessionDuration = parseInt(config.sessionDuration);
          const breakTime = parseInt(config.breakBetweenSessions);
          
          switch (session) {
            case 'Morning':
              startTime = config.preferredStartTime;
              break;
            case 'Midday':
              const morningStart = new Date(`2000-01-01T${config.preferredStartTime}`);
              const middayStart = new Date(morningStart.getTime() + (sessionDuration + breakTime) * 60 * 60 * 1000);
              startTime = middayStart.toTimeString().slice(0, 5);
              break;
          }
          
          const startDateTime = new Date(`2000-01-01T${startTime}`);
          const endDateTime = new Date(startDateTime.getTime() + sessionDuration * 60 * 60 * 1000);
          endTime = endDateTime.toTimeString().slice(0, 5);

          // Calculate total students for this course (sum all departments) - with safety checks
          const totalStudents = courseGroup.reduce((sum, course) => sum + (course?.studentCount || 0), 0);

          // Select appropriate venue based on student count
          let venueName = "Exam Hall 1";
          if (totalStudents > 500) {
            venueName = "Mascom Auditorium";
          } else if (totalStudents > 300) {
            venueName = "Cafeteria";
          } else if (totalStudents > 150) {
            venueName = `Exam Hall ${Math.floor(courseIndex / 5) + 1}`;
          }

          schedule.push({
            ...representativeCourse,
            studentCount: totalStudents, // Use combined student count
            day: currentDate.toISOString().split('T')[0],
            startTime,
            endTime,
            sessionName: session,
            venueName,
          });

          processedCourses.add(courseCode);
          courseIndex++;
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }

      clearInterval(progressInterval);
      setGenerationProgress(100);

      console.log(`Generated schedule for ${schedule.length} out of ${uniqueCourses.length} unique courses`);

      if (schedule.length < uniqueCourses.length) {
        const missedCount = uniqueCourses.length - schedule.length;
        toast({
          title: "Partial Schedule Generated",
          description: `${schedule.length}/${uniqueCourses.length} courses scheduled. ${missedCount} courses need extended date range.`,
          variant: "destructive",
        });
      }

      await saveScheduleMutation.mutateAsync(schedule);
    } catch (error) {
      console.error("Schedule generation error:", error);
      toast({
        title: "Generation Error",
        description: error instanceof Error ? error.message : "An error occurred while generating the schedule.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
      setGenerationProgress(0);
    }
  };

  const isConfigValid = config.startDate && config.endDate && config.startDate < config.endDate;

  // Calculate shared courses with safety checks
  const courseCodeCounts: Record<string, number> = {};
  examCourses.forEach(course => {
    if (course?.courseCode) {
      courseCodeCounts[course.courseCode] = (courseCodeCounts[course.courseCode] || 0) + 1;
    }
  });
  const uniqueCoursesCount = Object.keys(courseCodeCounts).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <GenerationParameters
        config={config}
        onConfigChange={setConfig}
        uniqueCoursesCount={uniqueCoursesCount}
      />

      <CourseAnalysis examCourses={examCourses} />

      <GenerationValidation
        examCourses={examCourses}
        isConfigValid={isConfigValid}
        uniqueCoursesCount={uniqueCoursesCount}
      />

      <GenerationProgress
        isGenerating={isGenerating}
        progress={generationProgress}
      />

      {/* Generate Button */}
      <div className="flex justify-end">
        <Button
          onClick={generateSchedule}
          disabled={!isConfigValid || examCourses.length === 0 || isGenerating}
          size="lg"
          className="min-w-[160px]"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Generating...
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              Generate Schedule
            </> 
          )}
        </Button>
      </div>
    </div>
  );
};

export default ExamScheduleGenerator;
