import React, { useState, useMemo } from "react";
import Papa from 'papaparse';
import {
  ColumnDef,
  SortingState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import './StudentList.css';

// Define Student type
interface Student {
  name: string;
  email: string;
  timestamp: string;
  grade: string;
  feedback: string;
  appliedIds: number[];
}

interface StudentListProps {
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  selectedStudent: string | null;
  onStudentSelect: (studentName: string) => void;
}

const StudentList: React.FC<StudentListProps> = ({
  students,
  setStudents,
  selectedStudent,
  onStudentSelect
}) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [error, setError] = useState<string>("");

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

  const handleOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setStudents([]);
      setError("");
      
      const fileReader = new FileReader();
      fileReader.onload = (event) => {
        const text = event.target?.result as string;
        validateCSV(text);
      };
      fileReader.readAsText(file);
    }
  };

  const validateCSV = (csvString: string) => {
    try {
      const result = Papa.parse(csvString, {
        header: false,
        skipEmptyLines: true
      });

      if (result.errors.length > 0) {
        setError("Error parsing the CSV file.");
        return;
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
        return;
      }

      const parsedStudents = output.slice(1).map((row: string[]) => {
        const student: Record<string, string> = {};
        headerRow.forEach((header: string, index: number) => {
          student[header] = row[index] || "";
        });
        return student;
      });

      const invalidStudents = parsedStudents.filter(
        (student) =>
          !student["Full name"] ||
          !student["Email address"] ||
          !student["Last modified (submission)"]
      );

      if (invalidStudents.length > 0) {
        setError("Some rows contain missing or invalid data.");
        return;
      }

      setStudents(
        parsedStudents.map((student) => ({
          name: student["Full name"] || "",
          email: student["Email address"] || "",
          timestamp: student["Last modified (submission)"] || "",
          grade: student["Grade"] || "",
          feedback: student["Feedback comments"] || "",
          appliedIds: [],
        }))
      );
      setError("");
    } catch (error) {
      setError("Error parsing the CSV file.");
    }
  };

  return (
    <div className="layout">
      <div className="listSection">
        <div className="buttons">
          <form>
            <label htmlFor="csvFileInput" className="import-file-label">
              Import File (exported from Moodle)
            </label>
            <input
              type="file"
              id="csvFileInput"
              accept=".csv"
              onChange={handleOnChange}
              className="import-file-input"
            />
          </form>
          <button className="studentBtn">Export for Moodle</button>
          <button className="studentBtn">Save Progress</button>
          <button className="studentBtn">Load Progress</button>
        </div>
        {error && <div className="error-message">{error}</div>}
        <div className="rounded-md border">
          <div className="table-container">
            <Table>
              <TableCaption>A list of recent student submissions.</TableCaption>
              <TableHeader>
                <TableRow className="header-row sticky top-0 z-[10]">
                  {table.getHeaderGroups().map(headerGroup => (
                    <React.Fragment key={headerGroup.id}>
                      {headerGroup.headers.map(header => (
                        <TableHead
                          key={header.id}
                          onClick={header.column.getToggleSortingHandler()}
                          className="header-cell cursor-pointer"
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}{" "}
                          {header.column.getIsSorted() ? (header.column.getIsSorted() === "desc" ? "▲" : "▼") : "⇅"}
                        </TableHead>
                      ))}
                    </React.Fragment>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.map(row => (
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
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentList;
