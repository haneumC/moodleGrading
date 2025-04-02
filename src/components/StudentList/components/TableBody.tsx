import React from 'react';
import { Row, flexRender } from "@tanstack/react-table";
import { TableBody, TableCell, TableRow, TableCaption } from "@/components/ui/table";
import { Student } from '../../StudentList/types';

interface TableBodyProps {
  rows: Row<Student>[];
  selectedStudent: string | null;
  onStudentSelect: (studentName: string) => void;
  selectedFeedbackId: number | null;
}

const TableBodyComponent: React.FC<TableBodyProps> = ({ 
  rows, 
  selectedStudent, 
  onStudentSelect,
  selectedFeedbackId
}) => {
  console.log('TableBody received selectedFeedbackId:', selectedFeedbackId);
  
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
            <TableCell colSpan={4} className="text-center">
              No data available
            </TableCell>
          </TableRow>
        ) : (
          rows.map((row) => {
            const student = row.original;
            const isSelected = student.name === selectedStudent;
            
            // Debug: Check if student has appliedIds array
            console.log(`Student ${student.name} appliedIds:`, student.appliedIds);
            
            // Make sure appliedIds is an array before checking includes
            const studentAppliedIds = Array.isArray(student.appliedIds) ? student.appliedIds : [];
            
            // Check if this student has the selected feedback applied
            const hasFeedbackApplied = selectedFeedbackId !== null && 
              studentAppliedIds.includes(selectedFeedbackId);
            
            console.log(`Student ${student.name} has feedback ${selectedFeedbackId} applied:`, hasFeedbackApplied);
            
            let rowClassName = 'cursor-pointer ';
            if (isSelected) {
              rowClassName += 'selected bg-blue-900 hover:bg-blue-800';
            } else if (hasFeedbackApplied) {
              rowClassName += 'bg-green-900 hover:bg-green-800 student-with-feedback'; // Add the CSS class
            } else {
              rowClassName += 'hover:bg-gray-800';
            }
            
            return (
              <TableRow 
                key={student.name} 
                className={rowClassName}
                onClick={() => onStudentSelect(student.name)}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
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