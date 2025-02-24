
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Department } from "@/lib/types";

const departments: Department[] = [
  'Computer Science',
  'Cyber Security',
  'Information Technology',
  'Software Engineering'
];

const formSchema = z.object({
  code: z.string()
    .min(2, "Course code must be at least 2 characters")
    .max(10, "Course code must not exceed 10 characters"),
  name: z.string()
    .min(3, "Course name must be at least 3 characters")
    .max(100, "Course name must not exceed 100 characters"),
  lecturer: z.string()
    .min(3, "Lecturer name must be at least 3 characters")
    .max(100, "Lecturer name must not exceed 100 characters"),
  classSize: z.number()
    .min(1, "Class size must be at least 1")
    .max(1000, "Class size must not exceed 1000"),
  department: z.enum(['Computer Science', 'Cyber Security', 'Information Technology', 'Software Engineering'])
});

type FormData = z.infer<typeof formSchema>;

interface AddCourseFormProps {
  onSubmit: (data: FormData) => void;
}

const AddCourseForm = ({ onSubmit }: AddCourseFormProps) => {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: "",
      name: "",
      lecturer: "",
      classSize: 30,
      department: 'Computer Science'
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="p-4 space-y-4">
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Course Code</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., CS101" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="department"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Department</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Course Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Introduction to Programming" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lecturer"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Lecturer</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Dr. Smith" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="classSize"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Class Size</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    max={1000}
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <Button type="submit" className="w-full">Add Course</Button>
      </form>
    </Form>
  );
};

export default AddCourseForm;
