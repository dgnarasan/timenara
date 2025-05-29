
import { Course, Department, ScheduleItem, collegeStructure, College } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";
import { EnhancedGenerationResult } from "@/services/enhancedScheduleGenerator";
import { saveSchedule } from "@/lib/db";
import { useToast } from "@/hooks/use-toast";
import ErrorReportDialog from "./ErrorReportDialog";
import ConflictDetailsModal from "./ConflictDetailsModal";
import ScheduleScopeSelector from "./schedule-generation/ScheduleScopeSelector";
import ScheduleOverview from "./schedule-generation/ScheduleOverview";
import GenerationFeatures from "./schedule-generation/GenerationFeatures";
import GenerationCapabilities from "./schedule-generation/GenerationCapabilities";
import GenerationProgress from "./schedule-generation/GenerationProgress";

interface GenerateScheduleDialogProps {
  courses: Course[];
  onScheduleGenerated: (schedule: ScheduleItem[]) => void;
}

const GenerateScheduleDialog = ({ courses, onScheduleGenerated }: GenerateScheduleDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [scheduleScope, setScheduleScope] = useState<'department' | 'college' | 'all'>('department');
  const [selectedDepartment, setSelectedDepartment] = useState<Department | 'all'>('all');
  const [selectedCollege, setSelectedCollege] = useState<College | 'all'>('all');
  const [generationResult, setGenerationResult] = useState<EnhancedGenerationResult | null>(null);
  const [showErrorReport, setShowErrorReport] = useState(false);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [enableFallbacks, setEnableFallbacks] = useState(true);
  const [enableCourseGrouping, setEnableCourseGrouping] = useState(true);
  const { toast } = useToast();

  const getFilteredCourses = () => {
    if (scheduleScope === 'all') {
      return courses;
    } else if (scheduleScope === 'college' && selectedCollege !== 'all') {
      const collegeDepartments = collegeStructure.find(c => c.college === selectedCollege)?.departments || [];
      return courses.filter(course => collegeDepartments.includes(course.department));
    } else if (scheduleScope === 'department' && selectedDepartment !== 'all') {
      return courses.filter(course => course.department === selectedDepartment);
    }
    return courses;
  };

  const filteredCourses = getFilteredCourses();

  const handleGenerateAI = async () => {
    if (filteredCourses.length === 0) {
      toast({
        title: "No Courses Found",
        description: "Please add courses before generating a schedule",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setProgress(0);
    setGenerationResult(null);

    try {
      console.log("Starting enhanced schedule generation with:", {
        coursesCount: filteredCourses.length,
        enableFallbacks,
        enableCourseGrouping
      });
      
      // Start progress animation
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 8, 85));
      }, 300);

      // Import and use enhanced generator
      const { generateEnhancedSchedule } = await import("@/services/enhancedScheduleGenerator");
      const result = await generateEnhancedSchedule(filteredCourses, enableFallbacks);
      
      clearInterval(progressInterval);
      setProgress(90);
      setGenerationResult(result);

      console.log("Generation result received:", {
        scheduleLength: result.schedule.length,
        hasConflicts: result.conflicts.length > 0,
        preValidationPassed: result.preValidationPassed,
        successRate: result.summary.successRate
      });

      if (result.schedule.length > 0) {
        console.log("Enhanced schedule generated successfully, saving to database...");
        try {
          await saveSchedule(result.schedule, false);
          setProgress(100);
          
          console.log("Schedule saved successfully, calling onScheduleGenerated...");
          
          // Add a small delay and use a try-catch around the callback
          setTimeout(() => {
            try {
              console.log("About to call onScheduleGenerated with schedule:", result.schedule.length, "items");
              onScheduleGenerated(result.schedule);
              console.log("onScheduleGenerated called successfully");
            } catch (callbackError) {
              console.error("Error in onScheduleGenerated callback:", callbackError);
              toast({
                title: "Warning",
                description: "Schedule generated but there was an issue updating the display. Please refresh the page.",
                variant: "default",
              });
            }
          }, 100);
          
          const scopeDescription = scheduleScope === 'college' && selectedCollege !== 'all' 
            ? `for ${selectedCollege.replace(/\s*\([^)]*\)/g, '')}`
            : scheduleScope === 'department' && selectedDepartment !== 'all'
            ? `for ${selectedDepartment}`
            : 'across all departments';

          toast({
            title: "Enhanced Schedule Generated",
            description: `Successfully scheduled ${result.schedule.length}/${result.summary.totalCourses} courses ${scopeDescription} (${result.summary.successRate}% success rate)`,
          });

          // Only show conflict modal if generation actually failed or there are critical issues
          const hasCriticalFailures = result.schedule.length === 0 || !result.preValidationPassed;
          
          if (hasCriticalFailures) {
            console.log("Critical failures detected, showing conflict modal");
            setShowConflictModal(true);
          } else {
            console.log("Generation successful, closing dialog");
            // Close the dialog since generation was successful
            setIsOpen(false);
          }
        } catch (saveError) {
          console.error('Error saving schedule:', saveError);
          toast({
            title: "Save Error",
            description: "Schedule generated but failed to save. Please try again.",
            variant: "destructive",
          });
        }
      } else {
        console.log("No schedule generated, showing detailed conflict analysis");
        setShowConflictModal(true);
        toast({
          title: "Generation Failed",
          description: `Could not generate a valid schedule. ${result.conflicts.length} issues found.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error in enhanced generation:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate enhanced schedule",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setProgress(0);
    }
  };

  const handleRetryGeneration = () => {
    setShowConflictModal(false);
    setShowErrorReport(false);
    setGenerationResult(null);
    handleGenerateAI();
  };

  const handleApplyFallbacks = () => {
    setEnableFallbacks(true);
    setShowConflictModal(false);
    handleGenerateAI();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button 
            className="shadow-sm"
            disabled={courses.length === 0}
          >
            Generate with AI
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-lg">AI Schedule Generator</DialogTitle>
            <DialogDescription className="text-sm">
              Generate an AI-powered schedule with advanced features
            </DialogDescription>
          </DialogHeader>
          <div className="py-3 space-y-4">
            <ScheduleScopeSelector
              scheduleScope={scheduleScope}
              selectedDepartment={selectedDepartment}
              selectedCollege={selectedCollege}
              onScopeChange={setScheduleScope}
              onDepartmentChange={setSelectedDepartment}
              onCollegeChange={setSelectedCollege}
            />

            <ScheduleOverview filteredCourses={filteredCourses} />

            <GenerationFeatures
              enableCourseGrouping={enableCourseGrouping}
              enableFallbacks={enableFallbacks}
              onGroupingChange={setEnableCourseGrouping}
              onFallbacksChange={setEnableFallbacks}
            />

            <GenerationCapabilities />

            <GenerationProgress isLoading={isLoading} progress={progress} />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsOpen(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button 
              size="sm"
              onClick={handleGenerateAI}
              disabled={isLoading}
            >
              {isLoading ? "Generating..." : "Generate Schedule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConflictDetailsModal
        isOpen={showConflictModal}
        onClose={() => {
          setShowConflictModal(false);
          setIsOpen(false);
        }}
        conflicts={generationResult?.conflicts || []}
        validationErrors={generationResult?.validationResult?.errors}
        validationWarnings={generationResult?.validationResult?.warnings}
        onRetryGeneration={handleRetryGeneration}
        onApplyFallbacks={!enableFallbacks ? handleApplyFallbacks : undefined}
      />

      <ErrorReportDialog
        isOpen={showErrorReport}
        onClose={() => {
          setShowErrorReport(false);
          setIsOpen(false);
        }}
        conflicts={generationResult?.conflicts || []}
        onRetryGeneration={handleRetryGeneration}
      />
    </>
  );
};

export default GenerateScheduleDialog;
