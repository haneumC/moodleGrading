export interface Student {
  name: string;
  email: string;
  status?: string;
  grade: string;
  lastModifiedSubmission?: string;
  feedback: string;
  appliedIds: number[];
  identifier?: string;
  idNumber?: string;
  maxGrade?: string;
  gradeCanBeChanged?: string;
  onlineText?: string;
  lastModifiedGrade?: string;
}

export interface FeedbackItem {
  id: number;
  comment: string;
  grade: number;
  applied?: boolean;
}

export interface ChangeRecord {
  type: 'grade' | 'feedback' | 'import' | 'auto-save';
  studentName: string;
  oldValue: string | { grade: string; feedback: string; appliedIds: number[] };
  newValue: string | { grade: string; feedback: string; appliedIds: number[] };
  timestamp: string;
  message?: string;
}

export interface StudentListProps {
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  selectedStudent: string | null;
  onStudentSelect: (student: string | null) => void;
  assignmentName: string;
  setAssignmentName: (name: string) => void;
  feedbackItems: FeedbackItem[];
  setFeedbackItems: React.Dispatch<React.SetStateAction<FeedbackItem[]>>;
  onChangeTracked: (change: ChangeRecord) => void;
  onSaveProgress?: () => Promise<boolean>;
}

export interface SaveData {
  students: Student[];
  assignmentName: string;
  timestamp: string;
  feedbackItems: FeedbackItem[];
}

export interface AutoSaveProps {
  onSave: () => Promise<void>;
  status: string;
  showStatus: boolean;
} 