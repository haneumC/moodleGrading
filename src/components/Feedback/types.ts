import { Student, ChangeRecord, FeedbackItem } from '@/components/StudentList/types';
import { Dispatch, SetStateAction } from 'react';

export type { FeedbackItem };

export interface FeedbackProps {
  selectedStudent: string | null;
  selectedStudents: Set<string>;
  appliedIds: number[];
  onFeedbackEdit: (oldFeedback: FeedbackItem, newFeedback: FeedbackItem) => void;
  feedbackItems: FeedbackItem[];
  setFeedbackItems: Dispatch<SetStateAction<FeedbackItem[]>>;
  students: Student[];
  onStudentsUpdate: (updater: (prevStudents: Student[]) => Student[]) => void;
  onChangeTracked: (change: ChangeRecord) => void;
  onFeedbackSelect?: (id: number) => void;
  selectedFeedbackId?: number | null;
}

export type SortField = 'text' | 'deduction' | 'applied';
export type SortDirection = 'asc' | 'desc'; 