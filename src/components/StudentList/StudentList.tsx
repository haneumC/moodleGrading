import React, { useState, useEffect } from "react";
import {
  ColumnDef,
  SortingState,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Table } from "@/components/ui/table";
import { Student } from './types';  // Only import what we need
import type { StudentListProps } from './types';  // Import type separately
import TableHeaderComponent from './components/TableHeader';
import TableBodyComponent from './components/TableBody';
import FileControls from './components/FileControls';
import { useCSVHandling } from './hooks';
import './StudentList.css';
import { getImportedMoodleData } from '@/utils/moodleDataImport';
import { saveAs } from 'file-saver';

// Add type declaration for FileSystemFileHandle
declare global {
  interface Window {
    showSaveFilePicker: (options?: {
      types?: Array<{
        description: string;
        accept: Record<string, string[]>;
      }>;
      suggestedName?: string;
    }) => Promise<FileSystemFileHandle>;
  }
}

const StudentList: React.FC<StudentListProps> = ({
  students,
  setStudents,
  selectedStudent,
  onStudentSelect,
  assignmentName,
  setAssignmentName,
  feedbackItems,
  setFeedbackItems,
  onChangeTracked
}) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [autoSaveStatus, setAutoSaveStatus] = useState<string>("");
  const [showAutoSaveStatus, setShowAutoSaveStatus] = useState(false);
  const [error, setError] = useState<string>("");

  const { handleFileChange, exportForMoodle } = useCSVHandling(
    setStudents, 
    assignmentName, 
    students,
    onChangeTracked
  );

  useEffect(() => {
    // Check for Moodle data when component mounts
    const moodleData = getImportedMoodleData();
    if (moodleData) {
      setStudents(moodleData);
      // Optionally set assignment name if you have it in your state
      // setAssignmentName(decodeURIComponent(moodleData.assignmentName));
    }
  }, []);

  // Fix the date comparison
  const columns: ColumnDef<Student>[] = [
    { accessorKey: "name", header: "Name", cell: info => info.getValue() },
    { accessorKey: "email", header: "Email", cell: info => info.getValue() },
    {
      accessorKey: "lastModifiedSubmission",
      header: "Last Modified",
      cell: info => info.getValue(),
      sortingFn: (rowA, rowB) => {
        const dateA = rowA.original.lastModifiedSubmission || '';
        const dateB = rowB.original.lastModifiedSubmission || '';
        return new Date(dateA).getTime() - new Date(dateB).getTime();
      },
    },
    {
      accessorKey: "grade",
      header: "Grade",
      cell: info => info.getValue() || '',
      sortingFn: (rowA, rowB) =>
        parseInt(rowA.original.grade || '0') - parseInt(rowB.original.grade || '0'),
    },
    { 
      accessorKey: "feedback", 
      header: "Feedback", 
      cell: info => (
        <div style={{ whiteSpace: 'pre-line' }}>
          {(info.getValue() as string) || ''}
        </div>
      )
    },
  ];

  const table = useReactTable({
    data: students,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const handleSaveProgress = async () => {
    try {
      const saveData = {
        students,
        assignmentName,
        timestamp: new Date().toISOString(),
        feedbackItems
      };

      const jsonString = JSON.stringify(saveData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const filename = `${assignmentName.toLowerCase().replace(/\s+/g, '_')}_progress.json`;

      // Try modern File System API first
      if ('showSaveFilePicker' in window) {
        try {
          const options = {
            suggestedName: filename,
            types: [
              {
                description: 'JSON Files',
                accept: {
                  'application/json': ['.json']
                },
              },
            ],
          };

          const handle = await window.showSaveFilePicker(options);
          const writable = await handle.createWritable();
          await writable.write(jsonString);
          await writable.close();
        } catch (err: unknown) {  // Change _ to err since we're logging it
          console.error('Save error:', err);
          saveAs(blob, filename);
        }
      } else {
        // Fallback for browsers that don't support File System API
        saveAs(blob, filename);
      }

      setAutoSaveStatus("Progress saved successfully at " + new Date().toLocaleTimeString());
      setShowAutoSaveStatus(true);
      setError("");
      setTimeout(() => setShowAutoSaveStatus(false), 3000);
    } catch (err: unknown) {
      console.error('Save error:', err);
      setError("Failed to save progress. Please try again.");
      setAutoSaveStatus("");
      setShowAutoSaveStatus(false);
    }
  };

  const handleLoadProgress = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;

      const content = await file.text();
      const saveData = JSON.parse(content);
      
      // Validate the loaded data structure
      if (!saveData || typeof saveData !== 'object') {
        throw new Error("Invalid save file format");
      }

      // Validate and update students
      if (Array.isArray(saveData.students)) {
        setStudents(saveData.students);
      } else {
        throw new Error("Invalid students data in save file");
      }
      
      // Only update feedback items if there are saved items
      if (Array.isArray(saveData.feedbackItems) && saveData.feedbackItems.length > 0) {
        setFeedbackItems(saveData.feedbackItems);
      }

      // Validate and update assignment name
      if (typeof saveData.assignmentName === 'string') {
        setAssignmentName(saveData.assignmentName);
      }
      
      setAutoSaveStatus("Progress loaded successfully at " + new Date().toLocaleTimeString());
      setShowAutoSaveStatus(true);
      setError("");
      setTimeout(() => setShowAutoSaveStatus(false), 3000);

    } catch (err: unknown) {
      console.error("Load error:", err);
      setError("Failed to load progress file. Please check the file format.");
      setAutoSaveStatus("");
      setShowAutoSaveStatus(false);
    } finally {
      e.target.value = '';
    }
  };

  return (
    <div className="layout">
      <div className="listSection">
        <FileControls
          onFileImport={handleFileChange}
          onExport={exportForMoodle}
          onSaveProgress={handleSaveProgress}
          onLoadProgress={handleLoadProgress}
          error={error}
          autoSaveStatus={autoSaveStatus}
          showAutoSaveStatus={showAutoSaveStatus}
          hasData={students.length > 0}
        />
        <div className="rounded-md border">
          <div className="table-container">
            <Table>
              <TableHeaderComponent headerGroups={table.getHeaderGroups()} />
              <TableBodyComponent
                rows={table.getRowModel().rows}
                selectedStudent={selectedStudent}
                onStudentSelect={onStudentSelect}
              />
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentList;
