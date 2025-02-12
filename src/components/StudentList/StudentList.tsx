import React, { useState, useMemo } from "react";
import {
  ColumnDef,
  SortingState,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Table } from "@/components/ui/table";
import { Student, StudentListProps } from './types';
import TableHeaderComponent from './components/TableHeader';
import TableBodyComponent from './components/TableBody';
import FileControls from './components/FileControls';
import { useCSVHandling } from './hooks';
import './StudentList.css';

const StudentList: React.FC<StudentListProps> = ({
  students,
  setStudents,
  selectedStudent,
  onStudentSelect,
  assignmentName
}) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const { error, handleFileChange, exportForMoodle } = useCSVHandling(setStudents, assignmentName, students);

  const columns = useMemo<ColumnDef<Student>[]>(() => [
    { accessorKey: "name", header: "Name", cell: info => info.getValue() },
    { accessorKey: "email", header: "Email", cell: info => info.getValue() },
    {
      accessorKey: "timestamp",
      header: "Timestamp",
      cell: info => info.getValue(),
      sortingFn: (rowA, rowB) =>
        new Date(rowA.original.timestamp) > new Date(rowB.original.timestamp) ? 1 : -1,
    },
    {
      accessorKey: "grade",
      header: "Grade",
      cell: info => info.getValue(),
      sortingFn: (rowA, rowB) =>
        parseInt(rowA.original.grade) - parseInt(rowB.original.grade),
    },
    { 
      accessorKey: "feedback", 
      header: "Feedback", 
      cell: info => (
        <div style={{ whiteSpace: 'pre-line' }}>
          {info.getValue() as string}
        </div>
      )
    },
  ], []);

  const table = useReactTable({
    data: students,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="layout">
      <div className="listSection">
        <FileControls
          onFileImport={handleFileChange}
          onExport={exportForMoodle}
          error={error}
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
