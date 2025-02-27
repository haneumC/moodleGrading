export interface Student {
  name: string;
  email: string;
  lastModifiedSubmission: string;
  grade: string;
  feedback: string;
  appliedIds: number[];
}

export interface FeedbackItem {
  id: number;
  comment: string;
  grade: number;
  applied?: boolean;
}

export interface ChangeRecord {
  type: string;
  studentName: string;
  oldValue: any;
  newValue: any;
  timestamp: string;
  message?: string;
}

export interface StudentListProps {
  students: Student[];
  setStudents: (students: Student[]) => void;
  selectedStudent: string | null;
  onStudentSelect: (student: string | null) => void;
  assignmentName: string;
  setAssignmentName: (name: string) => void;
  feedbackItems: FeedbackItem[];
  setFeedbackItems: (items: FeedbackItem[]) => void;
  onChangeTracked: (change: ChangeRecord) => void;
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