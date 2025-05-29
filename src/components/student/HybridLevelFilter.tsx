import { useState } from "react";
import { ScheduleItem } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { GraduationCap, Users, BookOpen } from "lucide-react";

interface HybridLevelFilterProps {
  schedule: ScheduleItem[];
  onFilteredScheduleChange: (filtered: ScheduleItem[]) => void;
}

const HybridLevelFilter = ({ schedule, onFilteredScheduleChange }: HybridLevelFilterProps) => {
  const [selectedLevels, setSelectedLevels] = useState<Set<string>>(new Set());
  const [includeCarryoverCourses, setIncludeCarryoverCourses] = useState(true);

  const extractAcademicLevel = (courseCode: string): string => {
    const match = courseCode.match(/\d/);
    return match ? `${match[0]}00 Level` : 'Unknown Level';
  };

  const getAvailableLevels = () => {
    const levels = new Set<string>();
    schedule.forEach(item => {
      levels.add(extractAcademicLevel(item.code));
    });
    return Array.from(levels).sort();
  };

  const isCarryoverRelevant = (course: ScheduleItem): boolean => {
    const courseLevel = extractAcademicLevel(course.code);
    const baseCode = course.code.replace(/\d+/, '').trim();
    
    const crossLevelCourses = ['GST', 'ENG', 'MTH', 'STA', 'PHY', 'CHM'];
    return crossLevelCourses.some(prefix => baseCode.startsWith(prefix)) ||
           course.department.includes('Education');
  };

  const getLevelStats = (level: string) => {
    const levelCourses = schedule.filter(item => extractAcademicLevel(item.code) === level);
    return {
      courses: levelCourses.length,
      totalStudents: levelCourses.reduce((sum, course) => sum + course.classSize, 0),
      departments: new Set(levelCourses.map(course => course.department)).size
    };
  };

  const applyFilter = () => {
    if (selectedLevels.size === 0) {
      onFilteredScheduleChange(schedule);
      return;
    }

    let filtered = schedule.filter(item => {
      const itemLevel = extractAcademicLevel(item.code);
      return selectedLevels.has(itemLevel);
    });

    if (includeCarryoverCourses) {
      const carryoverCourses = schedule.filter(item => 
        !filtered.includes(item) && isCarryoverRelevant(item)
      );
      filtered = [...filtered, ...carryoverCourses];
    }

    onFilteredScheduleChange(filtered);
  };

  const toggleLevel = (level: string) => {
    const newSelected = new Set(selectedLevels);
    if (newSelected.has(level)) {
      newSelected.delete(level);
    } else {
      newSelected.add(level);
    }
    setSelectedLevels(newSelected);
  };

  const selectCommonCombinations = (combination: string) => {
    const newSelected = new Set<string>();
    
    switch (combination) {
      case 'freshman':
        newSelected.add('100 Level').add('200 Level');
        break;
      case 'sophomore':
        newSelected.add('200 Level').add('300 Level');
        break;
      case 'junior':
        newSelected.add('300 Level').add('400 Level');
        break;
      case 'senior':
        newSelected.add('400 Level').add('500 Level');
        break;
      case 'carryover':
        getAvailableLevels().forEach(level => newSelected.add(level));
        break;
    }
    
    setSelectedLevels(newSelected);
  };

  const availableLevels = getAvailableLevels();

  return (
    <Card className="p-3 md:p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base md:text-lg font-semibold flex items-center gap-2">
          <GraduationCap className="h-4 w-4 md:h-5 md:w-5" />
          <span className="hidden sm:inline">Hybrid Level Course Filter</span>
          <span className="sm:hidden">Level Filter</span>
        </h3>
        <Badge variant="outline" className="text-xs">
          {selectedLevels.size === 0 ? 'All' : `${selectedLevels.size} Level${selectedLevels.size !== 1 ? 's' : ''}`}
        </Badge>
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-medium">Quick Select:</h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => selectCommonCombinations('freshman')}
            className="text-xs p-2 h-auto"
          >
            <span className="hidden sm:inline">Freshman (100-200)</span>
            <span className="sm:hidden">100-200</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => selectCommonCombinations('sophomore')}
            className="text-xs p-2 h-auto"
          >
            <span className="hidden sm:inline">Sophomore (200-300)</span>
            <span className="sm:hidden">200-300</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => selectCommonCombinations('junior')}
            className="text-xs p-2 h-auto"
          >
            <span className="hidden sm:inline">Junior (300-400)</span>
            <span className="sm:hidden">300-400</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => selectCommonCombinations('senior')}
            className="text-xs p-2 h-auto"
          >
            <span className="hidden sm:inline">Senior (400-500)</span>
            <span className="sm:hidden">400-500</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => selectCommonCombinations('carryover')}
            className="text-xs p-2 h-auto col-span-2 sm:col-span-1"
          >
            <span className="hidden sm:inline">Carryover (All)</span>
            <span className="sm:hidden">All</span>
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-medium">Custom Level Selection:</h4>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {availableLevels.map(level => {
            const stats = getLevelStats(level);
            return (
              <div key={level} className="flex items-start space-x-3 p-3 border rounded-lg">
                <Checkbox
                  id={level}
                  checked={selectedLevels.has(level)}
                  onCheckedChange={(checked) => {
                    if (checked === true) {
                      toggleLevel(level);
                    } else if (checked === false) {
                      toggleLevel(level);
                    }
                  }}
                />
                <div className="flex-1 min-w-0">
                  <label htmlFor={level} className="text-sm font-medium cursor-pointer">
                    {level}
                  </label>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <BookOpen className="h-3 w-3" />
                      {stats.courses} courses
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {stats.totalStudents} students
                    </span>
                    <span>{stats.departments} dept{stats.departments !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg">
        <Checkbox
          id="carryover"
          checked={includeCarryoverCourses}
          onCheckedChange={(checked) => {
            if (checked === true) {
              setIncludeCarryoverCourses(true);
            } else if (checked === false) {
              setIncludeCarryoverCourses(false);
            }
          }}
        />
        <label htmlFor="carryover" className="text-xs md:text-sm cursor-pointer">
          Include carryover-relevant courses (GST, general electives, shared courses)
        </label>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-2">
        <div className="text-xs md:text-sm text-muted-foreground">
          {selectedLevels.size === 0 ? 
            `Showing all ${schedule.length} courses` : 
            `Will show courses from selected levels ${includeCarryoverCourses ? '+ carryover courses' : ''}`
          }
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedLevels(new Set());
              onFilteredScheduleChange(schedule);
            }}
            className="flex-1 sm:flex-none"
          >
            Clear All
          </Button>
          <Button size="sm" onClick={applyFilter} className="flex-1 sm:flex-none">
            Apply Filter
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default HybridLevelFilter;
