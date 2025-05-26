
import React, { useState } from "react";
import { ScheduleItem, collegeStructure, Department, College } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Building2, Users, BookOpen, Clock } from "lucide-react";

interface CollegeTimetableFilterProps {
  schedule: ScheduleItem[];
  onFilteredScheduleChange: (filteredSchedule: ScheduleItem[]) => void;
}

const CollegeTimetableFilter = ({ schedule, onFilteredScheduleChange }: CollegeTimetableFilterProps) => {
  const [selectedCollege, setSelectedCollege] = useState<College | 'all'>('all');
  const [selectedDepartment, setSelectedDepartment] = useState<Department | 'all'>('all');

  const getAvailableColleges = () => {
    const scheduleColleges = new Set<College>();
    schedule.forEach(item => {
      const college = collegeStructure.find(c => c.departments.includes(item.department))?.college;
      if (college) scheduleColleges.add(college);
    });
    return Array.from(scheduleColleges);
  };

  const getAvailableDepartments = () => {
    if (selectedCollege === 'all') {
      return Array.from(new Set(schedule.map(item => item.department)));
    }
    const collegeDepts = collegeStructure.find(c => c.college === selectedCollege)?.departments || [];
    return collegeDepts.filter(dept => schedule.some(item => item.department === dept));
  };

  const getFilteredSchedule = () => {
    let filtered = schedule;

    if (selectedCollege !== 'all') {
      const collegeDepartments = collegeStructure.find(c => c.college === selectedCollege)?.departments || [];
      filtered = filtered.filter(item => collegeDepartments.includes(item.department));
    }

    if (selectedDepartment !== 'all') {
      filtered = filtered.filter(item => item.department === selectedDepartment);
    }

    return filtered;
  };

  const filteredSchedule = getFilteredSchedule();
  
  // Update parent component when filters change
  React.useEffect(() => {
    onFilteredScheduleChange(filteredSchedule);
  }, [selectedCollege, selectedDepartment, schedule]);

  const getStats = () => {
    const departments = new Set(filteredSchedule.map(item => item.department));
    const lecturers = new Set(filteredSchedule.map(item => item.lecturer));
    const totalStudents = filteredSchedule.reduce((sum, item) => sum + item.classSize, 0);
    
    return {
      courses: filteredSchedule.length,
      departments: departments.size,
      lecturers: lecturers.size,
      totalStudents
    };
  };

  const stats = getStats();
  const availableColleges = getAvailableColleges();
  const availableDepartments = getAvailableDepartments();

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <label className="text-sm font-medium mb-2 block">College</label>
          <Select
            value={selectedCollege}
            onValueChange={(value: College | 'all') => {
              setSelectedCollege(value);
              setSelectedDepartment('all');
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select college" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Colleges</SelectItem>
              {availableColleges.map((college) => (
                <SelectItem key={college} value={college}>
                  {college.replace(/\s*\([^)]*\)/g, '')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1">
          <label className="text-sm font-medium mb-2 block">Department</label>
          <Select
            value={selectedDepartment}
            onValueChange={(value: Department | 'all') => setSelectedDepartment(value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {availableDepartments.map((dept) => (
                <SelectItem key={dept} value={dept}>
                  {dept}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-end">
          <Button
            variant="outline"
            onClick={() => {
              setSelectedCollege('all');
              setSelectedDepartment('all');
            }}
          >
            Clear Filters
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-3">
          <div className="flex items-center space-x-2">
            <BookOpen className="h-4 w-4 text-blue-600" />
            <div>
              <p className="text-sm text-muted-foreground">Courses</p>
              <p className="text-lg font-semibold">{stats.courses}</p>
            </div>
          </div>
        </Card>

        <Card className="p-3">
          <div className="flex items-center space-x-2">
            <Building2 className="h-4 w-4 text-green-600" />
            <div>
              <p className="text-sm text-muted-foreground">Departments</p>
              <p className="text-lg font-semibold">{stats.departments}</p>
            </div>
          </div>
        </Card>

        <Card className="p-3">
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-purple-600" />
            <div>
              <p className="text-sm text-muted-foreground">Lecturers</p>
              <p className="text-lg font-semibold">{stats.lecturers}</p>
            </div>
          </div>
        </Card>

        <Card className="p-3">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-orange-600" />
            <div>
              <p className="text-sm text-muted-foreground">Total Students</p>
              <p className="text-lg font-semibold">{stats.totalStudents}</p>
            </div>
          </div>
        </Card>
      </div>

      {selectedCollege !== 'all' && (
        <div className="bg-blue-50 p-3 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Viewing:</strong> {selectedCollege.replace(/\s*\([^)]*\)/g, '')}
            {selectedDepartment !== 'all' && ` - ${selectedDepartment} Department`}
          </p>
        </div>
      )}
    </div>
  );
};

export default CollegeTimetableFilter;
