import { Student, ChangeRecord, FeedbackItem } from '@/components/StudentList/types';

interface FeedbackProps {
  selectedStudent: string | null;
  appliedIds: number[];
  onFeedbackEdit: (oldFeedback: FeedbackItem, newFeedback: FeedbackItem) => void;
  feedbackItems: FeedbackItem[];
  setFeedbackItems: (items: FeedbackItem[]) => void;
  students: Student[];
  onStudentsUpdate: (updater: (students: Student[]) => Student[]) => void;
  onChangeTracked: (change: ChangeRecord) => void;
}

export type { FeedbackProps }; 