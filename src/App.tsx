import React, { useState } from 'react';
import './App.css';
import Feedback from './components/Feedback/Feedback';
import StudentList from './components/StudentList/StudentList';

interface Student {
  name: string;
  email: string;
  timestamp: string;
  grade: string;
  feedback: string;
  appliedIds: number[];
}

interface FeedbackItem {
  id: number;
  comment: string;
  grade: number;
  applied?: boolean;
}

interface ApplyFeedbackParams {
  feedbackItem: FeedbackItem;
  allFeedbackItems: FeedbackItem[];
}

const App: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);

  // State to manage all feedback items
  const [feedbackItems] = useState<FeedbackItem[]>([]);

  const handleStudentSelect = (studentName: string) => {
    setSelectedStudent(studentName);
  };

  const handleApplyFeedback = ({ feedbackItem, allFeedbackItems }: ApplyFeedbackParams) => {
    if (!selectedStudent) return;

    setStudents(prevStudents =>
      prevStudents.map(student => {
        if (student.name === selectedStudent) {
          if (student.appliedIds.includes(feedbackItem.id)) {
            // Remove the feedback
            const feedbackLines = student.feedback
              .split('\n')
              .filter(line => line.trim() !== feedbackItem.comment.trim())
              .filter(line => line.trim() !== '')
              .join('\n\n');

            // Calculate new grade
            const remainingIds = student.appliedIds.filter(id => id !== feedbackItem.id);
            if (remainingIds.length === 0) {
              return {
                ...student,
                grade: "",
                feedback: feedbackLines || "", // Ensure empty string if no feedback
                appliedIds: remainingIds,
              };
            }

            const totalDeduction = allFeedbackItems
              .filter((item: FeedbackItem) => remainingIds.includes(item.id))
              .reduce((sum: number, item: FeedbackItem) => sum + item.grade, 0);
            const newGrade = Math.max(0, 20 - totalDeduction);

            return {
              ...student,
              grade: newGrade.toString(),
              feedback: feedbackLines || "",
              appliedIds: remainingIds,
            };
          } else {
            // Apply the feedback
            const newAppliedIds = [...student.appliedIds, feedbackItem.id];
            const totalDeduction = allFeedbackItems
              .filter((item: FeedbackItem) => newAppliedIds.includes(item.id))
              .reduce((sum: number, item: FeedbackItem) => sum + item.grade, 0);
            const newGrade = Math.max(0, 20 - totalDeduction);

            // New feedback with line break
            const newFeedback = student.feedback
              ? `${student.feedback.trim()}\n\n${feedbackItem.comment.trim()}`
              : feedbackItem.comment.trim();

            return {
              ...student,
              grade: newGrade.toString(),
              feedback: newFeedback,
              appliedIds: newAppliedIds,
            };
          }
        }
        return student;
      })
    );
  };

  const handleFeedbackEdit = (oldFeedback: FeedbackItem, newFeedback: FeedbackItem) => {
    setStudents(prevStudents =>
      prevStudents.map(student => {
        if (student.appliedIds.includes(oldFeedback.id)) {
          // Replace old feedback text with new one
          const updatedFeedback = student.feedback
            .split('\n\n')
            .map(line => line.trim() === oldFeedback.comment.trim() ? newFeedback.comment : line)
            .join('\n\n');

          // Recalculate grade
          const totalDeduction = student.appliedIds.reduce((sum, id) => {
            if (id === oldFeedback.id) {
              return sum + newFeedback.grade;
            }
            const feedback = feedbackItems.find(f => f.id === id);
            return sum + (feedback?.grade || 0);
          }, 0);

          const newGrade = Math.max(0, 20 - totalDeduction);

          return {
            ...student,
            feedback: updatedFeedback,
            grade: newGrade.toString(),
          };
        }
        return student;
      })
    );
  };

  return (
    <div className="grading-assistant">
      <header>
        <h1>Grading Assistant</h1>
        <p>Assignment Name: Assignment 1</p>
        <p>Max Points: 20.00</p>
      </header>
      <main>
        <div className="left">
          <div className="controls">
            <button>Prev Student</button>
            <button>Next Student</button>
            <button>Show Stats</button>
            <button>Import Table</button>
            <button>Export Table</button>
          </div>
          <Feedback
            onApplyFeedback={handleApplyFeedback}
            selectedStudent={selectedStudent}
            appliedIds={students.find(s => s.name === selectedStudent)?.appliedIds || []}
            onFeedbackEdit={handleFeedbackEdit}
          />
        </div>
        <div className="right">
          <StudentList
            students={students}
            setStudents={setStudents}
            selectedStudent={selectedStudent}
            onStudentSelect={handleStudentSelect}
          />
        </div>
      </main>
    </div>
  );
};

export default App;
