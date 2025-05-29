
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, XCircle, Info, CheckCircle, Users, Calendar, MapPin } from "lucide-react";
import { ScheduleConflict } from "@/services/scheduleGenerator";
import { ValidationError, ValidationWarning } from "@/utils/scheduling/preValidation";

interface ConflictDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  conflicts: ScheduleConflict[];
  validationErrors?: ValidationError[];
  validationWarnings?: ValidationWarning[];
  onRetryGeneration?: () => void;
  onApplyFallbacks?: () => void;
}

const ConflictDetailsModal = ({ 
  isOpen, 
  onClose, 
  conflicts,
  validationErrors = [],
  validationWarnings = [],
  onRetryGeneration,
  onApplyFallbacks
}: ConflictDetailsModalProps) => {
  const getConflictIcon = (type: string) => {
    switch (type) {
      case 'lecturer':
        return <Users className="h-4 w-4 text-red-500" />;
      case 'venue':
        return <MapPin className="h-4 w-4 text-orange-500" />;
      case 'cross-departmental':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'system-error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'default';
      case 'medium':
        return 'secondary';
      case 'low':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const groupConflictsByType = (conflicts: ScheduleConflict[]) => {
    return conflicts.reduce((acc, conflict) => {
      const type = conflict.conflictType || 'other';
      if (!acc[type]) acc[type] = [];
      acc[type].push(conflict);
      return acc;
    }, {} as Record<string, ScheduleConflict[]>);
  };

  const groupValidationErrorsByType = (errors: ValidationError[]) => {
    return errors.reduce((acc, error) => {
      if (!acc[error.type]) acc[error.type] = [];
      acc[error.type].push(error);
      return acc;
    }, {} as Record<string, ValidationError[]>);
  };

  const groupedConflicts = groupConflictsByType(conflicts);
  const groupedValidationErrors = groupValidationErrorsByType(validationErrors);

  const totalIssues = conflicts.length + validationErrors.length;
  const criticalIssues = [
    ...conflicts.filter(c => c.severity === 'critical'),
    ...validationErrors.filter(e => e.severity === 'critical')
  ].length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Schedule Generation Analysis
          </DialogTitle>
          <DialogDescription>
            {totalIssues} issue{totalIssues !== 1 ? 's' : ''} detected
            {criticalIssues > 0 && ` (${criticalIssues} critical)`}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="conflicts" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="conflicts" className="flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              Generation Conflicts ({conflicts.length})
            </TabsTrigger>
            <TabsTrigger value="validation" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Pre-validation ({validationErrors.length})
            </TabsTrigger>
            <TabsTrigger value="warnings" className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              Warnings ({validationWarnings.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="conflicts" className="space-y-4">
            {Object.keys(groupedConflicts).length === 0 ? (
              <Card className="p-6 text-center">
                <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-muted-foreground">No generation conflicts detected</p>
              </Card>
            ) : (
              Object.entries(groupedConflicts).map(([type, typeConflicts]) => (
                <Card key={type} className="p-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        {getConflictIcon(type)}
                        {type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())} Issues
                      </h3>
                      <Badge variant={getSeverityColor(typeConflicts[0]?.severity || 'medium') as any}>
                        {typeConflicts.length} issue{typeConflicts.length !== 1 ? 's' : ''}
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
                                {conflict.course.lecturer} | {conflict.course.department} | 
                                Class Size: {conflict.course.classSize}
                              </p>
                            </div>
                            <Badge variant={getSeverityColor(conflict.severity || 'medium') as any} className="text-xs">
                              {conflict.severity}
                            </Badge>
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
                  </div>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="validation" className="space-y-4">
            {Object.keys(groupedValidationErrors).length === 0 ? (
              <Card className="p-6 text-center">
                <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-muted-foreground">No validation errors detected</p>
              </Card>
            ) : (
              Object.entries(groupedValidationErrors).map(([type, typeErrors]) => (
                <Card key={type} className="p-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        {getConflictIcon(type)}
                        {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} Errors
                      </h3>
                      <Badge variant={getSeverityColor(typeErrors[0]?.severity) as any}>
                        {typeErrors.length} error{typeErrors.length !== 1 ? 's' : ''}
                      </Badge>
                    </div>

                    <div className="space-y-3">
                      {typeErrors.map((error, index) => (
                        <div key={index} className="border rounded-lg p-3 bg-red-50">
                          <p className="text-sm font-medium text-red-800 mb-2">{error.message}</p>
                          <div className="text-xs text-muted-foreground mb-2">
                            Affects {error.affectedCourses.length} course{error.affectedCourses.length !== 1 ? 's' : ''}
                          </div>
                          <div className="bg-blue-50 border border-blue-200 rounded p-2">
                            <p className="text-xs font-medium text-blue-800 mb-1">Resolution:</p>
                            <p className="text-xs text-blue-700">{error.suggestion}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="warnings" className="space-y-4">
            {validationWarnings.length === 0 ? (
              <Card className="p-6 text-center">
                <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-muted-foreground">No warnings detected</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {validationWarnings.map((warning, index) => (
                  <Card key={index} className="p-4 bg-yellow-50 border-yellow-200">
                    <div className="flex items-start gap-3">
                      <Info className="h-4 w-4 text-yellow-600 mt-1" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-yellow-800">{warning.message}</p>
                        <p className="text-xs text-yellow-700 mt-1">{warning.suggestion}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Close Report
          </Button>
          {onApplyFallbacks && (
            <Button variant="secondary" onClick={onApplyFallbacks}>
              Apply Fallback Strategies
            </Button>
          )}
          {onRetryGeneration && (
            <Button onClick={onRetryGeneration}>
              Retry Generation
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConflictDetailsModal;
