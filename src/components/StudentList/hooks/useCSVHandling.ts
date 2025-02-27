import { useState } from 'react';
import Papa from 'papaparse';
import { saveAs } from 'file-saver';
import { Student, ChangeRecord } from '../types';

export const useCSVHandling = (
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>,
  assignmentName: string,
  students: Student[],
  onChangeTracked?: (change: ChangeRecord) => void
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
    } catch (err: unknown) {
      console.error('CSV parsing error:', err);
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
        identifier: student["Identifier"] || "",
        name: student["Full name"] || "",
        idNumber: student["ID number"] || "",
        email: student["Email address"] || "",
        status: student["Status"] || "",
        grade: student["Grade"] || "",
        maxGrade: student["Maximum Grade"] || "",
        gradeCanBeChanged: student["Grade can be changed"] || "",
        lastModifiedSubmission: student["Last modified (submission)"] || "",
        onlineText: student["Online text"] || "",
        lastModifiedGrade: student["Last modified (grade)"] || "",
        feedback: student["Feedback comments"] || "",
        appliedIds: []
      }))
    );

    // Track the change
    onChangeTracked?.({
      type: 'auto-save',
      timestamp: new Date().toISOString(),
      message: 'CSV data imported',
      oldValue: '',
      newValue: ''
    });
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
          "Identifier",
          "Full name",
          "ID number",
          "Email address",
          "Status",
          "Grade",
          "Maximum Grade",
          "Grade can be changed",
          "Last modified (submission)",
          "Online text",
          "Last modified (grade)",
          "Feedback comments"
        ],
        ...students.map(student => [
          student.identifier,
          student.name,
          student.idNumber,
          student.email,
          student.status,
          student.grade,
          student.maxGrade,
          student.gradeCanBeChanged,
          student.lastModifiedSubmission,
          student.onlineText,
          student.lastModifiedGrade,
          student.feedback
        ])
      ];
      
      const csvContent = Papa.unparse(csvRows);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const defaultFilename = `${assignmentName.toLowerCase().replace(/\s+/g, '_')}_grades.csv`;
      
      saveAs(blob, defaultFilename);
    } catch (err: unknown) {
      console.error('CSV parsing error:', err);
      setError("Error exporting the CSV file.");
    }
  };

  return {
    error,
    handleFileChange,
    exportForMoodle
  };
}; 