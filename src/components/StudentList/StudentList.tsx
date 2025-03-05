import React, { useState, useEffect } from "react";
import {
  ColumnDef,
  SortingState,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Table } from "@/components/ui/table";
import { Student, SaveData, ChangeRecord } from './types';
import TableHeaderComponent from './components/TableHeader';
import TableBodyComponent from './components/TableBody';
import FileControls from './components/FileControls';
import { useCSVHandling } from './hooks';
import './StudentList.css';
import { getImportedMoodleData } from '@/utils/moodleDataImport';

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

// Define the component with inline props type
const StudentList: React.FC<{
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  selectedStudent: string | null;
  onStudentSelect: (student: string) => void;
  assignmentName: string;
  setAssignmentName: React.Dispatch<React.SetStateAction<string>>;
  onChangeTracked: (change: ChangeRecord) => void;
  onSaveProgress?: () => Promise<boolean>;
  feedbackItems: any[];
  setFeedbackItems: React.Dispatch<React.SetStateAction<any[]>>;
}> = ({
  students,
  setStudents,
  selectedStudent,
  onStudentSelect,
  assignmentName,
  setAssignmentName,
  onChangeTracked,
  onSaveProgress,
}) => {
  console.log('StudentList received students:', students);
  const [sorting, setSorting] = useState<SortingState>([]);
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

  // Handle saving progress to localStorage
  const handleSaveProgress = async () => {
    if (onSaveProgress) {
      return await onSaveProgress();
    }
    return false;
  };

  // Handle loading progress from a file
  const handleLoadProgress = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const data = JSON.parse(content) as SaveData;
        
        setStudents(data.students);
        setAssignmentName(data.assignmentName);
        if (Array.isArray(data.feedbackItems) && data.feedbackItems.length > 0) {
          // Assuming feedbackItems is not needed in this component
        }
        
        // Track the import
        onChangeTracked({
          type: 'import',
          studentName: 'System',
          timestamp: new Date().toISOString(),
          message: 'Progress data imported',
          oldValue: '',
          newValue: ''
        });
        
      } catch (error) {
        console.error('Error parsing JSON:', error);
        setError("Invalid progress file");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="layout">
      <div className="listSection">
        <FileControls
          onFileImport={handleFileChange}
          onExport={exportForMoodle}
          onSaveProgress={async () => {
            await handleSaveProgress();
          }}
          onLoadProgress={handleLoadProgress}
          error={error}
          autoSaveStatus=""
          showAutoSaveStatus={false}
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
