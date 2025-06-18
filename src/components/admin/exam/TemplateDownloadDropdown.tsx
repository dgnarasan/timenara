
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileText, File, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";

const TemplateDownloadDropdown = () => {
  const { toast } = useToast();

  const downloadCSVTemplate = () => {
    // Updated template with shared course example
    const csvContent = `Course,No of Students,Departments Offering The Course
SMS 301 (Acct.),165,Accounting
,, Finance
BCH 401,60,Biochemistry
BCH 403,60,Biochemistry
CSC 413,370,Computer Science
,, Information Systems
CSC 433,370,Computer Science`;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = 'exam_courses_template.csv';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    toast({
      title: "CSV Template Downloaded",
      description: "CSV template downloaded successfully. Fill in your exam courses and upload it back.",
    });
  };

  const downloadExcelTemplate = () => {
    // Template with shared course examples
    const template = [
      ["Course", "No of Students", "Departments Offering The Course"],
      ["SMS 301 (Acct.)", "165", "Accounting"],
      ["", "", "Finance"],  // Shared department row
      ["BCH 401", "60", "Biochemistry"],
      ["BCH 403", "60", "Biochemistry"],
      ["CSC 413", "370", "Computer Science"],
      ["", "", "Information Systems"],  // Shared department row
      ["CSC 433", "370", "Computer Science"],
    ];

    // Instructions sheet explaining shared courses
    const instructions = [
      ["Using Shared Courses in the Template"],
      [""],
      ["To indicate that a course is shared across multiple departments:"],
      ["1. Enter the main course details in the first row (Course code, Student count, Primary department)"],
      ["2. For additional departments sharing the same course:"],
      ["   - Leave the 'Course' and 'No of Students' fields empty"],
      ["   - Enter only the department name in the 'Departments Offering The Course' column"],
      ["3. The system will recognize this as the same course being shared across departments"],
      [""],
      ["Example:"],
      ["Course", "No of Students", "Departments Offering The Course", "Note"],
      ["CHM 305", "73", "Chemistry", "Main course entry with all details"],
      ["", "", "Biochemistry", "Shared - same course for Biochemistry department"],
      ["", "", "Industrial Chemistry", "Shared - same course for Industrial Chemistry department"],
    ];

    const ws = XLSX.utils.aoa_to_sheet(template);
    const instructionsWs = XLSX.utils.aoa_to_sheet(instructions);
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Exam Courses");
    XLSX.utils.book_append_sheet(wb, instructionsWs, "Shared Courses Guide");
    
    // Set column widths for better readability
    ws["!cols"] = [
      { width: 20 }, // Course
      { width: 15 }, // No of Students
      { width: 30 }  // Departments Offering The Course
    ];
    
    instructionsWs["!cols"] = [
      { width: 20 },
      { width: 15 },
      { width: 40 },
      { width: 50 }
    ];
    
    XLSX.writeFile(wb, "exam_courses_template.xlsx");
    toast({
      title: "Excel Template Downloaded",
      description: "Excel template downloaded successfully. Includes guide for shared courses.",
    });
  };

  return (
    <Card className="p-4 bg-gray-50 border border-gray-200">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="font-semibold text-gray-900 flex items-center gap-1">
            Download Template 
            <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
              <Share2 className="h-3 w-3" /> Supports shared courses
            </span>
          </h3>
          <p className="text-sm text-gray-600">
            Get the template file with the correct format for uploading exam courses. 
            For shared courses, add departments in rows below the main course.
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              className="ml-4 bg-white hover:bg-gray-50 border-gray-200 transition-all duration-200"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Template
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-white border shadow-lg">
            <DropdownMenuItem 
              onClick={downloadExcelTemplate}
              className="cursor-pointer hover:bg-gray-50 transition-colors duration-150"
            >
              <File className="h-4 w-4 mr-2 text-gray-600" />
              <span>Download as Excel (.xlsx)</span>
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={downloadCSVTemplate}
              className="cursor-pointer hover:bg-gray-50 transition-colors duration-150"
            >
              <FileText className="h-4 w-4 mr-2 text-gray-600" />
              <span>Download as CSV</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Card>
  );
};

export default TemplateDownloadDropdown;
