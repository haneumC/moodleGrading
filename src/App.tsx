import React, { useState, useEffect } from 'react';
import './App.css';
import Feedback from './components/Feedback/Feedback';
import StudentList from './components/StudentList/StudentList';
import { HashRouter as Router, Route, Routes, useNavigate } from 'react-router-dom';
import AboutPage from './components/About/About';
import { Student, ChangeRecord, FeedbackItem } from '@/components/StudentList/types';
import ChangeHistoryPanel from './components/StudentList/components/ChangeHistoryPanel';

const MAX_CHANGES = 50;
const SAVE_HANDLE_KEY = 'save_handle_id';

const defaultFeedback: FeedbackItem[] = [
  { id: 1, comment: "Add more comments", grade: 3 },
  { id: 2, comment: "Poor indentation", grade: 2 },
  { id: 3, comment: "Looks good!", grade: 0 },
  { id: 4, comment: "No submission", grade: 20 },
];

interface MoodleMessage {
  type: 'MOODLE_DATA';
  data: {
    assignmentName: string;
    maxPoints: string;
    students: MoodleStudent[];
    timestamp: string;
  };
}

interface StorageData {
  moodleGradingData?: {
    assignmentName: string;
    maxPoints: string;
    students: MoodleStudent[];
    timestamp: string;
  };
}

declare global {
  interface Window {
    chrome: {
      runtime: {
        onMessage: {
          addListener: (callback: (message: MoodleMessage, sender: unknown, sendResponse: () => void) => void) => void;
          removeListener: (callback: (message: MoodleMessage, sender: unknown, sendResponse: () => void) => void) => void;
        };
        sendMessage: (message: MoodleMessage) => void;
      };
      storage: {
        local: {
          get: (keys: string[], callback: (result: StorageData) => void) => void;
          set: (items: StorageData, callback?: () => void) => void;
          remove: (keys: string | string[], callback?: () => void) => void;
        };
      };
    };
    showOpenFilePicker: (options?: {
      id?: string;
      startIn?: string;
      types?: Array<{
        description: string;
        accept: Record<string, string[]>;
      }>;
      multiple?: boolean;
    }) => Promise<FileSystemFileHandle[]>;
  }
}

type MoodleStudent = {
  name: string;
  email: string;
  idNumber?: string;
  status?: string;
  grade?: string;
  lastModifiedSubmission?: string;
  feedback?: string;
  appliedIds?: number[];
  onlineText?: string;
  lastModifiedGrade?: string;
  maxGrade?: string;
  gradeCanBeChanged?: string;
}

const MainApp = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [assignmentName, setAssignmentName] = useState<string>("Assignment 1");
  const [maxPoints, setMaxPoints] = useState<string>("20.00");
  const [feedbackItems, setFeedbackItems] = useState<FeedbackItem[]>(defaultFeedback);
  
  const [changeHistory, setChangeHistory] = useState<ChangeRecord[]>([]);
  const [isChangeHistoryVisible, setIsChangeHistoryVisible] = useState(false);
  const [lastAutoSaveTime, setLastAutoSaveTime] = useState<string>('');
  const [selectedFeedbackId, setSelectedFeedbackId] = useState<number | null>(null);
  const [fileHandle, setFileHandle] = useState<FileSystemFileHandle | null>(null);

  useEffect(() => {
    // First try to get data from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const dataParam = urlParams.get('data');
    
    if (dataParam) {
      try {
        const parsedData = JSON.parse(decodeURIComponent(dataParam));
        console.log('Found URL data:', parsedData);
        
        // Set max points first
        if (parsedData.maxPoints) {
          console.log('Setting max points from URL:', parsedData.maxPoints);
          setMaxPoints(parsedData.maxPoints);
        }
        
        // Set assignment name
        if (parsedData.assignmentName) {
          setAssignmentName(parsedData.assignmentName);
        }
        
        // Transform and set students data
        if (parsedData.students && Array.isArray(parsedData.students)) {
          const maxPointsValue = parsedData.maxPoints || '20.00';
          console.log('Using max points value for students:', maxPointsValue);
          
          const transformedStudents = parsedData.students.map((student: MoodleStudent) => ({
            name: student.name || '',
            email: student.email || '',
            grade: student.grade || '',
            feedback: student.feedback || '',
            appliedIds: student.appliedIds || [],
            identifier: student.idNumber || '',
            idNumber: student.idNumber || '',
            status: student.status || '',
            lastModifiedSubmission: student.lastModifiedSubmission || '',
            onlineText: student.onlineText || '',
            lastModifiedGrade: student.lastModifiedGrade || '',
            maxGrade: maxPointsValue,
            gradeCanBeChanged: student.gradeCanBeChanged || 'Yes'
          }));
          
          console.log('Setting students with max points:', transformedStudents);
          setStudents(transformedStudents);
        }
      } catch (error) {
        console.error('Error parsing URL data:', error);
      }
    }

    // Then check chrome.storage.local for data
    if (window.chrome?.storage?.local) {
      window.chrome.storage.local.get(['moodleGradingData'], (result) => {
        if (result.moodleGradingData) {
          try {
            const parsedData = result.moodleGradingData;
            console.log('Found Moodle data:', parsedData);
            
            // Set max points first
            const maxPointsValue = parsedData.maxPoints || '20.00';
            console.log('Setting max points from storage:', maxPointsValue);
            setMaxPoints(maxPointsValue);
            
            if (parsedData.students && Array.isArray(parsedData.students)) {
              console.log('Found valid students array:', parsedData.students);
              
              const transformedStudents: Student[] = parsedData.students.map((student: MoodleStudent) => ({
                name: student.name || '',
                email: student.email || '',
                grade: student.grade || '',
                feedback: student.feedback || '',
                appliedIds: student.appliedIds || [],
                identifier: student.idNumber || '',
                idNumber: student.idNumber || '',
                status: student.status || '',
                lastModifiedSubmission: student.lastModifiedSubmission || '',
                onlineText: student.onlineText || '',
                lastModifiedGrade: student.lastModifiedGrade || '',
                maxGrade: maxPointsValue,
                gradeCanBeChanged: student.gradeCanBeChanged || 'Yes'
              }));
              
              console.log('Setting students state with:', transformedStudents);
              setStudents(transformedStudents);
              
              if (parsedData.assignmentName) {
                console.log('Setting assignment name:', parsedData.assignmentName);
                setAssignmentName(parsedData.assignmentName);
              }
            }
            
            // Clear the data after loading
            window.chrome.storage.local.remove('moodleGradingData');
          } catch (error) {
            console.error('Error parsing Moodle data:', error);
          }
        }
      });
    }
  }, []);

  // Try to restore saved file handle on mount
  useEffect(() => {
    const handleId = localStorage.getItem(SAVE_HANDLE_KEY);
    if (handleId) {
      // Attempt to restore the file handle
      navigator.storage?.getDirectory?.()?.then(async (root) => {
        try {
          const handle = await root.getFileHandle(handleId);
          if (handle) {
            console.log('File handle restored successfully');
            setFileHandle(handle);
          }
        } catch (err) {
          console.error('Could not restore file handle:', err);
          localStorage.removeItem(SAVE_HANDLE_KEY);
        }
      });
    }
  }, []);

  useEffect(() => {
    if (fileHandle) {
      console.log('File handle updated:', fileHandle);
      // Store the file handle ID for future sessions
      localStorage.setItem(SAVE_HANDLE_KEY, fileHandle.name);
    }
  }, [fileHandle]);

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
    setStudents(prev => prev.map(student => {
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
    }));

    // Remove the change from history
    setChangeHistory(prev => prev.filter(c => c !== change));
  };

  const handleFeedbackEdit = (oldFeedback: FeedbackItem, newFeedback: FeedbackItem) => {
    setStudents(prevStudents => 
      prevStudents.map(student => {
        if (Array.isArray(student.appliedIds) && student.appliedIds.includes(oldFeedback.id)) {
          const updatedFeedback = student.feedback
            .split('\n')
            .map(line => {
              if (line.trim().startsWith(`${oldFeedback.comment.trim()}`)) {
                return `${newFeedback.comment.trim()}`;
              }
              return line;
            })
            .filter(line => line.trim() !== '')
            .join('\n');

          const totalDeduction = student.appliedIds.reduce((sum, id) => {
            if (id === oldFeedback.id) {
              return sum + newFeedback.grade;
            }
            const feedback = feedbackItems.find(f => f.id === id);
            return sum + (feedback?.grade || 0);
          }, 0);

          const maxPoints = parseFloat(student.maxGrade || '20.00');
          const newGrade = Math.max(0, maxPoints - totalDeduction);

          window.dispatchEvent(new CustomEvent('grading-change'));
          
          const oldState = {
            grade: student.grade,
            feedback: student.feedback,
            appliedIds: [...student.appliedIds]
          };

          const newState = {
            ...student,
            feedback: updatedFeedback,
            grade: updatedFeedback.trim() ? newGrade.toString() : '',
          };

          handleChangeTracked({
            type: 'feedback',
            studentName: student.name,
            oldValue: oldState,
            newValue: newState,
            timestamp: new Date().toISOString()
          });

          return newState;
        }
        return student;
      })
    );
  };

  // Function to handle feedback selection
  const handleFeedbackSelect = (feedbackId: number | null) => {
    console.log('App received feedback selection:', feedbackId);
    
    // Debug: Log all students who have this feedback applied
    if (feedbackId !== null) {
      const studentsWithFeedback = students.filter(student => 
        Array.isArray(student.appliedIds) && student.appliedIds.includes(feedbackId)
      );
      console.log('Students with this feedback:', studentsWithFeedback.map(s => s.name));
    }
    
    // Toggle selection if clicking the same feedback again
    if (selectedFeedbackId === feedbackId) {
      console.log('Deselecting feedback:', feedbackId);
      setSelectedFeedbackId(null);
    } else {
      console.log('Selecting feedback:', feedbackId);
      setSelectedFeedbackId(feedbackId);
    }
  };

  return (
    <div className="grading-assistant relative">
      <button 
        onClick={() => navigate('/about')}
        className="absolute top-4 right-4 text-white hover:text-gray-200 px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 transition-colors"
      >
        About Us
      </button>

      <div className="changes-section absolute top-16 right-4 flex flex-col gap-2">
        <button 
          onClick={() => setIsChangeHistoryVisible(!isChangeHistoryVisible)}
          className="text-white hover:text-gray-200 px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 transition-colors flex items-center justify-between w-full"
        >
          <span>{isChangeHistoryVisible ? 'Hide Changes' : 'Show Changes'}</span>
          <span className="bg-gray-700 px-2 py-0.5 rounded-full text-sm">
            {changeHistory.length}
          </span>
        </button>

        <a 
          href="https://youtu.be/your-video-id" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-500 hover:text-blue-400 flex items-center gap-1"
        >
          <i className="bi bi-play-circle text-lg"></i>
          <span>Watch Tutorial</span>
        </a>
        
        {/* Display the last auto-save time below all buttons */}
        {lastAutoSaveTime && (
          <div className="last-autosave-header">
            Last auto-save: {lastAutoSaveTime}
          </div>
        )}
      </div>

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
          <div className="flex items-center gap-2">
            <h1>Grading Assistant</h1>
            <span className="text-xs text-gray-400">v1.0.0</span>
          </div>
          <input
            type="text"
            value={assignmentName}
            onChange={(e) => setAssignmentName(e.target.value)}
            className="text-lg font-semibold px-2 py-1 border rounded"
          />
          <p>Max Points: {maxPoints}</p>
        </div>
      </header>
      <main>
        <div className="left">
          <Feedback
            selectedStudent={selectedStudent}
            selectedStudents={selectedStudents}
            appliedIds={
              selectedStudent
                ? students.find(s => s.name === selectedStudent)?.appliedIds || []
                : selectedStudents.size > 0
                  ? [...selectedStudents].reduce((ids, studentName) => {
                      const student = students.find(s => s.name === studentName);
                      return student?.appliedIds ? [...ids, ...student.appliedIds] : ids;
                    }, [] as number[])
                  : []
            }
            onFeedbackEdit={handleFeedbackEdit}
            feedbackItems={feedbackItems}
            setFeedbackItems={setFeedbackItems}
            students={students}
            onStudentsUpdate={setStudents}
            onChangeTracked={handleChangeTracked}
            onFeedbackSelect={handleFeedbackSelect}
            selectedFeedbackId={selectedFeedbackId}
          />
        </div>
        <div className="right">
          <StudentList
            students={students}
            setStudents={setStudents}
            selectedStudent={selectedStudent}
            onStudentSelect={setSelectedStudent}
            selectedStudents={selectedStudents}
            setSelectedStudents={setSelectedStudents}
            assignmentName={assignmentName}
            setAssignmentName={setAssignmentName}
            onChangeTracked={handleChangeTracked}
            feedbackItems={feedbackItems}
            setFeedbackItems={setFeedbackItems}
            onLastAutoSaveTimeUpdate={setLastAutoSaveTime}
            selectedFeedbackId={selectedFeedbackId}
            onFileHandleCreated={setFileHandle}
          />
        </div>
      </main>
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
