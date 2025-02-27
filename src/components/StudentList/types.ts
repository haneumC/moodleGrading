export interface Student {
  identifier: string;
  name: string;
  idNumber: string;
  email: string;
  status: string;
  grade: string;
  maxGrade: string;
  gradeCanBeChanged: string;
  lastModifiedSubmission: string;
  onlineText: string;
  lastModifiedGrade: string;
  feedback: string;
  appliedIds: number[];
}

export interface StudentListProps {
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  selectedStudent: string | null;
  onStudentSelect: (studentName: string) => void;
  assignmentName: string;
  setAssignmentName: (name: string) => void;
  feedbackItems: FeedbackItem[];
  setFeedbackItems: React.Dispatch<React.SetStateAction<FeedbackItem[]>>;
  changeHistory: ChangeRecord[];
  onChangeTracked: (change: ChangeRecord) => void;
  onRevertChange: (change: ChangeRecord) => void;
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

export interface ChangeRecord {
  type: 'grade' | 'feedback' | 'auto-save';
  studentName?: string;
  oldValue: string | { grade: string; feedback: string; appliedIds: number[] };
  newValue: string | { grade: string; feedback: string; appliedIds: number[] };
  timestamp: string;
  message: string;
}

export interface FeedbackItem {
  id: number;
  comment: string;
  grade: number;
  applied?: boolean;
} 