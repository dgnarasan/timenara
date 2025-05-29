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
import { EnhancedGenerationResult } from "@/services/enhancedScheduleGenerator";
import { saveSchedule } from "@/lib/db";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import ErrorReportDialog from "./ErrorReportDialog";
import ConflictDetailsModal from "./ConflictDetailsModal";

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

      if (result.schedule.length > 0) {
        console.log("Enhanced schedule generated successfully");
        try {
          await saveSchedule(result.schedule, false);
          setProgress(100);
          onScheduleGenerated(result.schedule);
          
          const scopeDescription = scheduleScope === 'college' && selectedCollege !== 'all' 
            ? `for ${selectedCollege.replace(/\s*\([^)]*\)/g, '')}`
            : scheduleScope === 'department' && selectedDepartment !== 'all'
            ? `for ${selectedDepartment}`
            : 'across all departments';

          toast({
            title: "Enhanced Schedule Generated",
            description: `Successfully scheduled ${result.schedule.length}/${result.summary.totalCourses} courses ${scopeDescription} (${result.summary.successRate}% success rate)`,
          });

          if (result.conflicts.length > 0 || !result.preValidationPassed) {
            setShowConflictModal(true);
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
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Schedule Scope</h4>
              <Select
                value={scheduleScope}
                onValueChange={(value: 'department' | 'college' | 'all') => {
                  setScheduleScope(value);
                  setSelectedDepartment('all');
                  setSelectedCollege('all');
                }}
              >
                <SelectTrigger className="w-full h-9">
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
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Department</h4>
                <Select
                  value={selectedDepartment}
                  onValueChange={(value: Department | 'all') => setSelectedDepartment(value)}
                >
                  <SelectTrigger className="w-full h-9">
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
              <div className="space-y-2">
                <h4 className="text-sm font-medium">College</h4>
                <Select
                  value={selectedCollege}
                  onValueChange={(value: College | 'all') => setSelectedCollege(value)}
                >
                  <SelectTrigger className="w-full h-9">
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

            <div className="space-y-2">
              <h4 className="text-sm font-medium">Overview</h4>
              <div className="bg-muted/30 p-3 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Courses:</span>
                  <Badge variant="secondary" className="text-xs">{filteredCourses.length}</Badge>
                </div>
                
                {Object.keys(getDepartmentCounts()).length > 1 && (
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">Department Distribution:</span>
                    <div className="grid grid-cols-1 gap-1 max-h-20 overflow-y-auto">
                      {Object.entries(getDepartmentCounts()).map(([dept, count]) => (
                        <div key={dept} className="flex items-center justify-between text-xs">
                          <span className="truncate text-xs">{dept}</span>
                          <Badge variant="outline" className="text-xs h-4">{count}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium">Features</h4>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="enableGrouping"
                    checked={enableCourseGrouping}
                    onChange={(e) => setEnableCourseGrouping(e.target.checked)}
                    className="rounded w-4 h-4"
                  />
                  <label htmlFor="enableGrouping" className="text-xs">
                    Auto-group shared courses (GST, MTH, etc.)
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="enableFallbacks"
                    checked={enableFallbacks}
                    onChange={(e) => setEnableFallbacks(e.target.checked)}
                    className="rounded w-4 h-4"
                  />
                  <label htmlFor="enableFallbacks" className="text-xs">
                    Enable fallback strategies
                  </label>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium">Capabilities</h4>
              <ul className="text-xs text-muted-foreground list-disc list-inside space-y-0.5 bg-blue-50 p-2 rounded-lg max-h-24 overflow-y-auto">
                <li>Pre-generation validation</li>
                <li>Auto-grouping of shared courses</li>
                <li>Cross-level conflict detection</li>
                <li>Intelligent fallback strategies</li>
                <li>Enhanced conflict resolution</li>
                <li>Venue capacity analysis</li>
              </ul>
            </div>

            {isLoading && (
              <div className="space-y-2">
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Generating schedule ({progress}%)...
                </p>
              </div>
            )}
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
