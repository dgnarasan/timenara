
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileText, File } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";

const TemplateDownloadDropdown = () => {
  const { toast } = useToast();

  const downloadCSVTemplate = () => {
    const csvContent = `Course,No of Students,Departments Offering The Course
SMS 301 (Acct.),165,Accounting
BCH 401,60,Biochemistry
BCH 403,60,Biochemistry
CSC 413,370,Computer Science
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
    const template = [
      ["Course", "No of Students", "Departments Offering The Course"],
      ["SMS 301 (Acct.)", "165", "Accounting"],
      ["BCH 401", "60", "Biochemistry"],
      ["BCH 403", "60", "Biochemistry"],
      ["CSC 413", "370", "Computer Science"],
      ["CSC 433", "370", "Computer Science"],
    ];

    const ws = XLSX.utils.aoa_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Exam Courses");
    
    // Set column widths for better readability
    ws["!cols"] = [
      { width: 20 }, // Course
      { width: 15 }, // No of Students
      { width: 30 }  // Departments Offering The Course
    ];
    
    XLSX.writeFile(wb, "exam_courses_template.xlsx");
    toast({
      title: "Excel Template Downloaded",
      description: "Excel template downloaded successfully. Fill in your exam courses and upload it back.",
    });
  };

  return (
    <Card className="p-4 bg-gray-50 border border-gray-200">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="font-semibold text-gray-900">Download Template</h3>
          <p className="text-sm text-gray-600">
            Get the template file with the correct format for uploading exam courses
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
