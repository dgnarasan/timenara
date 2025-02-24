
import { useState } from "react";
import { Course } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AddCourseFormProps {
  onSubmit: (course: Omit<Course, "id">) => void;
}

const departments = [
  "Computer Science",
  "Cyber Security",
  "Information Technology",
  "Software Engineering",
] as const;

const AddCourseForm = ({ onSubmit }: AddCourseFormProps) => {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [lecturer, setLecturer] = useState("");
  const [classSize, setClassSize] = useState("");
  const [department, setDepartment] = useState<Course["department"]>("Computer Science");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    onSubmit({
      code,
      name,
      lecturer,
      classSize: parseInt(classSize),
      department,
    });

    // Reset form
    setCode("");
    setName("");
    setLecturer("");
    setClassSize("");
    setDepartment("Computer Science");
  };

  const isFormValid = () => {
    return (
      code.match(/^[A-Z]{2,4}\d{3,4}$/) &&
      name.length >= 3 &&
      lecturer.length >= 3 &&
      parseInt(classSize) > 0 &&
      parseInt(classSize) <= 1000 &&
      departments.includes(department)
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="code" className="text-sm font-medium">
              Course Code
            </label>
            <Input
              id="code"
              placeholder="e.g., CS101"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              pattern="^[A-Z]{2,4}\d{3,4}$"
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="classSize" className="text-sm font-medium">
              Class Size
            </label>
            <Input
              id="classSize"
              type="number"
              placeholder="e.g., 30"
              value={classSize}
              onChange={(e) => setClassSize(e.target.value)}
              min="1"
              max="1000"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium">
            Course Name
          </label>
          <Input
            id="name"
            placeholder="e.g., Introduction to Computer Science"
            value={name}
            onChange={(e) => setName(e.target.value)}
            minLength={3}
            required
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="lecturer" className="text-sm font-medium">
            Lecturer Name
          </label>
          <Input
            id="lecturer"
            placeholder="e.g., Dr. John Doe"
            value={lecturer}
            onChange={(e) => setLecturer(e.target.value)}
            minLength={3}
            required
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="department" className="text-sm font-medium">
            Department
          </label>
          <Select
            value={department}
            onValueChange={(value) => setDepartment(value as Course["department"])}
          >
            <SelectTrigger id="department">
              <SelectValue placeholder="Select department" />
            </SelectTrigger>
            <SelectContent>
              {departments.map((dept) => (
                <SelectItem key={dept} value={dept}>
                  {dept}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={!isFormValid()}
      >
        Add Course
      </Button>
    </form>
  );
};

export default AddCourseForm;
