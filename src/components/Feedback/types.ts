import { Student, ChangeRecord, FeedbackItem } from '@/components/StudentList/types';
import { Dispatch, SetStateAction } from 'react';

export interface FeedbackProps {
  selectedStudent: string | null;
  appliedIds: number[];
  onFeedbackEdit: (oldFeedback: FeedbackItem, newFeedback: FeedbackItem) => void;
  feedbackItems: FeedbackItem[];
  setFeedbackItems: Dispatch<SetStateAction<FeedbackItem[]>>;
  students: Student[];
  onStudentsUpdate: (updater: (students: Student[]) => Student[]) => void;
  onChangeTracked: (change: ChangeRecord) => void;
  onFeedbackSelect?: (feedbackId: number) => void;
  selectedFeedbackId?: number | null;
  _onSaveProgress?: () => Promise<boolean | void>;
} 