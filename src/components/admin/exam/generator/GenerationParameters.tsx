
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, Settings } from "lucide-react";

interface GenerationConfig {
  startDate: string;
  endDate: string;
  sessionDuration: string;
  breakBetweenSessions: string;
  maxExamsPerDay: string;
  preferredStartTime: string;
  preferredEndTime: string;
}

interface GenerationParametersProps {
  config: GenerationConfig;
  onConfigChange: (config: GenerationConfig) => void;
  uniqueCoursesCount: number;
}

const GenerationParameters = ({ config, onConfigChange, uniqueCoursesCount }: GenerationParametersProps) => {
  const updateConfig = (key: keyof GenerationConfig, value: string) => {
    onConfigChange({ ...config, [key]: value });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Generation Parameters
        </CardTitle>
        <CardDescription>
          Configure exam schedule parameters for {uniqueCoursesCount} unique courses
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Date Range */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="start-date" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Exam Start Date
            </Label>
            <Input
              id="start-date"
              type="date"
              value={config.startDate}
              onChange={(e) => updateConfig('startDate', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="end-date" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Exam End Date
            </Label>
            <Input
              id="end-date"
              type="date"
              value={config.endDate}
              onChange={(e) => updateConfig('endDate', e.target.value)}
              min={config.startDate}
            />
          </div>
        </div>

        {/* Time Configuration */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="start-time" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Daily Start Time
            </Label>
            <Input
              id="start-time"
              type="time"
              value={config.preferredStartTime}
              onChange={(e) => updateConfig('preferredStartTime', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="end-time" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Daily End Time
            </Label>
            <Input
              id="end-time"
              type="time"
              value={config.preferredEndTime}
              onChange={(e) => updateConfig('preferredEndTime', e.target.value)}
            />
          </div>
        </div>

        {/* Session Configuration */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="session-duration">Exam Duration (hours)</Label>
            <Select
              value={config.sessionDuration}
              onValueChange={(value) => updateConfig('sessionDuration', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2">2 hours</SelectItem>
                <SelectItem value="3">3 hours</SelectItem>
                <SelectItem value="4">4 hours</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="break-time">Break Between Exams (hours)</Label>
            <Select
              value={config.breakBetweenSessions}
              onValueChange={(value) => updateConfig('breakBetweenSessions', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0.5">30 minutes</SelectItem>
                <SelectItem value="1">1 hour</SelectItem>
                <SelectItem value="1.5">1.5 hours</SelectItem>
                <SelectItem value="2">2 hours</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="max-exams">Max Exams Per Student/Day</Label>
            <Select
              value={config.maxExamsPerDay}
              onValueChange={(value) => updateConfig('maxExamsPerDay', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 exam</SelectItem>
                <SelectItem value="2">2 exams (recommended)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GenerationParameters;
export type { GenerationConfig };
