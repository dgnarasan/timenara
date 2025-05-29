
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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { generateSchedule, GenerationResult } from "@/services/scheduleGenerator";
import { saveSchedule } from "@/lib/db";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import ErrorReportDialog from "./ErrorReportDialog";

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
  const [generationResult, setGenerationResult] = useState<GenerationResult | null>(null);
  const [showErrorReport, setShowErrorReport] = useState(false);
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

  const getDepartmentCounts = () => {
    const counts: Record<string, number> = {};
    filteredCourses.forEach(course => {
      counts[course.department] = (counts[course.department] || 0) + 1;
    });
    return counts;
  };

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
      console.log("Starting enhanced schedule generation with courses:", filteredCourses.length);
      
      // Start progress animation
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          const newProgress = Math.min(prev + 5, 85);
          console.log("Progress:", newProgress + "%");
          return newProgress;
        });
      }, 200);

      console.log("Calling enhanced generateSchedule function...");
      const result = await generateSchedule(filteredCourses);
      
      console.log("Enhanced schedule generation completed:", {
        scheduleLength: result.schedule.length,
        conflictsLength: result.conflicts.length,
        successRate: result.summary.successRate
      });
      
      clearInterval(progressInterval);
      setProgress(90);
      setGenerationResult(result);

      if (result.conflicts.length > 0) {
        console.log("Schedule conflicts found:", result.conflicts);
        
        // Show critical errors immediately
        const criticalErrors = result.conflicts.filter(c => c.severity === 'critical');
        if (criticalErrors.length > 0) {
          criticalErrors.forEach(conflict => {
            toast({
              title: "Critical Error",
              description: conflict.reason,
              variant: "destructive",
            });
          });
        }
      }

      if (result.schedule.length > 0) {
        console.log("Saving generated schedule to database...");
        try {
          await saveSchedule(result.schedule, false);
          setProgress(100);
          console.log("Generated schedule successfully, updating UI...");
          onScheduleGenerated(result.schedule);
          
          const scopeDescription = scheduleScope === 'college' && selectedCollege !== 'all' 
            ? `for ${selectedCollege.replace(/\s*\([^)]*\)/g, '')}`
            : scheduleScope === 'department' && selectedDepartment !== 'all'
            ? `for ${selectedDepartment}`
            : 'across all departments';

          toast({
            title: "Schedule Generated",
            description: `Successfully scheduled ${result.schedule.length}/${result.summary.totalCourses} courses ${scopeDescription} (${result.summary.successRate}% success rate)`,
          });

          if (result.conflicts.length > 0) {
            setShowErrorReport(true);
          } else {
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
        console.log("No schedule generated, showing error report");
        setShowErrorReport(true);
        toast({
          title: "Generation Failed",
          description: `Could not generate a valid schedule. ${result.conflicts.length} issues found.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error generating schedule:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate schedule",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setProgress(0);
      console.log("Schedule generation process completed");
    }
  };

  const handleRetryGeneration = () => {
    setShowErrorReport(false);
    setGenerationResult(null);
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Generate AI Schedule</DialogTitle>
            <DialogDescription>
              Generate an AI-powered schedule with advanced conflict detection and detailed error reporting
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-6">
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Schedule Scope</h4>
              <Select
                value={scheduleScope}
                onValueChange={(value: 'department' | 'college' | 'all') => {
                  setScheduleScope(value);
                  setSelectedDepartment('all');
                  setSelectedCollege('all');
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select scope" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="department">Single Department</SelectItem>
                  <SelectItem value="college">Entire College</SelectItem>
                  <SelectItem value="all">All Colleges</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {scheduleScope === 'department' && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Department</h4>
                <Select
                  value={selectedDepartment}
                  onValueChange={(value: Department | 'all') => setSelectedDepartment(value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {collegeStructure.map((collegeItem) => (
                      <SelectGroup key={collegeItem.college}>
                        <SelectLabel>{collegeItem.college.replace(/\s*\([^)]*\)/g, '')}</SelectLabel>
                        {collegeItem.departments.map((dept) => (
                          <SelectItem key={dept} value={dept}>
                            {dept}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {scheduleScope === 'college' && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium">College</h4>
                <Select
                  value={selectedCollege}
                  onValueChange={(value: College | 'all') => setSelectedCollege(value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a college" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Colleges</SelectItem>
                    {collegeStructure.map((collegeItem) => (
                      <SelectItem key={collegeItem.college} value={collegeItem.college}>
                        {collegeItem.college.replace(/\s*\([^)]*\)/g, '')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-3">
              <h4 className="text-sm font-medium">Schedule Overview</h4>
              <div className="bg-muted/30 p-4 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Courses:</span>
                  <Badge variant="secondary">{filteredCourses.length}</Badge>
                </div>
                
                {Object.keys(getDepartmentCounts()).length > 1 && (
                  <div className="space-y-2">
                    <span className="text-sm text-muted-foreground">Department Distribution:</span>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(getDepartmentCounts()).map(([dept, count]) => (
                        <div key={dept} className="flex items-center justify-between text-xs">
                          <span className="truncate">{dept}</span>
                          <Badge variant="outline" className="text-xs">{count}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-medium">Enhanced Error Detection</h4>
              <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 bg-blue-50 p-3 rounded-lg">
                <li>Cross-departmental lecturer scheduling conflicts detection</li>
                <li>Venue capacity vs class size validation</li>
                <li>System connectivity and performance monitoring</li>
                <li>Database integrity and venue availability checks</li>
                <li>Lecturer workload distribution analysis</li>
                <li>Detailed conflict categorization and resolution suggestions</li>
              </ul>
            </div>

            {isLoading && (
              <div className="space-y-2">
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Generating AI schedule with enhanced error detection ({progress}%)...
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button 
              onClick={handleGenerateAI}
              disabled={isLoading}
            >
              {isLoading ? "Generating..." : "Generate AI Schedule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
