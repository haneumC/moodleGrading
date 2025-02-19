import { useState } from 'react';
import Papa from 'papaparse';
import { saveAs } from 'file-saver';
import { Student } from '../types';

export const useCSVHandling = (
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>,
  assignmentName: string,
  students: Student[]
) => {
  const [error, setError] = useState<string>("");

  const validateCSV = (csvString: string): boolean => {
    try {
      const result = Papa.parse(csvString, {
        header: false,
        skipEmptyLines: true
      });

      if (result.errors.length > 0) {
        setError("Error parsing the CSV file.");
        return false;
      }

      const output = result.data as string[][];
      const headerRow: string[] = output[0];
      const requiredHeaders: string[] = [
        "Full name",
        "Email address",
        "Last modified (submission)",
        "Grade",
        "Feedback comments",
      ];

      const missingHeaders = requiredHeaders.filter((header) => !headerRow.includes(header));
      if (missingHeaders.length > 0) {
        setError(`Missing required columns: ${missingHeaders.join(", ")}`);
        return false;
      }

      return true;
    } catch (_) {
      setError("Error parsing the CSV file.");
      return false;
    }
  };

  const processCSVData = (csvString: string) => {
    const result = Papa.parse(csvString, {
      header: false,
      skipEmptyLines: true
    });
    
    const output = result.data as string[][];
    const headerRow: string[] = output[0];
    
    const parsedStudents = output.slice(1).map((row: string[]) => {
      const student: Record<string, string> = {};
      headerRow.forEach((header: string, index: number) => {
        student[header] = row[index] || "";
      });
      return student;
    });

    setStudents(
      parsedStudents.map((student) => ({
        name: student["Full name"] || "",
        email: student["Email address"] || "",
        timestamp: student["Last modified (submission)"] || "",
        grade: student["Grade"] || "",
        feedback: student["Feedback comments"] || "",
        appliedIds: [],
      }))
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setStudents([]);
      setError("");
      
      const fileReader = new FileReader();
      fileReader.onload = (event) => {
        const text = event.target?.result as string;
        if (validateCSV(text)) {
          processCSVData(text);
          setError("");
        }
      };
      fileReader.readAsText(file);
    }
  };

  const exportForMoodle = () => {
    try {
      if (students.length === 0) {
        setError("No CSV imported");
        return;
      }

      const csvRows = [
        [
          "Full name",
          "Email address",
          "Last modified (submission)",
          "Grade",
          "Feedback comments"
        ],
        ...students.map(student => [
          student.name,
          student.email,
          student.timestamp,
          student.grade,
          student.feedback
        ])
      ];
      
      const csvContent = Papa.unparse(csvRows);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const defaultFilename = `${assignmentName.toLowerCase().replace(/\s+/g, '_')}_grades.csv`;
      
      saveAs(blob, defaultFilename);
    } catch (error) {
      setError("Error exporting the CSV file.");
    }
  };

  return {
    error,
    handleFileChange,
    exportForMoodle
  };
}; 