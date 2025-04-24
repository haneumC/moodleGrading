import React from 'react';
import { HeaderGroup, flexRender } from "@tanstack/react-table";
import { TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Student } from '../../StudentList/types';

interface TableHeaderProps {
  headerGroups: HeaderGroup<Student>[];
}

const TableHeaderComponent: React.FC<TableHeaderProps> = ({ headerGroups }) => {
  return (
    <TableHeader>
      <TableRow className="header-row sticky top-0 z-[10]">
        {headerGroups.map(headerGroup => (
          <React.Fragment key={headerGroup.id}>
            {headerGroup.headers.map(header => (
              <TableHead
                key={header.id}
                onClick={header.column.getToggleSortingHandler()}
                className="header-cell cursor-pointer"
              >
                {flexRender(header.column.columnDef.header, header.getContext())}{" "}
                {header.column.id !== 'select' && header.column.getIsSorted() ? (
                  header.column.getIsSorted() === "desc" ? "▲" : "▼"
                ) : header.column.id !== 'select' ? "⇅" : ""}
              </TableHead>
            ))}
          </React.Fragment>
        ))}
      </TableRow>
    </TableHeader>
  );
};

export default TableHeaderComponent; 