import { useState } from 'react';
import Papa, { ParseResult } from 'papaparse';
import { saveAs } from 'file-saver';
import { Student, ChangeRecord } from '../types';

export const useCSVHandling = (
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>,
  assignmentName: string,
  students: Student[],
  onChangeTracked?: (change: ChangeRecord) => void,
  setMaxPoints?: (maxPoints: number) => void
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
        "Maximum Grade"
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
    let maxGradeFound = '';
    
    // Find the index of the Maximum Grade column
    const maxGradeIndex = headerRow.findIndex(header => header === 'Maximum Grade');
    console.log('Maximum Grade column index:', maxGradeIndex);
    
    // Get the first non-empty maximum grade value from the data rows
    if (maxGradeIndex !== -1) {
      for (let i = 1; i < csvData.length; i++) {
        const row = csvData[i];
        if (row[maxGradeIndex] && row[maxGradeIndex].trim() !== '') {
          const rawValue = row[maxGradeIndex].trim();
          // Try to parse the value, removing any non-numeric characters except decimal point
          const cleanedValue = rawValue.replace(/[^\d.]/g, '');
          if (cleanedValue) {
            maxGradeFound = cleanedValue;
            console.log('Found maximum grade value:', maxGradeFound);
            break;
          }
        }
      }
    }
    
    const processedStudents = csvData.slice(1).map(row => {
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
          case 'Maximum Grade': {
            // Clean and validate the max grade value
            const cleanedGrade = value.trim().replace(/[^\d.]/g, '');
            student.maxGrade = cleanedGrade || maxGradeFound;
            break;
          }
        }
      });

      return student;
    });

    // Update the max points in the parent component if we found a value
    if (maxGradeFound && setMaxPoints) {
      console.log('Setting max points from CSV:', maxGradeFound);
      const numericValue = parseFloat(maxGradeFound);
      if (!isNaN(numericValue) && numericValue > 0) {
        console.log('Setting valid max points value:', numericValue);
        setMaxPoints(numericValue);
      } else {
        console.warn('Invalid maximum points value:', maxGradeFound);
        setError("Invalid maximum points value in CSV");
      }
    } else {
      console.warn('No valid maximum grade value found in CSV');
    }

    return processedStudents;
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