import React, { useState, useEffect } from 'react';
import './App.css';
import Feedback from './components/Feedback/Feedback';
import StudentList from './components/StudentList/StudentList';
import { HashRouter as Router, Route, Routes, useNavigate } from 'react-router-dom';
import AboutPage from './components/About/About';
import { Student, ChangeRecord, FeedbackItem } from '@/components/StudentList/types';
import ChangeHistoryPanel from './components/StudentList/components/ChangeHistoryPanel';

const AUTO_SAVE_KEY = 'grading_autosave';
const MAX_CHANGES = 50;

const defaultFeedback: FeedbackItem[] = [
  { id: 1, comment: "Add more comments", grade: 3 },
  { id: 2, comment: "Poor indentation", grade: 2 },
  { id: 3, comment: "Looks good!", grade: 0 },
  { id: 4, comment: "No submission", grade: 20 },
];

const MainApp = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [assignmentName, setAssignmentName] = useState<string>("Assignment 1");
  const [feedbackItems, setFeedbackItems] = useState<FeedbackItem[]>(defaultFeedback);
  
  const [changeHistory, setChangeHistory] = useState<ChangeRecord[]>([]);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isChangeHistoryVisible, setIsChangeHistoryVisible] = useState(false);

  useEffect(() => {
    const savedData = localStorage.getItem(AUTO_SAVE_KEY);
    if (savedData) {
      try {
        const { students: savedStudents, feedbackItems: savedFeedback, assignmentName: savedName, timestamp } = JSON.parse(savedData);
        
        const lastSaveDate = new Date(timestamp);
        const shouldRestore = window.confirm(
          `Found auto-saved data from ${lastSaveDate.toLocaleString()}. Would you like to restore it?`
        );

        if (shouldRestore) {
          setStudents(savedStudents);
          if (Array.isArray(savedFeedback) && savedFeedback.length > 0) {
            setFeedbackItems(savedFeedback);
          }
          setAssignmentName(savedName);
          setLastSaved(lastSaveDate);
        } else {
          localStorage.removeItem(AUTO_SAVE_KEY);
        }
      } catch (error) {
        console.error('Error loading auto-saved data:', error);
      }
    }
  }, []);

  const handleChangeTracked = (change: ChangeRecord) => {
    // Only track grade and feedback changes, ignore auto-saves
    if (change.type !== 'grade' && change.type !== 'feedback') return;

    setChangeHistory(prev => {
      let message = '';
      if (change.type === 'grade') {
        message = `${change.studentName}: ${change.oldValue} → ${change.newValue} points`;
      } else if (change.type === 'feedback') {
        const oldValue = change.oldValue as { grade: string; feedback: string; appliedIds: number[] };
        const newValue = change.newValue as { grade: string; feedback: string; appliedIds: number[] };
        message = `${change.studentName}: ${oldValue.grade || '0'} → ${newValue.grade} points`;
      }

      const newChange = {
        ...change,
        message,
        timestamp: new Date().toISOString()
      };

      // Prevent duplicate entries within 1 second
      if (prev.length > 0) {
        const lastChange = prev[0];
        if (
          lastChange.studentName === change.studentName &&
          lastChange.type === change.type &&
          Math.abs(new Date(lastChange.timestamp).getTime() - Date.now()) < 1000
        ) {
          return prev;
        }
      }

      return [newChange, ...prev.slice(0, MAX_CHANGES - 1)];
    });
  };

  const handleRevertChange = (change: ChangeRecord) => {
    if (!change.studentName) return;

    // Revert the student's state
    setStudents(prevStudents =>
      prevStudents.map(student => {
        if (student.name === change.studentName) {
          if (change.type === 'grade') {
            return { ...student, grade: change.oldValue as string };
          } else if (change.type === 'feedback') {
            const oldValue = change.oldValue as { grade: string; feedback: string; appliedIds: number[] };
            return {
              ...student,
              grade: oldValue.grade,
              feedback: oldValue.feedback,
              appliedIds: oldValue.appliedIds
            };
          }
        }
        return student;
      })
    );

    // Only remove the specific change from history
    setChangeHistory(prev => 
      prev.filter(c => 
        !(c.timestamp === change.timestamp && 
          c.studentName === change.studentName)
      )
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
    <div className="grading-assistant relative">
      <button 
        onClick={() => navigate('/about')}
        className="absolute top-4 right-4 text-white hover:text-gray-200 px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 transition-colors"
      >
        About Us
      </button>

      <button 
        onClick={() => setIsChangeHistoryVisible(!isChangeHistoryVisible)}
        className="absolute top-16 right-4 text-white hover:text-gray-200 px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 transition-colors flex items-center justify-between"
      >
        <span>{isChangeHistoryVisible ? 'Hide Changes' : 'Show Changes'}</span>
        <span className="bg-gray-700 px-2 py-0.5 rounded-full text-sm">
          {changeHistory.length}
        </span>
      </button>

      {/* Change History Panel */}
      {isChangeHistoryVisible && (
        <ChangeHistoryPanel
          changeHistory={changeHistory}
          onClose={() => setIsChangeHistoryVisible(false)}
          onRevert={handleRevertChange}
        />
      )}

      {/* Main content */}
      <header>
        <div>
          <h1>Grading Assistant</h1>
          <input
            type="text"
            value={assignmentName}
            onChange={(e) => setAssignmentName(e.target.value)}
            className="text-lg font-semibold px-2 py-1 border rounded"
          />
          <p>Max Points: 20.00</p>
        </div>
      </header>
      <main>
        <div className="left">
          <Feedback
            selectedStudent={selectedStudent}
            appliedIds={students.find(s => s.name === selectedStudent)?.appliedIds || []}
            onFeedbackEdit={handleFeedbackEdit}
            feedbackItems={feedbackItems}
            setFeedbackItems={setFeedbackItems}
            students={students}
            onStudentsUpdate={setStudents}
            onChangeTracked={handleChangeTracked}
          />
        </div>
        <div className="right">
          <StudentList
            students={students}
            setStudents={setStudents}
            selectedStudent={selectedStudent}
            onStudentSelect={setSelectedStudent}
            assignmentName={assignmentName}
            setAssignmentName={setAssignmentName}
            feedbackItems={feedbackItems}
            setFeedbackItems={setFeedbackItems}
            onChangeTracked={handleChangeTracked}
          />
        </div>
      </main>
      
      {lastSaved && (
        <div className="fixed bottom-4 right-4 text-sm text-gray-500">
          Last saved: {lastSaved.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/about" element={<AboutPage />} />
        <Route path="/" element={<MainApp />} />
      </Routes>
    </Router>
  );
};

export default App;
