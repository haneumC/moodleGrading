export interface Student {
  name: string;
  email: string;
  timestamp: string;
  grade: string;
  feedback: string;
  appliedIds: number[];
}

export interface StudentListProps {
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  selectedStudent: string | null;
  onStudentSelect: (studentName: string) => void;
  assignmentName: string;
} 