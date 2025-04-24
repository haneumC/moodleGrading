import React from 'react';
import { Row, flexRender } from "@tanstack/react-table";
import { TableBody, TableCell, TableRow, TableCaption } from "@/components/ui/table";
import { Student } from '../../StudentList/types';

interface TableBodyProps {
  rows: Row<Student>[];
  onStudentSelect: (student: string) => void;
  selectedFeedbackId: number | null;
  selectedStudents: Set<string>;
  setSelectedStudents: React.Dispatch<React.SetStateAction<Set<string>>>;
}

const TableBodyComponent: React.FC<TableBodyProps> = ({ 
  rows, 
  onStudentSelect,
  selectedFeedbackId,
  selectedStudents,
  setSelectedStudents
}) => {
  const handleRowClick = (student: Student) => {
    // If more than one student is selected, don't change selection on row click
    if (selectedStudents.size > 1) {
      return;
    }

    // If clicking on the currently selected student, do nothing
    if (selectedStudents.has(student.name)) {
      return;
    }

    // Clear previous selection and select the new student
    setSelectedStudents(new Set([student.name]));
    onStudentSelect(student.name);
  };

  return (
    <>
      <TableCaption>
        {rows.length === 0 
          ? 'No submissions loaded. Please import data or use the Moodle Grading button.'
          : 'A list of recent student submissions.'}
      </TableCaption>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5} className="text-center">
              No data available
            </TableCell>
          </TableRow>
        ) : (
          rows.map((row) => {
            const student = row.original as Student;
            const isSelected = selectedStudents.has(student.name);
            
            // Make sure appliedIds is an array before checking includes
            const studentAppliedIds = Array.isArray(student.appliedIds) ? student.appliedIds : [];
            
            // Check if this student has the selected feedback applied
            const hasFeedbackApplied = selectedFeedbackId !== null && 
              studentAppliedIds.includes(selectedFeedbackId);
            
            let rowClassName = 'cursor-pointer hover:bg-[#2d2d2d] transition-colors ';
            if (isSelected) {
              rowClassName += 'bg-[#2d4a3e]';
            } else if (hasFeedbackApplied) {
              rowClassName += 'bg-green-900 hover:bg-green-800 student-with-feedback';
            } else {
              rowClassName += 'hover:bg-gray-800';
            }
            
            return (
              <TableRow 
                key={student.name} 
                className={rowClassName}
                onClick={() => handleRowClick(student)}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className={cell.column.id === 'select' ? 'w-10' : ''}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            );
          })
        )}
      </TableBody>
    </>
  );
};

export default TableBodyComponent; 