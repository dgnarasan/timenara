
import { Department, College, collegeStructure } from "@/lib/types";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ScheduleScopeSelectorProps {
  scheduleScope: 'department' | 'college' | 'all';
  selectedDepartment: Department | 'all';
  selectedCollege: College | 'all';
  onScopeChange: (scope: 'department' | 'college' | 'all') => void;
  onDepartmentChange: (department: Department | 'all') => void;
  onCollegeChange: (college: College | 'all') => void;
}

const ScheduleScopeSelector = ({
  scheduleScope,
  selectedDepartment,
  selectedCollege,
  onScopeChange,
  onDepartmentChange,
  onCollegeChange
}: ScheduleScopeSelectorProps) => {
  const handleScopeChange = (value: 'department' | 'college' | 'all') => {
    onScopeChange(value);
    onDepartmentChange('all');
    onCollegeChange('all');
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h4 className="text-sm font-medium">Schedule Scope</h4>
        <Select
          value={scheduleScope}
          onValueChange={handleScopeChange}
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
            onValueChange={onDepartmentChange}
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
            onValueChange={onCollegeChange}
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
    </div>
  );
};

export default ScheduleScopeSelector;
