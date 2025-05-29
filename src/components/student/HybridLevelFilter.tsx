
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
    // Check if course is commonly taken by students from different levels
    const courseLevel = extractAcademicLevel(course.code);
    const baseCode = course.code.replace(/\d+/, '').trim();
    
    // Common courses that span levels (GST, general electives, etc.)
    const crossLevelCourses = ['GST', 'ENG', 'MTH', 'STA', 'PHY', 'CHM'];
    return crossLevelCourses.some(prefix => baseCode.startsWith(prefix)) ||
           course.department === 'General Studies';
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

    // Add carryover-relevant courses if enabled
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
        // Select all levels for extensive carryover students
        getAvailableLevels().forEach(level => newSelected.add(level));
        break;
    }
    
    setSelectedLevels(newSelected);
  };

  const availableLevels = getAvailableLevels();

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <GraduationCap className="h-5 w-5" />
          Hybrid Level Course Filter
        </h3>
        <Badge variant="outline">
          {selectedLevels.size === 0 ? 'All Levels' : `${selectedLevels.size} Level${selectedLevels.size !== 1 ? 's' : ''}`}
        </Badge>
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-medium">Quick Select:</h4>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => selectCommonCombinations('freshman')}
            className="text-xs"
          >
            Freshman (100-200)
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => selectCommonCombinations('sophomore')}
            className="text-xs"
          >
            Sophomore (200-300)
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => selectCommonCombinations('junior')}
            className="text-xs"
          >
            Junior (300-400)
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => selectCommonCombinations('senior')}
            className="text-xs"
          >
            Senior (400-500)
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => selectCommonCombinations('carryover')}
            className="text-xs"
          >
            Carryover (All)
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-medium">Custom Level Selection:</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {availableLevels.map(level => {
            const stats = getLevelStats(level);
            return (
              <div key={level} className="flex items-start space-x-3 p-3 border rounded-lg">
                <Checkbox
                  id={level}
                  checked={selectedLevels.has(level)}
                  onCheckedChange={() => toggleLevel(level)}
                />
                <div className="flex-1 min-w-0">
                  <label htmlFor={level} className="text-sm font-medium cursor-pointer">
                    {level}
                  </label>
                  <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
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
          onCheckedChange={setIncludeCarryoverCourses}
        />
        <label htmlFor="carryover" className="text-sm cursor-pointer">
          Include carryover-relevant courses (GST, general electives, shared courses)
        </label>
      </div>

      <div className="flex justify-between items-center pt-2">
        <div className="text-sm text-muted-foreground">
          {selectedLevels.size === 0 ? 
            `Showing all ${schedule.length} courses` : 
            `Will show courses from selected levels ${includeCarryoverCourses ? '+ carryover courses' : ''}`
          }
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedLevels(new Set());
              onFilteredScheduleChange(schedule);
            }}
          >
            Clear All
          </Button>
          <Button size="sm" onClick={applyFilter}>
            Apply Filter
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default HybridLevelFilter;
