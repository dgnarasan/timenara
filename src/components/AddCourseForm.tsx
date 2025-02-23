
import { useState } from "react";
import { Course } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

interface AddCourseFormProps {
  onSubmit: (course: Omit<Course, "id">) => void;
}

const AddCourseForm = ({ onSubmit }: AddCourseFormProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    lecturer: "",
    classSize: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.name || !formData.lecturer || !formData.classSize) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    onSubmit({
      ...formData,
      classSize: parseInt(formData.classSize),
      constraints: [],
    });

    setFormData({
      code: "",
      name: "",
      lecturer: "",
      classSize: "",
    });

    toast({
      title: "Success",
      description: "Course added successfully",
    });
  };

  return (
    <Card className="p-6 animate-fade-in">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="code">
            Course Code
          </label>
          <Input
            id="code"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            placeholder="e.g., CS101"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="name">
            Course Name
          </label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Introduction to Computer Science"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="lecturer">
            Lecturer Name
          </label>
          <Input
            id="lecturer"
            value={formData.lecturer}
            onChange={(e) => setFormData({ ...formData, lecturer: e.target.value })}
            placeholder="Dr. John Doe"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="classSize">
            Class Size
          </label>
          <Input
            id="classSize"
            type="number"
            value={formData.classSize}
            onChange={(e) => setFormData({ ...formData, classSize: e.target.value })}
            placeholder="30"
          />
        </div>
        <Button type="submit" className="w-full">
          Add Course
        </Button>
      </form>
    </Card>
  );
};

export default AddCourseForm;
