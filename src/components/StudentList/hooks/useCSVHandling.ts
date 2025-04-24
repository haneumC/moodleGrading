import { useState } from 'react';
import Papa, { ParseResult } from 'papaparse';
import { saveAs } from 'file-saver';
import { Student, ChangeRecord } from '../types';

export const useCSVHandling = (
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>,
  assignmentName: string,
  students: Student[],
  onChangeTracked?: (change: ChangeRecord) => void
) => {
  const [error, setError] = useState<string>("");

  const validateCSV = (data: string[][]): boolean => {
    try {
      if (data.length === 0) {
        setError("Empty CSV file");
        return false;
      }

      const headerRow = data[0];
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
      console.error('CSV validation error:', err);
      setError("Error validating the CSV file.");
      return false;
    }
  };

  const processCSVData = (csvData: string[][]): Student[] => {
    const headerRow = csvData[0];
    
    return csvData.slice(1).map(row => {
      const student: Student = {
        name: '',
        email: '',
        grade: '',
        feedback: '',
        appliedIds: [],
        maxGrade: '',
      };

      headerRow.forEach((header, index) => {
        const value = row[index] || '';
        switch(header) {
          case 'Full name': student.name = value; break;
          case 'Email address': student.email = value; break;
          case 'Grade': student.grade = value; break;
          case 'Feedback comments': student.feedback = value; break;
          case 'Maximum Grade': student.maxGrade = value; break;
          // Add other fields as needed
        }
      });

      return student;
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const content = await file.text();
      Papa.parse(content, {
        header: false,
        skipEmptyLines: true,
        complete: (results: ParseResult<string[]>) => {
          if (validateCSV(results.data)) {
            const students = processCSVData(results.data);
            setStudents(students);
            trackImport();
          }
        }
      });
    } catch (error) {
      console.error('Error reading CSV:', error);
      setError("Error reading the CSV file");
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

  const trackImport = () => {
    onChangeTracked?.({
      type: 'import',
      studentName: 'System',
      timestamp: new Date().toISOString(),
      message: 'CSV data imported',
      oldValue: '',
      newValue: ''
    });
  };

  return {
    error,
    handleFileChange,
    exportForMoodle
  };
}; 