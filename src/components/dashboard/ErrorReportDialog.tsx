
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { AlertTriangle, XCircle, Info, CheckCircle } from "lucide-react";
import { ScheduleConflict } from "@/services/scheduleGenerator";

interface ErrorReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  conflicts: ScheduleConflict[];
  onRetryGeneration?: () => void;
}

const ErrorReportDialog = ({ 
  isOpen, 
  onClose, 
  conflicts, 
  onRetryGeneration 
}: ErrorReportDialogProps) => {
  const getConflictIcon = (type: string) => {
    switch (type) {
      case 'lecturer':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'venue':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'resource':
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getConflictBadgeColor = (type: string) => {
    switch (type) {
      case 'lecturer':
        return 'destructive';
      case 'venue':
        return 'default';
      case 'resource':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const groupedConflicts = conflicts.reduce((acc, conflict) => {
    const type = conflict.conflictType || 'cross-departmental';
    if (!acc[type]) acc[type] = [];
    acc[type].push(conflict);
    return acc;
  }, {} as Record<string, ScheduleConflict[]>);

  const getConflictTypeTitle = (type: string) => {
    switch (type) {
      case 'lecturer':
        return 'Lecturer Conflicts';
      case 'venue':
        return 'Venue Capacity Issues';
      case 'resource':
        return 'Resource Conflicts';
      case 'cross-departmental':
        return 'Cross-Departmental Issues';
      default:
        return 'Other Issues';
    }
  };

  const getSolutionSteps = (type: string) => {
    switch (type) {
      case 'lecturer':
        return [
          'Review lecturer availability and workload',
          'Consider adjusting time preferences',
          'Split large classes into multiple sessions',
          'Assign alternative lecturers if available'
        ];
      case 'venue':
        return [
          'Check venue capacity against class sizes',
          'Consider splitting large classes',
          'Request additional venues from administration',
          'Move classes to online format if appropriate'
        ];
      case 'resource':
        return [
          'Review shared resource scheduling',
          'Coordinate with other departments',
          'Consider alternative resources or equipment',
          'Adjust timing to avoid peak usage'
        ];
      default:
        return [
          'Review course requirements and constraints',
          'Coordinate with other departments',
          'Consider alternative scheduling approaches',
          'Contact academic planning for guidance'
        ];
    }
  };

  if (conflicts.length === 0) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Schedule Generated Successfully
            </DialogTitle>
            <DialogDescription>
              All courses have been scheduled without conflicts.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={onClose}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Schedule Generation Report
          </DialogTitle>
          <DialogDescription>
            {conflicts.length} issue{conflicts.length > 1 ? 's' : ''} found during schedule generation. 
            Review the details below for resolution steps.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {Object.entries(groupedConflicts).map(([type, typeConflicts]) => (
            <Card key={type} className="p-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    {getConflictIcon(type)}
                    {getConflictTypeTitle(type)}
                  </h3>
                  <Badge variant={getConflictBadgeColor(type) as any}>
                    {typeConflicts.length} issue{typeConflicts.length > 1 ? 's' : ''}
                  </Badge>
                </div>

                <div className="space-y-3">
                  {typeConflicts.map((conflict, index) => (
                    <div key={index} className="border rounded-lg p-3 bg-muted/30">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium text-sm">
                            {conflict.course.code} - {conflict.course.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Lecturer: {conflict.course.lecturer} | 
                            Department: {conflict.course.department} | 
                            Class Size: {conflict.course.classSize}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-red-700 mb-2">{conflict.reason}</p>
                      {conflict.suggestion && (
                        <div className="bg-blue-50 border border-blue-200 rounded p-2">
                          <p className="text-xs font-medium text-blue-800 mb-1">Suggestion:</p>
                          <p className="text-xs text-blue-700">{conflict.suggestion}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="bg-slate-50 rounded-lg p-3">
                  <h4 className="text-sm font-semibold mb-2">Recommended Actions:</h4>
                  <ul className="text-xs space-y-1">
                    {getSolutionSteps(type).map((step, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-muted-foreground">•</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>
          ))}

          <Card className="p-4 bg-blue-50 border-blue-200">
            <h3 className="text-sm font-semibold text-blue-800 mb-2">Next Steps:</h3>
            <div className="text-xs text-blue-700 space-y-1">
              <p>1. Address the issues listed above by modifying course details or constraints</p>
              <p>2. Consider adjusting lecturer assignments or class sizes</p>
              <p>3. Coordinate with other departments for shared resources</p>
              <p>4. Try generating the schedule again after making adjustments</p>
            </div>
          </Card>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Close Report
          </Button>
          {onRetryGeneration && (
            <Button onClick={onRetryGeneration}>
              Try Again
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ErrorReportDialog;
