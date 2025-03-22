
import { Course, Department, ScheduleItem } from "@/lib/types";
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
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { generateSchedule } from "@/services/scheduleGenerator";
import { useToast } from "@/hooks/use-toast";

interface GenerateScheduleDialogProps {
  courses: Course[];
  onScheduleGenerated: (schedule: ScheduleItem[]) => void;
}

const departments: Department[] = [
  'Computer Science',
  'Cyber Security',
  'Information Technology',
  'Software Engineering'
];

const GenerateScheduleDialog = ({ courses, onScheduleGenerated }: GenerateScheduleDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | 'all'>('all');
  const { toast } = useToast();

  const filteredCourses = selectedDepartment === 'all'
    ? courses
    : courses.filter(course => course.department === selectedDepartment);

  const handleGenerateAI = async () => {
    if (filteredCourses.length === 0) {
      toast({
        title: "No Courses Found",
        description: selectedDepartment !== 'all'
          ? `No courses found for ${selectedDepartment} department` 
          : "Please add courses before generating a schedule",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setProgress(0);

    try {
      // Start progress animation
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 3000);

      const { schedule: newSchedule, conflicts } = await generateSchedule(filteredCourses);
      
      clearInterval(progressInterval);
      setProgress(100);

      if (conflicts.length > 0) {
        conflicts.forEach(({ reason }) => {
          toast({
            title: "Scheduling Conflict",
            description: reason,
            variant: "destructive",
          });
        });
      }

      if (newSchedule.length > 0) {
        onScheduleGenerated(newSchedule);
        setIsOpen(false);
        toast({
          title: "Schedule Generated",
          description: `Successfully scheduled ${newSchedule.length} courses${
            selectedDepartment !== 'all' ? ` for ${selectedDepartment}` : ''
          }${conflicts.length > 0 ? ' with some conflicts' : ''}`,
        });
      } else {
        toast({
          title: "Generation Failed",
          description: "Could not generate a valid schedule. Please check the conflicts and try again.",
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
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          className="shadow-sm"
          disabled={courses.length === 0}
        >
          Generate with AI
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generate AI Schedule</DialogTitle>
          <DialogDescription>
            Generate an optimized schedule for {filteredCourses.length} courses using AI
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="space-y-2">
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
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              {selectedDepartment !== 'all'
                ? `${filteredCourses.length} courses in ${selectedDepartment}`
                : `${filteredCourses.length} courses across all departments`}
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Scheduling Constraints</h4>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
              <li>No lecturer teaches multiple classes simultaneously</li>
              <li>No venue hosts multiple classes at the same time</li>
              <li>Class sizes respect venue capacities</li>
              <li>Courses are distributed evenly across the week</li>
              <li>Time slots are from 9:00 to 17:00, Monday to Friday</li>
            </ul>
          </div>
          {isLoading && (
            <div className="space-y-2">
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Generating schedule ({progress}%)
              </p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleGenerateAI}
            disabled={isLoading}
          >
            {isLoading ? "Generating..." : "Generate Schedule"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GenerateScheduleDialog;
