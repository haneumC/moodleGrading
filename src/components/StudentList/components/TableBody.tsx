import React from 'react';
import { Row, flexRender } from "@tanstack/react-table";
import { TableBody, TableCell, TableRow, TableCaption } from "@/components/ui/table";
import { Student } from '../../StudentList/types';

interface TableBodyProps {
  rows: Row<Student>[];
  selectedStudent: string | null;
  onStudentSelect: (studentName: string) => void;
}

const TableBodyComponent: React.FC<TableBodyProps> = ({ 
  rows, 
  selectedStudent, 
  onStudentSelect 
}) => {
  return (
    <>
      <TableCaption>A list of recent student submissions.</TableCaption>
      <TableBody>
        {rows.map(row => (
          <TableRow
            key={row.id}
            className={selectedStudent === row.original.name ? 'selected' : ''}
            onClick={() => onStudentSelect(row.original.name)}
          >
            {row.getVisibleCells().map(cell => (
              <TableCell key={cell.id}>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </>
  );
};

export default TableBodyComponent; 